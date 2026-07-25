import { Injectable } from '@nestjs/common';
import { GlobalFlag } from '@vendure/common/lib/generated-types';
import {
    ID,
    LanguageCode,
    ProductOptionGroupService,
    ProductOptionService,
    ProductService,
    ProductVariantService,
    RequestContext,
    StockLevelService,
    StockMovementService,
    TaxCategoryService,
    TransactionalConnection,
} from '@vendure/core';
import { Product } from '@vendure/core/dist/entity/product/product.entity';
import { ProductVariant } from '@vendure/core/dist/entity/product-variant/product-variant.entity';
import { IsNull } from 'typeorm';

import { NormalizedProduct, NormalizedVariant } from '../types/feed.types';
import { CatalogSyncResult } from '../types/import.types';
import { sanitizeProductDescription } from '../utils/html-sanitize';
import { toMinorUnits } from '../utils/price.utils';
import { TaxonomySyncService } from './taxonomy-sync.service';
import { CategoryAvailabilityService } from './category-availability.service';

@Injectable()
export class CatalogSyncService {
    private defaultTaxCategoryId: ID | null = null;

    constructor(
        private connection: TransactionalConnection,
        private productService: ProductService,
        private productVariantService: ProductVariantService,
        private productOptionGroupService: ProductOptionGroupService,
        private productOptionService: ProductOptionService,
        private stockMovementService: StockMovementService,
        private stockLevelService: StockLevelService,
        private taxCategoryService: TaxCategoryService,
        private taxonomySyncService: TaxonomySyncService,
        private categoryAvailabilityService: CategoryAvailabilityService,
    ) {}

