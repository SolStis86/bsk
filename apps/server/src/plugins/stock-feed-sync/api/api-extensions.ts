import gql from 'graphql-tag';

export const adminApiExtensions = gql`
    enum StockFeedSyncStatus {
        RUNNING
        COMPLETE
        FAILED
    }

    type StockFeedSyncResult {
        rowsParsed: Int!
        matched: Int!
        updated: Int!
        unchanged: Int!
        unknownSkus: Int!
        errors: [String!]!
    }

    type StockFeedSyncRun {
        runId: ID!
        status: StockFeedSyncStatus!
        source: String!
        message: String!
        startedAt: DateTime!
        completedAt: DateTime
        durationMs: Int
        result: StockFeedSyncResult
        error: String
    }

    extend type Query {
        lastStockFeedSync: StockFeedSyncRun
        stockFeedSyncRuns(take: Int): [StockFeedSyncRun!]!
        stockFeedSyncRun(runId: ID!): StockFeedSyncRun
    }

    extend type Mutation {
        triggerStockFeedSync(syncLimit: Int): StockFeedSyncRun!
    }
`;
