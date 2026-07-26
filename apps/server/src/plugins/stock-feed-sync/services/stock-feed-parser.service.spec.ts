import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { StockFeedParserService } from './stock-feed-parser.service';

const fixturesDir = path.join(__dirname, '../__fixtures__');
const repoStockFeed = path.join(__dirname, '../../../../../data/stock-feed.csv');

describe('StockFeedParserService', () => {
    const parser = new StockFeedParserService();

    it('parses fixture rows and maps stock levels', () => {
        const buffer = fs.readFileSync(path.join(fixturesDir, 'stock-feed.csv'));
        const result = parser.parse(buffer);

        expect(result.parseErrors).toEqual([]);
        expect(result.rows).toHaveLength(5);
        expect(result.stockBySku.get('N8440')).toBe(150);
        expect(result.stockBySku.get('N7988')).toBe(0);
        expect(result.stockBySku.get('NTEST1')).toBe(42);
    });

    it('dedupes by last row when duplicate SKUs appear', () => {
        const csv = `SKU,Stock,StockLevel,Price
N100,"In Stock",10,1.00
N100,"In Stock",25,1.00`;
        const result = parser.parse(csv);
        expect(result.stockBySku.get('N100')).toBe(25);
    });

    it('warns on missing SKU rows', () => {
        const csv = `SKU,Stock,StockLevel,Price
,"In Stock",10,1.00`;
        const result = parser.parse(csv);
        expect(result.rows).toHaveLength(0);
        expect(result.rowWarnings).toHaveLength(1);
    });

    it('parses the repo stock feed sample without fatal errors', () => {
        if (!fs.existsSync(repoStockFeed)) {
            return;
        }

        const buffer = fs.readFileSync(repoStockFeed);
        const result = parser.parse(buffer);

        expect(result.parseErrors).toEqual([]);
        expect(result.rows.length).toBeGreaterThan(1800);
        expect(result.stockBySku.get('N8440')).toBe(303);
    });
});
