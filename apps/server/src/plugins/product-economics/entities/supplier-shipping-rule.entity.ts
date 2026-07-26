import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, ManyToOne } from 'typeorm';

import { ProductSupplierProvider } from './product-supplier-provider.entity';

@Entity()
export class SupplierShippingRule extends VendureEntity {
    constructor(input?: DeepPartial<SupplierShippingRule>) {
        super(input);
    }

    @ManyToOne(() => ProductSupplierProvider, provider => provider.shippingRules, { onDelete: 'CASCADE' })
    provider: ProductSupplierProvider;

    @Column()
    providerId: number;

    @Column({ type: 'varchar' })
    code: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column('float')
    costExVat: number;

    @Column({ default: false })
    isDefault: boolean;

    @Column('int', { default: 0 })
    sortOrder: number;

    @Column({ type: 'varchar', nullable: true })
    customerShippingMethodCode: string | null;
}
