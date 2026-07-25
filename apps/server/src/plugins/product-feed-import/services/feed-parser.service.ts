import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

import { FEED_COLUMNS } from '../constants/feed.constants';
import {
    FeedParseError,
    FeedParseResult,
    FeedWarning,
    RawFeedRow,
} from '../types/feed.types';
import {
    normalizeWhitespace,
    parseOptionalFloat,
    parseStockLevel,
    parseStockStatus,
} from './feed-mapper.utils';

type CsvRecord = Record<string, string | undefined>;

@Injectable()
export class FeedParserService {
    parse(input: Buffer | string): FeedParseResult {
        const csvText = typeof input === 'string' ? input : input.toString('latin1');
        const parseErrors: FeedParseError[] = [];
        const rowWarnings: FeedWarning[] = [];

        let records: CsvRecord[];
        try {
            records = parse(csvText, {
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true,
                trim: false,
            }) as CsvRecord[];
        } catch (error) {
            parseErrors.push({
                message: error instanceof Error ? error.message : String(error),
            });
            return { rows: [], parseErrors, rowWarnings };
        }

        const rows: RawFeedRow[] = [];

        records.forEach((record, index) => {
            const rowIndex = index + 2;
            try {
                const row = this.mapRecord(record);
                const missing = this.validateRequiredFields(row);
                if (missing.length > 0) {
                    rowWarnings.push({
                        code: 'MISSING_REQUIRED_FIELD',
                        message: `Row ${rowIndex}: missing ${missing.join(', ')}`,
                        productCode: row.productCode || undefined,
                        uniqueId: row.uniqueId || undefined,
                    });
                    return;
                }
                rows.push(row);
            } catch (error) {
                parseErrors.push({
                    message: error instanceof Error ? error.message : String(error),
                    rowIndex,
                });
            }
        });

        return { rows, parseErrors, rowWarnings };
    }

    private mapRecord(record: CsvRecord): RawFeedRow {
        return {
            uniqueId: normalizeWhitespace(record[FEED_COLUMNS.uniqueId]),
            productCode: normalizeWhitespace(record[FEED_COLUMNS.productCode]),
            subproductCode: normalizeWhitespace(record[FEED_COLUMNS.subproductCode]),
            productName: normalizeWhitespace(record[FEED_COLUMNS.productName]),
            description: normalizeWhitespace(record[FEED_COLUMNS.description]),
            materials: normalizeWhitespace(record[FEED_COLUMNS.materials]),
            sizeImperial: normalizeWhitespace(record[FEED_COLUMNS.sizeImperial]),
            sizeMet: normalizeWhitespace(record[FEED_COLUMNS.sizeMet]),
            power: normalizeWhitespace(record[FEED_COLUMNS.power]),
            tradePrice: parseOptionalFloat(record[FEED_COLUMNS.tradePrice]),
            rrp: parseOptionalFloat(record[FEED_COLUMNS.rrp]),
            catalogue: normalizeWhitespace(record[FEED_COLUMNS.catalogue]),
            range: normalizeWhitespace(record[FEED_COLUMNS.range]),
            imageName: normalizeWhitespace(record[FEED_COLUMNS.imageName]),
            thumbImageUrl: normalizeWhitespace(record[FEED_COLUMNS.thumbImageUrl]),
            viewImageUrl: normalizeWhitespace(record[FEED_COLUMNS.viewImageUrl]),
            hiResUrl: normalizeWhitespace(record[FEED_COLUMNS.hiResUrl]),
            stockStatus: normalizeWhitespace(record[FEED_COLUMNS.stockStatus]),
            stockLevel: parseStockLevel(record[FEED_COLUMNS.stockLevel]),
            mpn: normalizeWhitespace(record[FEED_COLUMNS.mpn]),
            manufacturer: normalizeWhitespace(record[FEED_COLUMNS.manufacturer]),
            barcode: normalizeWhitespace(record[FEED_COLUMNS.barcode]),
            allCats: normalizeWhitespace(record[FEED_COLUMNS.allCats]),
            weight: parseOptionalFloat(record[FEED_COLUMNS.weight]),
            allImages: normalizeWhitespace(record[FEED_COLUMNS.allImages]),
            shortUnique: normalizeWhitespace(record[FEED_COLUMNS.shortUnique]),
        };
    }

    private validateRequiredFields(row: RawFeedRow): string[] {
        const missing: string[] = [];
        if (!row.uniqueId) {
            missing.push('Unique ID');
        }
        if (!row.productCode) {
            missing.push('Product Code');
        }
        if (!row.productName) {
            missing.push('Product Name');
        }
        return missing;
    }
}
