export type ImportSource = 'manual' | 'scheduled' | 'cli';

export interface ImportOptions {
    fixturePath?: string;
    importLimit?: number;
    skipAssets?: boolean;
    /** When true (default), enqueue asset imports on a separate worker queue. */
    deferAssets?: boolean;
    /** Local zip path — skips remote imageZipUrl download (CLI/tests). */
    imageZipPath?: string;
    importJobId?: string;
    source?: ImportSource;
    onProgress?: ImportProgressCallback;
}

export enum ProductFeedImportStage {
    QUEUED = 'QUEUED',
    DOWNLOADING_FEED = 'DOWNLOADING_FEED',
    PREPARING_IMAGES = 'PREPARING_IMAGES',
    PARSING_FEED = 'PARSING_FEED',
    SYNCING_PRODUCTS = 'SYNCING_PRODUCTS',
    DISABLING_MISSING = 'DISABLING_MISSING',
    ENQUEUING_ASSETS = 'ENQUEUING_ASSETS',
    APPLYING_COLLECTIONS = 'APPLYING_COLLECTIONS',
    IMPORTING_ASSETS = 'IMPORTING_ASSETS',
    REINDEXING_SEARCH = 'REINDEXING_SEARCH',
    COMPLETE = 'COMPLETE',
    FAILED = 'FAILED',
}

export interface ImportProgressUpdate {
    stage: ProductFeedImportStage;
    message: string;
    progress: number;
    processedProducts?: number;
    totalProducts?: number;
    currentProductCode?: string;
    assetsPending?: number;
}

export type ImportProgressCallback = (update: ImportProgressUpdate) => void | Promise<void>;

export interface ProductFeedImportProgress {
    jobId: string;
    stage: ProductFeedImportStage;
    message: string;
    progress: number;
    processedProducts: number;
    totalProducts: number;
    currentProductCode?: string | null;
    assetsPending?: number;
    result?: ProductFeedImportResult | null;
    error?: string | null;
    source?: ImportSource | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    durationMs?: number | null;
}

export interface ProductFeedImportStartResult {
    jobId: string;
}

export interface ProductFeedImportSummary {
    jobId: string;
    completedAt: Date;
    source: ImportSource;
    result: ProductFeedImportResult;
    assetsPending: number;
}

export interface CatalogSyncResult {
    productCreated: boolean;
    productUpdated: boolean;
    variantsCreated: number;
    variantsUpdated: number;
    productId: string;
    variantIds: Array<{ sku: string; id: string }>;
}

export interface DisableMissingResult {
    variantsDisabled: number;
    productsDisabled: number;
}

export interface ProductFeedImportResult {
    productsCreated: number;
    productsUpdated: number;
    variantsCreated: number;
    variantsUpdated: number;
    variantsDisabled: number;
    productsDisabled: number;
    assetsImported: number;
    assetsEnqueued: number;
    warnings: string[];
    errors: string[];
}

export function emptyImportResult(): ProductFeedImportResult {
    return {
        productsCreated: 0,
        productsUpdated: 0,
        variantsCreated: 0,
        variantsUpdated: 0,
        variantsDisabled: 0,
        productsDisabled: 0,
        assetsImported: 0,
        assetsEnqueued: 0,
        warnings: [],
        errors: [],
    };
}
