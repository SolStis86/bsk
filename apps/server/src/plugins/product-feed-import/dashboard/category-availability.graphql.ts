import { graphql } from '@vendure/dashboard';

export const categoryAvailabilityDocument = graphql(`
    query CategoryAvailability {
        categoryAvailability {
            name
            slug
            productCount
            categories {
                tag
                enabled
                productCount
            }
        }
    }
`);

export const updateCategoryAvailabilityDocument = graphql(`
    mutation UpdateCategoryAvailability($enabledTags: [String!]!) {
        updateCategoryAvailability(enabledTags: $enabledTags) {
            enabledTags
            productsEnabled
            productsDisabled
            variantsUpdated
            searchReindexJobId
        }
    }
`);
