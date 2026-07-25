import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTION_GROUP } from '../constants/feed.constants';
import { FeedMapperService } from './feed-mapper.service';
import { FeedParserService } from './feed-parser.service';

const fixturesDir = path.join(__dirname, '../__fixtures__');

describe('FeedMapperService', () => {
    const parser = new FeedParserService();
    const mapper = new FeedMapperService();

    function parseAndMap(fixtureName: string) {
        const content = fs.readFileSync(path.join(fixturesDir, fixtureName));
        const parsed = parser.parse(content);
        return mapper.map(parsed.rows);
    }

    it('maps N8440 as a single-variant product with Body Fit', () => {
        const { products, report } = parseAndMap('single-variant.csv');

        expect(products).toHaveLength(1);
        expect(products[0].variants).toHaveLength(1);
        expect(products[0].bodyFit).toBe('32cm length');
        expect(products[0].slug).toBe('n8440');
        expect(products[0].optionGroups).toEqual([]);
        expect(report.warnings).toHaveLength(0);
    });

    it('maps N7828 as a four-variant product with Flavour options', () => {
        const { products } = parseAndMap('multi-variant-flavour.csv');

        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Earthly Body Edible Massage Oil');
        expect(products[0].optionGroups).toEqual([DEFAULT_OPTION_GROUP]);
        expect(products[0].variants).toHaveLength(4);
        expect(products[0].variants.map(v => v.optionValues[DEFAULT_OPTION_GROUP])).toEqual([
            'Watermelon',
            'Vanilla',
            'Cherry',
            'Strawberry',
        ]);
    });

    it('maps N9917 variants with shared product asset URLs', () => {
        const { products } = parseAndMap('shared-images.csv');

        expect(products).toHaveLength(1);
        expect(products[0].variants).toHaveLength(5);
        expect(products[0].assetUrls.length).toBeGreaterThan(0);
        expect(products[0].assetFilenames.length).toBeGreaterThan(0);
        expect(products[0].variants.every(v => v.price > 0)).toBe(true);
    });

    it('maps out-of-stock variant with zero stock', () => {
        const { products } = parseAndMap('out-of-stock.csv');

        expect(products).toHaveLength(1);
        expect(products[0].variants[0].inStock).toBe(false);
        expect(products[0].variants[0].stockOnHand).toBe(0);
    });

    it('splits N10164 bad group into separate products with warnings', () => {
        const { products, report } = parseAndMap('bad-group.csv');

        expect(report.warnings.some(w => w.code === 'INVALID_GROUP_SPLIT')).toBe(true);
        expect(report.warnings.some(w => w.code === 'MISSING_RRP')).toBe(true);
        expect(products).toHaveLength(0);
    });

    it('excludes Tiered Pricing from category tags', () => {
        const fullCsv = fs.readFileSync(
            path.join(__dirname, '../../../../../../data/active-products.csv'),
        );
        const parsed = parser.parse(fullCsv);
        const withTiered = parsed.rows.find(r => r.allCats.includes('Tiered Pricing'));
        expect(withTiered).toBeDefined();

        const { products } = mapper.map([withTiered!]);
        expect(products[0].categoryTags).not.toContain('Tiered Pricing');
    });

    it('falls back to ViewImageURL when AllImages is empty', () => {
        const row = parser.parse(
            [
                '"Unique ID","Product Code","Subproduct Code","Product Name",Description,materials,"Size (imp)","Size (met)",Power,"Trade Price",RRP,Catalogue,Range,ImageName,ThumbImageURL,ViewImageURL,"Hi-Res URL",Stock,StockLevel,MPN,Manufacturer,Barcode,all_cats,wieght,AllImages,"Short Unique"',
                'TEST,TEST,,Test Product,Desc,,,,,1.00,2.99,Cat,Range,,,https://example.com/view.jpg,,In Stock,1,,,,,,,TEST',
            ].join('\n'),
        ).rows[0];

        const { products } = mapper.map([row]);
        expect(products[0].assetUrls).toEqual(['https://example.com/view.jpg']);
        expect(products[0].assetFilenames).toEqual(['view.jpg']);
    });

    it('maps the full active-products.csv with documented counts', () => {
        const fullCsv = fs.readFileSync(
            path.join(__dirname, '../../../../../../data/active-products.csv'),
        );
        const parsed = parser.parse(fullCsv);
        const { products, report } = mapper.map(parsed.rows);

        expect(parsed.rows.length).toBe(1064);
        expect(products.length).toBeGreaterThan(900);
        expect(report.variantCount).toBe(parsed.rows.length - report.warnings.filter(w => w.code === 'MISSING_RRP').length);
        expect(report.warnings.some(w => w.code === 'INVALID_GROUP_SPLIT')).toBe(true);
        expect(report.warnings.some(w => w.code === 'MISSING_RRP')).toBe(true);
    });
});
