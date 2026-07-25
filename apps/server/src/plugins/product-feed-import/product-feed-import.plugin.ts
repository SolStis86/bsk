import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';

import { adminApiExtensions } from './api/api-extensions';
import { ProductFeedImportAdminResolver } from './api/product-feed-import.resolver';
import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS } from './constants';
import { ProductFeedImportProgressRecord } from './entities/product-feed-import-progress.entity';
import { AssetImportService } from './services/asset-import.service';
import { CatalogSyncService } from './services/catalog-sync.service';
import { CategoryAvailabilityService } from './services/category-availability.service';
import { FeedMapperService } from './services/feed-mapper.service';
import { FeedParserService } from './services/feed-parser.service';
import { ProductFeedImportProgressService } from './services/product-feed-import-progress.service';
import { ProductFeedImportService } from './services/product-feed-import.service';
import { TaxonomySeedService } from './services/taxonomy-seed.service';
import { TaxonomySyncService } from './services/taxonomy-sync.service';
import { PluginInitOptions } from './types';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [ProductFeedImportProgressRecord],
    providers: [
        { provide: PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS, useFactory: () => ProductFeedImportPlugin.options },
        TaxonomySeedService,
        FeedParserService,
        FeedMapperService,
        TaxonomySyncService,
        CategoryAvailabilityService,
        CatalogSyncService,
        AssetImportService,
        ProductFeedImportProgressService,
        ProductFeedImportService,
    ],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [ProductFeedImportAdminResolver],
    },
    dashboard: './dashboard/index.tsx',
    compatibility: '^3.0.0',
})
export class ProductFeedImportPlugin {
    static options: PluginInitOptions;

    static init(options: PluginInitOptions): Type<ProductFeedImportPlugin> {
        this.options = options;
        return ProductFeedImportPlugin;
    }
}
