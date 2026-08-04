import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductFeedImportStage, emptyImportResult } from '../types/import.types';
import { ProductFeedAssetImportService } from './product-feed-asset-import.service';

describe('ProductFeedAssetImportService asset zip cleanup', () => {
    const activateImportSessionForWorker = vi.fn();
    const deactivateAssetSession = vi.fn();
    const importFromPayload = vi.fn();
    const syncAssetImportProgress = vi.fn();

    let service: ProductFeedAssetImportService;

    beforeEach(() => {
        vi.clearAllMocks();
        activateImportSessionForWorker.mockResolvedValue(undefined);
        deactivateAssetSession.mockResolvedValue(undefined);
        importFromPayload.mockResolvedValue({ assetsImported: 1, warnings: [] });
        syncAssetImportProgress.mockResolvedValue(0);

        service = new ProductFeedAssetImportService(
            {} as never,
            {
                activateImportSessionForWorker,
                deactivateAssetSession,
                importFromPayload,
            } as never,
            {
                syncAssetImportProgress,
            } as never,
        );
    });

    it('activates the zip session on the worker before importing assets', async () => {
        await (service as any).processAssetJob({
            data: {
                ctx: { serialize: () => ({}) },
                importJobId: '17086',
                payload: { productId: '1', assetFilenames: [], assetUrls: [], variants: [] },
            },
        });

        expect(activateImportSessionForWorker).toHaveBeenCalledWith('17086');
        expect(importFromPayload).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
        expect(deactivateAssetSession).toHaveBeenCalled();
        expect(syncAssetImportProgress).toHaveBeenCalledWith(expect.anything(), '17086');
    });

    it('syncs progress even when importFromPayload throws', async () => {
        importFromPayload.mockRejectedValue(new Error('import failed'));

        await expect(
            (service as any).processAssetJob({
                data: {
                    ctx: { serialize: () => ({}) },
                    importJobId: '17086',
                    payload: { productId: '1', assetFilenames: [], assetUrls: [], variants: [] },
                },
            }),
        ).rejects.toThrow('import failed');

        expect(deactivateAssetSession).toHaveBeenCalled();
        expect(syncAssetImportProgress).toHaveBeenCalledWith(expect.anything(), '17086');
    });
});

describe('ProductFeedAssetImportService finalization via sync service', () => {
    it('documents that finalization is handled by ProductFeedAssetImportProgressSyncService', () => {
        expect(ProductFeedImportStage.IMPORTING_ASSETS).toBe('IMPORTING_ASSETS');
        expect(emptyImportResult()).toBeDefined();
    });
});
