import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { adminApiExtensions } from './api/api-extensions';
import { StockFeedSyncAdminResolver } from './api/stock-feed-sync.resolver';
import { STOCK_FEED_SYNC_PLUGIN_OPTIONS } from './constants';
import { StockFeedSyncRunRecord } from './entities/stock-feed-sync-run.entity';
import { StockFeedParserService } from './services/stock-feed-parser.service';
import { StockFeedSyncProgressService } from './services/stock-feed-sync-progress.service';
import { StockFeedSyncService } from './services/stock-feed-sync.service';
import { StockLevelUpdateService } from './services/stock-level-update.service';
import { createStockFeedSyncTask } from './tasks/stock-feed-sync.task';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [StockFeedSyncRunRecord],
    providers: [
        { provide: STOCK_FEED_SYNC_PLUGIN_OPTIONS, useFactory: () => StockFeedSyncPlugin.options },
        StockFeedParserService,
        StockLevelUpdateService,
        StockFeedSyncProgressService,
        StockFeedSyncService,
    ],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [StockFeedSyncAdminResolver],
    },
    dashboard: './dashboard/index.tsx',
    configuration: config => {
        config.schedulerOptions.tasks = config.schedulerOptions.tasks ?? [];
        config.schedulerOptions.tasks.push(createStockFeedSyncTask(StockFeedSyncPlugin.options));
        return config;
    },
    compatibility: '^3.0.0',
})
export class StockFeedSyncPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<StockFeedSyncPlugin> {
        this.options = options;
        return StockFeedSyncPlugin;
    }
}
