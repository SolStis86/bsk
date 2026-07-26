import { PluginInitOptions } from '../types';

export const defaultStockFeedSyncPluginOptions: PluginInitOptions = {
    feedUrl: 'https://example.com/stock.csv',
    syncCron: '*/5 * * * *',
    scheduleEnabled: false,
    devSyncLimit: 0,
};
