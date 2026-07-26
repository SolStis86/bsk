import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext, Transaction } from '@vendure/core';

import { WishlistService } from '../services/wishlist.service';

@Resolver()
export class WishlistShopResolver {
    constructor(private wishlistService: WishlistService) {}

    @Query()
    @Allow(Permission.Owner)
    async activeCustomerWishlist(@Ctx() ctx: RequestContext) {
        return this.wishlistService.getWishlistItems(ctx);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async addToWishlist(
        @Ctx() ctx: RequestContext,
        @Args() args: { productVariantId: string },
    ) {
        return this.wishlistService.addItem(ctx, args.productVariantId);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    async removeFromWishlist(@Ctx() ctx: RequestContext, @Args() args: { itemId: string }) {
        return this.wishlistService.removeItem(ctx, args.itemId);
    }
}
