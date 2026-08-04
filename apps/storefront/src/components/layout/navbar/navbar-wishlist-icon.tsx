'use client';

import {Heart} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {HeaderIconLink} from '@/components/layout/navbar/header-icon-link';
import {WISHLIST_COUNT_CHANGE_EVENT} from '@/lib/wishlist-client';

interface NavbarWishlistIconProps {
    wishlistCount: number;
}

export function NavbarWishlistIcon({wishlistCount}: NavbarWishlistIconProps) {
    const t = useTranslations('Navigation');
    const [count, setCount] = useState(wishlistCount);

    useEffect(() => {
        setCount(wishlistCount);
    }, [wishlistCount]);

    useEffect(() => {
        const handleCountChange = (event: Event) => {
            const delta = (event as CustomEvent<{ delta: number }>).detail.delta;
            setCount((current) => Math.max(0, current + delta));
        };

        window.addEventListener(WISHLIST_COUNT_CHANGE_EVENT, handleCountChange);
        return () => window.removeEventListener(WISHLIST_COUNT_CHANGE_EVENT, handleCountChange);
    }, []);

    return (
        <HeaderIconLink href="/account/wishlist" label={t('wishlist')} badge={count}>
            <Heart className="size-5" strokeWidth={1.75} />
        </HeaderIconLink>
    );
}
