import { describe, expect, it } from 'vitest';

import { toMinorUnits } from './price.utils';

describe('toMinorUnits', () => {
    it('converts pounds to pence', () => {
        expect(toMinorUnits(6.99)).toBe(699);
        expect(toMinorUnits(19.99)).toBe(1999);
    });
});
