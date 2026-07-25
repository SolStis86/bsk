import { ScheduledTask } from '@vendure/core';

import { PRODUCT_FEED_ASSET_CLEANUP_TASK_ID, PRODUCT_FEED_IMPORT_TASK_ID } from '../constants';
import { PluginInitOptions } from '../types';
import { AssetImportService } from '../services/asset-import.service';
import { ProductFeedImportProgressService } from '../services/product-feed-import-progress.service';
import { ProductFeedImportService } from '../services/product-feed-import.service';

export function createProductFeedImportTask(options: PluginInitOptions): ScheduledTask {
    return new ScheduledTask({
        id: PRODUCT_FEED_IMPORT_TASK_ID,
        description: 'Nightly product feed sync from wholesale CSV export',
        schedule: options.importCron,
        preventOverlap: true,
        timeout: '6h',
        execute: async ({ injector, scheduledContext }) => {
            if (!options.scheduleEnabled) {
                return { skipped: true, reason: 'schedule disabled' };
            }

            const progressService = injector.get(ProductFeedImportProgressService);
            const importService = injector.get(ProductFeedImportService);

            if (await progressService.hasActiveImport(scheduledContext)) {
                return { skipped: true, reason: 'import already running' };
            }

            const result = await importService.startImportJob(scheduledContext, {
                source: 'scheduled',
            });

            return { jobId: result.jobId };
        },
    });
}

export function createProductFeedAssetCleanupTask(): ScheduledTask {
    return new ScheduledTask({
        id: PRODUCT_FEED_ASSET_CLEANUP_TASK_ID,
        description: 'Remove stale product feed image import temp directories',
        schedule: cron => cron.every(1).hours(),
        preventOverlap: true,
        timeout: '5m',
        execute: async ({ injector }) => {
            const assetImportService = injector.get(AssetImportService);
            const removed = await assetImportService.cleanupStaleImportSessions();
            return { removed };
        },
    });
}
