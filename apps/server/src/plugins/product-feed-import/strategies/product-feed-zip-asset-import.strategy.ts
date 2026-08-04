import { Readable } from 'stream';

import { Injector } from '@vendure/core/dist/common/injector';
import { DefaultAssetImportStrategy } from '@vendure/core/dist/config/asset-import-strategy/default-asset-import-strategy';
import { AssetImportStrategy } from '@vendure/core/dist/config/asset-import-strategy/asset-import-strategy';

import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS } from '../constants';
import { ProductFeedImportAssetSessionService } from '../services/product-feed-import-asset-session.service';
import { PluginInitOptions } from '../types';

export class ProductFeedZipAssetImportStrategy implements AssetImportStrategy {
    private session!: ProductFeedImportAssetSessionService;
    private defaultStrategy!: DefaultAssetImportStrategy;
    private imageZipUrl = '';

    init(injector: Injector): void {
        this.session = injector.get(ProductFeedImportAssetSessionService);
        this.defaultStrategy = new DefaultAssetImportStrategy();
        this.defaultStrategy.init(injector);

        const options = injector.get<PluginInitOptions>(PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS);
        this.imageZipUrl = options.imageZipUrl ?? '';
    }

    async getStreamFromPath(assetPath: string): Promise<Readable> {
        if (this.session.isActive()) {
            const stream = await this.session.openStream(assetPath);
            if (!stream) {
                throw new Error(`Image "${assetPath}" not found in zip archive`);
            }

            return stream;
        }

        if (this.imageZipUrl) {
            throw new Error(
                `Image "${assetPath}" skipped — zip import session not active (individual URL import disabled)`,
            );
        }

        return this.defaultStrategy.getStreamFromPath(assetPath);
    }
}
