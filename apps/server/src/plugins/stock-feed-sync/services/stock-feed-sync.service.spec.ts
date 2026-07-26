import fs from 'fs';
import path from 'path';

import { describe, expect, it, vi } from 'vitest';

import { defaultStockFeedSyncPluginOptions } from '../test/plugin-options.fixture';
import { StockFeedParserService } from './stock-feed-parser.service';
import { StockFeedSyncProgressService } from './stock-feed-sync-progress.service';
import { StockFeedSyncService } from './stock-feed-sync.service';
import { StockLevelUpdateService } from './stock-level-update.service';

const fixturesDir = path.join(__dirname, '../__fixtures__');

describe('StockFeedSyncService', () => {
    it('runs sync from fixture and records result counters', async () => {
        const progressService = {
            updateMessage: vi.fn(),
            complete: vi.fn(),
            fail: vi.fn(),
        };

        const stockLevelUpdateService = {
            applyStockUpdates: vi.fn().mockResolvedValue({
                matched: 2,
                updated: 1,
                unchanged: 1,
                unknownSkus: 3,
            }),
        };

        const service = new StockFeedSyncService(
            defaultStockFeedSyncPluginOptions,
            new StockFeedParserService(),
            stockLevelUpdateService as never,
            progressService as never,
        );

        const result = await service.runSync({} as never, 'run-1', {
            fixturePath: path.join(fixturesDir, 'stock-feed.csv'),
        });

        expect(result.rowsParsed).toBe(5);
        expect(result.matched).toBe(2);
        expect(result.updated).toBe(1);
        expect(result.unchanged).toBe(1);
        expect(result.unknownSkus).toBe(3);
        expect(stockLevelUpdateService.applyStockUpdates).toHaveBeenCalledOnce();
    });
});
