'use client';

import {Link} from '@/i18n/navigation';
import {buttonVariants} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface HeroCtaButtonsProps {
    shopNewInLabel: string;
    shopCollectionsLabel: string;
    shopNewInHref: string;
    shopCollectionsHref: string;
    className?: string;
}

export function HeroCtaButtons({
    shopNewInLabel,
    shopCollectionsLabel,
    shopNewInHref,
    shopCollectionsHref,
    className,
}: HeroCtaButtonsProps) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
            <Link
                href={shopNewInHref}
                className={buttonVariants({variant: 'brand', size: 'brand'})}
            >
                {shopNewInLabel}
            </Link>
            <Link
                href={shopCollectionsHref}
                className={buttonVariants({variant: 'brand-outline', size: 'brand'})}
            >
                {shopCollectionsLabel}
            </Link>
        </div>
    );
}
