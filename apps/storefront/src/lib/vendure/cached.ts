import {cacheLife, cacheTag} from 'next/cache';
import {query} from './api';
import {GetActiveChannelQuery, GetAllCollectionSlugsQuery, GetAvailableCountriesQuery, GetTopCollectionsQuery} from './queries';
import {
    sortCollectionsByName,
    toMainNavLinks,
    type CollectionNavLink,
    type TopCollection,
} from '@/lib/collection-nav';

/**
 * Get the active channel with caching enabled.
 * Channel configuration rarely changes, so we cache it for 1 hour.
 * Channel config is language-independent, so no locale parameter needed.
 */
export async function getActiveChannelCached() {
    'use cache';
    cacheLife('hours');

    const result = await query(GetActiveChannelQuery);
    return result.data.activeChannel;
}

/**
 * Get available countries with caching enabled.
 * Countries list rarely changes, so we cache it with max duration.
 * Country names are translatable, so locale is required.
 */
export async function getAvailableCountriesCached(locale: string) {
    'use cache';
    cacheLife('max');
    cacheTag(`countries-${locale}`);

    const result = await query(GetAvailableCountriesQuery, undefined, {languageCode: locale});
    return result.data.availableCountries || [];
}

/**
 * Get top-level collections with caching enabled.
 * Collections rarely change, so we cache them for 1 day.
 * Collection names are translatable, so locale is required.
 */
export async function getTopCollections(locale: string): Promise<TopCollection[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);

    const result = await query(GetTopCollectionsQuery, undefined, {languageCode: locale});
    return result.data.collections.items;
}

/**
 * Top-level collections sorted alphabetically for footer and catalogue lists.
 */
export async function getFooterCollections(locale: string): Promise<TopCollection[]> {
    const collections = await getTopCollections(locale);
    return sortCollectionsByName(collections);
}

/**
 * Curated main navigation collections from admin custom fields.
 */
export async function getMainNavCollections(locale: string): Promise<CollectionNavLink[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);
    cacheTag('navbar-collections');
    cacheTag('mobile-nav');

    const collections = await getTopCollections(locale);
    return toMainNavLinks(collections);
}

/**
 * All collection slugs for static page generation (parent + child).
 * Falls back to top-level slugs when the shop API is unavailable (e.g. dev startup race).
 */
export async function getAllCollectionSlugs(locale: string): Promise<string[]> {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);

    try {
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
    } catch {
        try {
            const topLevel = await getTopCollections(locale);
            return topLevel.map(collection => collection.slug);
        } catch {
            return [];
        }
    }
}
