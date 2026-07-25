'use client';

import { FragmentOf, readFragment } from '@/graphql';
import { loadMoreProducts } from '@/lib/actions/load-more-products';
import { ProductCardFragment } from '@/lib/vendure/fragments';
import { PRODUCTS_PAGE_SIZE } from '@/lib/search-helpers';
import { ProductCard } from '@/components/commerce/product-card';
import { SortDropdown } from '@/components/commerce/sort-dropdown';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

interface InfiniteProductGridProps {
    initialItems: FragmentOf<typeof ProductCardFragment>[];
    totalItems: number;
    collectionSlug?: string;
}

function searchParamsRecord(
    params: URLSearchParams,
): Record<string, string | string[] | undefined> {
    const record: Record<string, string | string[] | undefined> = {};
    params.forEach((value, key) => {
        const existing = record[key];
        if (existing === undefined) {
            record[key] = value;
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            record[key] = [existing, value];
        }
    });
    return record;
}

function getProductId(item: FragmentOf<typeof ProductCardFragment>): string {
    return readFragment(ProductCardFragment, item).productId;
}

export function InfiniteProductGrid({
    initialItems,
    totalItems,
    collectionSlug,
}: InfiniteProductGridProps) {
    const t = useTranslations('Product');
    const searchParams = useSearchParams();
    const filterKey = searchParams.toString();

    const [items, setItems] = useState(initialItems);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialItems.length < totalItems);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    useEffect(() => {
        setItems(initialItems);
        setPage(1);
        setHasMore(initialItems.length < totalItems);
    }, [filterKey, initialItems, totalItems]);

    const loadNextPage = useCallback(async () => {
        if (loadingRef.current || isLoading || !hasMore) {
            return;
        }

        loadingRef.current = true;
        setIsLoading(true);
        const nextPage = page + 1;

        try {
            const result = await loadMoreProducts({
                page: nextPage,
                collectionSlug,
                searchParams: searchParamsRecord(searchParams),
            });

            setItems(current => {
                const seen = new Set(current.map(getProductId));
                const merged = [...current];
                for (const item of result.items) {
                    const productId = getProductId(item);
                    if (!seen.has(productId)) {
                        seen.add(productId);
                        merged.push(item);
                    }
                }
                setHasMore(merged.length < result.totalItems);
                return merged;
            });
            setPage(nextPage);
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [collectionSlug, hasMore, isLoading, page, searchParams]);

    useEffect(() => {
        if (!hasMore || isLoading) {
            return;
        }

        const sentinel = sentinelRef.current;
        if (!sentinel) {
            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0]?.isIntersecting) {
                    void loadNextPage();
                }
            },
            { rootMargin: '240px' },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoading, loadNextPage]);

    if (!items.length) {
        return (
            <div className="py-12 text-center">
                <p className="text-muted-foreground">{t('noProductsFound')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {t('productCount', { count: totalItems })}
                </p>
                <SortDropdown />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(product => (
                    <ProductCard key={getProductId(product)} product={product} />
                ))}
            </div>

            {hasMore ? (
                <div ref={sentinelRef} className="flex justify-center py-8">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">{t('loadingMore')}</p>
                    ) : (
                        <div className="h-8" aria-hidden="true" />
                    )}
                </div>
            ) : items.length >= PRODUCTS_PAGE_SIZE ? (
                <p className="text-center text-sm text-muted-foreground">{t('allProductsLoaded')}</p>
            ) : null}
        </div>
    );
}
