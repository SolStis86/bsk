import gql from 'graphql-tag';

export const adminApiExtensions = gql`
    enum ProductFeedImportStage {
        QUEUED
        DOWNLOADING_FEED
        PREPARING_IMAGES
        PARSING_FEED
        SYNCING_PRODUCTS
        DISABLING_MISSING
        ENQUEUING_ASSETS
        APPLYING_COLLECTIONS
        IMPORTING_ASSETS
        REINDEXING_SEARCH
        COMPLETE
        FAILED
    }

    type ProductFeedImportResult {
        productsCreated: Int!
        productsUpdated: Int!
        variantsCreated: Int!
        variantsUpdated: Int!
        variantsDisabled: Int!
        productsDisabled: Int!
        assetsImported: Int!
        assetsEnqueued: Int!
        warnings: [String!]!
        errors: [String!]!
    }

    type ProductFeedImportStartResult {
        jobId: ID!
    }

    type ProductFeedImportProgress {
        jobId: ID!
        stage: ProductFeedImportStage!
        message: String!
        progress: Float!
        processedProducts: Int!
        totalProducts: Int!
        currentProductCode: String
        assetsPending: Int!
        result: ProductFeedImportResult
        error: String
        source: String
        startedAt: DateTime
        completedAt: DateTime
        durationMs: Int
    }

    type ProductFeedImportSummary {
        jobId: ID!
        completedAt: DateTime!
        source: String!
        assetsPending: Int!
        result: ProductFeedImportResult!
    }

    type CategoryAvailabilityTag {
        tag: String!
        enabled: Boolean!
        productCount: Int!
    }

    type CategoryAvailabilityCollection {
        name: String!
        slug: String!
        productCount: Int!
        categories: [CategoryAvailabilityTag!]!
    }

    type CategoryAvailabilityUpdateResult {
        enabledTags: [String!]!
        productsEnabled: Int!
        productsDisabled: Int!
        variantsUpdated: Int!
        searchReindexJobId: ID!
    }

    extend type Query {
        categoryAvailability: [CategoryAvailabilityCollection!]!
        productFeedImportProgress(jobId: ID!): ProductFeedImportProgress
        lastProductFeedImport: ProductFeedImportSummary
    }

    extend type Mutation {
        importProductFeed(importLimit: Int): ProductFeedImportStartResult!
        updateCategoryAvailability(enabledTags: [String!]!): CategoryAvailabilityUpdateResult!
    }
`;
