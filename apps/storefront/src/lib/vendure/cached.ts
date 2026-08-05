import {cacheLife, cacheTag} from 'next/cache';
import {query} from './api';
import {isVendureBuildFetchSkipped, BUILD_PLACEHOLDER_SLUG} from './build-skip';
import {GetActiveChannelQuery, GetAllCollectionSlugsQuery, GetAvailableCountriesQuery, GetTopCollectionsQuery} from './queries';
import {
    sortCollectionsByName,
    toHomepageCategories,
    toMainNavLinks,
    type CollectionNavLink,
    type HomepageCategory,
    type TopCollection,
} from '@/lib/collection-nav';

async function getActiveChannelCachedInner() {
    'use cache';
    cacheLife('hours');

    const result = await query(GetActiveChannelQuery);
    return result.data.activeChannel;
}

/**
 * Get the active channel with caching enabled.
 * Channel configuration rarely changes, so we cache it for 1 hour.
 * Channel config is language-independent, so no locale parameter needed.
 */
export async function getActiveChannelCached() {
    if (isVendureBuildFetchSkipped()) {
        return {availableCurrencyCodes: ['GBP'], defaultCurrencyCode: 'GBP'};
    }

    return getActiveChannelCachedInner();
}

async function getAvailableCountriesCachedInner(locale: string) {
    'use cache';
    cacheLife('max');
    cacheTag(`countries-${locale}`);

    const result = await query(GetAvailableCountriesQuery, undefined, {languageCode: locale});
    return result.data.availableCountries || [];
}

/**
 * Get available countries with caching enabled.
 * Countries list rarely changes, so we cache it with max duration.
 * Country names are translatable, so locale is required.
 */
export async function getAvailableCountriesCached(locale: string) {
    if (isVendureBuildFetchSkipped()) {
        return [];
    }

    return getAvailableCountriesCachedInner(locale);
}

async function getTopCollectionsCached(locale: string): Promise<TopCollection[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);

    const result = await query(GetTopCollectionsQuery, undefined, {languageCode: locale});
    return result.data.collections.items;
}

/**
 * Get top-level collections with caching enabled.
 * Collections rarely change, so we cache them for 1 day.
 * Collection names are translatable, so locale is required.
 */
export async function getTopCollections(locale: string): Promise<TopCollection[]> {
    if (isVendureBuildFetchSkipped()) {
        return [];
    }

    return getTopCollectionsCached(locale);
}

/**
 * Top-level collections sorted alphabetically for footer and catalogue lists.
 */
export async function getFooterCollections(locale: string): Promise<TopCollection[]> {
    const collections = await getTopCollections(locale);
    return sortCollectionsByName(collections);
}

async function getMainNavCollectionsCached(locale: string): Promise<CollectionNavLink[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);
    cacheTag(`navbar-collections-${locale}`);
    cacheTag(`mobile-nav-${locale}`);

    const collections = await getTopCollectionsCached(locale);
    return toMainNavLinks(collections);
}

/**
 * Curated main navigation collections from admin custom fields.
 */
export async function getMainNavCollections(locale: string): Promise<CollectionNavLink[]> {
    if (isVendureBuildFetchSkipped()) {
        return [];
    }

    return getMainNavCollectionsCached(locale);
}

async function getHomepageCategoriesCached(locale: string): Promise<HomepageCategory[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);
    cacheTag(`homepage-categories-${locale}`);

    const collections = await getTopCollectionsCached(locale);
    return toHomepageCategories(collections);
}

/**
 * Curated homepage category grid from admin custom fields and collection assets.
 */
export async function getHomepageCategories(locale: string): Promise<HomepageCategory[]> {
    if (isVendureBuildFetchSkipped()) {
        return [];
    }

    return getHomepageCategoriesCached(locale);
}

async function getAllCollectionSlugsCached(locale: string): Promise<string[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);

    const take = 100;
    const slugs: string[] = [];
    let skip = 0;
    let totalItems = Infinity;

    while (skip < totalItems) {
        const result = await query(
            GetAllCollectionSlugsQuery,
            { options: { take, skip } },
            { languageCode: locale },
        );
        const page = result.data.collections;
        totalItems = page.totalItems;
        slugs.push(...page.items.map(item => item.slug));
        skip += take;
    }

    return slugs;
}

/**
 * All collection slugs for static page generation (parent + child).
 * Falls back to top-level slugs when the shop API is unavailable (e.g. dev startup race).
 */
export async function getAllCollectionSlugs(locale: string): Promise<string[]> {
    if (isVendureBuildFetchSkipped()) {
        return [BUILD_PLACEHOLDER_SLUG];
    }

    try {
        return await getAllCollectionSlugsCached(locale);
    } catch {
        try {
            const topLevel = await getTopCollections(locale);
            return topLevel.map(collection => collection.slug);
        } catch {
            return [BUILD_PLACEHOLDER_SLUG];
        }
    }
}
