import {useTranslations} from 'next-intl';

interface ProductFacetValue {
    id: string;
    name: string;
    code: string;
    facet: {
        code: string;
        name: string;
    };
}

interface ProductSpecsProps {
    customFields?: {
        materials?: string | null;
        power?: string | null;
        sizeImperial?: string | null;
    } | null;
    facetValues?: ProductFacetValue[] | null;
}

function facetValueName(facetValues: ProductFacetValue[] | null | undefined, facetCode: string): string | null {
    const match = facetValues?.find(value => value.facet.code === facetCode);
    return match?.name?.trim() || null;
}

export function ProductSpecs({customFields, facetValues}: ProductSpecsProps) {
    const t = useTranslations('Product');

    const rows: Array<{ label: string; value: string }> = [];

    const brand = facetValueName(facetValues, 'brand');
    if (brand) {
        rows.push({label: t('brand'), value: brand});
    }

    const bodyFit = facetValueName(facetValues, 'body-fit');
    if (bodyFit) {
        rows.push({label: t('bodyFit'), value: bodyFit});
    }

    const materials = customFields?.materials?.trim();
    if (materials) {
        rows.push({label: t('materials'), value: materials});
    }

    const power = customFields?.power?.trim();
    if (power) {
        rows.push({label: t('power'), value: power});
    }

    const sizeImperial = customFields?.sizeImperial?.trim();
    if (sizeImperial) {
        rows.push({label: t('sizeImperial'), value: sizeImperial});
    }

    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h2 className="text-base font-semibold">{t('specs')}</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 text-sm">
                {rows.map(row => (
                    <div key={row.label} className="contents">
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="font-medium">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
