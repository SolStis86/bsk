import { defineDashboardExtension } from '@vendure/dashboard';

import { StockFeedSyncPage } from './stock-feed-sync-page';

defineDashboardExtension({
    routes: [
        {
            path: '/stock-feed-sync',
            loader: () => ({ breadcrumb: 'Stock feed sync' }),
            navMenuItem: {
                id: 'stock-feed-sync',
                title: 'Stock feed sync',
                sectionId: 'catalog',
            },
            component: StockFeedSyncPage,
        },
    ],
});
