import { ProfitCalculationVatMode } from './utils/economics.utils';

export interface PluginInitOptions {
    /** Default supplier provider code for feed-managed products. */
    defaultProviderCode: string;
}

export interface VariantEconomics {
    variantId: string;
    sku: string;
    supplierProviderCode: string;
    vatMode: ProfitCalculationVatMode;
    vatRatePercent: number;
    pricesIncludeTax: boolean;
    rrpIncVatMinor: number;
    rrpExVatMinor: number;
    tradePriceExVatMinor: number;
    tradePriceIncVatMinor: number;
    unitMarginExVatMinor: number;
    unitMarginIncVatMinor: number;
    marginPercent: number;
}

export interface OrderProfitSnapshotLine {
    sku: string;
    qty: number;
    tradePriceExVat: number;
    lineCogsExVat: number;
}

export interface OrderProfitSnapshotProvider {
    code: string;
    shippingRuleCode: string;
    shippingCostExVat: number;
    lines: OrderProfitSnapshotLine[];
}

export interface OrderProfitSnapshot {
    capturedAt: string;
    vatMode: ProfitCalculationVatMode;
    revenueExVat: number;
    revenueIncVat: number;
    estimatedCostExVat: number;
    estimatedCostIncVat: number;
    estimatedProfitExVat: number;
    estimatedProfitIncVat: number;
    marginPercent: number;
    providers: OrderProfitSnapshotProvider[];
}
