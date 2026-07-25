'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { ResultOf } from '@/graphql';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { SearchProductsQuery } from '@/lib/vendure/queries';
import { buildFacetFilterGroups, type FacetFilterGroup } from '@/lib/facet-filter-helpers';
import { useTranslations } from 'next-intl';

interface FacetFiltersProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
        token?: string;
    }>;
}

function FilterContent({
    facetGroups,
    selectedFacets,
    toggleFacet,
    clearFilters,
    hasActiveFilters,
    facetTitle,
}: {
    facetGroups: FacetFilterGroup[];
    selectedFacets: string[];
    toggleFacet: (facetId: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    facetTitle: (code: FacetFilterGroup['code']) => string;
}) {
    const t = useTranslations('Filters');
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{t('title')}</h2>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        {t('clearAll')}
                    </Button>
                )}
            </div>

            {facetGroups.map(facet => (
                <Collapsible key={facet.code} defaultOpen>
                    <div className="space-y-2">
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors">
                            {facetTitle(facet.code)}
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-panel-open]_&]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="space-y-2 pb-2">
                                {facet.values.map(value => {
                                    const isChecked = selectedFacets.includes(value.id);
                                    return (
                                        <div key={value.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`filter-${value.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => toggleFacet(value.id)}
                                            />
                                            <Label
                                                htmlFor={`filter-${value.id}`}
                                                className="text-sm font-normal cursor-pointer flex items-center gap-2"
                                            >
                                                {value.name}
                                                <span className="text-xs text-muted-foreground">
                                                    ({value.count})
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            ))}
        </div>
    );
}

export function FacetFilters({ productDataPromise }: FacetFiltersProps) {
    const t = useTranslations('Filters');
    const result = use(productDataPromise);
    const searchResult = result.data.search;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);

    const facetGroups = buildFacetFilterGroups(searchResult.facetValues);

    const facetTitle = (code: FacetFilterGroup['code']) => {
        if (code === 'brand') {
            return t('facetBrand');
        }
        if (code === 'category') {
            return t('facetCategory');
        }
        return code;
    };

    const selectedFacets = searchParams.getAll('facets');

    const toggleFacet = (facetId: string) => {
        const params = new URLSearchParams(searchParams);
        const current = params.getAll('facets');

        if (current.includes(facetId)) {
            params.delete('facets');
            current.filter(id => id !== facetId).forEach(id => params.append('facets', id));
        } else {
            params.append('facets', facetId);
        }

        params.delete('page');

        router.push(`${pathname}?${params.toString()}`);
        setSheetOpen(false);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('facets');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
        setSheetOpen(false);
    };

    const hasActiveFilters = selectedFacets.length > 0;

    if (facetGroups.length === 0) {
        return null;
    }

    const filterContentProps = {
        facetGroups,
        selectedFacets,
        toggleFacet,
        clearFilters,
        hasActiveFilters,
        facetTitle,
    };

    return (
        <>
            <div className="lg:hidden">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger
                        render={
                            <Button variant="outline" className="w-full">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                {t('filtersButton')}
                                {hasActiveFilters && (
                                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {selectedFacets.length}
                                    </span>
                                )}
                            </Button>
                        }
                    />
                    <SheetContent side="left" className="overflow-y-auto p-6">
                        <SheetHeader>
                            <SheetTitle>{t('title')}</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                            <FilterContent {...filterContentProps} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden lg:block">
                <FilterContent {...filterContentProps} />
            </div>
        </>
    );
}
