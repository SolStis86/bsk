import { Injectable, Logger } from '@nestjs/common';
import { ID, OrderService, RequestContext } from '@vendure/core';

import { loggerCtx } from '../constants';
import { OrderProfitSnapshot, OrderProfitSnapshotProvider } from '../types';
import { toMinorUnits } from '../utils/economics.utils';
import { MarginCalculationService } from './margin-calculation.service';
import { SupplierProviderService } from './supplier-provider.service';

@Injectable()
export class OrderProfitSnapshotService {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        private orderService: OrderService,
        private marginCalculationService: MarginCalculationService,
        private supplierProviderService: SupplierProviderService,
    ) {}

    async captureSnapshot(ctx: RequestContext, orderId: ID): Promise<OrderProfitSnapshot | null> {
        const order = await this.orderService.findOne(ctx, orderId, [
            'lines',
            'lines.productVariant',
            'lines.productVariant.product',
        ]);
        if (!order?.lines?.length) {
            return null;
        }

        const vatMode = await this.marginCalculationService.getProfitCalculationVatMode(ctx);
        const providerGroups = new Map<string, OrderProfitSnapshotProvider>();
        let revenueExVat = 0;
        let revenueIncVat = 0;

        for (const line of order.lines) {
            revenueExVat += line.discountedLinePrice;
            revenueIncVat += line.discountedLinePriceWithTax;

            const providerCode =
                line.productVariant.product.customFields.supplierProviderCode?.trim() || '1on1';
            const tradePriceExVatMajor = line.productVariant.customFields.tradePrice ?? 0;
            const tradePriceExVatMinor = toMinorUnits(tradePriceExVatMajor);
            const lineCogsExVat = tradePriceExVatMinor * line.quantity;

            if (!providerGroups.has(providerCode)) {
                const defaultRule = await this.supplierProviderService.getDefaultShippingRule(
                    ctx,
                    providerCode,
                );
                providerGroups.set(providerCode, {
                    code: providerCode,
                    shippingRuleCode: defaultRule?.code ?? 'unknown',
                    shippingCostExVat: defaultRule ? toMinorUnits(defaultRule.costExVat) : 0,
                    lines: [],
                });
            }

            providerGroups.get(providerCode)!.lines.push({
                sku: line.productVariant.sku,
                qty: line.quantity,
                tradePriceExVat: tradePriceExVatMinor,
                lineCogsExVat,
            });
        }

        const providers = [...providerGroups.values()];
        const lineCogsExVat = providers.reduce(
            (sum, provider) => sum + provider.lines.reduce((lineSum, line) => lineSum + line.lineCogsExVat, 0),
            0,
        );
        const shippingCostExVat = providers.reduce((sum, provider) => sum + provider.shippingCostExVat, 0);
        const estimatedCostExVat = lineCogsExVat + shippingCostExVat;
        const vatRate = 0.2;
        const estimatedCostIncVat = Math.round(estimatedCostExVat * (1 + vatRate));
        const estimatedProfitExVat = revenueExVat - estimatedCostExVat;
        const estimatedProfitIncVat = revenueIncVat - estimatedCostIncVat;
        const marginPercent =
            vatMode === 'gross'
                ? revenueIncVat > 0
                    ? (estimatedProfitIncVat / revenueIncVat) * 100
                    : 0
                : revenueExVat > 0
                  ? (estimatedProfitExVat / revenueExVat) * 100
                  : 0;

        const snapshot: OrderProfitSnapshot = {
            capturedAt: new Date().toISOString(),
            vatMode,
            revenueExVat,
            revenueIncVat,
            estimatedCostExVat,
            estimatedCostIncVat,
            estimatedProfitExVat,
            estimatedProfitIncVat,
            marginPercent,
            providers,
        };

        await this.orderService.updateCustomFields(ctx, orderId, {
            profitSnapshot: JSON.stringify(snapshot),
        });

        this.logger.log(`Captured profit snapshot for order ${order.code}`);
        return snapshot;
    }
}
