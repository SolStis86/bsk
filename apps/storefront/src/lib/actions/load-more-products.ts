'use server';

import { ResultOf } from '@/graphql';
import { getLocale } from 'next-intl/server';
import { getActiveCurrencyCode } from '@/lib/currency-server';
import { buildSearchInput } from '@/lib/search-helpers';
import { query } from '@/lib/vendure/api';
import { SearchProductsQuery } from '@/lib/vendure/queries';

export type SearchProductItem = ResultOf<typeof SearchProductsQuery>['search']['items'][number];

export async function loadMoreProducts(input: {
    page: number;
    collectionSlug?: string;
    searchParams: Record<string, string | string[] | undefined>;
}): Promise<{ items: SearchProductItem[]; totalItems: number }> {
    const locale = await getLocale();
    const currencyCode = await getActiveCurrencyCode();

    const result = await query(
        SearchProductsQuery,
        {
            input: buildSearchInput({
                searchParams: input.searchParams,
                collectionSlug: input.collectionSlug,
                page: input.page,
            }),
        },
        { languageCode: locale, currencyCode },
    );

    return {
        items: result.data.search.items,
        totalItems: result.data.search.totalItems,
    };
}
