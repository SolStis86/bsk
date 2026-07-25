import { describe, expect, it } from 'vitest';

import { sanitizeProductDescription } from './html-sanitize';

describe('sanitizeProductDescription', () => {
    it('strips script tags', () => {
        expect(sanitizeProductDescription('<p>Hello</p><script>alert(1)</script>')).toBe('<p>Hello</p>');
    });

    it('preserves allowed markup', () => {
        expect(sanitizeProductDescription('<p><strong>Bold</strong> text</p>')).toBe(
            '<p><strong>Bold</strong> text</p>',
        );
    });
});
