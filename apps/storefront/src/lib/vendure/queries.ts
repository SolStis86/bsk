import { graphql } from '@/graphql';
import { ActiveCustomerFragment, ProductCardFragment, ProductDetailFragment, WishlistItemFragment } from './fragments';

export const GetTopCollectionsQuery = graphql(`
    query GetTopCollections {
        collections(options: { topLevelOnly: true }) {
            items {
                id
                name
                slug
                customFields {
                    showInMainNav
                    navSortOrder
                    navHighlight
                }
            }
        }
    }
`);

export const GetAllCollectionSlugsQuery = graphql(`
    query GetAllCollectionSlugs($options: CollectionListOptions) {
        collections(options: $options) {
            items {
                slug
            }
            totalItems
        }
    }
`);

export const GetActiveCustomerQuery = graphql(`
    query GetActiveCustomer {
        activeCustomer {
            ...ActiveCustomer
        }
    }
`, [ActiveCustomerFragment]);

export const SearchProductsQuery = graphql(`
    query SearchProducts($input: SearchInput!) {
        search(input: $input) {
            totalItems
            items {
                ...ProductCard
            }
            facetValues {
                count
                facetValue {
                    id
                    name
                    code
                    facet {
                        id
                        name
                        code
                    }
                }
            }
        }
    }
`, [ProductCardFragment]);

export const GetProductDetailQuery = graphql(`
    query GetProductDetail($slug: String!) {
        product(slug: $slug) {
            ...ProductDetail
        }
    }
`, [ProductDetailFragment]);

export const GetActiveOrderQuery = graphql(`
    query GetActiveOrder {
        activeOrder {
            id
            code
            state
            totalQuantity
            subTotal
            subTotalWithTax
            shipping
            shippingWithTax
            total
            totalWithTax
            currencyCode
            couponCodes
            discounts {
                description
                amountWithTax
            }
            lines {
                id
                productVariant {
                    id
                    name
                    sku
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
                unitPriceWithTax
                quantity
                linePriceWithTax
            }
        }
    }
`);

export const GetActiveOrderForCheckoutQuery = graphql(`
    query GetActiveOrderForCheckout {
        activeOrder {
            id
            code
            state
            totalQuantity
            subTotal
            subTotalWithTax
            shipping
            shippingWithTax
            total
            totalWithTax
            currencyCode
            couponCodes
            customer {
                id
                firstName
                lastName
                emailAddress
                phoneNumber
            }
            shippingAddress {
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                country
                phoneNumber
            }
            billingAddress {
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                country
                phoneNumber
            }
            shippingLines {
                shippingMethod {
                    id
                    name
                    description
                }
                priceWithTax
            }
            discounts {
                description
                amountWithTax
            }
            lines {
                id
                productVariant {
                    id
                    name
                    sku
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
                unitPriceWithTax
                quantity
                linePriceWithTax
            }
        }
    }
`);

export const GetCustomerAddressesQuery = graphql(`
    query GetCustomerAddresses {
        activeCustomer {
            id
            addresses {
                id
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                country {
                    id
                    code
                    name
                }
                phoneNumber
                defaultShippingAddress
                defaultBillingAddress
            }
        }
    }
`);

export const GetEligibleShippingMethodsQuery = graphql(`
    query GetEligibleShippingMethods {
        eligibleShippingMethods {
            id
            name
            code
            description
            priceWithTax
        }
    }
`);

export const GetEligiblePaymentMethodsQuery = graphql(`
    query GetEligiblePaymentMethods {
        eligiblePaymentMethods {
            id
            name
            code
            description
            isEligible
            eligibilityMessage
        }
    }
`);

export const GetAvailableCountriesQuery = graphql(`
    query GetAvailableCountries {
        availableCountries {
            id
            code
            name
        }
    }
`);

export const GetCustomerOrdersQuery = graphql(`
    query GetCustomerOrders($options: OrderListOptions) {
        activeCustomer {
            id
            orders(options: $options) {
                totalItems
                items {
                    id
                    code
                    state
                    totalWithTax
                    currencyCode
                    createdAt
                    updatedAt
                    lines {
                        id
                        productVariant {
                            id
                            name
                            product {
                                id
                                name
                                featuredAsset {
                                    id
                                    preview
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`);

export const GetOrderDetailQuery = graphql(`
    query GetOrderDetail($code: String!) {
        orderByCode(code: $code) {
            id
            code
            state
            active
            createdAt
            updatedAt
            totalQuantity
            subTotal
            subTotalWithTax
            shipping
            shippingWithTax
            total
            totalWithTax
            currencyCode
            customer {
                id
                firstName
                lastName
                emailAddress
            }
            shippingAddress {
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                country
                phoneNumber
            }
            billingAddress {
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                country
                phoneNumber
            }
            shippingLines {
                shippingMethod {
                    id
                    name
                    description
                }
                priceWithTax
            }
            payments {
                id
                method
                amount
                state
                transactionId
                createdAt
            }
            lines {
                id
                productVariant {
                    id
                    name
                    sku
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
                unitPriceWithTax
                quantity
                linePriceWithTax
            }
            discounts {
                description
                amountWithTax
            }
        }
    }
`);

export const GetActiveChannelQuery = graphql(`
    query GetActiveChannel {
        activeChannel {
            id
            code
            defaultLanguageCode
            availableLanguageCodes
            defaultCurrencyCode
            availableCurrencyCodes
        }
    }
`);

export const GetCollectionProductsQuery = graphql(`
    query GetCollectionProducts($slug: String!, $input: SearchInput!) {
        collection(slug: $slug) {
            id
            name
            slug
            description
            featuredAsset {
                id
                preview
            }
            parent {
                id
                name
                slug
            }
            children {
                id
                name
                slug
                productVariantCount
            }
        }
        search(input: $input) {
            totalItems
            items {
                ...ProductCard
            }
            facetValues {
                count
                facetValue {
                    id
                    name
                    code
                    facet {
                        id
                        name
                        code
                    }
                }
            }
        }
    }
`, [ProductCardFragment]);

export const GetActiveCustomerWishlistQuery = graphql(`
    query GetActiveCustomerWishlist {
        activeCustomerWishlist {
            ...WishlistItem
        }
    }
`, [WishlistItemFragment]);
