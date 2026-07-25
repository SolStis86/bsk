import { graphql } from '@vendure/dashboard';

export const importProductFeedDocument = graphql(`
    mutation ImportProductFeed($importLimit: Int) {
        importProductFeed(importLimit: $importLimit) {
            jobId
        }
    }
`);

export const productFeedImportProgressDocument = graphql(`
    query ProductFeedImportProgress($jobId: ID!) {
        productFeedImportProgress(jobId: $jobId) {
            jobId
            stage
            message
            progress
            processedProducts
            totalProducts
            currentProductCode
            assetsPending
            error
            result {
                productsCreated
                productsUpdated
                variantsCreated
                variantsUpdated
                variantsDisabled
                productsDisabled
                assetsImported
                assetsEnqueued
                warnings
                errors
            }
        }
    }
`);

export const lastProductFeedImportDocument = graphql(`
    query LastProductFeedImport {
        lastProductFeedImport {
            jobId
            completedAt
            source
            assetsPending
            result {
                productsCreated
                productsUpdated
                variantsCreated
                variantsUpdated
                variantsDisabled
                productsDisabled
                assetsImported
                assetsEnqueued
                warnings
                errors
            }
        }
    }
`);

export const importJobStatusDocument = graphql(`
    query ImportJobStatus($jobId: ID!) {
        job(jobId: $jobId) {
            id
            state
            progress
            isSettled
            error
        }
    }
`);
