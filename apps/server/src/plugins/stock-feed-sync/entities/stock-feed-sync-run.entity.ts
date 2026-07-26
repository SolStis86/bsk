import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

import { StockFeedSyncResult, StockFeedSyncSource, StockFeedSyncStatus } from '../types/sync.types';

@Entity()
export class StockFeedSyncRunRecord extends VendureEntity {
    constructor(input?: DeepPartial<StockFeedSyncRunRecord>) {
        super(input);
    }

    @Column({ unique: true })
    runId: string;

    @Column({ type: 'varchar' })
    status: StockFeedSyncStatus;

    @Column({ type: 'varchar' })
    source: StockFeedSyncSource;

    @Column()
    message: string;

    @Column({ type: 'varchar' })
    startedAt: string;

    @Column({ type: 'varchar', nullable: true })
    completedAt: string | null;

    @Column('int', { nullable: true })
    durationMs: number | null;

    @Column('simple-json', { nullable: true })
    result: StockFeedSyncResult | null;

    @Column({ type: 'varchar', nullable: true })
    error: string | null;
}
