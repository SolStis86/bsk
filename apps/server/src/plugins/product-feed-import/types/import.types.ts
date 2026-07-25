export interface ImportOptions {
    fixturePath?: string;
    importLimit?: number;
    skipAssets?: boolean;
    /** Local zip path — skips remote imageZipUrl download (CLI/tests). */
    imageZipPath?: string;
    onProgress?: ImportProgressCallback;
}

export enum ProductFeedImportStage {
    QUEUED = 'QUEUED',
    DOWNLOADING_FEED = 'DOWNLOADING_FEED',
    PREPARING_IMAGES = 'PREPARING_IMAGES',
    PARSING_FEED = 'PARSING_FEED',
    SYNCING_PRODUCTS = 'SYNCING_PRODUCTS',
    APPLYING_COLLECTIONS = 'APPLYING_COLLECTIONS',
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
}

export type ImportProgressCallback = (update: ImportProgressUpdate) => void;

export interface ProductFeedImportProgress {
    jobId: string;
    stage: ProductFeedImportStage;
    message: string;
    progress: number;
    processedProducts: number;
    totalProducts: number;
    currentProductCode?: string | null;
    result?: ProductFeedImportResult | null;
    error?: string | null;
}

export interface ProductFeedImportStartResult {
    jobId: string;
}

export interface CatalogSyncResult {
    productCreated: boolean;
    productUpdated: boolean;
    variantsCreated: number;
    variantsUpdated: number;
    productId: string;
    variantIds: Array<{ sku: string; id: string }>;
}

export interface ProductFeedImportResult {
    productsCreated: number;
    productsUpdated: number;
    variantsCreated: number;
    variantsUpdated: number;
    assetsImported: number;
    warnings: string[];
    errors: string[];
}

export function emptyImportResult(): ProductFeedImportResult {
    return {
        productsCreated: 0,
        productsUpdated: 0,
        variantsCreated: 0,
        variantsUpdated: 0,
        assetsImported: 0,
        warnings: [],
        errors: [],
    };
}
