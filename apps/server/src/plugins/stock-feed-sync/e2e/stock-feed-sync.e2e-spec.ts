import fs from 'fs';
import path from 'path';

import gql from 'graphql-tag';
import {
    createTestEnvironment,
    registerInitializer,
    SqljsInitializer,
    testConfig,
} from '@vendure/testing';
import { dummyPaymentHandler, mergeConfig, RequestContextService } from '@vendure/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { productFeedCustomFields } from '../../../custom-fields';
import '../../../custom-fields.types';
import { ProductFeedImportPlugin } from '../../product-feed-import/product-feed-import.plugin';
import { ProductFeedImportService } from '../../product-feed-import/services/product-feed-import.service';
import { defaultProductFeedImportPluginOptions } from '../../product-feed-import/test/plugin-options.fixture';
import { e2eInitialData } from '../../product-feed-import/e2e/fixtures/e2e-initial-data';
import { StockFeedSyncPlugin } from '../stock-feed-sync.plugin';
import { StockFeedSyncService } from '../services/stock-feed-sync.service';
import { defaultStockFeedSyncPluginOptions } from '../test/plugin-options.fixture';

const sqliteDataDir = path.join(__dirname, '__data-stock-feed-sync-v2');
const productFixturesDir = path.join(__dirname, '../../product-feed-import/__fixtures__');
const stockFixturesDir = path.join(__dirname, '../__fixtures__');

registerInitializer('sqljs', new SqljsInitializer(sqliteDataDir));

describe('StockFeedSync e2e', () => {
    const { server, adminClient } = createTestEnvironment(
        mergeConfig(testConfig, {
            apiOptions: {
                port: 3053,
            },
            paymentOptions: {
                paymentMethodHandlers: [dummyPaymentHandler],
            },
            customFields: productFeedCustomFields,
            plugins: [
                ProductFeedImportPlugin.init(defaultProductFeedImportPluginOptions),
                StockFeedSyncPlugin.init(defaultStockFeedSyncPluginOptions),
            ],
        }),
    );

    beforeAll(async () => {
        await server.init({
            initialData: e2eInitialData,
            customerCount: 0,
        });
        await adminClient.asSuperAdmin();
    }, 120_000);

    afterAll(async () => {
        await server.destroy();
    });

    it('updates variant stock from stock feed fixture', async () => {
        const singleVariant = fs.readFileSync(path.join(productFixturesDir, 'single-variant.csv'));

        const productImportService = server.app.get(ProductFeedImportService);
        const stockSyncService = server.app.get(StockFeedSyncService);
        const requestContextService = server.app.get(RequestContextService);
        const ctx = await requestContextService.create({ apiType: 'admin' });

        await productImportService.importFromBuffer(ctx, singleVariant, {
            skipAssets: true,
            deferAssets: false,
        });

        const before = await adminClient.query(gql`
            query VariantBeforeSync {
                productVariants(options: { filter: { sku: { eq: "N8440" } } }) {
                    items {
                        sku
                        stockOnHand
                    }
                }
            }
        `);

        expect(before.productVariants.items[0].stockOnHand).toBe(303);

        const stockFixture = path.join(stockFixturesDir, 'stock-feed.csv');
        const syncResult = await stockSyncService.runSync(ctx, 'e2e-run', {
            fixturePath: stockFixture,
        });

        expect(syncResult.errors).toEqual([]);
        expect(syncResult.matched).toBeGreaterThanOrEqual(1);

        const after = await adminClient.query(gql`
            query VariantAfterSync {
                productVariants(options: { filter: { sku: { eq: "N8440" } } }) {
                    items {
                        sku
                        stockOnHand
                    }
                }
            }
        `);

        expect(after.productVariants.items[0].stockOnHand).toBe(150);
    });
});
