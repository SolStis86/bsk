import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
    CollectionService,
    FacetService,
    LanguageCode,
    ProcessContext,
    RequestContextService,
} from '@vendure/core';

import { loggerCtx } from '../constants';
import {
    PARENT_COLLECTION_NAV_DEFAULTS,
    PRODUCT_FEED_FACETS,
} from '../constants/taxonomy.constants';

@Injectable()
export class TaxonomySeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        private processContext: ProcessContext,
        private requestContextService: RequestContextService,
        private facetService: FacetService,
        private collectionService: CollectionService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        if (this.processContext.isWorker) {
            return;
        }

        const ctx = await this.requestContextService.create({
            apiType: 'admin',
        });

        let created = 0;
        let existing = 0;

        for (const facetDef of PRODUCT_FEED_FACETS) {
            const found = await this.facetService.findByCode(ctx, facetDef.code, LanguageCode.en);
            if (found) {
                existing++;
                continue;
            }

            await this.facetService.create(ctx, {
                code: facetDef.code,
                isPrivate: false,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: facetDef.name,
                    },
                ],
            });
            created++;
            this.logger.log(`Created facet: ${facetDef.code} (${facetDef.name})`);
        }

        this.logger.log(
            `Product feed taxonomy seed complete — created: ${created}, already existed: ${existing}`,
        );

        await this.bootstrapCollectionNavDefaults(ctx);
    }

    /**
     * One-time bootstrap for existing collections: if no top-level collection is
     * marked for main nav yet, apply defaults from PARENT_COLLECTION_NAV_DEFAULTS.
     */
    private async bootstrapCollectionNavDefaults(ctx: Awaited<ReturnType<RequestContextService['create']>>): Promise<void> {
        const { items } = await this.collectionService.findAll(ctx, {
            topLevelOnly: true,
            take: 100,
        });

        if (items.some(collection => collection.customFields?.showInMainNav === true)) {
            return;
        }

        let updated = 0;

        for (const collection of items) {
            const defaults = PARENT_COLLECTION_NAV_DEFAULTS[collection.slug];
            if (!defaults) {
                continue;
            }

            await this.collectionService.update(ctx, {
                id: collection.id,
                customFields: {
                    showInMainNav: defaults.showInMainNav,
                    navSortOrder: defaults.navSortOrder,
                    navHighlight: defaults.navHighlight ?? false,
                },
            });
            updated++;
        }

        if (updated > 0) {
            this.logger.log(`Applied collection nav defaults to ${updated} top-level collections`);
        }
    }
}
