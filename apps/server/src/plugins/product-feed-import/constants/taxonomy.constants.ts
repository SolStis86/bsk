import { normalizeString } from '@vendure/common/lib/normalize-string';

import { CATEGORY_TAG_TO_PARENT_COLLECTION } from './category-collection-mapping.constants';

export interface FacetDefinition {
    code: string;
    name: string;
}

export const FACET_BRAND: FacetDefinition = {
    code: 'brand',
    name: 'Brand',
};

export const FACET_BODY_FIT: FacetDefinition = {
    code: 'body-fit',
    name: 'Body Fit',
};

export const FACET_CATEGORY: FacetDefinition = {
    code: 'category',
    name: 'Category',
};

export const PRODUCT_FEED_FACETS: FacetDefinition[] = [
    FACET_BRAND,
    FACET_BODY_FIT,
    FACET_CATEGORY,
];

/** Category tags from all_cats to skip during import. */
export const SKIP_CATEGORY_TAGS = ['Tiered Pricing'] as const;

/** Top-level catalogue collections shown in storefront navigation. */
export const PARENT_COLLECTION_NAMES = [
    'Anal Toys',
    'Best Sellers',
    'Bondage',
    'Couples',
    'Dildos',
    'Enhancers',
    'Essentials',
    'Fun and Games',
    'New In',
    'Offers',
    'Sex Dolls',
    'Sexual Health &amp; Wellbeing',
    'Sexy Lingerie',
    'Toys For Her',
    'Toys For Him',
    'Vibrators',
] as const;

export type ParentCollectionName = (typeof PARENT_COLLECTION_NAMES)[number];

const PARENT_COLLECTION_BY_NORMALIZED_LABEL = new Map<string, ParentCollectionName>(
    PARENT_COLLECTION_NAMES.map(name => [normalizeCollectionLabel(name), name]),
);

/**
 * Normalise a feed label for collection name matching (not URL slugs).
 */
export function normalizeCollectionLabel(value: string | undefined | null): string {
    if (!value) {
        return '';
    }

    return value
        .trim()
        .replace(/&amp;/gi, '&')
        .replace(/&/g, ' and ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Resolve which top-level collections a product belongs to from feed category tags.
 */
export function resolveParentCollectionsFromCategoryTags(categoryTags: string[]): ParentCollectionName[] {
    const parents = new Set<ParentCollectionName>();

    for (const tag of categoryTags) {
        if (!tag?.trim()) {
            continue;
        }

        const directMatch = PARENT_COLLECTION_BY_NORMALIZED_LABEL.get(normalizeCollectionLabel(tag));
        if (directMatch) {
            parents.add(directMatch);
            continue;
        }

        const mapped = CATEGORY_TAG_TO_PARENT_COLLECTION[tag];
        if (mapped && PARENT_COLLECTION_BY_NORMALIZED_LABEL.has(normalizeCollectionLabel(mapped))) {
            parents.add(
                PARENT_COLLECTION_BY_NORMALIZED_LABEL.get(
                    normalizeCollectionLabel(mapped),
                ) as ParentCollectionName,
            );
        }
    }

    return [...parents];
}

/**
 * Normalise a feed label into a URL-safe collection slug.
 */
export function collectionSlug(value: string): string {
    const raw = value
        .trim()
        .replace(/&amp;/gi, 'and')
        .replace(/&/g, 'and')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalizeString(raw, '-');
}

export function parentCollectionSlug(catalogue: string): string {
    return collectionSlug(catalogue);
}

/** Default main-nav settings for top-level parent collections (keyed by slug). */
export const PARENT_COLLECTION_NAV_DEFAULTS: Readonly<
    Record<string, { showInMainNav: boolean; navSortOrder: number; navHighlight?: boolean }>
> = {
    'new-in': { showInMainNav: true, navSortOrder: 10 },
    'sexy-lingerie': { showInMainNav: true, navSortOrder: 20 },
    'toys-for-her': { showInMainNav: true, navSortOrder: 30 },
    'toys-for-him': { showInMainNav: true, navSortOrder: 40 },
    vibrators: { showInMainNav: true, navSortOrder: 50 },
    essentials: { showInMainNav: true, navSortOrder: 60 },
    offers: { showInMainNav: true, navSortOrder: 70, navHighlight: true },
    'best-sellers': { showInMainNav: true, navSortOrder: 80 },
    couples: { showInMainNav: true, navSortOrder: 90 },
};

export function getParentCollectionNavDefaults(slug: string): {
    showInMainNav: boolean;
    navSortOrder: number;
    navHighlight: boolean;
} {
    const defaults = PARENT_COLLECTION_NAV_DEFAULTS[slug];
    return {
        showInMainNav: defaults?.showInMainNav ?? false,
        navSortOrder: defaults?.navSortOrder ?? 0,
        navHighlight: defaults?.navHighlight ?? false,
    };
}

/** Child slugs use a double-dash join; Vendure normalises consecutive dashes to one. */
export function childCollectionSlug(catalogue: string, range: string): string {
    return normalizeString(`${collectionSlug(catalogue)}--${collectionSlug(range)}`, '-');
}
