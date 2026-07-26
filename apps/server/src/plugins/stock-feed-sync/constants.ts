export const STOCK_FEED_SYNC_PLUGIN_OPTIONS = Symbol('STOCK_FEED_SYNC_PLUGIN_OPTIONS');
export const STOCK_FEED_SYNC_TASK_ID = 'stock-feed-sync';
export const loggerCtx = 'StockFeedSyncPlugin';

export const STOCK_FEED_COLUMNS = {
    sku: 'SKU',
    stockStatus: 'Stock',
    stockLevel: 'StockLevel',
    price: 'Price',
} as const;

export const SKU_BATCH_SIZE = 500;
