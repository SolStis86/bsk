/**
 * Stock parsing helpers — same semantics as product-feed-import feed-mapper.utils.ts
 */

export function normalizeWhitespace(value: string | undefined | null): string {
    if (value == null) {
        return '';
    }
    const trimmed = value.trim();
    return trimmed === ' ' ? '' : trimmed;
}

function parseOptionalFloat(value: string | undefined | null): number | null {
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

export function targetStockFromRow(stockStatus: string, stockLevel: number): number {
    return parseStockStatus(stockStatus) ? stockLevel : 0;
}
