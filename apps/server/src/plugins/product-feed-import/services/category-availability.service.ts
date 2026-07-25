import { Injectable, Logger } from '@nestjs/common';
import {
    GlobalSettingsService,
    LanguageCode,
    ProductService,
    ProductVariantService,
    RequestContext,
    SearchService,
    TransactionalConnection,
} from '@vendure/core';
import { FacetValue } from '@vendure/core/dist/entity/facet-value/facet-value.entity';
import { Product } from '@vendure/core/dist/entity/product/product.entity';

import {
    allStaticCategoryTags,
    expandCollectionSlugsToCategoryTags,
    mergeCategoryTagsIntoHierarchy,
} from '../constants/category-hierarchy.constants';
import { FACET_CATEGORY } from '../constants/taxonomy.constants';

export interface CategoryAvailabilityTag {
    tag: string;
    enabled: boolean;
    productCount: number;
}

export interface CategoryAvailabilityCollection {
    name: string;
    slug: string;
    productCount: number;
    categories: CategoryAvailabilityTag[];
}

export interface CategoryAvailabilityUpdateResult {
    enabledTags: string[];
    productsEnabled: number;
    productsDisabled: number;
    variantsUpdated: number;
    searchReindexJobId: string;
}

@Injectable()
export class CategoryAvailabilityService {
    private readonly logger = new Logger(CategoryAvailabilityService.name);

    constructor(
        private globalSettingsService: GlobalSettingsService,
        private connection: TransactionalConnection,
        private productService: ProductService,
        private productVariantService: ProductVariantService,
        private searchService: SearchService,
    ) {}

    async getAvailability(ctx: RequestContext): Promise<CategoryAvailabilityCollection[]> {
        const enabledTags = await this.getEnabledTags(ctx);
        const enabledSet = new Set(enabledTags);
        const productCountsByTag = await this.countProductsByCategoryTag(ctx);
        const allTags = new Set([...allStaticCategoryTags(), ...productCountsByTag.keys()]);
        const hierarchy = mergeCategoryTagsIntoHierarchy([...allTags]);

        return hierarchy.map(group => {
            const categories = group.categories.map(category => ({
                tag: category.tag,
                enabled: enabledSet.has(category.tag),
                productCount: productCountsByTag.get(category.tag) ?? 0,
            }));

            const productCount = categories.reduce((total, category) => total + category.productCount, 0);

            return {
                name: group.name,
                slug: group.slug,
                productCount,
                categories,
            };
        });
    }

    async getEnabledTags(ctx: RequestContext): Promise<string[]> {
        const settings = await this.globalSettingsService.getSettings(ctx);
        const storedTags = settings.customFields?.enabledCategoryTags?.trim();

        if (storedTags) {
            const parsed = this.parseTagArray(storedTags);
            if (parsed.length > 0) {
                return parsed;
            }
        }

        const legacySlugs = settings.customFields?.enabledParentCategorySlugs?.trim();
        if (legacySlugs) {
            const parsedSlugs = this.parseStringArray(legacySlugs);
            if (parsedSlugs.length > 0) {
                return expandCollectionSlugsToCategoryTags(parsedSlugs);
            }
        }

        return allStaticCategoryTags();
    }

    /**
     * A product is enabled only when every category tag on it is enabled.
     * If any tag is disabled, the product is disabled even when other tags remain enabled.
     */
    isProductEnabled(categoryTags: string[], enabledTags: string[]): boolean {
        const productTags = categoryTags.filter(tag => tag?.trim());
        if (productTags.length === 0) {
            return true;
        }

        const enabledSet = new Set(enabledTags);
        return productTags.every(tag => enabledSet.has(tag));
    }

    async updateAvailability(
        ctx: RequestContext,
        enabledTags: string[],
    ): Promise<CategoryAvailabilityUpdateResult> {
        const normalizedTags = this.normalizeEnabledTags(enabledTags);

        await this.globalSettingsService.updateSettings(ctx, {
            customFields: {
                enabledCategoryTags: JSON.stringify(normalizedTags),
            },
        });

        const applyResult = await this.applyAvailabilityToImportedProducts(ctx, normalizedTags);

        const job = await this.searchService.reindex(ctx);
        this.logger.log(`Search reindex job queued after category availability update (id: ${job.id})`);

        return {
            enabledTags: normalizedTags,
            searchReindexJobId: String(job.id),
            ...applyResult,
        };
    }

