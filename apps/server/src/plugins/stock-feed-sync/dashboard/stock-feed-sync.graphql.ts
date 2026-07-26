import { graphql } from '@vendure/dashboard';

export const lastStockFeedSyncDocument = graphql(`
    query LastStockFeedSync {
        lastStockFeedSync {
            runId
            status
            source
            message
            startedAt
            completedAt
            durationMs
            error
            result {
                rowsParsed
                matched
                updated
                unchanged
                unknownSkus
                errors
            }
        }
    }
`);

export const triggerStockFeedSyncDocument = graphql(`
    mutation TriggerStockFeedSync($syncLimit: Int) {
        triggerStockFeedSync(syncLimit: $syncLimit) {
            runId
            status
            source
            message
            startedAt
            completedAt
            durationMs
            error
            result {
                rowsParsed
                matched
                updated
                unchanged
                unknownSkus
                errors
            }
        }
    }
`);
