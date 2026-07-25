import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';

import { ProductFeedImportProgressRecord } from '../entities/product-feed-import-progress.entity';
import {
    ImportProgressUpdate,
    ProductFeedImportProgress,
    ProductFeedImportResult,
    ProductFeedImportStage,
} from '../types/import.types';

@Injectable()
export class ProductFeedImportProgressService {
    constructor(private connection: TransactionalConnection) {}

    async initRun(ctx: RequestContext, jobId: string): Promise<void> {
        await this.save(ctx, jobId, {
            stage: ProductFeedImportStage.QUEUED,
            message: 'Import queued',
            progress: 0,
            processedProducts: 0,
            totalProducts: 0,
            currentProductCode: null,
            result: null,
            error: null,
        });
    }

    async update(ctx: RequestContext, jobId: string, update: ImportProgressUpdate): Promise<void> {
        const current = (await this.get(ctx, jobId)) ?? this.defaultProgress(jobId);
        await this.save(ctx, jobId, {
            stage: update.stage,
            message: update.message,
            progress: update.progress,
            processedProducts: update.processedProducts ?? current.processedProducts,
            totalProducts: update.totalProducts ?? current.totalProducts,
            currentProductCode: update.currentProductCode ?? current.currentProductCode ?? null,
        });
    }

    async complete(ctx: RequestContext, jobId: string, result: ProductFeedImportResult): Promise<void> {
        await this.save(ctx, jobId, {
            stage: ProductFeedImportStage.COMPLETE,
            message: 'Import complete',
            progress: 100,
            result,
            error: null,
        });
    }

    async fail(ctx: RequestContext, jobId: string, error: string): Promise<void> {
        await this.save(ctx, jobId, {
            stage: ProductFeedImportStage.FAILED,
            message: 'Import failed',
            error,
        });
    }

    async get(ctx: RequestContext, jobId: string): Promise<ProductFeedImportProgress | null> {
        const repo = this.connection.getRepository(ctx, ProductFeedImportProgressRecord);
        const record = await repo.findOne({ where: { jobId } });
        return record ? this.toProgress(record) : null;
    }

    private async save(
        ctx: RequestContext,
        jobId: string,
        data: Partial<ProductFeedImportProgressRecord>,
    ): Promise<void> {
        const repo = this.connection.getRepository(ctx, ProductFeedImportProgressRecord);
        const existing = await repo.findOne({ where: { jobId } });

        if (existing) {
            await repo.save({ ...existing, ...data, jobId });
            return;
        }

        await repo.save(
            new ProductFeedImportProgressRecord({
                jobId,
                stage: ProductFeedImportStage.QUEUED,
                message: 'Import queued',
                progress: 0,
                processedProducts: 0,
                totalProducts: 0,
                currentProductCode: null,
                result: null,
                error: null,
                ...data,
            }),
        );
    }

    private toProgress(record: ProductFeedImportProgressRecord): ProductFeedImportProgress {
        return {
            jobId: record.jobId,
            stage: record.stage as ProductFeedImportStage,
            message: record.message,
            progress: record.progress,
            processedProducts: record.processedProducts,
            totalProducts: record.totalProducts,
            currentProductCode: record.currentProductCode,
            result: record.result,
            error: record.error,
        };
    }

    private defaultProgress(jobId: string): ProductFeedImportProgress {
        return {
            jobId,
            stage: ProductFeedImportStage.QUEUED,
            message: 'Import queued',
            progress: 0,
            processedProducts: 0,
            totalProducts: 0,
            currentProductCode: null,
            result: null,
            error: null,
        };
    }
}
