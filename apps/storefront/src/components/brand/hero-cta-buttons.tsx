'use client';

import {Link} from '@/i18n/navigation';
import {buttonVariants} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface HeroCtaButtonsProps {
    shopNewInLabel: string;
    shopCollectionsLabel: string;
    className?: string;
}

export function HeroCtaButtons({
    shopNewInLabel,
    shopCollectionsLabel,
    className,
}: HeroCtaButtonsProps) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
            <Link
                href="/search?sort=newest"
                className={buttonVariants({variant: 'brand', size: 'brand'})}
            >
                {shopNewInLabel}
            </Link>
            <Link
                href="/search"
                className={buttonVariants({variant: 'brand-outline', size: 'brand'})}
            >
                {shopCollectionsLabel}
            </Link>
        </div>
    );
}
