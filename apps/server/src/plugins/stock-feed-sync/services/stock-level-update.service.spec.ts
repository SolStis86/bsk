import { describe, expect, it, vi } from 'vitest';

import { StockLevelUpdateService } from './stock-level-update.service';

describe('StockLevelUpdateService', () => {
    it('updates only changed stock levels and counts unknown SKUs', async () => {
        const variants = [
            { id: '1', sku: 'N8440' },
            { id: '2', sku: 'N7988' },
        ];

        const repo = {
            find: vi.fn().mockResolvedValue(variants),
        };

        const connection = {
            getRepository: vi.fn().mockReturnValue(repo),
        };

        const stockLevelService = {
            getAvailableStock: vi
                .fn()
                .mockResolvedValueOnce({ stockOnHand: 100, stockAllocated: 0 })
                .mockResolvedValueOnce({ stockOnHand: 0, stockAllocated: 0 }),
        };

        const stockMovementService = {
            adjustProductVariantStock: vi.fn().mockResolvedValue(undefined),
        };

        const service = new StockLevelUpdateService(
            connection as never,
            stockLevelService as never,
            stockMovementService as never,
        );

        const stockBySku = new Map([
            ['N8440', 303],
            ['N7988', 0],
            ['UNKNOWN', 10],
        ]);

        const result = await service.applyStockUpdates({} as never, stockBySku);

        expect(result.matched).toBe(2);
        expect(result.updated).toBe(1);
        expect(result.unchanged).toBe(1);
        expect(result.unknownSkus).toBe(1);
        expect(stockMovementService.adjustProductVariantStock).toHaveBeenCalledTimes(1);
        expect(stockMovementService.adjustProductVariantStock).toHaveBeenCalledWith(
            {},
            '1',
            303,
        );
    });
});
