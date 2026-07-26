import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

import { STOCK_FEED_COLUMNS } from '../constants';
import { ParsedStockRow, StockFeedParseResult } from '../types/sync.types';
import {
    normalizeWhitespace,
    parseStockLevel,
    targetStockFromRow,
} from '../utils/stock-feed.utils';

type CsvRecord = Record<string, string | undefined>;

@Injectable()
export class StockFeedParserService {
    parse(input: Buffer | string): StockFeedParseResult {
        const csvText = typeof input === 'string' ? input : input.toString('latin1');
        const parseErrors: string[] = [];
        const rowWarnings: string[] = [];

        let records: CsvRecord[];
        try {
            records = parse(csvText, {
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true,
                trim: false,
            }) as CsvRecord[];
        } catch (error) {
            parseErrors.push(error instanceof Error ? error.message : String(error));
            return { rows: [], stockBySku: new Map(), parseErrors, rowWarnings };
        }

        const rows: ParsedStockRow[] = [];
        const stockBySku = new Map<string, number>();

        records.forEach((record, index) => {
            const rowIndex = index + 2;
            try {
                const sku = normalizeWhitespace(record[STOCK_FEED_COLUMNS.sku]);
                if (!sku) {
                    rowWarnings.push(`Row ${rowIndex}: missing SKU`);
                    return;
                }

                const stockStatus = normalizeWhitespace(record[STOCK_FEED_COLUMNS.stockStatus]);
                const stockLevel = parseStockLevel(record[STOCK_FEED_COLUMNS.stockLevel]);
                const row: ParsedStockRow = { sku, stockStatus, stockLevel };
                rows.push(row);
                stockBySku.set(sku, targetStockFromRow(stockStatus, stockLevel));
            } catch (error) {
                parseErrors.push(
                    `Row ${rowIndex}: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        });

        return { rows, stockBySku, parseErrors, rowWarnings };
    }
}
