import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RequestContext, RequestContextService, TransactionalConnection } from '@vendure/core';
import { In, Not } from 'typeorm';

import { DEFAULT_PROVIDER_CODE, DEFAULT_VAT_RATE_PERCENT } from '../constants';
import {
    ONE_ON_ONE_SHIPPING_RULE_CODES,
    ONE_ON_ONE_SHIPPING_RULES,
} from '../constants/one-on-one-shipping-rules';
import { ProductSupplierProvider } from '../entities/product-supplier-provider.entity';
import { SupplierShippingRule } from '../entities/supplier-shipping-rule.entity';

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
        let provider = await providerRepo.findOne({
            where: { code: DEFAULT_PROVIDER_CODE },
            relations: ['shippingRules'],
        });

        if (!provider) {
            provider = await providerRepo.save(
                new ProductSupplierProvider({
                    code: DEFAULT_PROVIDER_CODE,
                    name: '1on1 Wholesale',
                    tradePriceIncludesVat: false,
                    defaultVatRatePercent: DEFAULT_VAT_RATE_PERCENT,
                    active: true,
                }),
            );
        }

        const ruleRepo = this.connection.getRepository(ctx, SupplierShippingRule);
        for (const rule of ONE_ON_ONE_SHIPPING_RULES) {
            const existingRule = await ruleRepo.findOne({
                where: {
                    providerId: provider.id as number,
                    code: rule.code,
                },
            });

            await ruleRepo.save(
                new SupplierShippingRule({
                    ...(existingRule ?? {}),
                    providerId: provider.id as number,
                    provider,
                    code: rule.code,
                    name: rule.name,
                    costExVat: rule.costExVat,
                    isDefault: rule.isDefault,
                    sortOrder: rule.sortOrder,
                    customerShippingMethodCode: rule.customerShippingMethodCode,
                }),
            );
        }

        await ruleRepo.delete({
            providerId: provider.id as number,
            code: Not(In(ONE_ON_ONE_SHIPPING_RULE_CODES)),
        });

        if (ONE_ON_ONE_SHIPPING_RULES.some(rule => rule.isDefault)) {
            const defaultCode = ONE_ON_ONE_SHIPPING_RULES.find(rule => rule.isDefault)!.code;
            const rules = await ruleRepo.find({ where: { providerId: provider.id as number } });
            for (const rule of rules) {
                rule.isDefault = rule.code === defaultCode;
                await ruleRepo.save(rule);
            }
        }

        return providerRepo.findOneOrFail({
            where: { id: provider.id },
            relations: ['shippingRules'],
        });
    }
}
