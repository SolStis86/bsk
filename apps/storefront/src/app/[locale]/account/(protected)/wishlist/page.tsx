import type {Metadata} from 'next';
import {Suspense} from 'react';
import {cacheLife, cacheTag} from 'next/cache';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {noIndexRobots} from '@/lib/metadata';
import {query} from '@/lib/vendure/api';
import {GetActiveCustomerWishlistQuery} from '@/lib/vendure/queries';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {WishlistItems} from './wishlist-items';
import WishlistLoading from './loading';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});
    return {
        title: t('title'),
        robots: noIndexRobots(),
    };
}

export default async function WishlistPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Wishlist'});

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
            </div>
            <Suspense fallback={<WishlistLoading />}>
                <WishlistContent />
            </Suspense>
        </div>
    );
}

async function WishlistContent() {
    'use cache: private';
    cacheLife('minutes');
    cacheTag('wishlist');

    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();

    const result = await query(GetActiveCustomerWishlistQuery, undefined, {
        useAuthToken: true,
        languageCode: locale,
        currencyCode,
        tags: ['wishlist'],
    });

    return (
        <WishlistItems
            items={result.data.activeCustomerWishlist}
            currencyCode={currencyCode}
        />
    );
}
