import { Injectable } from '@nestjs/common';
import { ROOT_COLLECTION_NAME } from '@vendure/common/lib/shared-constants';
import {
    ChannelService,
    CollectionService,
    FacetService,
    FacetValueService,
    ID,
    LanguageCode,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';
import { Collection } from '@vendure/core/dist/entity/collection/collection.entity';
import { CollectionTranslation } from '@vendure/core/dist/entity/collection/collection-translation.entity';
import { FacetValue } from '@vendure/core/dist/entity/facet-value/facet-value.entity';

import {
    childCollectionSlug,
    FACET_BODY_FIT,
    FACET_BRAND,
    FACET_CATEGORY,
    getParentCollectionNavDefaults,
    parentCollectionSlug,
    resolveParentCollectionsFromCategoryTags,
} from '../constants/taxonomy.constants';

const PRODUCT_ID_FILTER = 'product-id-filter';

@Injectable()
export class TaxonomySyncService {
    private readonly facetValueCache = new Map<string, ID>();
    private readonly collectionCache = new Map<string, ID>();
    private rootCollectionId: ID | null = null;

    constructor(
        private connection: TransactionalConnection,
        private facetService: FacetService,
        private facetValueService: FacetValueService,
        private collectionService: CollectionService,
        private channelService: ChannelService,
    ) {}

    clearCaches(): void {
        this.facetValueCache.clear();
        this.collectionCache.clear();
        this.rootCollectionId = null;
    }

    async resolveFacetValueIds(
        ctx: RequestContext,
        product: {
            brand?: string;
            bodyFit?: string;
            categoryTags: string[];
        },
    ): Promise<ID[]> {
        const ids: ID[] = [];

        if (product.brand) {
            ids.push(await this.findOrCreateFacetValue(ctx, FACET_BRAND.code, product.brand));
        }
        if (product.bodyFit) {
            ids.push(await this.findOrCreateFacetValue(ctx, FACET_BODY_FIT.code, product.bodyFit));
        }
        for (const tag of product.categoryTags) {
            ids.push(await this.findOrCreateFacetValue(ctx, FACET_CATEGORY.code, tag));
        }

        return ids;
    }

    async assignProductToCollections(
        ctx: RequestContext,
        productId: ID,
        input: {
            catalogue?: string;
            range?: string;
            categoryTags: string[];
        },
    ): Promise<void> {
        const parentCollections = resolveParentCollectionsFromCategoryTags(input.categoryTags);

        for (const parentName of parentCollections) {
            const parentId = await this.findOrCreateCollection(ctx, {
                name: parentName,
                slug: parentCollectionSlug(parentName),
                parentId: await this.getRootCollectionId(ctx),
            });

            await this.addProductToCollectionFilter(ctx, parentId, productId);
        }

        if (!input.catalogue || !input.range) {
            return;
        }

        const parentSlug = parentCollectionSlug(input.catalogue);
        const childSlug = childCollectionSlug(input.catalogue, input.range);

        const parentId = await this.findOrCreateCollection(ctx, {
            name: input.catalogue,
            slug: parentSlug,
            parentId: await this.getRootCollectionId(ctx),
        });

        const childId = await this.findOrCreateCollection(ctx, {
            name: input.range,
            slug: childSlug,
            parentId,
        });

        await this.addProductToCollectionFilter(ctx, childId, productId);
    }

    private async findOrCreateFacetValue(
        ctx: RequestContext,
        facetCode: string,
        valueName: string,
    ): Promise<ID> {
        const cacheKey = `${facetCode}:${valueName}`;
        const cached = this.facetValueCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const facet = await this.facetService.findByCode(ctx, facetCode, LanguageCode.en);
        if (!facet) {
            throw new Error(`Facet "${facetCode}" not found — ensure taxonomy seed has run`);
        }

        const existingValues = await this.facetValueService.findByFacetId(ctx, facet.id);
        const match = existingValues.find(v => v.name === valueName);
        if (match) {
            this.facetValueCache.set(cacheKey, match.id);
            return match.id;
        }

        const created = await this.facetValueService.create(ctx, facet, {
            code: this.slugify(valueName),
            translations: [{ languageCode: LanguageCode.en, name: valueName }],
        });

        this.facetValueCache.set(cacheKey, created.id);
        return created.id;
    }

    private async getRootCollectionId(ctx: RequestContext): Promise<ID> {
        if (this.rootCollectionId) {
            return this.rootCollectionId;
        }

        let root = await this.findRootCollection(ctx);

        if (!root) {
            root = await this.createRootCollection(ctx);
        }

        if (!root) {
            throw new Error('Root collection not found');
        }

        this.rootCollectionId = root.id;
        return root.id;
    }

    private async findRootCollection(ctx: RequestContext): Promise<Collection | null> {
        const scoped = await this.connection
            .getRepository(ctx, Collection)
            .createQueryBuilder('collection')
            .leftJoin('collection.channels', 'channel')
            .where('collection.isRoot = :isRoot', { isRoot: true })
            .andWhere('channel.id = :channelId', { channelId: ctx.channelId })
            .getOne();

        if (scoped) {
            return scoped;
        }

        return this.connection.getRepository(ctx, Collection).findOne({
            where: { isRoot: true },
        });
    }

    private async createRootCollection(ctx: RequestContext): Promise<Collection> {
        const channel = await this.channelService.getDefaultChannel(ctx);
        const translation = await this.connection.rawConnection
            .getRepository(CollectionTranslation)
            .save(
                new CollectionTranslation({
                    languageCode: LanguageCode.en,
                    name: ROOT_COLLECTION_NAME,
                    description: 'The root of the Collection tree.',
                    slug: ROOT_COLLECTION_NAME,
                }),
            );

        return this.connection.rawConnection.getRepository(Collection).save(
            new Collection({
                isRoot: true,
                position: 0,
                translations: [translation],
                channels: [channel],
                filters: [],
            }),
        );
    }

    private async findOrCreateCollection(
        ctx: RequestContext,
        input: { name: string; slug: string; parentId: ID },
    ): Promise<ID> {
        const cached = this.collectionCache.get(input.slug);
        if (cached) {
            return cached;
        }

        const existing = await this.collectionService.findOneBySlug(ctx, input.slug);
        if (existing) {
            this.collectionCache.set(input.slug, existing.id);
            return existing.id;
        }

        const navDefaults = getParentCollectionNavDefaults(input.slug);

        const created = await this.collectionService.create(ctx, {
            translations: [
                {
                    languageCode: LanguageCode.en,
                    name: input.name,
                    slug: input.slug,
                    description: '',
                },
            ],
            parentId: input.parentId,
            customFields: navDefaults,
            filters: [
                {
                    code: PRODUCT_ID_FILTER,
                    arguments: [{ name: 'productIds', value: '[]' }],
                },
            ],
        });

        this.collectionCache.set(input.slug, created.id);
        return created.id;
    }

    private async addProductToCollectionFilter(
        ctx: RequestContext,
        collectionId: ID,
        productId: ID,
    ): Promise<void> {
        const collection = await this.collectionService.findOne(ctx, collectionId);
        if (!collection) {
            return;
        }

        const filter = collection.filters.find(f => f.code === PRODUCT_ID_FILTER);
        const existingArg = filter?.args.find(a => a.name === 'productIds');
        const existingIds: ID[] = existingArg?.value ? JSON.parse(existingArg.value) : [];

        if (existingIds.includes(String(productId))) {
            return;
        }

        const updatedIds = [...existingIds, String(productId)];

        await this.collectionService.update(ctx, {
            id: collectionId,
            filters: [
                {
                    code: PRODUCT_ID_FILTER,
                    arguments: [{ name: 'productIds', value: JSON.stringify(updatedIds) }],
                },
            ],
        });
    }

    private slugify(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
