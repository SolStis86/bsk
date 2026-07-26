function formatMoney(minorUnits: number): string {
    return `£${(minorUnits / 100).toFixed(2)}`;
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

type ProfitSnapshot = {
    capturedAt?: string;
    vatMode?: string;
    revenueExVat?: number;
    revenueIncVat?: number;
    estimatedCostExVat?: number;
    estimatedProfitExVat?: number;
    marginPercent?: number;
    providers?: Array<{
        code: string;
        shippingRuleCode: string;
        shippingCostExVat: number;
        lines: Array<{
            sku: string;
            qty: number;
            tradePriceExVat: number;
            lineCogsExVat: number;
        }>;
    }>;
};

export function OrderProfitPanel({ context }: { context: { entity?: { customFields?: { profitSnapshot?: string } } } }) {
    const rawSnapshot = context.entity?.customFields?.profitSnapshot;
    if (!rawSnapshot) {
        return (
            <div className="text-sm text-muted-foreground">
                Profit snapshot will appear here once payment is settled.
            </div>
        );
    }

    let snapshot: ProfitSnapshot;
    try {
        snapshot = JSON.parse(rawSnapshot) as ProfitSnapshot;
    } catch {
        return <div className="text-sm text-destructive">Unable to parse profit snapshot.</div>;
    }

    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <div className="text-muted-foreground">Captured</div>
                    <div className="font-medium">
                        {snapshot.capturedAt ? new Date(snapshot.capturedAt).toLocaleString() : '—'}
                    </div>
                </div>
                <div>
                    <div className="text-muted-foreground">VAT mode</div>
                    <div className="font-medium uppercase">{snapshot.vatMode ?? 'net'}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Revenue (ex VAT)</div>
                    <div className="font-medium">{formatMoney(snapshot.revenueExVat ?? 0)}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Est. cost (ex VAT)</div>
                    <div className="font-medium">{formatMoney(snapshot.estimatedCostExVat ?? 0)}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Est. profit (ex VAT)</div>
                    <div className="font-medium">{formatMoney(snapshot.estimatedProfitExVat ?? 0)}</div>
                </div>
                <div>
                    <div className="text-muted-foreground">Margin</div>
                    <div className="font-medium">{formatPercent(snapshot.marginPercent ?? 0)}</div>
                </div>
            </div>
            {snapshot.providers?.map(provider => (
                <div key={provider.code} className="rounded-md border p-3 space-y-2">
                    <div className="font-medium">
                        {provider.code} · {provider.shippingRuleCode} (
                        {formatMoney(provider.shippingCostExVat)})
                    </div>
                    <ul className="space-y-1 text-muted-foreground">
                        {provider.lines.map(line => (
                            <li key={`${provider.code}-${line.sku}`}>
                                {line.sku} × {line.qty} · COGS {formatMoney(line.lineCogsExVat)}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
