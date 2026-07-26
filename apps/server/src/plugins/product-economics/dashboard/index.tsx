import { defineDashboardExtension } from '@vendure/dashboard';

import { OrderProfitPanel } from './order-profit-panel';
import { SupplierProvidersPage } from './supplier-providers-page';
import { VariantEconomicsPanel } from './variant-economics-panel';

defineDashboardExtension({
    routes: [
        {
            path: '/supplier-providers',
            loader: () => ({ breadcrumb: 'Supplier providers' }),
            navMenuItem: {
                id: 'supplier-providers',
                title: 'Supplier providers',
                sectionId: 'settings',
                order: 1300,
                requiresPermission: ['UpdateSettings'],
            },
            component: SupplierProvidersPage,
        },
    ],
    pageBlocks: [
        {
            id: 'variant-economics',
            title: 'Variant economics',
            location: {
                pageId: 'product-variant-detail',
                column: 'side',
                position: { blockId: 'parent-product', order: 'after' },
            },
            component: VariantEconomicsPanel,
            requiresPermission: ['ReadCatalog'],
        },
        {
            id: 'order-profit-snapshot',
            title: 'Profit snapshot',
            location: {
                pageId: 'order-detail',
                column: 'side',
                position: { blockId: 'fulfillment-details', order: 'after' },
            },
            component: OrderProfitPanel,
            requiresPermission: ['ReadOrder'],
        },
    ],
});
