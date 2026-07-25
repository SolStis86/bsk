import { Inject, Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { AssetService, ID, isGraphQlErrorResult, RequestContext, TransactionalConnection } from '@vendure/core';
import { Product } from '@vendure/core/dist/entity/product/product.entity';
import { ProductVariant } from '@vendure/core/dist/entity/product-variant/product-variant.entity';

import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS, loggerCtx } from '../constants';
import { NormalizedProduct } from '../types/feed.types';
import { ProductAssetImportPayload } from '../types/asset-import.types';
import { ImportOptions } from '../types/import.types';
import { PluginInitOptions } from '../types';
import { filenameFromUrl } from './feed-mapper.utils';
import { ImageZipArchive, normalizeFilename } from './image-zip-archive';

const IMPORT_SESSION_DIR = 'product-feed-import';

@Injectable()
export class AssetImportService {
    private readonly logger = new Logger(loggerCtx);
    private readonly assetCache = new Map<string, ID>();
    private archive: ImageZipArchive | null = null;
    private activeImportJobId: string | null = null;

    constructor(
        @Inject(PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS) private options: PluginInitOptions,
        private assetService: AssetService,
        private connection: TransactionalConnection,
    ) {}

    clearCache(): void {
        this.assetCache.clear();
    }

    getImportZipPath(importJobId: string): string {
        return path.join(os.tmpdir(), IMPORT_SESSION_DIR, importJobId, 'images.zip');
    }

    getImportDir(importJobId: string): string {
        return path.join(os.tmpdir(), IMPORT_SESSION_DIR, importJobId);
    }

    async cleanupImportSession(importJobId: string): Promise<void> {
        await fs.rm(this.getImportDir(importJobId), { recursive: true, force: true }).catch(() => undefined);
    }

    async cleanupStaleImportSessions(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
        const rootDir = path.join(os.tmpdir(), IMPORT_SESSION_DIR);
        let removed = 0;

        try {
            const entries = await fs.readdir(rootDir, { withFileTypes: true });
            const now = Date.now();

            for (const entry of entries) {
                if (!entry.isDirectory()) {
                    continue;
                }

                const dirPath = path.join(rootDir, entry.name);
                const stat = await fs.stat(dirPath);
                if (now - stat.mtimeMs > maxAgeMs) {
                    await fs.rm(dirPath, { recursive: true, force: true });
                    removed++;
                }
            }
        } catch {
            return removed;
        }

        return removed;
    }

    async prepareArchive(options: ImportOptions = {}): Promise<void> {
        await this.releaseArchive();

        if (options.skipAssets) {
            return;
        }

        if (options.imageZipPath) {
            this.archive = await ImageZipArchive.fromPath(options.imageZipPath);
            this.logger.log(
                `Loaded local image zip (${this.archive.entryCount} files): ${options.imageZipPath}`,
            );
            return;
        }

        if (options.importJobId) {
            this.activeImportJobId = options.importJobId;
            const zipPath = this.getImportZipPath(options.importJobId);

            if (options.imageZipPath) {
                await fs.mkdir(path.dirname(zipPath), { recursive: true });
                await fs.copyFile(options.imageZipPath, zipPath);
            } else if (this.options.imageZipUrl) {
                this.logger.log(
                    `Downloading product image zip for import ${options.importJobId} from ${this.options.imageZipUrl}...`,
                );
                await ImageZipArchive.downloadToPath(this.options.imageZipUrl, zipPath);
            }

            this.archive = await ImageZipArchive.fromPath(zipPath);
            this.logger.log(`Image zip ready (${this.archive.entryCount} files indexed)`);
            return;
        }

        if (this.options.imageZipUrl) {
            this.logger.log(`Downloading product image zip from ${this.options.imageZipUrl}...`);
            this.archive = await ImageZipArchive.fromUrl(this.options.imageZipUrl);
            this.logger.log(`Image zip ready (${this.archive.entryCount} files indexed)`);
        }
    }

