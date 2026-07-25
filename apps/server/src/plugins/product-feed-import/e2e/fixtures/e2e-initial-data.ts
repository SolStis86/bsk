import { InitialData, LanguageCode } from '@vendure/core';

export const e2eInitialData: InitialData = {
    defaultLanguage: LanguageCode.en,
    defaultZone: 'Europe',
    countries: [{ name: 'United Kingdom', code: 'GB', zone: 'Europe' }],
    taxRates: [{ name: 'Standard Tax', percentage: 20 }],
    shippingMethods: [{ name: 'Standard Shipping', price: 500 }],
    paymentMethods: [
        {
            name: 'Standard Payment',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'false' }],
            },
        },
    ],
    collections: [],
};
