import { Injectable } from '@nestjs/common';
import {
    Customer,
    ForbiddenError,
    ID,
    InternalServerError,
    ProductVariantService,
    RequestContext,
    TransactionalConnection,
    UserInputError,
} from '@vendure/core';

import { WishlistItem } from '../entities/wishlist-item.entity';

@Injectable()
export class WishlistService {
    constructor(
        private connection: TransactionalConnection,
        private productVariantService: ProductVariantService,
    ) {}

    async getWishlistItems(ctx: RequestContext): Promise<WishlistItem[]> {
        try {
            const customer = await this.getCustomerWithWishlistItems(ctx);
            return customer.customFields.wishlistItems ?? [];
        } catch {
            return [];
        }
    }

    async addItem(ctx: RequestContext, variantId: ID): Promise<WishlistItem[]> {
        const customer = await this.getCustomerWithWishlistItems(ctx);
        const variant = await this.productVariantService.findOne(ctx, variantId);
        if (!variant) {
            throw new UserInputError(`No ProductVariant with the id ${variantId} could be found`);
        }

        const existingItem = customer.customFields.wishlistItems?.find(
            item => item.productVariantId === variantId,
        );
        if (existingItem) {
            return customer.customFields.wishlistItems;
        }

        const wishlistItem = await this.connection.getRepository(ctx, WishlistItem).save(
            new WishlistItem({ productVariantId: variantId }),
        );

        customer.customFields.wishlistItems = [
            ...(customer.customFields.wishlistItems ?? []),
            wishlistItem,
        ];
        await this.connection.getRepository(ctx, Customer).save(customer, { reload: false });

        return this.getWishlistItems(ctx);
    }

    async removeItem(ctx: RequestContext, itemId: ID): Promise<WishlistItem[]> {
        const customer = await this.getCustomerWithWishlistItems(ctx);
        const itemToRemove = customer.customFields.wishlistItems?.find(item => item.id === itemId);

        if (itemToRemove) {
            await this.connection.getRepository(ctx, WishlistItem).remove(itemToRemove);
            customer.customFields.wishlistItems = customer.customFields.wishlistItems.filter(
                item => item.id !== itemId,
            );
            await this.connection.getRepository(ctx, Customer).save(customer);
        }

        return this.getWishlistItems(ctx);
    }

    private async getCustomerWithWishlistItems(ctx: RequestContext): Promise<Customer> {
        if (!ctx.activeUserId) {
            throw new ForbiddenError();
        }

        const customer = await this.connection.getRepository(ctx, Customer).findOne({
            where: { user: { id: ctx.activeUserId } },
            relations: {
                customFields: {
                    wishlistItems: {
                        productVariant: true,
                    },
                },
            },
        });

        if (!customer) {
            throw new InternalServerError('Customer was not found');
        }

        return customer;
    }
}
