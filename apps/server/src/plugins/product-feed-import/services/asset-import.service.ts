import { Inject, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';

import { AssetService, ID, isGraphQlErrorResult, RequestContext, TransactionalConnection } from '@vendure/core';
import { Product } from '@vendure/core/dist/entity/product/product.entity';
import { ProductVariant } from '@vendure/core/dist/entity/product-variant/product-variant.entity';

import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS, loggerCtx } from '../constants';
import { NormalizedProduct } from '../types/feed.types';
import { ImportOptions } from '../types/import.types';
import { PluginInitOptions } from '../types';
import { filenameFromUrl } from './feed-mapper.utils';
import { ImageZipArchive, normalizeFilename } from './image-zip-archive';

@Injectable()
export class AssetImportService {
    private readonly logger = new Logger(loggerCtx);
    private readonly assetCache = new Map<string, ID>();
    private archive: ImageZipArchive | null = null;

    constructor(
        @Inject(PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS) private options: PluginInitOptions,
        private assetService: AssetService,
        private connection: TransactionalConnection,
    ) {}

    clearCache(): void {
        this.assetCache.clear();
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

        if (this.options.imageZipUrl) {
            this.logger.log(`Downloading product image zip from ${this.options.imageZipUrl}...`);
            this.archive = await ImageZipArchive.fromUrl(this.options.imageZipUrl);
            this.logger.log(`Image zip ready (${this.archive.entryCount} files indexed)`);
        }
    }

    async releaseArchive(): Promise<void> {
        if (this.archive) {
            await this.archive.close();
            this.archive = null;
        }
    }

    async importForProduct(
        ctx: RequestContext,
        product: NormalizedProduct,
        productId: ID,
        variantIds: Array<{ sku: string; id: string }>,
    ): Promise<{ assetsImported: number; warnings: string[] }> {
        const warnings: string[] = [];
        const assetIds: ID[] = [];
        let assetsImported = 0;

        for (const filename of product.assetFilenames) {
            const assetId = await this.importAsset(ctx, filename, product.assetUrls, warnings);
            if (assetId) {
                assetIds.push(assetId);
                assetsImported++;
            }
        }

        if (assetIds.length > 0) {
            const productEntity = await this.connection.getEntityOrThrow(ctx, Product, productId);
            await this.attachEntityAssets(ctx, productEntity, assetIds);
        }

        for (const variantRef of variantIds) {
            const variant = product.variants.find(v => v.sku === variantRef.sku);
            const filenames =
                variant?.variantAssetFilenames ??
                variant?.variantAssetUrls?.map(filenameFromUrl).filter(Boolean) ??
                [];

            if (filenames.length === 0) {
                continue;
            }

            const variantAssetIds: ID[] = [];
            for (const filename of filenames) {
                const assetId = await this.importAsset(
                    ctx,
                    filename,
                    variant?.variantAssetUrls ?? product.assetUrls,
                    warnings,
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
                    variantRef.id,
                );
                await this.attachEntityAssets(ctx, variantEntity, variantAssetIds);
            }
        }

        return { assetsImported, warnings };
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
    ): Promise<ID | null> {
        const cacheKey = normalizeFilename(filename);
        const cached = this.assetCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        if (this.archive) {
            const stream = await this.archive.openStream(filename);
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

        if (!this.archive) {
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
