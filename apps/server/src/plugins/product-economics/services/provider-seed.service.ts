import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RequestContext, RequestContextService, TransactionalConnection } from '@vendure/core';

import { DEFAULT_PROVIDER_CODE, DEFAULT_VAT_RATE_PERCENT } from '../constants';
import { ProductSupplierProvider } from '../entities/product-supplier-provider.entity';
import { SupplierShippingRule } from '../entities/supplier-shipping-rule.entity';

const ONE_ON_ONE_SHIPPING_RULES = [
    { code: 'tracked', name: 'Tracked delivery', costExVat: 3.6, isDefault: true, sortOrder: 0 },
    { code: 'next_day', name: 'Next day delivery', costExVat: 5.95, isDefault: false, sortOrder: 1 },
    { code: 'europe', name: 'Europe delivery', costExVat: 15.3, isDefault: false, sortOrder: 2 },
] as const;

@Injectable()
export class ProviderSeedService implements OnApplicationBootstrap {
    constructor(
        private connection: TransactionalConnection,
        private requestContextService: RequestContextService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const ctx = await this.requestContextService.create({ apiType: 'admin' });
        await this.seedOneOnOneProvider(ctx);
    }

    async seedOneOnOneProvider(ctx: RequestContext): Promise<ProductSupplierProvider> {
        const providerRepo = this.connection.getRepository(ctx, ProductSupplierProvider);
        const existing = await providerRepo.findOne({
            where: { code: DEFAULT_PROVIDER_CODE },
            relations: ['shippingRules'],
        });
        if (existing) {
            return existing;
        }

        const provider = await providerRepo.save(
            new ProductSupplierProvider({
                code: DEFAULT_PROVIDER_CODE,
                name: '1on1 Wholesale',
                tradePriceIncludesVat: false,
                defaultVatRatePercent: DEFAULT_VAT_RATE_PERCENT,
                active: true,
            }),
        );

        const ruleRepo = this.connection.getRepository(ctx, SupplierShippingRule);
        for (const rule of ONE_ON_ONE_SHIPPING_RULES) {
            await ruleRepo.save(
                new SupplierShippingRule({
                    providerId: provider.id as number,
                    provider,
                    code: rule.code,
                    name: rule.name,
                    costExVat: rule.costExVat,
                    isDefault: rule.isDefault,
                    sortOrder: rule.sortOrder,
                    customerShippingMethodCode: null,
                }),
            );
        }

        return provider;
    }
}
