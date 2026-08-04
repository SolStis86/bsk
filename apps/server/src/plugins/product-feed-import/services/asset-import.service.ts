import { Inject, Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { AssetImporter, AssetService, ID, RequestContext, TransactionalConnection } from '@vendure/core';
import { Product } from '@vendure/core/dist/entity/product/product.entity';
import { ProductVariant } from '@vendure/core/dist/entity/product-variant/product-variant.entity';

import {
    getImportDir,
    getImportSessionRoot,
    getImportZipPath,
    IMPORT_SESSION_DIR,
} from '../constants/import-session.constants';
import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS, loggerCtx } from '../constants';
import { NormalizedProduct } from '../types/feed.types';
import { ProductAssetImportPayload } from '../types/asset-import.types';
import { ImportOptions } from '../types/import.types';
import { PluginInitOptions } from '../types';
import { filenameFromUrl } from './feed-mapper.utils';
import { ImageZipArchive, normalizeFilename } from './image-zip-archive';
import { ProductFeedImportAssetSessionService } from './product-feed-import-asset-session.service';

@Injectable()
export class AssetImportService {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        @Inject(PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS) private options: PluginInitOptions,
        private assetImporter: AssetImporter,
        private assetService: AssetService,
        private connection: TransactionalConnection,
        private assetSession: ProductFeedImportAssetSessionService,
    ) {}

    private readonly zipImportLock: { chain: Promise<void> } = { chain: Promise.resolve() };

    clearCache(): void {
        // Asset deduplication is handled by Vendure's AssetImporter.
    }

    getImportZipPath(importJobId: string): string {
        return getImportZipPath(importJobId);
    }

    getImportDir(importJobId: string): string {
        return getImportDir(importJobId);
    }

    async cleanupImportSession(importJobId: string): Promise<void> {
        await this.deactivateAssetSession();
        await fs.rm(this.getImportDir(importJobId), { recursive: true, force: true }).catch(() => undefined);
    }

    async activateImportSessionForWorker(importJobId: string): Promise<void> {
        const zipPath = this.getImportZipPath(importJobId);
        await fs.access(zipPath);
        await this.assetSession.activate(importJobId, zipPath);
    }

    async cleanupStaleImportSessions(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
        const rootDir = path.join(getImportSessionRoot(), IMPORT_SESSION_DIR);
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
        await this.deactivateAssetSession();

        if (options.skipAssets) {
            return;
        }

        if (options.imageZipPath && !options.importJobId) {
            await this.assetSession.activateFromPath(options.imageZipPath);
            this.logger.log(
                `Loaded local image zip (${this.assetSession.entryCount} files): ${options.imageZipPath}`,
            );
            return;
        }

        if (options.importJobId) {
            const zipPath = this.getImportZipPath(options.importJobId);

            if (options.imageZipPath) {
                await fs.mkdir(getImportDir(options.importJobId), { recursive: true });
                await fs.copyFile(options.imageZipPath, zipPath);
            } else if (this.options.imageZipUrl) {
                this.logger.log(
                    `Downloading product image zip for import ${options.importJobId} from ${this.options.imageZipUrl}...`,
                );
                await ImageZipArchive.downloadToPath(this.options.imageZipUrl, zipPath);
            }

            await this.assetSession.activate(options.importJobId, zipPath);
            this.logger.log(`Image zip ready (${this.assetSession.entryCount} files indexed)`);
            return;
        }

        if (this.options.imageZipUrl) {
            this.logger.log(`Downloading product image zip from ${this.options.imageZipUrl}...`);
            const tempPath = path.join(os.tmpdir(), `product-feed-images-${Date.now()}.zip`);
            await ImageZipArchive.downloadToPath(this.options.imageZipUrl, tempPath);
            await this.assetSession.activateFromPath(tempPath, 'ephemeral');
            this.logger.log(`Image zip ready (${this.assetSession.entryCount} files indexed)`);
        }
    }

    async deactivateAssetSession(): Promise<void> {
        await this.assetSession.deactivate();
    }

    /** @deprecated Session lifecycle is managed explicitly; kept for callers during migration. */
    async releaseArchive(): Promise<void> {
        await this.deactivateAssetSession();
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
    ): Promise<{ assetsImported: number; warnings: string[] }> {
        const warnings: string[] = [];
        let assetsImported = 0;

        const productAssetIds = await this.importFilenames(ctx, payload.assetFilenames, warnings);
        assetsImported += productAssetIds.length;

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

            const variantAssetIds = await this.importFilenames(ctx, filenames, warnings);
            assetsImported += variantAssetIds.length;

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

    private async importFilenames(
        ctx: RequestContext,
        filenames: string[],
        warnings: string[],
    ): Promise<ID[]> {
        if (filenames.length === 0) {
            return [];
        }

        const assetIds: ID[] = [];
        const seen = new Set<string>();

        for (const filename of filenames) {
            const key = normalizeFilename(filename);
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);

            await this.withZipImportLock(async () => {
                const { assets, errors } = await this.assetImporter.getAssets([filename], ctx);
                if (errors.length > 0) {
                    warnings.push(...errors);
                }
                if (assets.length > 0) {
                    assetIds.push(assets[0].id);
                }
            });
        }

        return assetIds;
    }

    /**
     * Zip entry streams are not safe to read concurrently from the shared import session.
     * Asset worker jobs run in parallel, so serialize zip-backed imports.
     */
    private async withZipImportLock<T>(operation: () => Promise<T>): Promise<T> {
        if (!this.assetSession.isActive()) {
            return operation();
        }

        let releaseLock!: () => void;
        const previous = this.zipImportLock.chain;
        this.zipImportLock.chain = new Promise<void>(resolve => {
            releaseLock = resolve;
        });

        await previous;

        try {
            return await operation();
        } finally {
            releaseLock();
        }
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
        if (assetIds.length === 0) {
            return;
        }

        const uniqueAssetIds = [...new Map(assetIds.map(id => [String(id), id])).values()];
        const input = {
            assetIds: uniqueAssetIds,
            featuredAssetId: uniqueAssetIds[0],
        };

        await this.assetService.updateFeaturedAsset(ctx, entity, input);
        await this.assetService.updateEntityAssets(ctx, entity, input);

        if (entity instanceof Product) {
            await this.connection.getRepository(ctx, Product).save(entity);
        } else {
            await this.connection.getRepository(ctx, ProductVariant).save(entity);
        }
    }
}
