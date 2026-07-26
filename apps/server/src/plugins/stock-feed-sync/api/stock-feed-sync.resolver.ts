import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext } from '@vendure/core';

import { StockFeedSyncProgressService } from '../services/stock-feed-sync-progress.service';
import { StockFeedSyncService } from '../services/stock-feed-sync.service';
import { StockFeedSyncRun } from '../types/sync.types';

@Resolver()
export class StockFeedSyncAdminResolver {
    constructor(
        private syncService: StockFeedSyncService,
        private progressService: StockFeedSyncProgressService,
    ) {}

    @Query()
    @Allow(Permission.SuperAdmin)
    async lastStockFeedSync(@Ctx() ctx: RequestContext): Promise<StockFeedSyncRun | null> {
        return this.progressService.getLastCompleted(ctx);
    }

    @Query()
    @Allow(Permission.SuperAdmin)
    async stockFeedSyncRuns(
        @Ctx() ctx: RequestContext,
        @Args() args: { take?: number },
    ): Promise<StockFeedSyncRun[]> {
        return this.progressService.getRecentRuns(ctx, args.take ?? 10);
    }

    @Query()
    @Allow(Permission.SuperAdmin)
    async stockFeedSyncRun(
        @Ctx() ctx: RequestContext,
        @Args() args: { runId: string },
    ): Promise<StockFeedSyncRun | null> {
        return this.progressService.get(ctx, args.runId);
    }

    @Mutation()
    @Allow(Permission.SuperAdmin)
    async triggerStockFeedSync(
        @Ctx() ctx: RequestContext,
        @Args() args: { syncLimit?: number },
    ): Promise<StockFeedSyncRun> {
        return this.syncService.startSync(ctx, {
            source: 'manual',
            syncLimit: args.syncLimit,
        });
    }
}
