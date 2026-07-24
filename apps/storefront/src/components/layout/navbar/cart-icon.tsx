'use client';

import {ShoppingBag} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {HeaderIconLink} from '@/components/layout/navbar/header-icon-link';

interface CartIconProps {
    cartItemCount: number;
}

export function CartIcon({cartItemCount}: CartIconProps) {
    const t = useTranslations('Navigation');

    return (
        <HeaderIconLink href="/cart" label={t('shoppingCart')} badge={cartItemCount}>
            <ShoppingBag className="size-5" strokeWidth={1.75} />
        </HeaderIconLink>
    );
}
