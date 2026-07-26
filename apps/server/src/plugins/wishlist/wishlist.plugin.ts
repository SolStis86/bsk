import { PluginCommonModule, VendurePlugin } from '@vendure/core';

import { shopApiExtensions } from './api/api-extensions';
import { WishlistShopResolver } from './api/wishlist-shop.resolver';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistService } from './services/wishlist.service';
import './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [WishlistItem],
    providers: [WishlistService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [WishlistShopResolver],
    },
    configuration: config => {
        config.customFields.Customer.push({
            name: 'wishlistItems',
            type: 'relation',
            list: true,
            entity: WishlistItem,
            internal: true,
        });
        return config;
    },
    compatibility: '^3.0.0',
})
export class WishlistPlugin {}
