import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { FeedParserService } from './feed-parser.service';

const fixturesDir = path.join(__dirname, '../__fixtures__');

describe('FeedParserService', () => {
    const parser = new FeedParserService();

    function parseFixture(name: string) {
        const content = fs.readFileSync(path.join(fixturesDir, name));
        return parser.parse(content);
    }

    it('parses a single-variant fixture row', () => {
        const result = parseFixture('single-variant.csv');

        expect(result.parseErrors).toHaveLength(0);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].productCode).toBe('N8440');
        expect(result.rows[0].sizeMet).toBe('32cm length');
        expect(result.rows[0].rrp).toBe(6.99);
    });

    it('parses multiline descriptions as a single record', () => {
        const result = parseFixture('single-variant.csv');
        const row = result.rows[0];

        expect(row.description).toContain('Increase your orgasms');
        expect(row.description).toContain('retrieval ring!');
        expect(row.description.split('\n').length).toBeGreaterThan(1);
    });

    it('parses multi-variant fixture with four rows', () => {
        const result = parseFixture('multi-variant-flavour.csv');

        expect(result.parseErrors).toHaveLength(0);
        expect(result.rows).toHaveLength(4);
        expect(result.rows.map(r => r.subproductCode)).toEqual([
            'NS5629',
            'NS5630',
            'NS5631',
            'NS5632',
        ]);
    });

    it('parses stock status and floors decimal stock levels', () => {
        const fullCsv = fs.readFileSync(
            path.join(__dirname, '../../../../../../data/active-products.csv'),
        );
        const result = parser.parse(fullCsv);
        const n10164 = result.rows.find(r => r.uniqueId === 'N10164 NS7051');

        expect(n10164).toBeDefined();
        expect(n10164!.stockLevel).toBe(2);
    });

    it('parses out-of-stock row', () => {
        const result = parseFixture('out-of-stock.csv');

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].stockStatus).toBe('Out Stock');
        expect(result.rows[0].stockLevel).toBe(0);
    });

    it('handles the full active-products.csv without crashing', () => {
        const fullCsv = fs.readFileSync(
            path.join(__dirname, '../../../../../../data/active-products.csv'),
        );
        const result = parser.parse(fullCsv);

        expect(result.parseErrors).toHaveLength(0);
        expect(result.rows.length).toBeGreaterThan(1000);
    });
});