    async upsert(ctx: RequestContext, product: NormalizedProduct): Promise<CatalogSyncResult> {
        const facetValueIds = await this.taxonomySyncService.resolveFacetValueIds(ctx, product);
        const enabledSlugs = await this.categoryAvailabilityService.getEnabledTags(ctx);
        const productEnabled = this.categoryAvailabilityService.isProductEnabled(
            product.categoryTags,
            enabledSlugs,
        );
        const existingProduct = await this.findProductBySourceCode(ctx, product.productCode);
        const now = new Date();

        let productId: ID;
        let productCreated = false;
        let productUpdated = false;

        const productCustomFields = {
            sourceProductCode: product.productCode,
            materials: product.materials ?? '',
            power: product.power ?? '',
            sizeImperial: product.sizeImperial ?? '',
            lastSeenInFeedAt: now,
        };

        const description = sanitizeProductDescription(product.description);

        if (existingProduct) {
            await this.productService.update(ctx, {
                id: existingProduct.id,
                enabled: productEnabled,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: product.name,
                        slug: product.slug,
                        description,
                    },
                ],
                facetValueIds,
                customFields: productCustomFields,
            });
            productId = existingProduct.id;
            productUpdated = true;
        } else {
            const created = await this.productService.create(ctx, {
                enabled: productEnabled,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: product.name,
                        slug: product.slug,
                        description,
                    },
                ],
                facetValueIds,
                customFields: productCustomFields,
            });
            productId = created.id;
            productCreated = true;
        }

        const optionIdMap = await this.ensureOptionGroups(ctx, productId, product);

        let variantsCreated = 0;
        let variantsUpdated = 0;
        const variantIds: Array<{ sku: string; id: string }> = [];

        for (const variant of product.variants) {
            const result = await this.upsertVariant(
                ctx,
                productId,
                product,
                variant,
                optionIdMap,
                now,
                productEnabled,
            );
            variantIds.push({ sku: variant.sku, id: String(result.id) });
            if (result.created) {
                variantsCreated++;
            } else {
                variantsUpdated++;
            }
        }

        await this.taxonomySyncService.assignProductToCollections(ctx, productId, {
            catalogue: product.catalogue,
            range: product.range,
            categoryTags: product.categoryTags,
        });

        return {
            productCreated,
            productUpdated,
            variantsCreated,
            variantsUpdated,
            productId: String(productId),
            variantIds,
        };
    }

    private async upsertVariant(
        ctx: RequestContext,
        productId: ID,
        product: NormalizedProduct,
        variant: NormalizedVariant,
        optionIdMap: Map<string, ID>,
        now: Date,
        enabled: boolean,
    ): Promise<{ id: ID; created: boolean }> {
        const existing = await this.findVariantBySku(ctx, variant.sku);
        const taxCategoryId = await this.getDefaultTaxCategoryId(ctx);
        const optionIds = this.resolveOptionIds(product, variant, optionIdMap);
        const variantName = this.buildVariantName(product, variant);
        const price = toMinorUnits(variant.price);

        const variantCustomFields = {
            sourceUniqueId: variant.sku,
            tradePrice: variant.tradePrice ?? 0,
            barcode: variant.barcode ?? '',
            mpn: variant.mpn ?? '',
            weight: variant.weight ?? 0,
            lastSeenInFeedAt: now,
        };

        let variantId: ID;

        if (existing) {
            await this.productVariantService.update(ctx, [
                {
                    id: existing.id,
                    sku: variant.sku,
                    enabled,
                    trackInventory: GlobalFlag.TRUE,
                    optionIds,
                    translations: [
                        {
                            languageCode: LanguageCode.en,
                            name: variantName,
                        },
                    ],
                    customFields: variantCustomFields,
                },
            ]);
            variantId = existing.id;
            await this.productVariantService.createOrUpdateProductVariantPrice(
                ctx,
                variantId,
                price,
                ctx.channelId,
            );
            await this.setStockLevel(ctx, variantId, variant.stockOnHand);
            return { id: variantId, created: false };
        }

        const [created] = await this.productVariantService.create(ctx, [
            {
                productId,
                sku: variant.sku,
                enabled,
                trackInventory: GlobalFlag.TRUE,
                taxCategoryId,
                optionIds,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: variantName,
                    },
                ],
                customFields: variantCustomFields,
                prices: [{ price, currencyCode: ctx.channel.defaultCurrencyCode }],
            },
        ]);
        variantId = created.id;
        await this.setStockLevel(ctx, variantId, variant.stockOnHand);
        return { id: variantId, created: true };
    }

    private async ensureOptionGroups(
        ctx: RequestContext,
        productId: ID,
        product: NormalizedProduct,
    ): Promise<Map<string, ID>> {
        const optionIdMap = new Map<string, ID>();

        if (product.optionGroups.length === 0) {
            return optionIdMap;
        }

        const existingGroups = await this.productOptionGroupService.getOptionGroupsByProductId(
            ctx,
            productId,
        );

        for (const groupName of product.optionGroups) {
            const groupCode = this.slugify(`${product.productCode}-${groupName}`);
            let group = existingGroups.find(g => g.code === groupCode);

            if (!group) {
                group = await this.productOptionGroupService.create(ctx, {
                    code: groupCode,
                    translations: [{ languageCode: LanguageCode.en, name: groupName }],
                });
                await this.productService.addOptionGroupToProduct(ctx, productId, group.id);
            } else {
                group =
                    (await this.productOptionGroupService.findOne(ctx, group.id, ['options'])) ??
                    group;
            }

            const optionValues = [
                ...new Set(
                    product.variants
                        .map(v => v.optionValues[groupName])
                        .filter((value): value is string => Boolean(value)),
                ),
            ];

            for (const value of optionValues) {
                const optionCode = this.slugify(value);
                const cacheKey = `${groupName}:${value}`;

                const existingOption = group.options?.find(o => o.code === optionCode);
                if (existingOption) {
                    optionIdMap.set(cacheKey, existingOption.id);
                    continue;
                }

                const createdOption = await this.productOptionService.create(ctx, group.id, {
                    code: optionCode,
                    translations: [{ languageCode: LanguageCode.en, name: value }],
                });
                optionIdMap.set(cacheKey, createdOption.id);
            }
        }

        return optionIdMap;
    }

    private resolveOptionIds(
        product: NormalizedProduct,
        variant: NormalizedVariant,
        optionIdMap: Map<string, ID>,
    ): ID[] {
        return product.optionGroups
            .map(groupName => {
                const value = variant.optionValues[groupName];
                if (!value) {
                    return undefined;
                }
                return optionIdMap.get(`${groupName}:${value}`);
            })
            .filter((id): id is ID => id != null);
    }

    private buildVariantName(product: NormalizedProduct, variant: NormalizedVariant): string {
        if (product.optionGroups.length === 0) {
            return variant.name;
        }
        return variant.name;
    }

    private async setStockLevel(ctx: RequestContext, variantId: ID, targetStock: number): Promise<void> {
        const { stockOnHand } = await this.stockLevelService.getAvailableStock(ctx, variantId);
        const delta = targetStock - stockOnHand;
        if (delta !== 0) {
            await this.stockMovementService.adjustProductVariantStock(ctx, variantId, delta);
        }
    }

    private async findProductBySourceCode(
        ctx: RequestContext,
        productCode: string,
    ): Promise<Product | null> {
        return this.connection
            .getRepository(ctx, Product)
            .createQueryBuilder('product')
            .where('product.customFieldsSourceproductcode = :code', { code: productCode })
            .andWhere('product.deletedAt IS NULL')
            .getOne();
    }

    private async findVariantBySku(ctx: RequestContext, sku: string): Promise<ProductVariant | null> {
        return this.connection.getRepository(ctx, ProductVariant).findOne({
            where: { sku, deletedAt: IsNull() },
        });
    }

    private async getDefaultTaxCategoryId(ctx: RequestContext): Promise<ID> {
        if (this.defaultTaxCategoryId) {
            return this.defaultTaxCategoryId;
        }

        const categories = await this.taxCategoryService.findAll(ctx);
        if (categories.totalItems === 0) {
            throw new Error('No tax categories found — run initial data population first');
        }

        this.defaultTaxCategoryId = categories.items[0].id;
        return this.defaultTaxCategoryId;
    }

    private slugify(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
