'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/commerce/price';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { removeFromWishlist } from '@/app/[locale]/account/(protected)/wishlist/actions';
import { emitWishlistCountChange } from '@/lib/wishlist-client';
import { addToCart } from '@/app/[locale]/product/[slug]/actions';
import type { FragmentOf } from '@/graphql';
import { readFragment } from '@/graphql';
import { WishlistItemFragment } from '@/lib/vendure/fragments';

interface WishlistItemsProps {
    items: FragmentOf<typeof WishlistItemFragment>[];
    currencyCode: string;
}

export function WishlistItems({ items: itemsProp, currencyCode }: WishlistItemsProps) {
    const t = useTranslations('Wishlist');
    const [items, setItems] = useState(() =>
        itemsProp.map((item) => readFragment(WishlistItemFragment, item)),
    );
    const [isPending, startTransition] = useTransition();

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                <Heart className="mx-auto mb-4 size-10 text-brand-pink/60" strokeWidth={1.5} />
                <h2 className="font-heading text-xl font-semibold text-brand-charcoal">{t('empty')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('emptyMessage')}</p>
                <Button className="mt-6" render={<Link href="/" />} nativeButton={false}>
                    {t('continueShopping')}
                </Button>
            </div>
        );
    }

    const handleRemove = (itemId: string) => {
        startTransition(async () => {
            const result = await removeFromWishlist(itemId, { revalidateCache: false });
            if (result.success) {
                setItems((current) => current.filter((item) => item.id !== itemId));
                emitWishlistCountChange(-1);
                toast.success(t('removed'));
            } else {
                toast.error(t('errorTitle'), { description: result.error });
            }
        });
    };

    const handleAddToCart = (variantId: string, productName: string) => {
        startTransition(async () => {
            const result = await addToCart(variantId, 1);
            if (result.success) {
                toast.success(t('addedToCart'), { description: productName });
            } else {
                toast.error(t('errorTitle'), { description: result.error });
            }
        });
    };

    return (
        <div className="divide-y divide-border rounded-xl border bg-card">
            {items.map((item) => {
                const variant = item.productVariant;
                const product = variant.product;
                const preview = product.featuredAsset?.preview;
                const inStock = variant.stockLevel !== 'OUT_OF_STOCK';

                return (
                    <div
                        key={item.id}
                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center first:rounded-t-xl last:rounded-b-xl"
                    >
                        {preview ? (
                            <Link href={`/product/${product.slug}`} className="shrink-0">
                                <Image
                                    src={preview}
                                    alt={product.name}
                                    width={120}
                                    height={120}
                                    className="size-[120px] rounded-lg object-cover"
                                />
                            </Link>
                        ) : (
                            <div className="flex size-[120px] shrink-0 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                                {t('noImage')}
                            </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                            <Link
                                href={`/product/${product.slug}`}
                                className="font-semibold text-brand-charcoal hover:text-brand-pink"
                            >
                                {product.name}
                            </Link>
                            {variant.name !== product.name ? (
                                <p className="text-sm text-muted-foreground">{variant.name}</p>
                            ) : null}
                            <p className="text-base font-semibold text-brand-charcoal">
                                <Price value={variant.priceWithTax} currencyCode={currencyCode} />
                            </p>
                            {!inStock ? (
                                <p className="text-sm text-destructive">{t('outOfStock')}</p>
                            ) : null}
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                            <Button
                                size="sm"
                                className="w-full"
                                disabled={!inStock || isPending}
                                onClick={() => handleAddToCart(variant.id, product.name)}
                            >
                                <ShoppingCart className="mr-2 size-4" />
                                {t('addToCart')}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                disabled={isPending}
                                onClick={() => handleRemove(item.id)}
                            >
                                <Trash2 className="mr-2 size-4" />
                                {t('remove')}
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
