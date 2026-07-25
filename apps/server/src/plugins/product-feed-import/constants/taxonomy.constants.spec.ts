import { describe, expect, it } from 'vitest';

import {
    childCollectionSlug,
    collectionSlug,
    FACET_BODY_FIT,
    parentCollectionSlug,
    PARENT_COLLECTION_NAMES,
    PRODUCT_FEED_FACETS,
    resolveParentCollectionsFromCategoryTags,
    SKIP_CATEGORY_TAGS,
} from './taxonomy.constants';

describe('taxonomy constants', () => {
    it('defines the three product feed facets', () => {
        expect(PRODUCT_FEED_FACETS.map(f => f.code)).toEqual(['brand', 'body-fit', 'category']);
        expect(FACET_BODY_FIT.name).toBe('Body Fit');
    });

    it('skips Tiered Pricing category tags', () => {
        expect(SKIP_CATEGORY_TAGS).toContain('Tiered Pricing');
    });
});

describe('collectionSlug', () => {
    it('normalises labels to URL-safe slugs', () => {
        expect(collectionSlug('Anal Toys')).toBe('anal-toys');
        expect(collectionSlug('Sexual Health &amp; Wellbeing')).toBe('sexual-health-and-wellbeing');
    });

    it('builds parent and child collection slugs', () => {
        expect(parentCollectionSlug('Essentials')).toBe('essentials');
        expect(childCollectionSlug('Essentials', 'Lubricants')).toBe('essentials-lubricants');
        expect(childCollectionSlug('Anal Toys', 'Anal Beads')).toBe('anal-toys-anal-beads');
    });

    it('defines the 16 parent catalogue collections', () => {
        expect(PARENT_COLLECTION_NAMES).toHaveLength(16);
        expect(PARENT_COLLECTION_NAMES).toContain('Vibrators');
    });

    it('resolves parent collections from category tags', () => {
        expect(
            resolveParentCollectionsFromCategoryTags(['Anal Toys', 'Butt Plugs', 'New In']),
        ).toEqual(['Anal Toys', 'New In']);

        expect(resolveParentCollectionsFromCategoryTags(['Lubricants', 'Condoms'])).toEqual([
            'Essentials',
        ]);

        expect(resolveParentCollectionsFromCategoryTags(['Uncategorised'])).toEqual([]);
        expect(resolveParentCollectionsFromCategoryTags(['', undefined as unknown as string])).toEqual([]);
    });
});
