import { Injectable } from '@nestjs/common';
import { Job, JobBuffer, JobQueueService } from '@vendure/core';

const COLLECTION_BUFFER_ID = 'product-feed-import-suppress-collection-filters';
const SEARCH_BUFFER_ID = 'product-feed-import-suppress-search-index';

const SUPPRESSED_SEARCH_INDEX_TYPES = new Set([
    'update-product',
    'update-variants',
    'update-variants-by-id',
    'update-asset',
]);

class SuppressCollectionFiltersBuffer implements JobBuffer {
    readonly id = COLLECTION_BUFFER_ID;

    collect(job: Job): boolean {
        return job.queueName === 'apply-collection-filters';
    }

    reduce(): Array<Job> {
        return [];
    }
}

class SuppressSearchIndexBuffer implements JobBuffer {
    readonly id = SEARCH_BUFFER_ID;

    collect(job: Job): boolean {
        if (job.queueName !== 'update-search-index') {
            return false;
        }

        const type = (job.data as { type?: string })?.type;
        return type != null && SUPPRESSED_SEARCH_INDEX_TYPES.has(type);
    }

    reduce(): Array<Job> {
        return [];
    }
}

@Injectable()
export class ProductFeedImportSideEffectBufferService {
    private readonly collectionBuffer = new SuppressCollectionFiltersBuffer();
    private readonly searchBuffer = new SuppressSearchIndexBuffer();
    private active = false;

    constructor(private jobQueueService: JobQueueService) {}

    isActive(): boolean {
        return this.active;
    }

    activate(): void {
        if (this.active) {
            return;
        }

        this.jobQueueService.addBuffer(this.collectionBuffer);
        this.jobQueueService.addBuffer(this.searchBuffer);
        this.active = true;
    }

    async discardCollectionJobs(): Promise<void> {
        if (!this.active) {
            return;
        }

        await this.jobQueueService.flush(this.collectionBuffer);
    }

    async discardSearchJobs(): Promise<void> {
        if (!this.active) {
            return;
        }

        await this.jobQueueService.flush(this.searchBuffer);
    }

    deactivate(): void {
        if (!this.active) {
            return;
        }

        this.jobQueueService.removeBuffer(this.collectionBuffer);
        this.jobQueueService.removeBuffer(this.searchBuffer);
        this.active = false;
    }
}
