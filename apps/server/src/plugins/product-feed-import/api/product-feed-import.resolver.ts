import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext, Transaction } from '@vendure/core';

import {
    CategoryAvailabilityCollection,
    CategoryAvailabilityService,
    CategoryAvailabilityUpdateResult,
} from '../services/category-availability.service';
import { ProductFeedAssetImportService } from '../services/product-feed-asset-import.service';
import { ProductFeedAssetImportProgressSyncService } from '../services/product-feed-asset-import-progress-sync.service';
import { ProductFeedImportProgressService } from '../services/product-feed-import-progress.service';
import { ProductFeedImportService } from '../services/product-feed-import.service';
import {
    ProductFeedImportProgress,
    ProductFeedImportStartResult,
    ProductFeedImportSummary,
} from '../types/import.types';

@Resolver()
export class ProductFeedImportAdminResolver {
    constructor(
        private productFeedImportService: ProductFeedImportService,
        private categoryAvailabilityService: CategoryAvailabilityService,
        private progressService: ProductFeedImportProgressService,
        private assetProgressSyncService: ProductFeedAssetImportProgressSyncService,
    ) {}

    @Query()
    @Allow(Permission.ReadSettings, Permission.SuperAdmin)
    async categoryAvailability(@Ctx() ctx: RequestContext): Promise<CategoryAvailabilityCollection[]> {
        return this.categoryAvailabilityService.getAvailability(ctx);
    }

    @Query()
    @Allow(Permission.SuperAdmin)
    async productFeedImportProgress(
        @Ctx() ctx: RequestContext,
        @Args() args: { jobId: string },
    ): Promise<ProductFeedImportProgress | null> {
        await this.assetProgressSyncService.syncAssetImportProgress(ctx, args.jobId);
        return this.progressService.get(ctx, args.jobId);
    }

    @Query()
    @Allow(Permission.SuperAdmin)
    async lastProductFeedImport(@Ctx() ctx: RequestContext): Promise<ProductFeedImportSummary | null> {
        return this.progressService.getLastCompletedImport(ctx);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateSettings, Permission.SuperAdmin)
    async updateCategoryAvailability(
        @Ctx() ctx: RequestContext,
        @Args() args: { enabledTags: string[] },
    ): Promise<CategoryAvailabilityUpdateResult> {
        return this.categoryAvailabilityService.updateAvailability(ctx, args.enabledTags);
    }

    @Mutation()
    @Allow(Permission.SuperAdmin)
    async importProductFeed(
        @Ctx() ctx: RequestContext,
        @Args() args: { importLimit?: number },
    ): Promise<ProductFeedImportStartResult> {
        return this.productFeedImportService.startImportJob(ctx, {
            importLimit: args.importLimit,
            source: 'manual',
        });
    }
}
