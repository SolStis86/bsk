import { describe, expect, it, vi } from 'vitest';

import { ProductFeedImportProgressRecord } from '../entities/product-feed-import-progress.entity';
import { ProductFeedImportProgressService } from './product-feed-import-progress.service';
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
});
