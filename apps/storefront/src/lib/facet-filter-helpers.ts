/** Facet codes shown in collection/search filter sidebars (Phase 4 v1). */
export const FILTERABLE_FACET_CODES = ['brand', 'category'] as const;

export type FilterableFacetCode = (typeof FILTERABLE_FACET_CODES)[number];

export interface FacetFilterGroup {
    id: string;
    code: FilterableFacetCode;
    values: Array<{ id: string; name: string; count: number }>;
}

interface SearchFacetValue {
    count: number;
    facetValue: {
        id: string;
        name: string;
        code: string;
        facet: {
            id: string;
            name: string;
            code: string;
        };
    };
}

export function buildFacetFilterGroups(facetValues: SearchFacetValue[]): FacetFilterGroup[] {
    const groups = new Map<FilterableFacetCode, FacetFilterGroup>();

    for (const item of facetValues) {
        const facetCode = item.facetValue.facet.code as string;
        if (!FILTERABLE_FACET_CODES.includes(facetCode as FilterableFacetCode)) {
            continue;
        }

        const code = facetCode as FilterableFacetCode;
        let group = groups.get(code);
        if (!group) {
            group = {
                id: item.facetValue.facet.id,
                code,
                values: [],
            };
            groups.set(code, group);
        }

        group.values.push({
            id: item.facetValue.id,
            name: item.facetValue.name,
            count: item.count,
        });
    }

    return FILTERABLE_FACET_CODES.flatMap(code => {
        const group = groups.get(code);
        return group ? [group] : [];
    });
}
