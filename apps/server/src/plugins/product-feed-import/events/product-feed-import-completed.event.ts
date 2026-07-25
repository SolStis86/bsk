import { RequestContext } from '@vendure/core';

import { ProductFeedImportResult } from '../types/import.types';

export class ProductFeedImportCompletedEvent {
    readonly createdAt = new Date();

    constructor(
        public readonly ctx: RequestContext,
        public readonly jobId: string,
        public readonly result: ProductFeedImportResult,
    ) {}
}
