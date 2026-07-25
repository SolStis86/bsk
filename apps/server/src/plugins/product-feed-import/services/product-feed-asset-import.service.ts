import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job, JobQueue, JobQueueService, RequestContext } from '@vendure/core';

import { PRODUCT_FEED_ASSET_IMPORT_QUEUE_NAME } from '../constants';
import { NormalizedProduct } from '../types/feed.types';
import {
    ProductAssetImportPayload,
    toAssetImportPayload,
} from '../types/asset-import.types';
import { CatalogSyncResult } from '../types/import.types';
import { AssetImportService } from './asset-import.service';
import { ProductFeedImportProgressService } from './product-feed-import-progress.service';

type AssetImportJobPayload = {
    productId: string;
    assetFilenames: string[];
    assetUrls: string[];
    variants: Array<{
        id: string;
        sku: string;
        variantAssetFilenames: string[];
        variantAssetUrls: string[];
    }>;
};

interface ProductFeedAssetImportJobData {
    ctx: ReturnType<RequestContext['serialize']>;
    importJobId: string;
    payload: AssetImportJobPayload;
}

@Injectable()
export class ProductFeedAssetImportService implements OnModuleInit {
    private assetQueue!: JobQueue<ProductFeedAssetImportJobData>;

    constructor(
        private jobQueueService: JobQueueService,
        private assetImportService: AssetImportService,
        private progressService: ProductFeedImportProgressService,
    ) {}

    async onModuleInit(): Promise<void> {
        this.assetQueue = await this.jobQueueService.createQueue({
            name: PRODUCT_FEED_ASSET_IMPORT_QUEUE_NAME,
            process: job => this.processAssetJob(job),
        });
    }

    async enqueueForProduct(
        ctx: RequestContext,
        importJobId: string,
        product: NormalizedProduct,
        syncResult: CatalogSyncResult,
    ): Promise<{ enqueued: boolean; skipped: boolean }> {
        const payload = toAssetImportPayload(product, syncResult.productId, syncResult.variantIds);

        if (await this.assetImportService.assetsUnchanged(ctx, syncResult.productId, payload)) {
            return { enqueued: false, skipped: true };
        }

        await this.assetQueue.add(
            {
                ctx: ctx.serialize(),
                importJobId,
                payload: this.toJobPayload(payload),
            },
            { ctx },
        );

        return { enqueued: true, skipped: false };
    }

    private async processAssetJob(
        job: Job<ProductFeedAssetImportJobData>,
    ): Promise<{ assetsImported: number; warnings: string[] }> {
        const ctx = RequestContext.deserialize(job.data.ctx);
        const { importJobId, payload } = job.data;
        const archive = await this.assetImportService.openArchiveForImport(importJobId);

        try {
            const result = await this.assetImportService.importFromPayload(
                ctx,
                payload as ProductAssetImportPayload,
                archive,
            );
            const assetsPending = await this.progressService.decrementAssetsPending(ctx, importJobId);

            if (assetsPending === 0) {
                await this.assetImportService.cleanupImportSession(importJobId);
            }

            return result;
        } finally {
            await archive?.close();
        }
    }

    private toJobPayload(payload: ProductAssetImportPayload): AssetImportJobPayload {
        return {
            productId: payload.productId,
            assetFilenames: [...payload.assetFilenames],
            assetUrls: [...payload.assetUrls],
            variants: payload.variants.map(variant => ({
                id: variant.id,
                sku: variant.sku,
                variantAssetFilenames: [...variant.variantAssetFilenames],
                variantAssetUrls: [...variant.variantAssetUrls],
            })),
        };
    }
}
