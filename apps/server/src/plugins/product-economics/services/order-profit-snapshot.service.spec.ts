import { describe, expect, it, vi } from 'vitest';

import { OrderProfitSnapshotService } from './order-profit-snapshot.service';

describe('OrderProfitSnapshotService', () => {
    it('groups lines by provider and includes default shipping cost', async () => {
        const orderService = {
            findOne: vi.fn().mockResolvedValue({
                id: '1',
                code: 'ORDER1',
                lines: [
                    {
                        quantity: 2,
                        discountedLinePrice: 1000,
                        discountedLinePriceWithTax: 1200,
                        productVariant: {
                            sku: 'N8440',
                            customFields: { tradePrice: 2.8 },
                            product: { customFields: { supplierProviderCode: '1on1' } },
                        },
                    },
                    {
                        quantity: 1,
                        discountedLinePrice: 500,
                        discountedLinePriceWithTax: 600,
                        productVariant: {
                            sku: 'ALT-1',
                            customFields: { tradePrice: 1.5 },
                            product: { customFields: { supplierProviderCode: 'other' } },
                        },
                    },
                ],
            }),
            updateCustomFields: vi.fn().mockResolvedValue(undefined),
        };
        const marginCalculationService = {
            getProfitCalculationVatMode: vi.fn().mockResolvedValue('net'),
        };
        const supplierProviderService = {
            getDefaultShippingRule: vi.fn().mockResolvedValue({
                code: 'tracked',
                costExVat: 3.6,
            }),
        };
        const service = new OrderProfitSnapshotService(
            orderService as any,
            marginCalculationService as any,
            supplierProviderService as any,
        );

        const snapshot = await service.captureSnapshot({} as any, '1');
        expect(snapshot).not.toBeNull();
        expect(snapshot!.providers).toHaveLength(2);
        expect(snapshot!.providers[0].shippingCostExVat).toBe(360);
        expect(snapshot!.providers[0].lines[0].lineCogsExVat).toBe(560);
        expect(snapshot!.estimatedCostExVat).toBe(560 + 360 + 150 + 360);
        expect(orderService.updateCustomFields).toHaveBeenCalledOnce();
    });
});
