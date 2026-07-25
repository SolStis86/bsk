import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTION_GROUP } from '../constants/feed.constants';
import { RawFeedRow } from '../types/feed.types';
import {
    filenameFromUrl,
    inferOptionValues,
    parseCategoryTags,
    parseImageFilenames,
    parseImageUrls,
    validateVariantGroup,
} from './feed-mapper.utils';

function makeRow(overrides: Partial<RawFeedRow>): RawFeedRow {
    return {
        uniqueId: 'SKU1',
        productCode: 'P1',
        subproductCode: '',
        productName: 'Product',
        description: 'Desc',
        materials: '',
        sizeImperial: '',
        sizeMet: '',
        power: '',
        tradePrice: null,
        rrp: 9.99,
        catalogue: '',
        range: '',
        imageName: '',
        thumbImageUrl: '',
        viewImageUrl: '',
        hiResUrl: '',
        stockStatus: 'In Stock',
        stockLevel: 1,
        mpn: '',
        manufacturer: '',
        barcode: '',
        allCats: '',
        weight: null,
        allImages: '',
        shortUnique: '',
        ...overrides,
    };
}

describe('feed-mapper.utils', () => {
    it('infers Flavour option values from product name suffixes', () => {
        const result = inferOptionValues([
            'Earthly Body Edible Massage Oil - Watermelon',
            'Earthly Body Edible Massage Oil - Vanilla',
        ]);

        expect(result).toEqual({
            baseName: 'Earthly Body Edible Massage Oil',
            optionGroup: DEFAULT_OPTION_GROUP,
            optionValues: ['Watermelon', 'Vanilla'],
        });
    });

    it('filters duplicate and skipped category tags', () => {
        expect(parseCategoryTags('Anal Toys|New In|Tiered Pricing|Anal Toys')).toEqual([
            'Anal Toys',
            'New In',
        ]);
    });

    it('falls back to ViewImageURL when AllImages is empty', () => {
        const urls = parseImageUrls(
            makeRow({
                allImages: '',
                viewImageUrl: 'https://example.com/view.jpg',
            }),
        );
        expect(urls).toEqual(['https://example.com/view.jpg']);
    });

    it('derives image filenames from AllImages URL basenames', () => {
        const filenames = parseImageFilenames(
            makeRow({
                allImages:
                    'https://example.com/path/photo-a.jpg|https://example.com/photo-b.jpg',
            }),
        );
        expect(filenames).toEqual(['photo-a.jpg', 'photo-b.jpg']);
    });

    it('falls back to ImageName when AllImages is empty', () => {
        const filenames = parseImageFilenames(
            makeRow({
                imageName: 'n8440-loving-joyAnal-Beads-Black-1.jpg',
            }),
        );
        expect(filenames).toEqual(['n8440-loving-joyAnal-Beads-Black-1.jpg']);
    });

    it('extracts filename from URL', () => {
        expect(filenameFromUrl('https://example.com/dir/image.jpg?size=large')).toBe('image.jpg');
    });

    it('rejects variant groups with missing RRP', () => {
        const rows = [
            makeRow({
                uniqueId: 'A1',
                subproductCode: 'S1',
                productName: 'Product - Red',
                rrp: null,
            }),
            makeRow({
                uniqueId: 'A2',
                subproductCode: 'S2',
                productName: 'Product - Blue',
                rrp: 9.99,
            }),
        ];

        expect(validateVariantGroup(rows).valid).toBe(false);
    });
});
