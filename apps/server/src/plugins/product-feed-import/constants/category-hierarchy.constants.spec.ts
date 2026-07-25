import { describe, expect, it } from 'vitest';

import {
    allStaticCategoryTags,
    buildStaticCategoryHierarchy,
    expandCollectionSlugsToCategoryTags,
    resolveParentCollectionForCategoryTag,
} from './category-hierarchy.constants';

describe('category hierarchy', () => {
    it('maps subcategory tags to parent collections', () => {
        expect(resolveParentCollectionForCategoryTag('Butt Plugs')).toBe('Anal Toys');
        expect(resolveParentCollectionForCategoryTag('Vibrators')).toBe('Vibrators');
    });

    it('groups categories under collections', () => {
        const analToys = buildStaticCategoryHierarchy().find(group => group.slug === 'anal-toys');
        expect(analToys?.categories.map(category => category.tag)).toContain('Butt Plugs');
        expect(analToys?.categories.map(category => category.tag)).toContain('Anal Toys');
    });

    it('expands legacy collection slugs to category tags', () => {
        const tags = expandCollectionSlugsToCategoryTags(['anal-toys']);
        expect(tags).toContain('Butt Plugs');
        expect(tags).toContain('Anal Toys');
        expect(tags.length).toBeLessThan(allStaticCategoryTags().length);
    });
});
