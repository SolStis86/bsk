import { describe, expect, it, vi } from 'vitest';

import { ProductFeedImportProgressRecord } from '../entities/product-feed-import-progress.entity';
import { ProductFeedImportProgressService, isAssetZipStillRequired } from './product-feed-import-progress.service';
import { ProductFeedImportStage, emptyImportResult } from '../types/import.types';

function createMockContext() {
    return {} as never;
}

function createMockService(initialRecords: ProductFeedImportProgressRecord[] = []) {
    const records = new Map(initialRecords.map(record => [record.jobId, record]));

    const repo = {
        findOne: vi.fn(async ({ where }: { where: { jobId: string } }) => records.get(where.jobId) ?? null),
        save: vi.fn(async (record: ProductFeedImportProgressRecord) => {
            records.set(record.jobId, record);
            return record;
        }),
        increment: vi.fn(async (_where: { jobId: string }, _column: string, amount: number) => {
            const record = records.get(_where.jobId);
            if (!record) {
                return { affected: 0 };
            }
            record.assetsPending = (record.assetsPending ?? 0) + amount;
            records.set(record.jobId, record);
            return { affected: 1 };
        }),
        createQueryBuilder: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            execute: vi.fn(async () => {
                const record = records.get('42');
                if (record && (record.assetsPending ?? 0) > 0) {
                    record.assetsPending = Math.max(0, (record.assetsPending ?? 0) - 1);
                }
                return { affected: 1 };
            }),
        })),
        count: vi.fn(async () => 0),
    };

    const connection = {
        getRepository: vi.fn(() => repo),
    };

    return {
        service: new ProductFeedImportProgressService(connection as never),
        records,
        repo,
    };
}

describe('isAssetZipStillRequired', () => {
    it('returns true while catalog sync is still running', () => {
        expect(isAssetZipStillRequired(ProductFeedImportStage.SYNCING_PRODUCTS)).toBe(true);
    });

    it('returns false after asset jobs have been queued', () => {
        expect(isAssetZipStillRequired(ProductFeedImportStage.ENQUEUING_ASSETS)).toBe(false);
        expect(isAssetZipStillRequired(ProductFeedImportStage.IMPORTING_ASSETS)).toBe(false);
    });
});

describe('ProductFeedImportProgressService', () => {
    it('tracks progress updates through completion', async () => {
        const ctx = createMockContext();
        const { service } = createMockService();
        await service.initRun(ctx, '42');

        await service.update(ctx, '42', {
            stage: ProductFeedImportStage.SYNCING_PRODUCTS,
            message: 'Syncing product 1 of 2',
            progress: 50,
            processedProducts: 1,
            totalProducts: 2,
            currentProductCode: 'ABC123',
        });

        const inProgress = await service.get(ctx, '42');
        expect(inProgress?.stage).toBe(ProductFeedImportStage.SYNCING_PRODUCTS);
        expect(inProgress?.processedProducts).toBe(1);
        expect(inProgress?.currentProductCode).toBe('ABC123');

        const result = { ...emptyImportResult(), productsCreated: 2 };
        await service.complete(ctx, '42', result);

        const completed = await service.get(ctx, '42');
        expect(completed?.stage).toBe(ProductFeedImportStage.COMPLETE);
        expect(completed?.progress).toBe(100);
        expect(completed?.result?.productsCreated).toBe(2);
    });

    it('records failures', async () => {
        const ctx = createMockContext();
        const { service } = createMockService();
        await service.initRun(ctx, '99');
        await service.fail(ctx, '99', 'Feed unavailable');

        expect(await service.get(ctx, '99')).toMatchObject({
            stage: ProductFeedImportStage.FAILED,
            error: 'Feed unavailable',
        });
    });

    it('increments and decrements assetsPending for queued asset jobs', async () => {
        const ctx = createMockContext();
        const { service } = createMockService();
        await service.initRun(ctx, '42');

        expect(await service.incrementAssetsPending(ctx, '42')).toBe(1);
        expect(await service.incrementAssetsPending(ctx, '42')).toBe(2);
        expect(await service.decrementAssetsPending(ctx, '42')).toBe(1);
        expect(await service.decrementAssetsPending(ctx, '42')).toBe(0);
    });

    it('preserves assetsPending when progress updates omit the field', async () => {
        const ctx = createMockContext();
        const { service, records } = createMockService();
        await service.initRun(ctx, '42');
        await service.incrementAssetsPending(ctx, '42');
        await service.incrementAssetsPending(ctx, '42');

        await service.update(ctx, '42', {
            stage: ProductFeedImportStage.APPLYING_COLLECTIONS,
            message: 'Applying collection filters…',
            progress: 90,
        });

        expect(records.get('42')?.assetsPending).toBe(2);
    });
});
