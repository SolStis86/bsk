'use client';

import type {ComponentProps, ReactNode} from 'react';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

interface HeaderIconLinkProps {
    href: string;
    label: string;
    children: ReactNode;
    badge?: number;
    className?: string;
    linkProps?: Omit<ComponentProps<typeof Link>, 'href' | 'children' | 'className' | 'aria-label'>;
}

export function HeaderIconLink({
    href,
    label,
    children,
    badge,
    className,
    linkProps,
}: HeaderIconLinkProps) {
    return (
        <Link
            href={href}
            aria-label={label}
            className={cn(
                'relative inline-flex size-10 items-center justify-center text-brand-charcoal transition-colors hover:text-brand-pink',
                className,
            )}
            {...linkProps}
        >
            {children}
            {badge !== undefined && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-pink text-[10px] font-semibold leading-none text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}