    async openArchiveForImport(importJobId: string): Promise<ImageZipArchive | null> {
        const zipPath = this.getImportZipPath(importJobId);
        try {
            await fs.access(zipPath);
            return ImageZipArchive.fromPath(zipPath);
        } catch {
            return null;
        }
    }

    async releaseArchive(): Promise<void> {
        if (this.archive) {
            await this.archive.close();
            this.archive = null;
        }
        this.activeImportJobId = null;
    }

    async assetsUnchanged(
        ctx: RequestContext,
        productId: ID,
        payload: ProductAssetImportPayload,
    ): Promise<boolean> {
        const product = await this.connection.getEntityOrThrow(ctx, Product, productId, {
            relations: [
                'assets',
                'assets.asset',
                'featuredAsset',
                'variants',
                'variants.assets',
                'variants.assets.asset',
                'variants.featuredAsset',
            ],
        });

        if (!this.entityAssetsMatch(product, payload.assetFilenames)) {
            return false;
        }

        for (const variantPayload of payload.variants) {
            const variant = product.variants.find(v => String(v.id) === variantPayload.id);
            if (!variant) {
                return false;
            }

            const filenames =
                variantPayload.variantAssetFilenames.length > 0
                    ? variantPayload.variantAssetFilenames
                    : variantPayload.variantAssetUrls.map(filenameFromUrl).filter(Boolean);

            if (filenames.length === 0) {
                continue;
            }

            if (!this.entityAssetsMatch(variant, filenames)) {
                return false;
            }
        }

        return true;
    }

    async importForProduct(
        ctx: RequestContext,
        product: NormalizedProduct,
        productId: ID,
        variantIds: Array<{ sku: string; id: string }>,
    ): Promise<{ assetsImported: number; warnings: string[] }> {
        const payload: ProductAssetImportPayload = {
            productId: String(productId),
            assetFilenames: product.assetFilenames,
            assetUrls: product.assetUrls,
            variants: variantIds.map(ref => {
                const variant = product.variants.find(v => v.sku === ref.sku);
                return {
                    id: ref.id,
                    sku: ref.sku,
                    variantAssetFilenames: variant?.variantAssetFilenames ?? [],
                    variantAssetUrls: variant?.variantAssetUrls ?? [],
                };
            }),
        };

        return this.importFromPayload(ctx, payload);
    }

    async importFromPayload(
        ctx: RequestContext,
        payload: ProductAssetImportPayload,
        archiveOverride?: ImageZipArchive | null,
    ): Promise<{ assetsImported: number; warnings: string[] }> {
        const archive = archiveOverride ?? this.archive;
        const warnings: string[] = [];
        let assetsImported = 0;

        const productAssetIds: ID[] = [];
        for (const filename of payload.assetFilenames) {
            const assetId = await this.importAsset(
                ctx,
                filename,
                payload.assetUrls,
                warnings,
                archive,
            );
            if (assetId) {
                productAssetIds.push(assetId);
                assetsImported++;
            }
        }

        if (productAssetIds.length > 0) {
            const productEntity = await this.connection.getEntityOrThrow(
                ctx,
                Product,
                payload.productId,
            );
            await this.attachEntityAssets(ctx, productEntity, productAssetIds);
        }

        for (const variantPayload of payload.variants) {
            const filenames =
                variantPayload.variantAssetFilenames.length > 0
                    ? variantPayload.variantAssetFilenames
                    : variantPayload.variantAssetUrls.map(filenameFromUrl).filter(Boolean);

            if (filenames.length === 0) {
                continue;
            }

            const variantAssetIds: ID[] = [];
            for (const filename of filenames) {
                const assetId = await this.importAsset(
                    ctx,
                    filename,
                    variantPayload.variantAssetUrls.length > 0
                        ? variantPayload.variantAssetUrls
                        : payload.assetUrls,
                    warnings,
                    archive,
                );
                if (assetId) {
                    variantAssetIds.push(assetId);
                    assetsImported++;
                }
            }

            if (variantAssetIds.length > 0) {
                const variantEntity = await this.connection.getEntityOrThrow(
                    ctx,
                    ProductVariant,
                    variantPayload.id,
                );
                await this.attachEntityAssets(ctx, variantEntity, variantAssetIds);
            }
        }

        return { assetsImported, warnings };
    }

