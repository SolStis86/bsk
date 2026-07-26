import { describe, expect, it } from 'vitest';

import { calculateMargin } from './economics.utils';

describe('calculateMargin', () => {
    it('calculates net margin for N8440 sample product', () => {
        const result = calculateMargin({
            sellPriceMinor: 699,
            tradePriceExVatMajor: 2.8,
            vatRatePercent: 20,
            pricesIncludeTax: true,
            vatMode: 'net',
        });

        expect(result.rrpIncVatMinor).toBe(699);
        expect(result.rrpExVatMinor).toBe(583);
        expect(result.tradePriceExVatMinor).toBe(280);
        expect(result.unitMarginExVatMinor).toBe(303);
        expect(result.marginPercent).toBeCloseTo(51.97, 1);
    });

    it('calculates gross margin using inc-VAT figures', () => {
        const result = calculateMargin({
            sellPriceMinor: 699,
            tradePriceExVatMajor: 2.8,
            vatRatePercent: 20,
            pricesIncludeTax: true,
            vatMode: 'gross',
        });

        expect(result.tradePriceIncVatMinor).toBe(336);
        expect(result.unitMarginIncVatMinor).toBe(363);
        expect(result.marginPercent).toBeCloseTo(51.93, 1);
    });

    it('handles zero trade price', () => {
        const result = calculateMargin({
            sellPriceMinor: 500,
            tradePriceExVatMajor: 0,
            vatRatePercent: 20,
            pricesIncludeTax: true,
            vatMode: 'net',
        });

        expect(result.unitMarginExVatMinor).toBe(417);
        expect(result.marginPercent).toBe(100);
    });
});
