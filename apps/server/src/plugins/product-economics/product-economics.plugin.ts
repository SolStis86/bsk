import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { adminApiExtensions } from './api/api-extensions';
import { ProductEconomicsAdminResolver } from './api/product-economics.resolver';
import { PRODUCT_ECONOMICS_PLUGIN_OPTIONS } from './constants';
import { ProductSupplierProvider } from './entities/product-supplier-provider.entity';
import { SupplierShippingRule } from './entities/supplier-shipping-rule.entity';
import { OrderProfitSnapshotHandler } from './event-handlers/order-profit-snapshot.handler';
import { ChannelTaxBootstrapService } from './services/channel-tax-bootstrap.service';
import { MarginCalculationService } from './services/margin-calculation.service';
import { OrderProfitSnapshotService } from './services/order-profit-snapshot.service';
import { ProviderSeedService } from './services/provider-seed.service';
import { SupplierProviderService } from './services/supplier-provider.service';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [ProductSupplierProvider, SupplierShippingRule],
    providers: [
        { provide: PRODUCT_ECONOMICS_PLUGIN_OPTIONS, useFactory: () => ProductEconomicsPlugin.options },
        ChannelTaxBootstrapService,
        ProviderSeedService,
        SupplierProviderService,
        MarginCalculationService,
        OrderProfitSnapshotService,
        OrderProfitSnapshotHandler,
    ],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [ProductEconomicsAdminResolver],
    },
    dashboard: './dashboard/index.tsx',
    compatibility: '^3.0.0',
})
export class ProductEconomicsPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<ProductEconomicsPlugin> {
        this.options = options;
        return ProductEconomicsPlugin;
    }
}
