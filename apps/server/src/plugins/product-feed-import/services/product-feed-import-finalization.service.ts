import { Injectable, Logger } from '@nestjs/common';
import { EventBus, RequestContext, SearchService } from '@vendure/core';

import { loggerCtx } from '../constants';
import { ProductFeedImportCompletedEvent } from '../events/product-feed-import-completed.event';
import { ProductFeedImportResult, ProductFeedImportStage } from '../types/import.types';
import { ProductFeedImportProgressService } from './product-feed-import-progress.service';
import { ProductFeedImportSideEffectBufferService } from './product-feed-import-side-effect-buffer.service';

@Injectable()
export class ProductFeedImportFinalizationService {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        private progressService: ProductFeedImportProgressService,
        private searchService: SearchService,
        private sideEffectBuffer: ProductFeedImportSideEffectBufferService,
        private eventBus: EventBus,
    ) {}

    async queueSearchReindex(ctx: RequestContext): Promise<void> {
        this.logger.log('Rebuilding search index...');
        const job = await this.searchService.reindex(ctx);
        this.logger.log(`Search reindex job queued (id: ${job.id})`);
    }

    async finalizeImport(
        ctx: RequestContext,
        jobId: string,
        result: ProductFeedImportResult,
    ): Promise<void> {
        await this.progressService.update(ctx, jobId, {
            stage: ProductFeedImportStage.REINDEXING_SEARCH,
            message: 'Search reindex queued',
            progress: 98,
        });
        await this.progressService.complete(ctx, jobId, result);
        await this.eventBus.publish(new ProductFeedImportCompletedEvent(ctx, jobId, result));
        this.sideEffectBuffer.deactivate();
    }
}
