export type FeedWarningCode =
    | 'MISSING_RRP'
    | 'INVALID_GROUP_SPLIT'
    | 'MISSING_REQUIRED_FIELD'
    | 'ROW_SKIPPED'
    | 'PARSE_ERROR';

export interface FeedWarning {
    code: FeedWarningCode;
    message: string;
    productCode?: string;
    uniqueId?: string;
}

export interface FeedParseError {
    message: string;
    rowIndex?: number;
}

export interface RawFeedRow {
    uniqueId: string;
    productCode: string;
    subproductCode: string;
    productName: string;
    description: string;
    materials: string;
    sizeImperial: string;
    sizeMet: string;
    power: string;
    tradePrice: number | null;
    rrp: number | null;
    catalogue: string;
    range: string;
    imageName: string;
    thumbImageUrl: string;
    viewImageUrl: string;
    hiResUrl: string;
    stockStatus: string;
    stockLevel: number;
    mpn: string;
    manufacturer: string;
    barcode: string;
    allCats: string;
    weight: number | null;
    allImages: string;
    shortUnique: string;
}

export interface NormalizedVariant {
    sku: string;
    subproductCode: string;
    name: string;
    optionValues: Record<string, string>;
    price: number;
    stockOnHand: number;
    inStock: boolean;
    barcode?: string;
    mpn?: string;
    tradePrice?: number;
    weight?: number;
    variantAssetUrls?: string[];
    variantAssetFilenames?: string[];
}

export interface NormalizedProduct {
    productCode: string;
    slug: string;
    name: string;
    description: string;
    bodyFit?: string;
    brand?: string;
    materials?: string;
    power?: string;
    sizeImperial?: string;
    categoryTags: string[];
    catalogue?: string;
    range?: string;
    assetUrls: string[];
    assetFilenames: string[];
    optionGroups: string[];
    variants: NormalizedVariant[];
}

export interface FeedParseResult {
    rows: RawFeedRow[];
    parseErrors: FeedParseError[];
    rowWarnings: FeedWarning[];
}

export interface FeedMapResult {
    products: NormalizedProduct[];
    report: FeedMapReport;
}

export interface FeedMapReport {
    productCount: number;
    variantCount: number;
    warnings: FeedWarning[];
}
