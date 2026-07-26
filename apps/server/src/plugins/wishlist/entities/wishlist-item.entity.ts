import { DeepPartial, EntityId, ID, ProductVariant, VendureEntity } from '@vendure/core';
import { Entity, ManyToOne } from 'typeorm';

@Entity()
export class WishlistItem extends VendureEntity {
    constructor(input?: DeepPartial<WishlistItem>) {
        super(input);
    }

    @ManyToOne(() => ProductVariant)
    productVariant: ProductVariant;

    @EntityId()
    productVariantId: ID;
}
