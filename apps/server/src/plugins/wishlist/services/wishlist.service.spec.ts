import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, UserInputError } from '@vendure/core';

import { WishlistItem } from '../entities/wishlist-item.entity';
import { WishlistService } from './wishlist.service';

function createService(overrides?: {
    customer?: {
        id: string;
        customFields: { wishlistItems: WishlistItem[] };
    } | null;
    variant?: { id: string } | null;
}) {
    const customer = overrides?.customer ?? {
        id: 'cust-1',
        customFields: { wishlistItems: [] },
    };

    const wishlistRepo = {
        save: vi.fn(async (item: WishlistItem) => ({ ...item, id: 'wl-1' })),
        remove: vi.fn(async () => undefined),
    };
    const customerRepo = {
        findOne: vi.fn(async () => customer),
        save: vi.fn(async (c: typeof customer) => c),
    };

    const connection = {
        getRepository: vi.fn((_ctx: unknown, entity: unknown) => {
            if (entity === WishlistItem) {
                return wishlistRepo;
            }
            return customerRepo;
        }),
    };

    const productVariantService = {
        findOne: vi.fn(async () => {
            if (overrides && 'variant' in overrides) {
                return overrides.variant;
            }
            return { id: 'variant-1' };
        }),
    };

    const service = new WishlistService(connection as never, productVariantService as never);

    return { service, wishlistRepo, customerRepo, productVariantService };
}

describe('WishlistService', () => {
    const ctx = { activeUserId: 'user-1' } as never;

    it('returns empty list when customer has no wishlist items', async () => {
        const { service } = createService();
        await expect(service.getWishlistItems(ctx)).resolves.toEqual([]);
    });

    it('throws ForbiddenError when user is not authenticated', async () => {
        const { service } = createService();
        await expect(service.addItem({ activeUserId: undefined } as never, 'variant-1')).rejects.toBeInstanceOf(
            ForbiddenError,
        );
    });

    it('adds a variant to the wishlist', async () => {
        const { service, wishlistRepo, customerRepo } = createService();

        const items = await service.addItem(ctx, 'variant-1');

        expect(wishlistRepo.save).toHaveBeenCalledOnce();
        expect(customerRepo.save).toHaveBeenCalledOnce();
        expect(items).toHaveLength(1);
    });

    it('does not duplicate an existing wishlist item', async () => {
        const existing = new WishlistItem({ id: 'wl-existing', productVariantId: 'variant-1' });
        const { service, wishlistRepo } = createService({
            customer: {
                id: 'cust-1',
                customFields: { wishlistItems: [existing] },
            },
        });

        const items = await service.addItem(ctx, 'variant-1');

        expect(wishlistRepo.save).not.toHaveBeenCalled();
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('wl-existing');
    });

    it('throws when variant does not exist', async () => {
        const { service } = createService({ variant: null });

        await expect(service.addItem(ctx, 'missing-variant')).rejects.toBeInstanceOf(UserInputError);
    });

    it('removes an item from the wishlist', async () => {
        const existing = new WishlistItem({ id: 'wl-1', productVariantId: 'variant-1' });
        const { service, wishlistRepo } = createService({
            customer: {
                id: 'cust-1',
                customFields: { wishlistItems: [existing] },
            },
        });

        const items = await service.removeItem(ctx, 'wl-1');

        expect(wishlistRepo.remove).toHaveBeenCalledOnce();
        expect(items).toEqual([]);
    });
});
