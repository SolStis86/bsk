import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';
import { In, Not } from 'typeorm';

import { StockFeedSyncRunRecord } from '../entities/stock-feed-sync-run.entity';
import {
    StockFeedSyncResult,
    StockFeedSyncRun,
    StockFeedSyncSource,
    StockFeedSyncStatus,
} from '../types/sync.types';

const TERMINAL_STATUSES = [StockFeedSyncStatus.COMPLETE, StockFeedSyncStatus.FAILED];

@Injectable()
export class StockFeedSyncProgressService {
    constructor(private connection: TransactionalConnection) {}

    async initRun(ctx: RequestContext, runId: string, source: StockFeedSyncSource): Promise<void> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        await repo.save(
            new StockFeedSyncRunRecord({
                runId,
                status: StockFeedSyncStatus.RUNNING,
                source,
                message: 'Sync started',
                startedAt: new Date().toISOString(),
                completedAt: null,
                durationMs: null,
                result: null,
                error: null,
            }),
        );
    }

    async updateMessage(ctx: RequestContext, runId: string, message: string): Promise<void> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const record = await repo.findOne({ where: { runId } });
        if (record) {
            record.message = message;
            await repo.save(record);
        }
    }

    async complete(ctx: RequestContext, runId: string, result: StockFeedSyncResult): Promise<void> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const record = await repo.findOne({ where: { runId } });
        const completedAt = new Date();
        const startedAt = record?.startedAt ? new Date(record.startedAt) : completedAt;

        await repo.save({
            ...record,
            runId,
            status: StockFeedSyncStatus.COMPLETE,
            message: 'Sync complete',
            result,
            error: null,
            completedAt: completedAt.toISOString(),
            durationMs: completedAt.getTime() - startedAt.getTime(),
        });
    }

    async fail(ctx: RequestContext, runId: string, error: string): Promise<void> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const record = await repo.findOne({ where: { runId } });
        const completedAt = new Date();
        const startedAt = record?.startedAt ? new Date(record.startedAt) : completedAt;

        await repo.save({
            ...record,
            runId,
            status: StockFeedSyncStatus.FAILED,
            message: 'Sync failed',
            error,
            completedAt: completedAt.toISOString(),
            durationMs: completedAt.getTime() - startedAt.getTime(),
        });
    }

    async get(ctx: RequestContext, runId: string): Promise<StockFeedSyncRun | null> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const record = await repo.findOne({ where: { runId } });
        return record ? this.toRun(record) : null;
    }

    async getLastCompleted(ctx: RequestContext): Promise<StockFeedSyncRun | null> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const record = await repo.findOne({
            where: { status: StockFeedSyncStatus.COMPLETE },
            order: { completedAt: 'DESC' },
        });
        return record ? this.toRun(record) : null;
    }

    async getRecentRuns(ctx: RequestContext, take = 10): Promise<StockFeedSyncRun[]> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const records = await repo.find({
            order: { createdAt: 'DESC' },
            take,
        });
        return records.map(record => this.toRun(record));
    }

    async hasActiveSync(ctx: RequestContext): Promise<boolean> {
        const repo = this.connection.getRepository(ctx, StockFeedSyncRunRecord);
        const count = await repo.count({
            where: {
                status: Not(In(TERMINAL_STATUSES)),
            },
        });
        return count > 0;
    }

    private toRun(record: StockFeedSyncRunRecord): StockFeedSyncRun {
        return {
            runId: record.runId,
            status: record.status,
            source: record.source,
            message: record.message,
            startedAt: record.startedAt,
            completedAt: record.completedAt,
            durationMs: record.durationMs,
            result: record.result,
            error: record.error,
        };
    }
}
