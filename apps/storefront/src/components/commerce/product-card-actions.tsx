'use client';

import { useEffect, useState, useTransition } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { addToCart } from '@/app/[locale]/product/[slug]/actions';
import { toggleWishlistVariant } from '@/app/[locale]/account/(protected)/wishlist/actions';

interface ProductCardWishlistButtonProps {
    variantId: string;
    productSlug: string;
    wishlistItemId: string | null;
    isAuthenticated: boolean;
    className?: string;
}

export function ProductCardWishlistButton({
    variantId,
    productSlug,
    wishlistItemId: initialWishlistItemId,
    isAuthenticated,
    className,
}: ProductCardWishlistButtonProps) {
    const t = useTranslations('Wishlist');
    const router = useRouter();
    const [wishlistItemId, setWishlistItemId] = useState(initialWishlistItemId);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setWishlistItemId(initialWishlistItemId);
    }, [initialWishlistItemId, variantId]);

    const isWishlisted = Boolean(wishlistItemId);

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isAuthenticated) {
            router.push(`/sign-in?redirectTo=${encodeURIComponent(`/product/${productSlug}`)}`);
            return;
        }

        startTransition(async () => {
            const result = await toggleWishlistVariant(variantId, wishlistItemId);
            if (result.success) {
                if (wishlistItemId) {
                    setWishlistItemId(null);
                    toast.success(t('removed'));
                    return;
                }

                const addedItemId =
                    'itemId' in result && typeof result.itemId === 'string'
                        ? result.itemId
                        : null;
                setWishlistItemId(addedItemId);
                toast.success(t('added'));
                return;
            }

            toast.error(t('errorTitle'), { description: result.error });
        });
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn('size-8 shrink-0 text-brand-charcoal hover:text-brand-pink', className)}
            disabled={isPending}
            aria-label={isWishlisted ? t('remove') : t('add')}
            aria-pressed={isWishlisted}
            onClick={handleClick}
        >
            <Heart
                className={cn('size-5 transition-colors', isWishlisted && 'fill-brand-pink text-brand-pink')}
                strokeWidth={1.75}
            />
        </Button>
    );
}

interface ProductCardAddToCartButtonProps {
    variantId: string;
    productName: string;
    inStock: boolean;
}

export function ProductCardAddToCartButton({
    variantId,
    productName,
    inStock,
}: ProductCardAddToCartButtonProps) {
    const t = useTranslations('Product');
    const [isPending, startTransition] = useTransition();

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!inStock || isPending) {
            return;
        }

        startTransition(async () => {
            const result = await addToCart(variantId, 1);
            if (result.success) {
                toast.success(t('addedToCartMessage'), {
                    description: t('addedToCartDescription', { name: productName }),
                });
            } else {
                toast.error(t('errorTitle'), { description: result.error ?? t('errorAddToCart') });
            }
        });
    };

    return (
        <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className={cn(
                'absolute right-2 top-2 z-10 size-9 rounded-full bg-white/95 text-brand-charcoal shadow-sm',
                'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                'hover:bg-white hover:text-brand-pink',
                (!inStock || isPending) && 'pointer-events-none opacity-0 group-hover:opacity-0',
            )}
            disabled={!inStock || isPending}
            aria-label={t('addToCart')}
            onClick={handleClick}
        >
            <Plus className="size-5" strokeWidth={2} />
        </Button>
    );
}
