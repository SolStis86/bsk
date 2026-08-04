import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import {
    CollectionService,
    Job,
    JobQueue,
    JobQueueService,
    RequestContext,
} from '@vendure/core';

import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS, PRODUCT_FEED_IMPORT_QUEUE_NAME, loggerCtx } from '../constants';
import { FeedWarning } from '../types/feed.types';
import {
    emptyImportResult,
    ImportOptions,
    ImportProgressCallback,
    ProductFeedImportResult,
    ProductFeedImportStage,
    ProductFeedImportStartResult,
} from '../types/import.types';
import { PluginInitOptions } from '../types';
import { AssetImportService } from './asset-import.service';
import { CatalogSyncService } from './catalog-sync.service';
import { FeedMapperService } from './feed-mapper.service';
import { FeedParserService } from './feed-parser.service';
import { ProductFeedAssetImportService } from './product-feed-asset-import.service';
import { ProductFeedAssetImportProgressSyncService } from './product-feed-asset-import-progress-sync.service';
import { ProductFeedImportFinalizationService } from './product-feed-import-finalization.service';
import { ProductFeedImportProgressService } from './product-feed-import-progress.service';
import { ProductFeedImportSideEffectBufferService } from './product-feed-import-side-effect-buffer.service';
import { TaxonomySyncService } from './taxonomy-sync.service';

interface ProductFeedImportJobData {
    ctx: ReturnType<RequestContext['serialize']>;
    importLimit?: number;
    source?: ImportOptions['source'];
}

@Injectable()
export class ProductFeedImportService implements OnModuleInit {
    private readonly logger = new Logger(loggerCtx);
    private importQueue!: JobQueue<ProductFeedImportJobData>;

    constructor(
        @Inject(PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS) private options: PluginInitOptions,
        private feedParserService: FeedParserService,
        private feedMapperService: FeedMapperService,
        private catalogSyncService: CatalogSyncService,
        private assetImportService: AssetImportService,
        private assetQueueService: ProductFeedAssetImportService,
        private assetProgressSyncService: ProductFeedAssetImportProgressSyncService,
        private taxonomySyncService: TaxonomySyncService,
        private collectionService: CollectionService,
        private jobQueueService: JobQueueService,
        private progressService: ProductFeedImportProgressService,
        private sideEffectBuffer: ProductFeedImportSideEffectBufferService,
        private finalizationService: ProductFeedImportFinalizationService,
    ) {}

    async onModuleInit(): Promise<void> {
        this.importQueue = await this.jobQueueService.createQueue({
            name: PRODUCT_FEED_IMPORT_QUEUE_NAME,
            process: job => this.processImportJob(job),
        });
    }

    async startImportJob(
        ctx: RequestContext,
        options: ImportOptions = {},
    ): Promise<ProductFeedImportStartResult> {
        if (await this.progressService.hasActiveImport(ctx)) {
            throw new Error('A product feed import is already running');
        }

        const source = options.source ?? 'manual';
        const job = await this.importQueue.add(
            {
                ctx: ctx.serialize(),
                importLimit: options.importLimit,
                source,
            },
            { ctx },
        );

        const jobId = String(job.id);
        await this.progressService.initRun(ctx, jobId, source);

        return { jobId };
    }

    async import(ctx: RequestContext, options: ImportOptions = {}): Promise<ProductFeedImportResult> {
        this.reportProgress(options.onProgress, {
            stage: ProductFeedImportStage.DOWNLOADING_FEED,
            message: 'Downloading product feed…',
            progress: 1,
        });

        const buffer = await this.loadFeedBuffer(options);

        this.reportProgress(options.onProgress, {
            stage: ProductFeedImportStage.DOWNLOADING_FEED,
            message: 'Product feed downloaded',
            progress: 3,
        });

        return this.importFromBuffer(ctx, buffer, options);
    }

