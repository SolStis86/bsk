import gql from 'graphql-tag';

export const adminApiExtensions = gql`
    enum ProfitCalculationVatMode {
        net
        gross
    }

    type VariantEconomics {
        variantId: ID!
        sku: String!
        supplierProviderCode: String!
        vatMode: ProfitCalculationVatMode!
        vatRatePercent: Float!
        pricesIncludeTax: Boolean!
        rrpIncVatMinor: Int!
        rrpExVatMinor: Int!
        tradePriceExVatMinor: Int!
        tradePriceIncVatMinor: Int!
        unitMarginExVatMinor: Int!
        unitMarginIncVatMinor: Int!
        marginPercent: Float!
    }

    type SupplierShippingRule {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        code: String!
        name: String!
        costExVat: Float!
        isDefault: Boolean!
        sortOrder: Int!
        customerShippingMethodCode: String
    }

    type ProductSupplierProvider {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        code: String!
        name: String!
        tradePriceIncludesVat: Boolean!
        defaultVatRatePercent: Float!
        active: Boolean!
        shippingRules: [SupplierShippingRule!]!
    }

    input UpdateProductSupplierProviderInput {
        id: ID!
        name: String
        tradePriceIncludesVat: Boolean
        defaultVatRatePercent: Float
        active: Boolean
    }

    input UpsertSupplierShippingRuleInput {
        id: ID
        providerId: ID!
        code: String!
        name: String!
        costExVat: Float!
        isDefault: Boolean
        sortOrder: Int
        customerShippingMethodCode: String
    }

    extend type Query {
        variantEconomics(variantId: ID!): VariantEconomics
        productSupplierProviders: [ProductSupplierProvider!]!
    }

    extend type Mutation {
        updateProductSupplierProvider(input: UpdateProductSupplierProviderInput!): ProductSupplierProvider!
        upsertSupplierShippingRule(input: UpsertSupplierShippingRuleInput!): SupplierShippingRule!
        deleteSupplierShippingRule(id: ID!): Boolean!
    }
`;
