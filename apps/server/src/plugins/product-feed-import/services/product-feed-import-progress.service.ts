import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';
import { In, Not } from 'typeorm';

import { ProductFeedImportProgressRecord } from '../entities/product-feed-import-progress.entity';
import {
    ImportProgressUpdate,
    ImportSource,
    ProductFeedImportProgress,
    ProductFeedImportResult,
    ProductFeedImportStage,
    ProductFeedImportSummary,
} from '../types/import.types';

const TERMINAL_STAGES = [ProductFeedImportStage.COMPLETE, ProductFeedImportStage.FAILED];

@Injectable()
export class ProductFeedImportProgressService {
    constructor(private connection: TransactionalConnection) {}

    async initRun(
        ctx: RequestContext,
        jobId: string,
        source: ImportSource = 'manual',
    ): Promise<void> {
        await this.save(ctx, jobId, {
            stage: ProductFeedImportStage.QUEUED,
            message: 'Import queued',
            progress: 0,
            processedProducts: 0,
            totalProducts: 0,
            currentProductCode: null,
            assetsPending: 0,
            source,
            startedAt: new Date().toISOString(),
            completedAt: null,
            durationMs: null,
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
            assetsPending: update.assetsPending ?? current.assetsPending ?? 0,
        });
    }

    async setAssetsPending(ctx: RequestContext, jobId: string, assetsPending: number): Promise<void> {
        await this.save(ctx, jobId, { assetsPending });
    }

    async decrementAssetsPending(ctx: RequestContext, jobId: string): Promise<number> {
        const repo = this.connection.getRepository(ctx, ProductFeedImportProgressRecord);
        const record = await repo.findOne({ where: { jobId } });
        if (!record) {
            return 0;
        }

        const assetsPending = Math.max(0, (record.assetsPending ?? 0) - 1);
        await repo.save({ ...record, assetsPending });
        return assetsPending;
    }

    async complete(ctx: RequestContext, jobId: string, result: ProductFeedImportResult): Promise<void> {
        const record = await this.connection
            .getRepository(ctx, ProductFeedImportProgressRecord)
            .findOne({ where: { jobId } });
        const completedAt = new Date();
        const startedAt = record?.startedAt ? new Date(record.startedAt) : completedAt;

        await this.save(ctx, jobId, {
            stage: ProductFeedImportStage.COMPLETE,
            message: 'Import complete',
            progress: 100,
            result,
            error: null,
            completedAt: completedAt.toISOString(),
            durationMs: completedAt.getTime() - startedAt.getTime(),
        });
    }

    async fail(ctx: RequestContext, jobId: string, error: string): Promise<void> {
        const record = await this.connection
            .getRepository(ctx, ProductFeedImportProgressRecord)
            .findOne({ where: { jobId } });
        const completedAt = new Date();
        const startedAt = record?.startedAt ? new Date(record.startedAt) : completedAt;

        await this.save(ctx, jobId, {
            stage: ProductFeedImportStage.FAILED,
            message: 'Import failed',
            error,
            completedAt: completedAt.toISOString(),
            durationMs: completedAt.getTime() - startedAt.getTime(),
        });
    }

    async get(ctx: RequestContext, jobId: string): Promise<ProductFeedImportProgress | null> {
        const repo = this.connection.getRepository(ctx, ProductFeedImportProgressRecord);
        const record = await repo.findOne({ where: { jobId } });
        return record ? this.toProgress(record) : null;
    }

    async hasActiveImport(ctx: RequestContext): Promise<boolean> {
        const repo = this.connection.getRepository(ctx, ProductFeedImportProgressRecord);
        const count = await repo.count({
            where: {
                stage: Not(In(TERMINAL_STAGES)),
            },
        });
        return count > 0;
    }

    async getLastCompletedImport(ctx: RequestContext): Promise<ProductFeedImportSummary | null> {
        const repo = this.connection.getRepository(ctx, ProductFeedImportProgressRecord);
        const record = await repo.findOne({
            where: { stage: ProductFeedImportStage.COMPLETE },
            order: { completedAt: 'DESC' },
        });

        if (!record?.result || !record.completedAt) {
            return null;
        }

        return {
            jobId: record.jobId,
            completedAt: new Date(record.completedAt),
            source: (record.source as ImportSource) ?? 'manual',
            result: record.result,
            assetsPending: record.assetsPending ?? 0,
        };
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
                assetsPending: 0,
                source: 'manual',
                startedAt: new Date().toISOString(),
                completedAt: null,
                durationMs: null,
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
            assetsPending: record.assetsPending ?? 0,
            result: record.result,
            error: record.error,
            source: (record.source as ImportSource) ?? null,
            startedAt: record.startedAt ? new Date(record.startedAt) : null,
            completedAt: record.completedAt ? new Date(record.completedAt) : null,
            durationMs: record.durationMs,
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
            assetsPending: 0,
            result: null,
            error: null,
            source: null,
            startedAt: null,
            completedAt: null,
            durationMs: null,
        };
    }
}
