'use client';

import { useState, useTransition, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    addToWishlist,
    removeFromWishlist,
} from '@/app/[locale]/account/(protected)/wishlist/actions';
import { emitWishlistCountChange } from '@/lib/wishlist-client';

interface WishlistButtonProps {
    variantId: string | null;
    wishlistItemId: string | null;
    productSlug: string;
    isAuthenticated: boolean;
    className?: string;
}

export function WishlistButton({
    variantId,
    wishlistItemId: initialWishlistItemId,
    productSlug,
    isAuthenticated,
    className,
}: WishlistButtonProps) {
    const t = useTranslations('Wishlist');
    const router = useRouter();
    const [wishlistItemId, setWishlistItemId] = useState(initialWishlistItemId);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setWishlistItemId(initialWishlistItemId);
    }, [initialWishlistItemId, variantId]);

    const isWishlisted = Boolean(wishlistItemId);
    const disabled = !variantId || isPending;

    const handleClick = () => {
        if (!variantId) return;

        if (!isAuthenticated) {
            router.push(`/sign-in?redirectTo=${encodeURIComponent(`/product/${productSlug}`)}`);
            return;
        }

        startTransition(async () => {
            if (wishlistItemId) {
                const result = await removeFromWishlist(wishlistItemId, { revalidateCache: false });
                if (result.success) {
                    setWishlistItemId(null);
                    emitWishlistCountChange(-1);
                    toast.success(t('removed'));
                } else {
                    toast.error(t('errorTitle'), { description: result.error });
                }
                return;
            }

            const result = await addToWishlist(variantId, { revalidateCache: false });
            if (result.success) {
                setWishlistItemId(result.itemId ?? variantId);
                emitWishlistCountChange(1);
                toast.success(t('added'));
            } else {
                toast.error(t('errorTitle'), { description: result.error });
            }
        });
    };

    if (!isAuthenticated) {
        return (
            <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn('shrink-0', className)}
                render={
                    <Link
                        href={`/sign-in?redirectTo=${encodeURIComponent(`/product/${productSlug}`)}`}
                        aria-label={t('signInToSave')}
                    />
                }
                nativeButton={false}
            >
                <Heart className="size-5" strokeWidth={1.75} />
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('shrink-0', className)}
            disabled={disabled}
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
