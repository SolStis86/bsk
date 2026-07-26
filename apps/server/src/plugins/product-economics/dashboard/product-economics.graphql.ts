import { graphql } from '@/vdb/graphql/graphql.js';

export const variantEconomicsDocument = graphql(`
    query VariantEconomics($variantId: ID!) {
        variantEconomics(variantId: $variantId) {
            variantId
            sku
            supplierProviderCode
            vatMode
            vatRatePercent
            pricesIncludeTax
            rrpIncVatMinor
            rrpExVatMinor
            tradePriceExVatMinor
            tradePriceIncVatMinor
            unitMarginExVatMinor
            unitMarginIncVatMinor
            marginPercent
        }
    }
`);

export const productSupplierProvidersDocument = graphql(`
    query ProductSupplierProviders {
        productSupplierProviders {
            id
            code
            name
            tradePriceIncludesVat
            defaultVatRatePercent
            active
            shippingRules {
                id
                code
                name
                costExVat
                isDefault
                sortOrder
                customerShippingMethodCode
            }
        }
    }
`);

export const updateProductSupplierProviderDocument = graphql(`
    mutation UpdateProductSupplierProvider($input: UpdateProductSupplierProviderInput!) {
        updateProductSupplierProvider(input: $input) {
            id
            name
            tradePriceIncludesVat
            defaultVatRatePercent
            active
        }
    }
`);

export const upsertSupplierShippingRuleDocument = graphql(`
    mutation UpsertSupplierShippingRule($input: UpsertSupplierShippingRuleInput!) {
        upsertSupplierShippingRule(input: $input) {
            id
            code
            name
            costExVat
            isDefault
            sortOrder
            customerShippingMethodCode
        }
    }
`);

export const deleteSupplierShippingRuleDocument = graphql(`
    mutation DeleteSupplierShippingRule($id: ID!) {
        deleteSupplierShippingRule(id: $id)
    }
`);
