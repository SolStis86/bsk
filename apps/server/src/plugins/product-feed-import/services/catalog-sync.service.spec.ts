import { describe, expect, it, vi } from 'vitest';

import { LanguageCode } from '@vendure/core';

import { NormalizedProduct } from '../types/feed.types';
import { CatalogSyncService } from './catalog-sync.service';

const baseProduct: NormalizedProduct = {
    productCode: 'N8440',
    slug: 'n8440',
    name: 'Loving Joy Anal Love Beads Black',
    description: '<p>Test</p>',
    bodyFit: '32cm length',
    brand: 'Nasstoys',
    categoryTags: ['Anal Toys'],
    catalogue: 'Anal Toys',
    range: 'Anal Beads',
    assetUrls: [],
    assetFilenames: [],
    optionGroups: [],
    variants: [
        {
            sku: 'N8440',
            subproductCode: '',
            name: 'Loving Joy Anal Love Beads Black',
            optionValues: {},
            price: 6.99,
            stockOnHand: 10,
            inStock: true,
        },
    ],
};

describe('CatalogSyncService', () => {
    it('creates a new product and variant when none exist', async () => {
        const productService = {
            create: vi.fn().mockResolvedValue({ id: 'prod-1' }),
            update: vi.fn(),
            addOptionGroupToProduct: vi.fn(),
        };
        const productVariantService = {
            create: vi.fn().mockResolvedValue([{ id: 'var-1' }]),
            update: vi.fn(),
            createOrUpdateProductVariantPrice: vi.fn(),
        };
        const connection = {
            getRepository: vi.fn().mockReturnValue({
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getOne: vi.fn().mockResolvedValue(null),
                }),
                findOne: vi.fn().mockResolvedValue(null),
            }),
        };
        const taxonomySyncService = {
            resolveFacetValueIds: vi.fn().mockResolvedValue(['fv-1']),
            assignProductToCollections: vi.fn().mockResolvedValue(undefined),
        };
        const categoryAvailabilityService = {
            getEnabledTags: vi.fn().mockResolvedValue(['Anal Toys']),
            isProductEnabled: vi.fn().mockReturnValue(true),
        };
        const options = { providerCode: '1on1' };
        const stockMovementService = {
            adjustProductVariantStock: vi.fn(),
        };
        const stockLevelService = {
            getAvailableStock: vi.fn().mockResolvedValue({ stockOnHand: 0, stockAllocated: 0 }),
        };
        const taxCategoryService = {
            findAll: vi.fn().mockResolvedValue({ totalItems: 1, items: [{ id: 'tax-1' }] }),
        };

        const service = new CatalogSyncService(
            connection as never,
            productService as never,
            productVariantService as never,
            {} as never,
            {} as never,
            stockMovementService as never,
            stockLevelService as never,
            taxCategoryService as never,
            taxonomySyncService as never,
            categoryAvailabilityService as never,
            options as never,
        );

        const ctx = { channelId: '1', channel: { defaultCurrencyCode: 'GBP' } } as never;
        const result = await service.upsert(ctx, baseProduct);

        expect(result.productCreated).toBe(true);
        expect(result.variantsCreated).toBe(1);
        expect(productService.create).toHaveBeenCalledWith(
            ctx,
            expect.objectContaining({
                translations: [
                    expect.objectContaining({
                        languageCode: LanguageCode.en,
                        name: baseProduct.name,
                    }),
                ],
                customFields: expect.objectContaining({
                    sourceProductCode: 'N8440',
                    supplierProviderCode: '1on1',
                }),
            }),
        );
    });

    it('disables feed-managed variants missing from the current import run', async () => {
        const runStartedAt = new Date('2026-01-02T00:00:00Z');
        const staleVariant = {
            id: 'var-stale',
            sku: 'STALE-SKU',
            productId: 'prod-1',
            enabled: true,
            customFields: { sourceUniqueId: 'STALE-SKU', lastSeenInFeedAt: new Date('2026-01-01T00:00:00Z') },
            product: { id: 'prod-1' },
        };
        const currentVariant = {
            id: 'var-current',
            sku: 'CURRENT-SKU',
            productId: 'prod-2',
            enabled: true,
            customFields: { sourceUniqueId: 'CURRENT-SKU', lastSeenInFeedAt: runStartedAt },
            product: { id: 'prod-2' },
        };

        const queryBuilder = {
            innerJoinAndSelect: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue([staleVariant, currentVariant]),
        };

        const productVariantService = {
            update: vi.fn(),
            getVariantsByProductId: vi.fn().mockResolvedValue({
                items: [{ id: 'var-stale', enabled: false }],
                totalItems: 1,
            }),
        };
        const productService = {
            update: vi.fn(),
        };
        const connection = {
            getRepository: vi.fn().mockReturnValue({
                createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
            }),
        };
        const options = { providerCode: '1on1' };

        const service = new CatalogSyncService(
            connection as never,
            productService as never,
            productVariantService as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            options as never,
        );

        const result = await service.disableMissingFromFeed(
            {} as never,
            runStartedAt,
            new Set(['CURRENT-SKU']),
        );

        expect(result.variantsDisabled).toBe(1);
        expect(productVariantService.update).toHaveBeenCalledWith(
            expect.anything(),
            [expect.objectContaining({ id: 'var-stale', enabled: false })],
        );
        expect(productService.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ id: 'prod-1', enabled: false }),
        );
    });
});
