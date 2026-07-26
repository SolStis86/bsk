import { Injectable, Logger } from '@nestjs/common';
import {
    ID,
    ProductVariant,
    RequestContext,
    StockLevelService,
    StockMovementService,
    TransactionalConnection,
} from '@vendure/core';
import { In, IsNull } from 'typeorm';

import { SKU_BATCH_SIZE, loggerCtx } from '../constants';
import { StockFeedSyncResult } from '../types/sync.types';

@Injectable()
export class StockLevelUpdateService {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        private connection: TransactionalConnection,
        private stockLevelService: StockLevelService,
        private stockMovementService: StockMovementService,
    ) {}

    async applyStockUpdates(
        ctx: RequestContext,
        stockBySku: Map<string, number>,
    ): Promise<Pick<StockFeedSyncResult, 'matched' | 'updated' | 'unchanged' | 'unknownSkus'>> {
        const skus = [...stockBySku.keys()];
        let matched = 0;
        let updated = 0;
        let unchanged = 0;

        const unknownSkuList: string[] = [];

        for (let offset = 0; offset < skus.length; offset += SKU_BATCH_SIZE) {
            const batchSkus = skus.slice(offset, offset + SKU_BATCH_SIZE);
            const variants = await this.connection.getRepository(ctx, ProductVariant).find({
                where: { sku: In(batchSkus), deletedAt: IsNull() },
            });

            const variantBySku = new Map(variants.map(variant => [variant.sku, variant]));

            for (const sku of batchSkus) {
                const variant = variantBySku.get(sku);
                if (!variant) {
                    unknownSkuList.push(sku);
                    continue;
                }

                matched++;
                const targetStock = stockBySku.get(sku) ?? 0;
                const didUpdate = await this.setStockLevel(ctx, variant.id, targetStock);
                if (didUpdate) {
                    updated++;
                } else {
                    unchanged++;
                }
            }
        }

        const unknownSkus = unknownSkuList.length;
        if (unknownSkus > 0) {
            const sample = unknownSkuList.slice(0, 5).join(', ');
            this.logger.warn(
                `${unknownSkus} stock feed SKU(s) not found in catalog` +
                    (sample ? ` (e.g. ${sample})` : ''),
            );
        }

        return { matched, updated, unchanged, unknownSkus };
    }

    private async setStockLevel(
        ctx: RequestContext,
        variantId: ID,
        targetStock: number,
    ): Promise<boolean> {
        const { stockOnHand } = await this.stockLevelService.getAvailableStock(ctx, variantId);
        if (targetStock === stockOnHand) {
            return false;
        }
        await this.stockMovementService.adjustProductVariantStock(ctx, variantId, targetStock);
        return true;
    }
}
