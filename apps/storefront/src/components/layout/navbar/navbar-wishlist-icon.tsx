'use client';

import {Heart} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {HeaderIconLink} from '@/components/layout/navbar/header-icon-link';

export function NavbarWishlistIcon() {
    const t = useTranslations('Navigation');

    return (
        <HeaderIconLink href="/search" label={t('wishlist')} badge={0}>
            <Heart className="size-5" strokeWidth={1.75} />
        </HeaderIconLink>
    );
}
