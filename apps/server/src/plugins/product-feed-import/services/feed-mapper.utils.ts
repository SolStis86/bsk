import { SKIP_CATEGORY_TAGS } from '../constants/taxonomy.constants';
import { DEFAULT_OPTION_GROUP } from '../constants/feed.constants';
import { RawFeedRow } from '../types/feed.types';
import { collectionSlug } from '../constants/taxonomy.constants';

export function normalizeWhitespace(value: string | undefined | null): string {
    if (value == null) {
        return '';
    }
    const trimmed = value.trim();
    return trimmed === ' ' ? '' : trimmed;
}

export function parseOptionalFloat(value: string | undefined | null): number | null {
    const normalized = normalizeWhitespace(value);
    if (!normalized) {
        return null;
    }
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseStockLevel(value: string | undefined | null): number {
    const parsed = parseOptionalFloat(value);
    if (parsed == null) {
        return 0;
    }
    return Math.floor(parsed);
}

export function parseStockStatus(value: string | undefined | null): boolean {
    return normalizeWhitespace(value).toLowerCase() === 'in stock';
}

export function parseCategoryTags(allCats: string): string[] {
    const tags = normalizeWhitespace(allCats)
        .split('|')
        .map(tag => tag.trim())
        .filter(Boolean);

    const skipSet = new Set<string>(SKIP_CATEGORY_TAGS);
    const seen = new Set<string>();
    const result: string[] = [];

    for (const tag of tags) {
        if (skipSet.has(tag) || seen.has(tag)) {
            continue;
        }
        seen.add(tag);
        result.push(tag);
    }

    return result;
}

export function filenameFromUrl(url: string): string {
    try {
        const pathname = new URL(url).pathname;
        return pathname.split('/').pop()?.split('?')[0] ?? '';
    } catch {
        return url.split('/').pop()?.split('?')[0] ?? '';
    }
}

export function parseAllImageFilenames(row: RawFeedRow): string[] {
    const entries = normalizeWhitespace(row.allImages)
        .split('|')
        .map(entry => entry.trim())
        .filter(Boolean);

    if (entries.length === 0) {
        return [];
    }

    return dedupeFilenames(entries.map(filenameFromUrl).filter(Boolean));
}

export function parseImageUrls(row: RawFeedRow): string[] {
    const fromAllImages = normalizeWhitespace(row.allImages)
        .split('|')
        .map(url => url.trim())
        .filter(Boolean);

    if (fromAllImages.length > 0) {
        return fromAllImages;
    }

    const fallback = normalizeWhitespace(row.viewImageUrl);
    return fallback ? [fallback] : [];
}

export function parseImageFilenames(row: RawFeedRow): string[] {
    const fromAllImages = parseAllImageFilenames(row);
    if (fromAllImages.length > 0) {
        return fromAllImages;
    }

    const imageName = normalizeWhitespace(row.imageName);
    return imageName ? [imageName] : [];
}

export function parseVariantAssetUrls(row: RawFeedRow, productAssetUrls: string[]): string[] {
    const subproductCode = normalizeWhitespace(row.subproductCode).toLowerCase();
    if (!subproductCode) {
        return [];
    }

    const matches = productAssetUrls.filter(url =>
        url.toLowerCase().includes(subproductCode),
    );

    return matches.length > 0 ? matches : [];
}

export function parseVariantAssetFilenames(
    row: RawFeedRow,
    productAssetFilenames: string[],
): string[] {
    const subproductCode = normalizeWhitespace(row.subproductCode).toLowerCase();
    if (!subproductCode) {
        return [];
    }

    const matches = productAssetFilenames.filter(filename =>
        filename.toLowerCase().includes(subproductCode),
    );

    return matches.length > 0 ? matches : [];
}

function dedupeFilenames(filenames: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const filename of filenames) {
        const key = filename.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(filename);
    }

    return result;
}

export function productSlug(productCode: string): string {
    return collectionSlug(productCode);
}

export interface OptionInferenceResult {
    baseName: string;
    optionGroup: string;
    optionValues: string[];
}

export function inferOptionValues(productNames: string[]): OptionInferenceResult | null {
    if (productNames.length < 2) {
        return null;
    }

    const separator = ' - ';
    const prefixes: string[] = [];
    const suffixes: string[] = [];

    for (const name of productNames) {
        const lastSep = name.lastIndexOf(separator);
        if (lastSep === -1) {
            return null;
        }
        prefixes.push(name.slice(0, lastSep));
        suffixes.push(name.slice(lastSep + separator.length).trim());
    }

    const baseName = prefixes[0];
    if (!baseName || !prefixes.every(prefix => prefix === baseName)) {
        return null;
    }

    if (suffixes.some(suffix => !suffix)) {
        return null;
    }

    const uniqueSuffixes = new Set(suffixes);
    if (uniqueSuffixes.size !== suffixes.length) {
        return null;
    }

    return {
        baseName,
        optionGroup: DEFAULT_OPTION_GROUP,
        optionValues: suffixes,
    };
}

export interface GroupValidationResult {
    valid: boolean;
    reason?: string;
}

export function validateVariantGroup(rows: RawFeedRow[]): GroupValidationResult {
    if (rows.length < 2) {
        return { valid: false, reason: 'Group has fewer than two rows' };
    }

    if (rows.some(row => !normalizeWhitespace(row.subproductCode))) {
        return { valid: false, reason: 'Missing Subproduct Code on one or more rows' };
    }

    const bodyFits = new Set(rows.map(row => normalizeWhitespace(row.sizeMet)));
    if (bodyFits.size > 1) {
        return { valid: false, reason: 'Size (met) differs within group' };
    }

    if (rows.some(row => row.rrp == null || row.rrp <= 0)) {
        return { valid: false, reason: 'Missing or invalid RRP on one or more rows' };
    }

    const inference = inferOptionValues(rows.map(row => row.productName));
    if (!inference) {
        return { valid: false, reason: 'Could not infer option values from product names' };
    }

    return { valid: true };
}

export function optionalString(value: string): string | undefined {
    const normalized = normalizeWhitespace(value);
    return normalized || undefined;
}
