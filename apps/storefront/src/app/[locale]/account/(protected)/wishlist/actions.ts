'use server';

import { readFragment } from '@/graphql';
import { mutate } from '@/lib/vendure/api';
import { AddToWishlistMutation, RemoveFromWishlistMutation } from '@/lib/vendure/mutations';
import { WishlistItemFragment } from '@/lib/vendure/fragments';
import { updateTag } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';

function revalidateWishlistCache(locale: string) {
    updateTag('wishlist');
    updateTag(`wishlist-${locale}`);
}

export async function addToWishlist(productVariantId: string) {
    const locale = await getLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});

    try {
        const result = await mutate(AddToWishlistMutation, { productVariantId }, { useAuthToken: true });
        revalidateWishlistCache(locale);
        const item = result.data.addToWishlist
            .map((entry) => readFragment(WishlistItemFragment, entry))
            .find((entry) => entry.productVariantId === productVariantId);
        return { success: true as const, itemId: item?.id ?? null };
    } catch {
        return { success: false as const, error: t('errorAdd') };
    }
}

export async function removeFromWishlist(itemId: string) {
    const locale = await getLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});

    try {
        await mutate(RemoveFromWishlistMutation, { itemId }, { useAuthToken: true });
        revalidateWishlistCache(locale);
        return { success: true as const };
    } catch {
        return { success: false as const, error: t('errorRemove') };
    }
}

export async function toggleWishlistVariant(
    productVariantId: string,
    wishlistItemId: string | null,
) {
    if (wishlistItemId) {
        return removeFromWishlist(wishlistItemId);
    }
    return addToWishlist(productVariantId);
}
