export type StockFeedSyncSource = 'manual' | 'scheduled';

export enum StockFeedSyncStatus {
    RUNNING = 'RUNNING',
    COMPLETE = 'COMPLETE',
    FAILED = 'FAILED',
}

export interface StockFeedSyncResult {
    rowsParsed: number;
    matched: number;
    updated: number;
    unchanged: number;
    unknownSkus: number;
    errors: string[];
}

export interface StockFeedSyncRun {
    runId: string;
    status: StockFeedSyncStatus;
    source: StockFeedSyncSource;
    message: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    result: StockFeedSyncResult | null;
    error: string | null;
}

export interface StockFeedSyncOptions {
    source?: StockFeedSyncSource;
    fixturePath?: string;
    syncLimit?: number;
}

export interface ParsedStockRow {
    sku: string;
    stockStatus: string;
    stockLevel: number;
}

export interface StockFeedParseResult {
    rows: ParsedStockRow[];
    stockBySku: Map<string, number>;
    parseErrors: string[];
    rowWarnings: string[];
}
