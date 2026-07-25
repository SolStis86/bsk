import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

import { ProductFeedImportResult } from '../types/import.types';

@Entity()
export class ProductFeedImportProgressRecord extends VendureEntity {
    constructor(input?: DeepPartial<ProductFeedImportProgressRecord>) {
        super(input);
    }

    @Column({ unique: true })
    jobId: string;

    @Column()
    stage: string;

    @Column()
    message: string;

    @Column('double precision')
    progress: number;

    @Column('int', { default: 0 })
    processedProducts: number;

    @Column('int', { default: 0 })
    totalProducts: number;

    @Column({ type: 'varchar', nullable: true })
    currentProductCode: string | null;

    @Column('simple-json', { nullable: true })
    result: ProductFeedImportResult | null;

    @Column({ type: 'varchar', nullable: true })
    error: string | null;
}
