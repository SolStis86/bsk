import { defineDashboardExtension } from '@vendure/dashboard';

import { CategoryAvailabilityPage } from './category-availability-page';
import { ProductFeedImportPage } from './product-feed-import-page';

defineDashboardExtension({
    routes: [
        {
            path: '/product-categories',
            loader: () => ({ breadcrumb: 'Product categories' }),
            navMenuItem: {
                id: 'product-categories',
                title: 'Product categories',
                sectionId: 'settings',
                order: 1250,
                requiresPermission: ['UpdateSettings'],
            },
            component: CategoryAvailabilityPage,
        },
        {
            path: '/product-feed-import',
            loader: () => ({ breadcrumb: 'Product feed import' }),
            navMenuItem: {
                id: 'product-feed-import',
                title: 'Product feed import',
                sectionId: 'catalog',
            },
            component: ProductFeedImportPage,
        },
    ],
});
