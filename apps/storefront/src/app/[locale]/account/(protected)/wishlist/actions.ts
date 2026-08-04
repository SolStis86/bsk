'use server';

import { readFragment } from '@/graphql';
import { mutate } from '@/lib/vendure/api';
import { AddToWishlistMutation, RemoveFromWishlistMutation } from '@/lib/vendure/mutations';
import { WishlistItemFragment } from '@/lib/vendure/fragments';
import { updateTag } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';

function revalidateWishlistCache(locale: string, shouldRevalidate: boolean) {
    if (!shouldRevalidate) {
        return;
    }

    updateTag('wishlist');
    updateTag(`wishlist-${locale}`);
}

type WishlistActionOptions = {
    revalidateCache?: boolean;
};

export async function addToWishlist(
    productVariantId: string,
    options: WishlistActionOptions = {},
) {
    const locale = await getLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});
    const revalidateCache = options.revalidateCache ?? true;

    try {
        const result = await mutate(AddToWishlistMutation, { productVariantId }, { useAuthToken: true });
        revalidateWishlistCache(locale, revalidateCache);
        const item = result.data.addToWishlist
            .map((entry) => readFragment(WishlistItemFragment, entry))
            .find((entry) => entry.productVariantId === productVariantId);
        return { success: true as const, itemId: item?.id ?? null };
    } catch {
        return { success: false as const, error: t('errorAdd') };
    }
}

export async function removeFromWishlist(itemId: string, options: WishlistActionOptions = {}) {
    const locale = await getLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});
    const revalidateCache = options.revalidateCache ?? true;

    try {
        await mutate(RemoveFromWishlistMutation, { itemId }, { useAuthToken: true });
        revalidateWishlistCache(locale, revalidateCache);
        return { success: true as const };
    } catch {
        return { success: false as const, error: t('errorRemove') };
    }
}

export async function toggleWishlistVariant(
    productVariantId: string,
    wishlistItemId: string | null,
    options: WishlistActionOptions = {},
) {
    if (wishlistItemId) {
        return removeFromWishlist(wishlistItemId, options);
    }
    return addToWishlist(productVariantId, options);
}

export async function getWishlistVariantMapAction(): Promise<Record<string, string>> {
    const { getWishlistVariantMap } = await import('@/lib/vendure/wishlist-server');
    return getWishlistVariantMap();
}