    private entityAssetsMatch(
        entity: Product | ProductVariant,
        filenames: string[],
    ): boolean {
        if (filenames.length === 0) {
            return true;
        }

        const assetNames = new Set<string>();
        if (entity.featuredAsset?.name) {
            assetNames.add(normalizeFilename(entity.featuredAsset.name));
        }
        for (const productAsset of entity.assets ?? []) {
            if (productAsset.asset?.name) {
                assetNames.add(normalizeFilename(productAsset.asset.name));
            }
        }

        if (assetNames.size === 0) {
            return false;
        }

        return filenames.every(filename => assetNames.has(normalizeFilename(filename)));
    }

    private async attachEntityAssets(
        ctx: RequestContext,
        entity: Product | ProductVariant,
        assetIds: ID[],
    ): Promise<void> {
        const input = {
            assetIds,
            featuredAssetId: assetIds[0],
        };

        await this.assetService.updateFeaturedAsset(ctx, entity, input);
        await this.assetService.updateEntityAssets(ctx, entity, input);

        if (entity instanceof Product) {
            await this.connection.getRepository(ctx, Product).save(entity);
        } else {
            await this.connection.getRepository(ctx, ProductVariant).save(entity);
        }
    }

    private async importAsset(
        ctx: RequestContext,
        filename: string,
        fallbackUrls: string[],
        warnings: string[],
        archive: ImageZipArchive | null,
    ): Promise<ID | null> {
        const cacheKey = normalizeFilename(filename);
        const cached = this.assetCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        if (archive) {
            const stream = await archive.openStream(filename);
            if (stream) {
                return this.createFromStream(ctx, stream, filename, cacheKey, warnings);
            }

            warnings.push(`Image "${filename}" not found in zip archive`);
        }

        const fallbackUrl = fallbackUrls.find(
            url => normalizeFilename(filenameFromUrl(url)) === cacheKey,
        );
        if (fallbackUrl) {
            return this.importUrl(ctx, fallbackUrl, cacheKey, warnings);
        }

        if (!archive) {
            warnings.push(`No image zip configured and no URL fallback for "${filename}"`);
        }

        return null;
    }

    private async createFromStream(
        ctx: RequestContext,
        stream: Readable,
        filename: string,
        cacheKey: string,
        warnings: string[],
    ): Promise<ID | null> {
        try {
            const asset = await this.assetService.createFromFileStream(stream, filename, ctx);
            if (isGraphQlErrorResult(asset)) {
                warnings.push(`Failed to create asset from ${filename}: ${asset.message}`);
                return null;
            }

            this.assetCache.set(cacheKey, asset.id);
            return asset.id;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            warnings.push(`Failed to import asset ${filename}: ${message}`);
            this.logger.warn(`Asset import failed for ${filename}: ${message}`);
            return null;
        }
    }

    private async importUrl(
        ctx: RequestContext,
        url: string,
        cacheKey: string,
        warnings: string[],
    ): Promise<ID | null> {
        const cached = this.assetCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                warnings.push(`Failed to download asset ${url}: HTTP ${response.status}`);
                return null;
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const stream = Readable.from(buffer);
            const filename = filenameFromUrl(url) || 'image.jpg';
            return this.createFromStream(ctx, stream, filename, cacheKey, warnings);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            warnings.push(`Failed to import asset ${url}: ${message}`);
            this.logger.warn(`Asset import failed for ${url}: ${message}`);
            return null;
        }
    }
}
