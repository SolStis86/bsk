import { describe, expect, it } from 'vitest';

import {
    parseStockLevel,
    parseStockStatus,
    targetStockFromRow,
} from './stock-feed.utils';

describe('stock-feed.utils', () => {
    it('parseStockLevel floors decimals and defaults invalid values to 0', () => {
        expect(parseStockLevel('2.000000')).toBe(2);
        expect(parseStockLevel('303')).toBe(303);
        expect(parseStockLevel('')).toBe(0);
        expect(parseStockLevel(undefined)).toBe(0);
    });

    it('parseStockStatus is true only for In Stock', () => {
        expect(parseStockStatus('In Stock')).toBe(true);
        expect(parseStockStatus('"In Stock"')).toBe(false);
        expect(parseStockStatus('Out Stock')).toBe(false);
        expect(parseStockStatus('Discontinued')).toBe(false);
    });

    it('targetStockFromRow zeroes non in-stock rows', () => {
        expect(targetStockFromRow('In Stock', 303)).toBe(303);
        expect(targetStockFromRow('Out Stock', 99)).toBe(0);
        expect(targetStockFromRow('Discontinued', 5)).toBe(0);
    });
});
