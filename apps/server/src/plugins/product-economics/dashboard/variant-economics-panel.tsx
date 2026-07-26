import { api, useQuery } from '@vendure/dashboard';
import { useEffect, useState } from 'react';

import { variantEconomicsDocument } from './product-economics.graphql';

function formatMoney(minorUnits: number): string {
    return `£${(minorUnits / 100).toFixed(2)}`;
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

export function VariantEconomicsPanel({ context }: { context: { entity?: { id?: string } } }) {
    const variantId = context.entity?.id;
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        setEnabled(Boolean(variantId));
    }, [variantId]);

    const { data, isLoading } = useQuery({
        queryKey: ['variant-economics', variantId],
        queryFn: () => api.query(variantEconomicsDocument, { variantId: variantId! }),
        enabled,
    });

    const economics = data?.variantEconomics;
    if (!variantId) {
        return null;
    }

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">Loading economics…</div>;
    }

    if (!economics) {
        return <div className="text-sm text-muted-foreground">Economics unavailable for this variant.</div>;
    }

    const activeMargin =
        economics.vatMode === 'gross'
            ? economics.unitMarginIncVatMinor
            : economics.unitMarginExVatMinor;

    return (
        <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <div className="text-muted-foreground">Provider</div>
                    <div className="font-medium">{economics.supplierProviderCode}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">VAT mode</div>
                    <div className="font-medium uppercase">{economics.vatMode}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">RRP (inc VAT)</div>
                    <div className="font-medium">{formatMoney(economics.rrpIncVatMinor)}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">RRP (ex VAT)</div>
                    <div className="font-medium">{formatMoney(economics.rrpExVatMinor)}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Trade (ex VAT)</div>
                    <div className="font-medium">{formatMoney(economics.tradePriceExVatMinor)}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Unit margin</div>
                    <div className="font-medium">{formatMoney(activeMargin)}</div>
                </div>
            </div>
            <div className="rounded-md border px-3 py-2">
                <div className="text-muted-foreground">Estimated margin</div>
                <div className="text-lg font-semibold">{formatPercent(economics.marginPercent)}</div>
            </div>
        </div>
    );
}
