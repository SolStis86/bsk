import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { RequestContext } from '@vendure/core';

import { STOCK_FEED_SYNC_PLUGIN_OPTIONS, loggerCtx } from '../constants';
import { PluginInitOptions } from '../types';
import {
    StockFeedSyncOptions,
    StockFeedSyncResult,
    StockFeedSyncRun,
} from '../types/sync.types';
import { StockFeedParserService } from './stock-feed-parser.service';
import { StockFeedSyncProgressService } from './stock-feed-sync-progress.service';
import { StockLevelUpdateService } from './stock-level-update.service';

function emptyResult(): StockFeedSyncResult {
    return {
        rowsParsed: 0,
        matched: 0,
        updated: 0,
        unchanged: 0,
        unknownSkus: 0,
        errors: [],
    };
}

@Injectable()
export class StockFeedSyncService {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        @Inject(STOCK_FEED_SYNC_PLUGIN_OPTIONS) private options: PluginInitOptions,
        private parserService: StockFeedParserService,
        private stockLevelUpdateService: StockLevelUpdateService,
        private progressService: StockFeedSyncProgressService,
    ) {}

    async startSync(ctx: RequestContext, options: StockFeedSyncOptions = {}): Promise<StockFeedSyncRun> {
        if (await this.progressService.hasActiveSync(ctx)) {
            throw new Error('A stock feed sync is already running');
        }

        const runId = randomUUID();
        const source = options.source ?? 'manual';
        await this.progressService.initRun(ctx, runId, source);

        try {
            const result = await this.runSync(ctx, runId, options);
            await this.progressService.complete(ctx, runId, result);
            const run = await this.progressService.get(ctx, runId);
            if (!run) {
                throw new Error('Stock feed sync completed but run record was not found');
            }
            return run;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.progressService.fail(ctx, runId, message);
            throw error;
        }
    }

    async runSync(
        ctx: RequestContext,
        runId: string,
        options: StockFeedSyncOptions = {},
    ): Promise<StockFeedSyncResult> {
        await this.progressService.updateMessage(ctx, runId, 'Downloading stock feed…');
        const buffer = await this.loadFeedBuffer(options);

        await this.progressService.updateMessage(ctx, runId, 'Parsing stock feed…');
        const parsed = this.parserService.parse(buffer);
        const result = emptyResult();
        result.errors.push(...parsed.parseErrors);

        if (parsed.parseErrors.length > 0 && parsed.stockBySku.size === 0) {
            throw new Error(parsed.parseErrors[0] ?? 'Failed to parse stock feed');
        }

        let stockBySku = parsed.stockBySku;
        const syncLimit = options.syncLimit ?? this.options.devSyncLimit;
        if (syncLimit && syncLimit > 0 && stockBySku.size > syncLimit) {
            stockBySku = new Map([...stockBySku.entries()].slice(0, syncLimit));
        }

        result.rowsParsed = stockBySku.size;

        await this.progressService.updateMessage(
            ctx,
            runId,
            `Updating stock for ${stockBySku.size} SKU(s)…`,
        );

        const updateResult = await this.stockLevelUpdateService.applyStockUpdates(ctx, stockBySku);
        result.matched = updateResult.matched;
        result.updated = updateResult.updated;
        result.unchanged = updateResult.unchanged;
        result.unknownSkus = updateResult.unknownSkus;

        this.logger.log(
            `Stock sync complete: ${result.updated} updated, ${result.unchanged} unchanged, ${result.unknownSkus} unknown SKUs`,
        );

        return result;
    }

    private async loadFeedBuffer(options: StockFeedSyncOptions): Promise<Buffer> {
        if (options.fixturePath) {
            return readFileSync(options.fixturePath);
        }

        const response = await fetch(this.options.feedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch stock feed: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
