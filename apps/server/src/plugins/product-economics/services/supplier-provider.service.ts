import { Injectable } from '@nestjs/common';
import { ID, RequestContext, TransactionalConnection } from '@vendure/core';

import { ProductSupplierProvider } from '../entities/product-supplier-provider.entity';
import { SupplierShippingRule } from '../entities/supplier-shipping-rule.entity';

@Injectable()
export class SupplierProviderService {
    constructor(private connection: TransactionalConnection) {}

    findAll(ctx: RequestContext): Promise<ProductSupplierProvider[]> {
        return this.connection.getRepository(ctx, ProductSupplierProvider).find({
            relations: ['shippingRules'],
            order: { code: 'ASC' },
        });
    }

    findByCode(ctx: RequestContext, code: string): Promise<ProductSupplierProvider | null> {
        return this.connection.getRepository(ctx, ProductSupplierProvider).findOne({
            where: { code },
            relations: ['shippingRules'],
        });
    }

    async getDefaultShippingRule(
        ctx: RequestContext,
        providerCode: string,
    ): Promise<SupplierShippingRule | null> {
        const provider = await this.findByCode(ctx, providerCode);
        if (!provider?.shippingRules?.length) {
            return null;
        }
        return (
            provider.shippingRules.find(rule => rule.isDefault) ??
            [...provider.shippingRules].sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
            null
        );
    }

    async updateProvider(
        ctx: RequestContext,
        input: {
            id: ID;
            name?: string;
            tradePriceIncludesVat?: boolean;
            defaultVatRatePercent?: number;
            active?: boolean;
        },
    ): Promise<ProductSupplierProvider> {
        const repo = this.connection.getRepository(ctx, ProductSupplierProvider);
        const provider = await repo.findOneOrFail({ where: { id: input.id }, relations: ['shippingRules'] });
        if (input.name !== undefined) {
            provider.name = input.name;
        }
        if (input.tradePriceIncludesVat !== undefined) {
            provider.tradePriceIncludesVat = input.tradePriceIncludesVat;
        }
        if (input.defaultVatRatePercent !== undefined) {
            provider.defaultVatRatePercent = input.defaultVatRatePercent;
        }
        if (input.active !== undefined) {
            provider.active = input.active;
        }
        return repo.save(provider);
    }

    async upsertShippingRule(
        ctx: RequestContext,
        input: {
            id?: ID;
            providerId: ID;
            code: string;
            name: string;
            costExVat: number;
            isDefault?: boolean;
            sortOrder?: number;
            customerShippingMethodCode?: string | null;
        },
    ): Promise<SupplierShippingRule> {
        const providerRepo = this.connection.getRepository(ctx, ProductSupplierProvider);
        const ruleRepo = this.connection.getRepository(ctx, SupplierShippingRule);
        const provider = await providerRepo.findOneOrFail({ where: { id: input.providerId } });

        let rule: SupplierShippingRule;
        if (input.id) {
            rule = await ruleRepo.findOneOrFail({ where: { id: input.id } });
        } else {
            rule = new SupplierShippingRule({ provider, providerId: provider.id as number });
        }

        rule.code = input.code;
        rule.name = input.name;
        rule.costExVat = input.costExVat;
        if (input.isDefault !== undefined) {
            rule.isDefault = input.isDefault;
        }
        if (input.sortOrder !== undefined) {
            rule.sortOrder = input.sortOrder;
        }
        if (input.customerShippingMethodCode !== undefined) {
            rule.customerShippingMethodCode = input.customerShippingMethodCode;
        }

        if (rule.isDefault) {
            const siblings = await ruleRepo.find({ where: { providerId: provider.id as number } });
            for (const sibling of siblings) {
                if (sibling.id !== rule.id) {
                    sibling.isDefault = false;
                    await ruleRepo.save(sibling);
                }
            }
        }

        return ruleRepo.save(rule);
    }

    async deleteShippingRule(ctx: RequestContext, id: ID): Promise<boolean> {
        const ruleRepo = this.connection.getRepository(ctx, SupplierShippingRule);
        const result = await ruleRepo.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
