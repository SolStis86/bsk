'use client';

import {Heart} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {HeaderIconLink} from '@/components/layout/navbar/header-icon-link';

interface NavbarWishlistIconProps {
    wishlistCount: number;
}

export function NavbarWishlistIcon({wishlistCount}: NavbarWishlistIconProps) {
    const t = useTranslations('Navigation');

    return (
        <HeaderIconLink href="/account/wishlist" label={t('wishlist')} badge={wishlistCount}>
            <Heart className="size-5" strokeWidth={1.75} />
        </HeaderIconLink>
    );
}
