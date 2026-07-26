export type ProfitCalculationVatMode = 'net' | 'gross';

export interface MarginCalculationInput {
    sellPriceMinor: number;
    tradePriceExVatMajor: number;
    vatRatePercent: number;
    pricesIncludeTax: boolean;
    vatMode: ProfitCalculationVatMode;
}

export interface MarginCalculationResult {
    rrpIncVatMinor: number;
    rrpExVatMinor: number;
    tradePriceExVatMinor: number;
    tradePriceIncVatMinor: number;
    unitMarginExVatMinor: number;
    unitMarginIncVatMinor: number;
    marginPercent: number;
    vatMode: ProfitCalculationVatMode;
}

export function toMinorUnits(majorUnits: number): number {
    return Math.round(majorUnits * 100);
}

export function toMajorUnits(minorUnits: number): number {
    return minorUnits / 100;
}

export function calculateMargin(input: MarginCalculationInput): MarginCalculationResult {
    const vatMultiplier = 1 + input.vatRatePercent / 100;
    const rrpIncVatMinor = input.pricesIncludeTax
        ? input.sellPriceMinor
        : Math.round(input.sellPriceMinor * vatMultiplier);
    const rrpExVatMinor = input.pricesIncludeTax
        ? Math.round(rrpIncVatMinor / vatMultiplier)
        : input.sellPriceMinor;
    const tradePriceExVatMinor = toMinorUnits(input.tradePriceExVatMajor);
    const tradePriceIncVatMinor = Math.round(tradePriceExVatMinor * vatMultiplier);
    const unitMarginExVatMinor = rrpExVatMinor - tradePriceExVatMinor;
    const unitMarginIncVatMinor = rrpIncVatMinor - tradePriceIncVatMinor;
    const marginPercent =
        input.vatMode === 'gross'
            ? rrpIncVatMinor > 0
                ? (unitMarginIncVatMinor / rrpIncVatMinor) * 100
                : 0
            : rrpExVatMinor > 0
              ? (unitMarginExVatMinor / rrpExVatMinor) * 100
              : 0;

    return {
        rrpIncVatMinor,
        rrpExVatMinor,
        tradePriceExVatMinor,
        tradePriceIncVatMinor,
        unitMarginExVatMinor,
        unitMarginIncVatMinor,
        marginPercent,
        vatMode: input.vatMode,
    };
}

export function normalizeProfitCalculationVatMode(value: string | null | undefined): ProfitCalculationVatMode {
    return value === 'gross' ? 'gross' : 'net';
}
