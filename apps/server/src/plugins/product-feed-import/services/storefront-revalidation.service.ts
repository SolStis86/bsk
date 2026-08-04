import { Inject, Injectable, Logger } from '@nestjs/common';

import { PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS, loggerCtx } from '../constants';
import { PluginInitOptions } from '../types';

const REVALIDATION_TAGS = [
    'collections',
    'navbar-collections',
    'mobile-nav',
    'homepage-categories',
    'featured',
    'products',
] as const;

@Injectable()
export class StorefrontRevalidationService {
    private readonly logger = new Logger(loggerCtx);

    constructor(@Inject(PRODUCT_FEED_IMPORT_PLUGIN_OPTIONS) private options: PluginInitOptions) {}

    async revalidateCatalogCaches(): Promise<void> {
        const { storefrontUrl, revalidationSecret } = this.options;

        if (!storefrontUrl) {
            this.logger.warn('Storefront revalidation skipped: storefrontUrl is not configured');
            return;
        }

        if (!revalidationSecret) {
            this.logger.warn('Storefront revalidation skipped: revalidationSecret is not configured');
            return;
        }

        const url = new URL('/api/revalidate', storefrontUrl).toString();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${revalidationSecret}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tags: [...REVALIDATION_TAGS] }),
            });

            if (!response.ok) {
                const body = await response.text();
                this.logger.warn(
                    `Storefront revalidation failed: HTTP ${response.status} — ${body.slice(0, 200)}`,
                );
                return;
            }

            this.logger.log('Storefront cache revalidation requested successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Storefront revalidation request failed: ${message}`);
        }
    }
}