    async applyAvailabilityToImportedProducts(
        ctx: RequestContext,
        enabledTags?: string[],
    ): Promise<Omit<CategoryAvailabilityUpdateResult, 'enabledTags' | 'searchReindexJobId'>> {
        const tags = enabledTags ?? (await this.getEnabledTags(ctx));
        const products = await this.loadImportedProductsWithCategories(ctx);

        let productsEnabled = 0;
        let productsDisabled = 0;
        let variantsUpdated = 0;

        for (const product of products) {
            const categoryTags = this.getCategoryTags(product, ctx.languageCode);
            const shouldEnable = this.isProductEnabled(categoryTags, tags);

            if (product.enabled !== shouldEnable) {
                await this.productService.update(ctx, {
                    id: product.id,
                    enabled: shouldEnable,
                });

                if (shouldEnable) {
                    productsEnabled++;
                } else {
                    productsDisabled++;
                }
            }

            const disabledVariants = product.variants.filter(variant => variant.enabled !== shouldEnable);
            if (disabledVariants.length > 0) {
                await this.productVariantService.update(
                    ctx,
                    disabledVariants.map(variant => ({
                        id: variant.id,
                        enabled: shouldEnable,
                    })),
                );
                variantsUpdated += disabledVariants.length;
            }
        }

        return { productsEnabled, productsDisabled, variantsUpdated };
    }

    private normalizeEnabledTags(enabledTags: string[]): string[] {
        const unique = [...new Set(enabledTags.map(tag => tag.trim()).filter(Boolean))];
        return unique.length > 0 ? unique : allStaticCategoryTags();
    }

    private async countProductsByCategoryTag(ctx: RequestContext): Promise<Map<string, number>> {
        const counts = new Map<string, number>();
        const products = await this.loadImportedProductsWithCategories(ctx);

        for (const product of products) {
            const categoryTags = this.getCategoryTags(product, ctx.languageCode);
            const seenOnProduct = new Set<string>();

            for (const tag of categoryTags) {
                if (seenOnProduct.has(tag)) {
                    continue;
                }
                seenOnProduct.add(tag);
                counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
        }

        return counts;
    }

    private async loadImportedProductsWithCategories(ctx: RequestContext): Promise<Product[]> {
        return this.connection
            .getRepository(ctx, Product)
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.facetValues', 'facetValue')
            .leftJoinAndSelect('facetValue.translations', 'facetValueTranslation')
            .leftJoinAndSelect('facetValue.facet', 'facet')
            .leftJoinAndSelect('product.variants', 'variant')
            .where('product.customFieldsSourceproductcode IS NOT NULL')
            .andWhere("product.customFieldsSourceproductcode != ''")
            .andWhere('product.deletedAt IS NULL')
            .getMany();
    }

    private getCategoryTags(product: Product, languageCode: LanguageCode): string[] {
        return product.facetValues
            .filter(facetValue => facetValue.facet?.code === FACET_CATEGORY.code)
            .map(facetValue => this.getFacetValueName(facetValue, languageCode))
            .filter((name): name is string => Boolean(name));
    }

    private getFacetValueName(facetValue: FacetValue, languageCode: LanguageCode): string {
        if (typeof facetValue.name === 'string' && facetValue.name.trim()) {
            return facetValue.name.trim();
        }

        const translation =
            facetValue.translations?.find(entry => entry.languageCode === languageCode) ??
            facetValue.translations?.[0];

        return translation?.name?.trim() ?? '';
    }

    private parseTagArray(value: string): string[] {
        return this.parseStringArray(value);
    }

    private parseStringArray(value: string): string[] {
        try {
            const parsed = JSON.parse(value) as unknown;
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
        } catch {
            return [];
        }
    }
}
