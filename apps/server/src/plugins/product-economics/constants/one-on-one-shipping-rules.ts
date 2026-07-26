/**
 * 1on1 wholesale dropship shipping tiers (ex VAT).
 * Used for supplier cost estimates in profit snapshots.
 */
export type OneOnOneShippingRuleDefinition = {
    code: string;
    name: string;
    costExVat: number;
    isDefault: boolean;
    sortOrder: number;
    customerShippingMethodCode: string;
    description: string;
};

export const ONE_ON_ONE_SHIPPING_RULES: readonly OneOnOneShippingRuleDefinition[] = [
    {
        code: 'evri_standard',
        name: 'Evri Standard Delivery',
        costExVat: 3.4,
        isDefault: true,
        sortOrder: 0,
        customerShippingMethodCode: 'evri-standard',
        description: 'Expected to take between 2-3 working days to arrive.',
    },
    {
        code: 'evri_express',
        name: 'Evri Express Delivery',
        costExVat: 4.13,
        isDefault: false,
        sortOrder: 1,
        customerShippingMethodCode: 'evri-express',
        description: 'Expected to arrive within 1-2 days including Saturdays.',
    },
    {
        code: 'dhl_express',
        name: 'DHL Express Delivery',
        costExVat: 4.95,
        isDefault: false,
        sortOrder: 2,
        customerShippingMethodCode: 'dhl-express',
        description: 'Expected to arrive the following day.',
    },
    {
        code: 'europe',
        name: 'European dropship delivery',
        costExVat: 15.3,
        isDefault: false,
        sortOrder: 3,
        customerShippingMethodCode: 'europe-dropship',
        description: 'Delivered within 3-10 working days. Items over 2kg may incur extra charges.',
    },
    {
        code: 'rest_of_world',
        name: 'Rest of World dropship delivery',
        costExVat: 25.4,
        isDefault: false,
        sortOrder: 4,
        customerShippingMethodCode: 'row-dropship',
        description: 'Usually takes between 7-10 working days. Items over 1.5kg may incur extra charges.',
    },
    {
        code: 'us',
        name: 'US dropship delivery',
        costExVat: 26.0,
        isDefault: false,
        sortOrder: 5,
        customerShippingMethodCode: 'us-dropship',
        description: 'Usually takes between 7-10 working days.',
    },
] as const;

export const ONE_ON_ONE_SHIPPING_RULE_CODES = ONE_ON_ONE_SHIPPING_RULES.map(rule => rule.code);
