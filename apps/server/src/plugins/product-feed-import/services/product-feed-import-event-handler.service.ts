import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventBus } from '@vendure/core';

import { loggerCtx } from '../constants';
import { ProductFeedImportCompletedEvent } from '../events/product-feed-import-completed.event';
import { StorefrontRevalidationService } from './storefront-revalidation.service';

@Injectable()
export class ProductFeedImportEventHandler implements OnApplicationBootstrap {
    private readonly logger = new Logger(loggerCtx);

    constructor(
        private eventBus: EventBus,
        private storefrontRevalidationService: StorefrontRevalidationService,
    ) {}

    onApplicationBootstrap(): void {
        this.eventBus.ofType(ProductFeedImportCompletedEvent).subscribe(event => {
            void this.handleCompleted(event);
        });
    }

    private async handleCompleted(event: ProductFeedImportCompletedEvent): Promise<void> {
        if (event.result.errors.length > 0) {
            this.logger.log(
                `Skipping storefront revalidation for import ${event.jobId} due to ${event.result.errors.length} error(s)`,
            );
            return;
        }

        await this.storefrontRevalidationService.revalidateCatalogCaches();
    }
}
