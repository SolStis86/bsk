import { CustomFields, LanguageCode } from '@vendure/core';

/**
 * Product feed import custom fields — defined in VendureConfig per
 * https://docs.vendure.io/current/core/developer-guide/custom-fields
 */
export const productFeedCustomFields: CustomFields = {
    Product: [
        {
            name: 'sourceProductCode',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Source product code' }],
            readonly: true,
        },
        {
            name: 'materials',
            type: 'string',
            public: true,
            label: [{ languageCode: LanguageCode.en, value: 'Materials' }],
        },
        {
            name: 'power',
            type: 'string',
            public: true,
            label: [{ languageCode: LanguageCode.en, value: 'Power' }],
        },
        {
            name: 'sizeImperial',
            type: 'string',
            public: true,
            label: [{ languageCode: LanguageCode.en, value: 'Size (imperial)' }],
        },
        {
            name: 'lastSeenInFeedAt',
            type: 'datetime',
            label: [{ languageCode: LanguageCode.en, value: 'Last seen in feed' }],
            readonly: true,
        },
        {
            name: 'supplierProviderCode',
            type: 'string',
            defaultValue: '1on1',
            readonly: true,
            label: [{ languageCode: LanguageCode.en, value: 'Supplier provider code' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Wholesale provider used for trade cost and shipping estimates.',
                },
            ],
        },
    ],
    ProductVariant: [
        {
            name: 'sourceUniqueId',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Source unique ID' }],
            readonly: true,
        },
        {
            name: 'tradePrice',
            type: 'float',
            label: [{ languageCode: LanguageCode.en, value: 'Trade price (ex VAT)' }],
            readonly: true,
        },
        {
            name: 'barcode',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Barcode' }],
        },
        {
            name: 'mpn',
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'MPN' }],
        },
        {
            name: 'weight',
            type: 'float',
            label: [{ languageCode: LanguageCode.en, value: 'Weight (kg)' }],
        },
        {
            name: 'lastSeenInFeedAt',
            type: 'datetime',
            label: [{ languageCode: LanguageCode.en, value: 'Last seen in feed' }],
            readonly: true,
        },
    ],
    Collection: [
        {
            name: 'showInMainNav',
            type: 'boolean',
            defaultValue: false,
            public: true,
            label: [{ languageCode: LanguageCode.en, value: 'Show in main navigation' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Include this collection in the storefront header and mobile menu.',
                },
            ],
        },
        {
            name: 'navSortOrder',
            type: 'int',
            defaultValue: 0,
            public: true,
            label: [{ languageCode: LanguageCode.en, value: 'Navigation sort order' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Lower numbers appear first in the main navigation.',
                },
            ],
        },
        {
            name: 'navHighlight',
            type: 'boolean',
            defaultValue: false,
            public: true,
            label: [{ languageCode: LanguageCode.en, value: 'Highlight in navigation' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Apply accent styling in the main navigation (e.g. for Offers).',
                },
            ],
        },
    ],
    GlobalSettings: [
        {
            name: 'enabledParentCategorySlugs',
            type: 'text',
            label: [{ languageCode: LanguageCode.en, value: 'Enabled parent category slugs (legacy)' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Deprecated — use enabledCategoryTags. Kept for backward compatibility.',
                },
            ],
        },
        {
            name: 'enabledCategoryTags',
            type: 'text',
            label: [{ languageCode: LanguageCode.en, value: 'Enabled category tags' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'JSON array of enabled feed category tags (all_cats). Managed via Settings → Product categories.',
                },
            ],
        },
        {
            name: 'profitCalculationVatMode',
            type: 'string',
            defaultValue: 'net',
            label: [{ languageCode: LanguageCode.en, value: 'Profit calculation VAT mode' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Use "net" when VAT registered (compare ex-VAT revenue vs cost). Use "gross" when not registered.',
                },
            ],
        },
    ],
    Order: [
        {
            name: 'profitSnapshot',
            type: 'text',
            readonly: true,
            label: [{ languageCode: LanguageCode.en, value: 'Profit snapshot' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Estimated order profitability captured when payment settles.',
                },
            ],
        },
    ],
};
