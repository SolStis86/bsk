import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity, OneToMany } from 'typeorm';

import { SupplierShippingRule } from './supplier-shipping-rule.entity';

@Entity()
export class ProductSupplierProvider extends VendureEntity {
    constructor(input?: DeepPartial<ProductSupplierProvider>) {
        super(input);
    }

    @Column({ type: 'varchar', unique: true })
    code: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ default: false })
    tradePriceIncludesVat: boolean;

    @Column('float', { default: 20 })
    defaultVatRatePercent: number;

    @Column({ default: true })
    active: boolean;

    @OneToMany(() => SupplierShippingRule, rule => rule.provider)
    shippingRules: SupplierShippingRule[];
}
