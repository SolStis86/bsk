import type {ResultOf} from 'gql.tada';
import type {GetTopCollectionsQuery} from '@/lib/vendure/queries';

export type TopCollection = ResultOf<typeof GetTopCollectionsQuery>['collections']['items'][number];

export interface CollectionNavLink {
    slug: string;
    name: string;
    highlight: boolean;
}

export function sortCollectionsByName(collections: TopCollection[]): TopCollection[] {
    return [...collections].sort((a, b) => a.name.localeCompare(b.name));
}

export function toMainNavLinks(collections: TopCollection[]): CollectionNavLink[] {
    return collections
        .filter((collection) => collection.customFields?.showInMainNav === true)
        .sort((a, b) => {
            const orderA = a.customFields?.navSortOrder ?? 0;
            const orderB = b.customFields?.navSortOrder ?? 0;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.name.localeCompare(b.name);
        })
        .map((collection) => ({
            slug: collection.slug,
            name: collection.name,
            highlight: collection.customFields?.navHighlight === true,
        }));
}

export function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
    if (columnCount <= 1) {
        return [items];
    }

    const columns: T[][] = Array.from({length: columnCount}, () => []);
    const baseSize = Math.ceil(items.length / columnCount);

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        const start = columnIndex * baseSize;
        columns[columnIndex] = items.slice(start, start + baseSize);
    }

    return columns;
}
