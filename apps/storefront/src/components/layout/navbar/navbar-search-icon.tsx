'use client';

import {Search} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {HeaderIconLink} from '@/components/layout/navbar/header-icon-link';

export function NavbarSearchIcon() {
    const t = useTranslations('Navigation');

    return (
        <HeaderIconLink href="/search" label={t('search')}>
            <Search className="size-5" strokeWidth={1.75} />
        </HeaderIconLink>
    );
}