    async importFromBuffer(
        ctx: RequestContext,
        buffer: Buffer,
        options: ImportOptions = {},
    ): Promise<ProductFeedImportResult> {
        const result = emptyImportResult();
        const importJobId = options.importJobId;
        const deferAssets =
            !options.skipAssets &&
            (options.deferAssets ?? this.options.assetQueueEnabled);
        const seenSkus = new Set<string>();
        const syncStartedAt = new Date();
        let isFullImport = true;
        let assetsStillPending = false;

        this.taxonomySyncService.clearCaches();
        this.assetImportService.clearCache();
        this.collectionService.setApplyAllFiltersOnProductUpdates(false);
        this.sideEffectBuffer.activate();

        try {
            if (!options.skipAssets) {
                this.reportProgress(options.onProgress, {
                    stage: ProductFeedImportStage.PREPARING_IMAGES,
                    message: 'Preparing product image archive…',
                    progress: 5,
                });
                await this.assetImportService.prepareArchive({
                    ...options,
                    importJobId,
                });
                this.reportProgress(options.onProgress, {
                    stage: ProductFeedImportStage.PREPARING_IMAGES,
                    message: 'Image archive ready',
                    progress: 8,
                });
            }

            this.reportProgress(options.onProgress, {
                stage: ProductFeedImportStage.PARSING_FEED,
                message: 'Parsing product feed…',
                progress: 10,
            });

            const parsed = this.feedParserService.parse(buffer);
            result.warnings.push(...this.formatParseWarnings(parsed.rowWarnings));
            result.errors.push(...parsed.parseErrors.map(e => e.message));

            const mapped = this.feedMapperService.map(parsed.rows);
            result.warnings.push(...this.formatMapWarnings(mapped.report.warnings));

            let products = mapped.products;
            const explicitLimit = options.importLimit;
            const defaultLimit = this.options.devImportLimit;
            const limit = explicitLimit ?? defaultLimit;
            if (limit && limit > 0) {
                products = products.slice(0, limit);
                isFullImport = false;
            }

            const totalProducts = products.length;
            this.reportProgress(options.onProgress, {
                stage: ProductFeedImportStage.SYNCING_PRODUCTS,
                message:
                    totalProducts > 0
                        ? `Syncing ${totalProducts} products…`
                        : 'No products to sync',
                progress: 12,
                processedProducts: 0,
                totalProducts,
            });

            for (let index = 0; index < products.length; index++) {
                const product = products[index];
                try {
                    const syncResult = await this.catalogSyncService.upsert(ctx, product);

                    for (const variant of product.variants) {
                        seenSkus.add(variant.sku);
                    }

                    if (syncResult.productCreated) {
                        result.productsCreated++;
                    } else if (syncResult.productUpdated) {
                        result.productsUpdated++;
                    }
                    result.variantsCreated += syncResult.variantsCreated;
                    result.variantsUpdated += syncResult.variantsUpdated;

                    if (!options.skipAssets) {
                        if (deferAssets && importJobId) {
                            const enqueueResult = await this.assetQueueService.enqueueForProduct(
                                ctx,
                                importJobId,
                                product,
                                syncResult,
                            );
                            if (enqueueResult.enqueued) {
                                result.assetsEnqueued++;
                            }
                        } else {
                            const assetResult = await this.assetImportService.importForProduct(
                                ctx,
                                product,
                                syncResult.productId,
                                syncResult.variantIds,
                            );
                            result.assetsImported += assetResult.assetsImported;
                            result.warnings.push(...assetResult.warnings);
                        }
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    result.errors.push(
                        `Failed to sync product ${product.productCode}: ${message}`,
                    );
                    this.logger.error(
                        `Failed to sync product ${product.productCode}: ${message}`,
                    );
                }

                const processedProducts = index + 1;
                const progress =
                    totalProducts === 0
                        ? 80
                        : 12 + Math.floor((processedProducts / totalProducts) * 68);

                this.reportProgress(options.onProgress, {
                    stage: ProductFeedImportStage.SYNCING_PRODUCTS,
                    message: `Syncing product ${processedProducts} of ${totalProducts}`,
                    progress,
                    processedProducts,
                    totalProducts,
                    currentProductCode: product.productCode,
                });
            }

            if (
                this.options.disableMissingFromFeed &&
                isFullImport &&
                result.errors.length === 0
            ) {
                this.reportProgress(options.onProgress, {
                    stage: ProductFeedImportStage.DISABLING_MISSING,
                    message: 'Disabling variants missing from feed…',
                    progress: 82,
                    processedProducts: totalProducts,
                    totalProducts,
                });

                const disableResult = await this.catalogSyncService.disableMissingFromFeed(
                    ctx,
                    syncStartedAt,
                    seenSkus,
                );
                result.variantsDisabled = disableResult.variantsDisabled;
                result.productsDisabled = disableResult.productsDisabled;
            }

            assetsStillPending = deferAssets && !!importJobId && result.assetsEnqueued > 0;

            if (assetsStillPending) {
                this.reportProgress(options.onProgress, {
                    stage: ProductFeedImportStage.ENQUEUING_ASSETS,
                    message: `Queued ${result.assetsEnqueued} asset import job(s)`,
                    progress: 86,
                    processedProducts: totalProducts,
                    totalProducts,
                });
            } else if (importJobId && result.assetsEnqueued === 0) {
                await this.assetImportService.cleanupImportSession(importJobId);
            }

            this.reportProgress(options.onProgress, {
                stage: ProductFeedImportStage.APPLYING_COLLECTIONS,
                message: 'Applying collection filters…',
                progress: 90,
                processedProducts: totalProducts,
                totalProducts,
            });

            await this.sideEffectBuffer.discardCollectionJobs();
            await this.collectionService.triggerApplyFiltersJob(ctx);

            const shouldReindex = this.shouldReindexSearch(result);
            if (shouldReindex && !assetsStillPending) {
                this.reportProgress(options.onProgress, {
                    stage: ProductFeedImportStage.REINDEXING_SEARCH,
                    message: 'Queueing search reindex…',
                    progress: 95,
                    processedProducts: totalProducts,
                    totalProducts,
                    assetsPending: result.assetsEnqueued,
                });
                await this.finalizationService.queueSearchReindex(ctx);
            }
        } finally {
            await this.assetImportService.deactivateAssetSession();
            this.collectionService.setApplyAllFiltersOnProductUpdates(true);
            if (!assetsStillPending) {
                await this.sideEffectBuffer.discardSearchJobs();
                this.sideEffectBuffer.deactivate();
            }
        }

        return result;
    }

    private async processImportJob(job: Job<ProductFeedImportJobData>): Promise<ProductFeedImportResult> {
        const jobId = String(job.id);
        const ctx = RequestContext.deserialize(job.data.ctx);

        try {
            const result = await this.import(ctx, {
                importLimit: job.data.importLimit,
                importJobId: jobId,
                source: job.data.source ?? 'manual',
                deferAssets: this.options.assetQueueEnabled,
                onProgress: async update => {
                    await this.progressService.update(ctx, jobId, update);
                    job.setProgress(update.progress);
                },
            });

            const pending = await this.assetProgressSyncService.countPendingAssetJobs(ctx, jobId);
            await this.progressService.saveResult(ctx, jobId, result);
            await this.progressService.setAssetsPending(ctx, jobId, pending);

            if (pending > 0) {
                await this.progressService.update(ctx, jobId, {
                    stage: ProductFeedImportStage.IMPORTING_ASSETS,
                    message: `Importing assets (${pending} remaining)…`,
                    progress: 92,
                });
                return result;
            }

            await this.finalizationService.finalizeImport(ctx, jobId, result);
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.progressService.fail(ctx, jobId, message);
            this.sideEffectBuffer.deactivate();
            await this.assetImportService.cleanupImportSession(jobId);
            throw error;
        }
    }

    private shouldReindexSearch(result: ProductFeedImportResult): boolean {
        return (
            result.productsCreated +
                result.productsUpdated +
                result.variantsCreated +
                result.variantsUpdated >
            0
        );
    }

    private reportProgress(
        onProgress: ImportProgressCallback | undefined,
        update: Parameters<ImportProgressCallback>[0],
    ): void {
        void onProgress?.(update);
    }

    private async loadFeedBuffer(options: ImportOptions): Promise<Buffer> {
        if (options.fixturePath) {
            return readFileSync(options.fixturePath);
        }

        const response = await fetch(this.options.feedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch feed: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    private formatParseWarnings(warnings: FeedWarning[]): string[] {
        return warnings.map(w => w.message);
    }

    private formatMapWarnings(warnings: FeedWarning[]): string[] {
        return warnings.map(w => w.message);
    }
}
