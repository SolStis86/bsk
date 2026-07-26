import { Injectable } from '@nestjs/common';
import {
    ChannelService,
    GlobalSettingsService,
    ID,
    ProductVariantService,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';

import { ProductVariantPrice } from '@vendure/core/dist/entity/product-variant/product-variant-price.entity';
import { DEFAULT_PROVIDER_CODE } from '../constants';
import { ProductSupplierProvider } from '../entities/product-supplier-provider.entity';
import { VariantEconomics } from '../types';
import {
    calculateMargin,
    normalizeProfitCalculationVatMode,
    ProfitCalculationVatMode,
} from '../utils/economics.utils';

@Injectable()
export class MarginCalculationService {
    constructor(
        private connection: TransactionalConnection,
        private productVariantService: ProductVariantService,
        private channelService: ChannelService,
        private globalSettingsService: GlobalSettingsService,
    ) {}

    async getProfitCalculationVatMode(ctx: RequestContext): Promise<ProfitCalculationVatMode> {
        const settings = await this.globalSettingsService.getSettings(ctx);
        return normalizeProfitCalculationVatMode(settings.customFields.profitCalculationVatMode);
    }

    async calculateForVariant(ctx: RequestContext, variantId: ID): Promise<VariantEconomics | null> {
        const variant = await this.productVariantService.findOne(ctx, variantId, [
            'product',
            'productVariantPrices',
            'taxCategory',
        ]);
        if (!variant) {
            return null;
        }

        const channel = await this.channelService.findOne(ctx, ctx.channelId);
        if (!channel) {
            return null;
        }

        const providerCode =
            variant.product.customFields.supplierProviderCode?.trim() || DEFAULT_PROVIDER_CODE;
        const provider = await this.connection.getRepository(ctx, ProductSupplierProvider).findOne({
            where: { code: providerCode, active: true },
        });
        const vatRatePercent = provider?.defaultVatRatePercent ?? 20;
        const vatMode = await this.getProfitCalculationVatMode(ctx);
        let sellPriceMinor = 0;
        try {
            const pricedVariant = await this.productVariantService.applyChannelPriceAndTax(variant, ctx);
            sellPriceMinor = channel.pricesIncludeTax ? pricedVariant.priceWithTax : pricedVariant.price;
        } catch {
            sellPriceMinor = 0;
        }
        if (sellPriceMinor <= 0 && variant.productVariantPrices?.length) {
            const channelPrice =
                variant.productVariantPrices.find(
                    price => String(price.channelId) === String(ctx.channelId),
                ) ?? variant.productVariantPrices[0];
            sellPriceMinor = channelPrice?.price ?? 0;
        }
        if (sellPriceMinor <= 0) {
            const prices = await this.connection.getRepository(ctx, ProductVariantPrice).find({
                where: { variant: { id: variant.id } },
            });
            const channelPrice =
                prices.find(price => String(price.channelId) === String(ctx.channelId)) ?? prices[0];
            sellPriceMinor = channelPrice?.price ?? 0;
        }
        const tradePriceExVatMajor = variant.customFields.tradePrice ?? 0;
        const margin = calculateMargin({
            sellPriceMinor,
            tradePriceExVatMajor,
            vatRatePercent,
            pricesIncludeTax: channel.pricesIncludeTax,
            vatMode,
        });

        return {
            variantId: String(variant.id),
            sku: variant.sku,
            supplierProviderCode: providerCode,
            vatMode: margin.vatMode,
            vatRatePercent,
            pricesIncludeTax: channel.pricesIncludeTax,
            rrpIncVatMinor: margin.rrpIncVatMinor,
            rrpExVatMinor: margin.rrpExVatMinor,
            tradePriceExVatMinor: margin.tradePriceExVatMinor,
            tradePriceIncVatMinor: margin.tradePriceIncVatMinor,
            unitMarginExVatMinor: margin.unitMarginExVatMinor,
            unitMarginIncVatMinor: margin.unitMarginIncVatMinor,
            marginPercent: margin.marginPercent,
        };
    }
}
