import 'server-only';

import { readFragment } from '@/graphql';
import { getAuthToken } from '@/lib/auth';
import { query } from '@/lib/vendure/api';
import { WishlistItemFragment } from '@/lib/vendure/fragments';
import { GetActiveCustomerWishlistQuery } from '@/lib/vendure/queries';

export type WishlistVariantMap = Record<string, string>;

export async function getWishlistVariantMap(): Promise<WishlistVariantMap> {
    const token = await getAuthToken();
    if (!token) {
        return {};
    }

    try {
        const result = await query(GetActiveCustomerWishlistQuery, undefined, {
            useAuthToken: true,
            tags: ['wishlist'],
        });

        const map: WishlistVariantMap = {};
        for (const entry of result.data.activeCustomerWishlist) {
            const item = readFragment(WishlistItemFragment, entry);
            map[item.productVariantId] = item.id;
        }
        return map;
    } catch {
        return {};
    }
}

export async function isAuthenticatedCustomer(): Promise<boolean> {
    return Boolean(await getAuthToken());
}
