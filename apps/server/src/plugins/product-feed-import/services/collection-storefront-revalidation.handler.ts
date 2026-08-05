import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CollectionEvent, EventBus } from '@vendure/core';

import { loggerCtx } from '../constants';
import { StorefrontRevalidationService } from './storefront-revalidation.service';

const REVALIDATION_DEBOUNCE_MS = 2_000;

@Injectable()
export class CollectionStorefrontRevalidationHandler implements OnApplicationBootstrap {
    private readonly logger = new Logger(loggerCtx);
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private eventBus: EventBus,
        private storefrontRevalidationService: StorefrontRevalidationService,
    ) {}

    onApplicationBootstrap(): void {
        this.eventBus.ofType(CollectionEvent).subscribe(event => {
            this.scheduleNavigationRevalidation(event.type, event.entity.slug);
        });
    }

    private scheduleNavigationRevalidation(type: CollectionEvent['type'], slug: string): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = undefined;
            void this.revalidateNavigation(type, slug);
        }, REVALIDATION_DEBOUNCE_MS);
    }

    private async revalidateNavigation(type: CollectionEvent['type'], slug: string): Promise<void> {
        this.logger.log(`Collection ${type} (${slug}) — revalidating storefront navigation caches`);
        await this.storefrontRevalidationService.revalidateNavigationCaches();
    }
}
