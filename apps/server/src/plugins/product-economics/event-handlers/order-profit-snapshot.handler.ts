import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, OrderStateTransitionEvent } from '@vendure/core';
import { filter } from 'rxjs/operators';

import { OrderProfitSnapshotService } from '../services/order-profit-snapshot.service';

@Injectable()
export class OrderProfitSnapshotHandler implements OnApplicationBootstrap {
    constructor(
        private eventBus: EventBus,
        private orderProfitSnapshotService: OrderProfitSnapshotService,
    ) {}

    onApplicationBootstrap(): void {
        this.eventBus
            .ofType(OrderStateTransitionEvent)
            .pipe(filter(event => event.toState === 'PaymentSettled'))
            .subscribe(event => {
                void this.orderProfitSnapshotService.captureSnapshot(event.ctx, event.order.id);
            });
    }
}
