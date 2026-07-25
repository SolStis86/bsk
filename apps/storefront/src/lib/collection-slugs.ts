/** Default collection slugs for homepage entry points. */
export const NEW_IN_COLLECTION_SLUG = 'new-in';
export const BEST_SELLERS_COLLECTION_SLUG = 'best-sellers';

/** Vendure's internal root collection — never shown in storefront breadcrumbs or nav. */
export const ROOT_COLLECTION_SLUG = '__root_collection__';

export function isRootCollection(collection: { slug: string } | null | undefined): boolean {
    return collection?.slug === ROOT_COLLECTION_SLUG;
}

export function getCollectionBreadcrumbParent<T extends { slug: string }>(
    parent: T | null | undefined,
): T | null {
    if (!parent || isRootCollection(parent)) {
        return null;
    }
    return parent;
}
