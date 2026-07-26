import fs from 'fs';
import path from 'path';

import gql from 'graphql-tag';
import {
    createTestEnvironment,
    registerInitializer,
    SqljsInitializer,
    testConfig,
} from '@vendure/testing';
import { InitialData, dummyPaymentHandler, mergeConfig, RequestContextService } from '@vendure/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { productFeedCustomFields } from '../../../custom-fields';
import '../../../custom-fields.types';
import { e2eInitialData } from '../../product-feed-import/e2e/fixtures/e2e-initial-data';
import { ProductFeedImportPlugin } from '../../product-feed-import/product-feed-import.plugin';
import { ProductFeedImportService } from '../../product-feed-import/services/product-feed-import.service';
import { defaultProductFeedImportPluginOptions } from '../../product-feed-import/test/plugin-options.fixture';
import { ProductEconomicsPlugin } from '../product-economics.plugin';
import { defaultProductEconomicsPluginOptions } from '../test/plugin-options.fixture';

const sqliteDataDir = path.join(__dirname, '__data-product-economics-v3');
const productFixturesDir = path.join(__dirname, '../../product-feed-import/__fixtures__');

registerInitializer('sqljs', new SqljsInitializer(sqliteDataDir));

const productEconomicsInitialData: InitialData = {
    ...e2eInitialData,
    paymentMethods: [
        {
            name: 'Standard Payment',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'true' }],
            },
        },
    ],
};

describe('ProductEconomics e2e', () => {
    const { server, adminClient } = createTestEnvironment(
        mergeConfig(testConfig, {
            apiOptions: {
                port: 3054,
            },
            paymentOptions: {
                paymentMethodHandlers: [dummyPaymentHandler],
            },
            customFields: productFeedCustomFields,
            plugins: [
                ProductFeedImportPlugin.init(defaultProductFeedImportPluginOptions),
                ProductEconomicsPlugin.init(defaultProductEconomicsPluginOptions),
            ],
        }),
    );

    beforeAll(async () => {
        await server.init({
            initialData: productEconomicsInitialData,
            customerCount: 0,
        });
        await adminClient.asSuperAdmin();
    }, 120_000);

    afterAll(async () => {
        await server.destroy();
    });

    async function importAndPrepareVariant() {
        const singleVariant = fs.readFileSync(path.join(productFixturesDir, 'single-variant.csv'));
        const productImportService = server.app.get(ProductFeedImportService);
        const requestContextService = server.app.get(RequestContextService);
        const ctx = await requestContextService.create({ apiType: 'admin' });

        const importResult = await productImportService.importFromBuffer(ctx, singleVariant, {
            skipAssets: true,
            deferAssets: false,
        });

        expect(importResult.errors).toEqual([]);

        const variantResult = await adminClient.query(gql`
            query ImportedVariant {
                productVariants(options: { filter: { sku: { eq: "N8440" } } }) {
                    items {
                        id
                        product {
                            id
                        }
                    }
                }
            }
        `);
        const variant = variantResult.productVariants.items[0];

        await adminClient.query(
            gql`
                mutation EnableProduct($input: UpdateProductInput!) {
                    updateProduct(input: $input) {
                        id
                    }
                }
            `,
            { input: { id: variant.product.id, enabled: true } },
        );

        await adminClient.query(
            gql`
                mutation EnableVariant($input: [UpdateProductVariantInput!]!) {
                    updateProductVariants(input: $input) {
                        id
                    }
                }
            `,
            { input: [{ id: variant.id, enabled: true, price: 699 }] },
        );

        return variant.id as string;
    }

    it('imports a product and returns expected variant economics', async () => {
        const variantId = await importAndPrepareVariant();

        const economicsResult = await adminClient.query(
            gql`
                query VariantEconomics($variantId: ID!) {
                    variantEconomics(variantId: $variantId) {
                        sku
                        supplierProviderCode
                        rrpIncVatMinor
                        rrpExVatMinor
                        tradePriceExVatMinor
                        unitMarginExVatMinor
                        marginPercent
                    }
                }
            `,
            { variantId },
        );

        const economics = economicsResult.variantEconomics;
        expect(economics.sku).toBe('N8440');
        expect(economics.supplierProviderCode).toBe('1on1');
        expect(economics.rrpIncVatMinor).toBe(699);
        expect(economics.tradePriceExVatMinor).toBe(280);
        expect(economics.unitMarginExVatMinor).toBe(303);
        expect(economics.marginPercent).toBeCloseTo(52, 0);
    });

    it('seeds the 1on1 provider and shipping rules', async () => {
        const result = await adminClient.query(gql`
            query ProductSupplierProviders {
                productSupplierProviders {
                    code
                    name
                    shippingRules {
                        code
                        costExVat
                        isDefault
                    }
                }
            }
        `);

        const provider = result.productSupplierProviders.find(
            (entry: { code: string }) => entry.code === '1on1',
        );
        expect(provider).toBeDefined();
        expect(provider.shippingRules).toHaveLength(3);
        expect(provider.shippingRules.find((rule: { code: string }) => rule.code === 'tracked')?.isDefault).toBe(
            true,
        );
    });
});
