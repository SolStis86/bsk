import { NormalizedProduct } from './feed.types';

export interface ProductAssetImportPayload {
    productId: string;
    assetFilenames: string[];
    assetUrls: string[];
    variants: Array<{
        id: string;
        sku: string;
        variantAssetFilenames: string[];
        variantAssetUrls: string[];
    }>;
}

export function toAssetImportPayload(
    product: NormalizedProduct,
    productId: string,
    variantIds: Array<{ sku: string; id: string }>,
): ProductAssetImportPayload {
    return {
        productId,
        assetFilenames: product.assetFilenames,
        assetUrls: product.assetUrls,
        variants: variantIds.map(ref => {
            const variant = product.variants.find(v => v.sku === ref.sku);
            return {
                id: ref.id,
                sku: ref.sku,
                variantAssetFilenames: variant?.variantAssetFilenames ?? [],
                variantAssetUrls: variant?.variantAssetUrls ?? [],
            };
        }),
    };
}
