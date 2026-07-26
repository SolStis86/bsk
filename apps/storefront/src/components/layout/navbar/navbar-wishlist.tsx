import { cacheLife, cacheTag } from 'next/cache';
import { getAuthToken } from '@/lib/auth';
import { getRouteLocale } from '@/i18n/server';
import { query } from '@/lib/vendure/api';
import { GetActiveCustomerWishlistQuery } from '@/lib/vendure/queries';
import { NavbarWishlistIcon } from '@/components/layout/navbar/navbar-wishlist-icon';

export async function NavbarWishlist() {
    'use cache: private';
    cacheLife('minutes');
    cacheTag('wishlist');

    const locale = await getRouteLocale();
    cacheTag(`wishlist-${locale}`);

    const token = await getAuthToken();
    if (!token) {
        return <NavbarWishlistIcon wishlistCount={0} />;
    }

    try {
        const result = await query(GetActiveCustomerWishlistQuery, undefined, {
            useAuthToken: true,
            languageCode: locale,
            tags: ['wishlist'],
        });

        return (
            <NavbarWishlistIcon wishlistCount={result.data.activeCustomerWishlist.length} />
        );
    } catch {
        return <NavbarWishlistIcon wishlistCount={0} />;
    }
}
