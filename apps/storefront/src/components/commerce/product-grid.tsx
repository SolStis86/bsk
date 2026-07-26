import { ResultOf } from '@/graphql';
import { InfiniteProductGrid } from '@/components/commerce/infinite-product-grid';
import { SearchProductsQuery } from '@/lib/vendure/queries';
import { getRouteLocale } from '@/i18n/server';
import { getTranslations } from 'next-intl/server';
import {
    getWishlistVariantMap,
    isAuthenticatedCustomer,
} from '@/lib/vendure/wishlist-server';

interface ProductGridProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
        token?: string;
    }>;
    collectionSlug?: string;
}

export async function ProductGrid({ productDataPromise, collectionSlug }: ProductGridProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({ locale, namespace: 'Product' });
    const [result, wishlistByVariantId, isAuthenticated] = await Promise.all([
        productDataPromise,
        getWishlistVariantMap(),
        isAuthenticatedCustomer(),
    ]);

    const searchResult = result.data.search;

    if (!searchResult.items.length) {
        return (
            <div className="py-12 text-center">
                <p className="text-muted-foreground">{t('noProductsFound')}</p>
            </div>
        );
    }

    return (
        <InfiniteProductGrid
            initialItems={searchResult.items}
            totalItems={searchResult.totalItems}
            collectionSlug={collectionSlug}
            wishlistByVariantId={wishlistByVariantId}
            isAuthenticated={isAuthenticated}
        />
    );
}
