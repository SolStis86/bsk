import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, ID, Permission, RequestContext } from '@vendure/core';

import { ProductSupplierProvider } from '../entities/product-supplier-provider.entity';
import { SupplierShippingRule } from '../entities/supplier-shipping-rule.entity';
import { MarginCalculationService } from '../services/margin-calculation.service';
import { SupplierProviderService } from '../services/supplier-provider.service';
import { VariantEconomics } from '../types';

@Resolver()
export class ProductEconomicsAdminResolver {
    constructor(
        private marginCalculationService: MarginCalculationService,
        private supplierProviderService: SupplierProviderService,
    ) {}

    @Query()
    @Allow(Permission.ReadCatalog)
    async variantEconomics(
        @Ctx() ctx: RequestContext,
        @Args() args: { variantId: ID },
    ): Promise<VariantEconomics | null> {
        return this.marginCalculationService.calculateForVariant(ctx, args.variantId);
    }

    @Query()
    @Allow(Permission.ReadSettings)
    async productSupplierProviders(@Ctx() ctx: RequestContext): Promise<ProductSupplierProvider[]> {
        return this.supplierProviderService.findAll(ctx);
    }

    @Mutation()
    @Allow(Permission.UpdateSettings)
    async updateProductSupplierProvider(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: Parameters<SupplierProviderService['updateProvider']>[1] },
    ): Promise<ProductSupplierProvider> {
        return this.supplierProviderService.updateProvider(ctx, args.input);
    }

    @Mutation()
    @Allow(Permission.UpdateSettings)
    async upsertSupplierShippingRule(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: Parameters<SupplierProviderService['upsertShippingRule']>[1] },
    ): Promise<SupplierShippingRule> {
        return this.supplierProviderService.upsertShippingRule(ctx, args.input);
    }

    @Mutation()
    @Allow(Permission.UpdateSettings)
    async deleteSupplierShippingRule(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
    ): Promise<boolean> {
        return this.supplierProviderService.deleteShippingRule(ctx, args.id);
    }
}
