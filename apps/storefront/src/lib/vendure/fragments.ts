import { graphql } from '@/graphql';

export const ProductCardFragment = graphql(`
    fragment ProductCard on SearchResult {
        productId
        productName
        slug
        productVariantId
        inStock
        productAsset {
            id
            preview
        }
        priceWithTax {
            __typename
            ... on PriceRange {
                min
                max
            }
            ... on SinglePrice {
                value
            }
        }
        currencyCode
    }
`);

export const ProductDetailFragment = graphql(`
    fragment ProductDetail on Product {
        id
        name
        description
        slug
        customFields {
            materials
            power
            sizeImperial
        }
        facetValues {
            id
            name
            code
            facet {
                id
                code
                name
            }
        }
        assets {
            id
            preview
            source
        }
        variants {
            id
            name
            sku
            priceWithTax
            stockLevel
            options {
                id
                code
                name
                groupId
                group {
                    id
                    code
                    name
                }
            }
        }
        optionGroups {
            id
            code
            name
            options {
                id
                code
                name
            }
        }
        collections {
            id
            name
            slug
            parent {
                id
                name
                slug
            }
        }
    }
`);

export const ActiveCustomerFragment = graphql(`
    fragment ActiveCustomer on Customer {
        id
        firstName
        lastName
        emailAddress
    }
`);

export const WishlistItemFragment = graphql(`
    fragment WishlistItem on WishlistItem {
        id
        productVariantId
        productVariant {
            id
            name
            sku
            stockLevel
            priceWithTax
            product {
                id
                name
                slug
                featuredAsset {
                    id
                    preview
                }
            }
        }
    }
`);
