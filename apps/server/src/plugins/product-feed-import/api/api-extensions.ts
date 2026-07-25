import gql from 'graphql-tag';

export const adminApiExtensions = gql`
    enum ProductFeedImportStage {
        QUEUED
        DOWNLOADING_FEED
        PREPARING_IMAGES
        PARSING_FEED
        SYNCING_PRODUCTS
        APPLYING_COLLECTIONS
        REINDEXING_SEARCH
        COMPLETE
        FAILED
    }

    type ProductFeedImportResult {
        productsCreated: Int!
        productsUpdated: Int!
        variantsCreated: Int!
        variantsUpdated: Int!
        assetsImported: Int!
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
        result: ProductFeedImportResult
        error: String
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
    }

    extend type Mutation {
        importProductFeed(importLimit: Int): ProductFeedImportStartResult!
        updateCategoryAvailability(enabledTags: [String!]!): CategoryAvailabilityUpdateResult!
    }
`;
