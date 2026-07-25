import { Injectable } from '@nestjs/common';

import {
    FeedMapReport,
    FeedMapResult,
    FeedWarning,
    NormalizedProduct,
    NormalizedVariant,
    RawFeedRow,
} from '../types/feed.types';
import {
    inferOptionValues,
    normalizeWhitespace,
    optionalString,
    parseCategoryTags,
    parseImageFilenames,
    parseImageUrls,
    parseStockStatus,
    parseVariantAssetFilenames,
    parseVariantAssetUrls,
    productSlug,
    validateVariantGroup,
} from './feed-mapper.utils';

@Injectable()
export class FeedMapperService {
    map(rows: RawFeedRow[]): FeedMapResult {
        const warnings: FeedWarning[] = [];
        const products: NormalizedProduct[] = [];
        const grouped = this.groupByProductCode(rows);

        for (const [productCode, groupRows] of grouped) {
            if (groupRows.length === 1) {
                const product = this.mapSingleVariantProduct(groupRows[0], warnings);
                if (product) {
                    products.push(product);
                }
                continue;
            }

            const validation = validateVariantGroup(groupRows);
            if (validation.valid) {
                products.push(this.mapMultiVariantProduct(groupRows));
                continue;
            }

            warnings.push({
                code: 'INVALID_GROUP_SPLIT',
                message: `Product ${productCode}: ${validation.reason} — splitting into separate products`,
                productCode,
            });

            for (const row of groupRows) {
                const product = this.mapSingleVariantProduct(row, warnings);
                if (product) {
                    products.push(product);
                }
            }
        }

        const report: FeedMapReport = {
            productCount: products.length,
            variantCount: products.reduce((sum, product) => sum + product.variants.length, 0),
            warnings,
        };

        return { products, report };
    }

    private groupByProductCode(rows: RawFeedRow[]): Map<string, RawFeedRow[]> {
        const grouped = new Map<string, RawFeedRow[]>();

        for (const row of rows) {
            const key = row.productCode;
            const existing = grouped.get(key);
            if (existing) {
                existing.push(row);
            } else {
                grouped.set(key, [row]);
            }
        }

        return grouped;
    }

    private mapSingleVariantProduct(
        row: RawFeedRow,
        warnings: FeedWarning[],
    ): NormalizedProduct | null {
        if (row.rrp == null || row.rrp <= 0) {
            warnings.push({
                code: 'MISSING_RRP',
                message: `Skipping row ${row.uniqueId}: missing or invalid RRP`,
                productCode: row.productCode,
                uniqueId: row.uniqueId,
            });
            return null;
        }

        const assetUrls = parseImageUrls(row);
        const assetFilenames = parseImageFilenames(row);
        const variant = this.mapVariant(row, assetUrls, assetFilenames, {});

        return {
            productCode: row.productCode,
            slug: productSlug(row.productCode),
            name: row.productName,
            description: row.description,
            bodyFit: optionalString(row.sizeMet),
            brand: optionalString(row.manufacturer),
            materials: optionalString(row.materials),
            power: optionalString(row.power),
            sizeImperial: optionalString(row.sizeImperial),
            categoryTags: parseCategoryTags(row.allCats),
            catalogue: optionalString(row.catalogue),
            range: optionalString(row.range),
            assetUrls,
            assetFilenames,
            optionGroups: [],
            variants: [variant],
        };
    }

    private mapMultiVariantProduct(rows: RawFeedRow[]): NormalizedProduct {
        const firstRow = rows[0];
        const inference = inferOptionValues(rows.map(row => row.productName));
        if (!inference) {
            throw new Error(`Unexpected invalid group for product ${firstRow.productCode}`);
        }

        const assetUrls = parseImageUrls(firstRow);
        const assetFilenames = parseImageFilenames(firstRow);
        const optionValuesBySku = new Map<string, string>();
        rows.forEach((row, index) => {
            optionValuesBySku.set(row.uniqueId, inference.optionValues[index]);
        });

        const variants = rows.map(row =>
            this.mapVariant(row, assetUrls, assetFilenames, {
                [inference.optionGroup]: optionValuesBySku.get(row.uniqueId) ?? '',
            }),
        );

        return {
            productCode: firstRow.productCode,
            slug: productSlug(firstRow.productCode),
            name: inference.baseName,
            description: firstRow.description,
            bodyFit: optionalString(firstRow.sizeMet),
            brand: optionalString(firstRow.manufacturer),
            materials: optionalString(firstRow.materials),
            power: optionalString(firstRow.power),
            sizeImperial: optionalString(firstRow.sizeImperial),
            categoryTags: parseCategoryTags(firstRow.allCats),
            catalogue: optionalString(firstRow.catalogue),
            range: optionalString(firstRow.range),
            assetUrls,
            assetFilenames,
            optionGroups: [inference.optionGroup],
            variants,
        };
    }

    private mapVariant(
        row: RawFeedRow,
        productAssetUrls: string[],
        productAssetFilenames: string[],
        optionValues: Record<string, string>,
    ): NormalizedVariant {
        const inStock = parseStockStatus(row.stockStatus);
        const variantAssetUrls = parseVariantAssetUrls(row, productAssetUrls);
        const variantAssetFilenames = parseVariantAssetFilenames(row, productAssetFilenames);

        return {
            sku: row.uniqueId,
            subproductCode: row.subproductCode,
            name: row.productName,
            optionValues,
            price: row.rrp as number,
            stockOnHand: inStock ? row.stockLevel : 0,
            inStock,
            barcode: optionalString(row.barcode),
            mpn: optionalString(row.mpn),
            tradePrice: row.tradePrice ?? undefined,
            weight: row.weight ?? undefined,
            variantAssetUrls: variantAssetUrls.length > 0 ? variantAssetUrls : undefined,
            variantAssetFilenames:
                variantAssetFilenames.length > 0 ? variantAssetFilenames : undefined,
        };
    }
}
