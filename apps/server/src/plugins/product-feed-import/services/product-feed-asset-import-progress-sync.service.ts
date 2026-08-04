import { JobState } from '@vendure/common/lib/generated-types';
import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';

import { PRODUCT_FEED_ASSET_IMPORT_QUEUE_NAME } from '../constants';
import { ProductFeedImportResult, ProductFeedImportStage } from '../types/import.types';
import { AssetImportService } from './asset-import.service';
import { ProductFeedImportFinalizationService } from './product-feed-import-finalization.service';
import { ProductFeedImportProgressService } from './product-feed-import-progress.service';
import { ProductFeedImportSideEffectBufferService } from './product-feed-import-side-effect-buffer.service';

const ACTIVE_JOB_STATES = [JobState.PENDING, JobState.RUNNING, JobState.RETRYING];

@Injectable()
export class ProductFeedAssetImportProgressSyncService {
    constructor(
        private connection: TransactionalConnection,
        private progressService: ProductFeedImportProgressService,
        private sideEffectBuffer: ProductFeedImportSideEffectBufferService,
        private finalizationService: ProductFeedImportFinalizationService,
        private assetImportService: AssetImportService,
    ) {}

    async countPendingAssetJobs(ctx: RequestContext, importJobId: string): Promise<number> {
        const rows: Array<{ count: string }> = await this.connection.rawConnection.query(
            `
            SELECT COUNT(*)::text AS count
            FROM job_record
            WHERE "queueName" = $1
              AND state = ANY($2::text[])
              AND (data::json->>'importJobId') = $3
            `,
            [PRODUCT_FEED_ASSET_IMPORT_QUEUE_NAME, ACTIVE_JOB_STATES, importJobId],
        );

        return Number(rows[0]?.count ?? 0);
    }

    async syncAssetImportProgress(ctx: RequestContext, importJobId: string): Promise<number> {
        const progress = await this.progressService.get(ctx, importJobId);
        if (!progress || this.isTerminalStage(progress.stage)) {
            return progress?.assetsPending ?? 0;
        }

        const pending = await this.countPendingAssetJobs(ctx, importJobId);
        await this.progressService.setAssetsPending(ctx, importJobId, pending);

        if (
            pending === 0 &&
            progress.result &&
            progress.stage === ProductFeedImportStage.IMPORTING_ASSETS
        ) {
            await this.completeImportAfterAssets(ctx, importJobId, progress.result);
        }

        return pending;
    }

    private async completeImportAfterAssets(
        ctx: RequestContext,
        importJobId: string,
        storedResult: ProductFeedImportResult,
    ): Promise<void> {
        const progress = await this.progressService.get(ctx, importJobId);
        if (!progress || progress.stage === ProductFeedImportStage.COMPLETE) {
            return;
        }

        await this.sideEffectBuffer.discardSearchJobs();
        await this.finalizationService.queueSearchReindex(ctx);
        await this.finalizationService.finalizeImport(ctx, importJobId, storedResult);
        await this.assetImportService.cleanupImportSession(importJobId);
    }

    private isTerminalStage(stage: ProductFeedImportStage): boolean {
        return stage === ProductFeedImportStage.COMPLETE || stage === ProductFeedImportStage.FAILED;
    }
}
