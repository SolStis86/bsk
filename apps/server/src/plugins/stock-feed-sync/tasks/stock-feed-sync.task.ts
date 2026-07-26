import { ScheduledTask } from '@vendure/core';

import { STOCK_FEED_SYNC_TASK_ID } from '../constants';
import { PluginInitOptions } from '../types';
import { StockFeedSyncProgressService } from '../services/stock-feed-sync-progress.service';
import { StockFeedSyncService } from '../services/stock-feed-sync.service';

export function createStockFeedSyncTask(options: PluginInitOptions): ScheduledTask {
    return new ScheduledTask({
        id: STOCK_FEED_SYNC_TASK_ID,
        description: 'Poll wholesale stock feed and update variant stock levels',
        schedule: options.syncCron,
        preventOverlap: true,
        timeout: '10m',
        execute: async ({ injector, scheduledContext }) => {
            if (!options.scheduleEnabled) {
                return { skipped: true, reason: 'schedule disabled' };
            }

            const progressService = injector.get(StockFeedSyncProgressService);
            const syncService = injector.get(StockFeedSyncService);

            if (await progressService.hasActiveSync(scheduledContext)) {
                return { skipped: true, reason: 'sync already running' };
            }

            const result = await syncService.startSync(scheduledContext, {
                source: 'scheduled',
            });

            return { runId: result.runId };
        },
    });
}
