import path from 'path';

import gql from 'graphql-tag';
import {
    createTestEnvironment,
    registerInitializer,
    SqljsInitializer,
    testConfig,
} from '@vendure/testing';
import { dummyPaymentHandler, mergeConfig } from '@vendure/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ProductFeedImportPlugin } from '../product-feed-import.plugin';
import { e2eInitialData } from './fixtures/e2e-initial-data';

const sqliteDataDir = path.join(__dirname, '__data-product-feed-import');
registerInitializer('sqljs', new SqljsInitializer(sqliteDataDir));

describe('ProductFeedImportPlugin e2e', () => {
    const { server, adminClient } = createTestEnvironment(
        mergeConfig(testConfig, {
            apiOptions: {
                port: 3051,
            },
            paymentOptions: {
                paymentMethodHandlers: [dummyPaymentHandler],
            },
            plugins: [
                ProductFeedImportPlugin.init({
                    feedUrl: 'https://www.1on1wholesale.co.uk/API/product/export/?type=1',
                    imageZipUrl:
                        'https://www.1on1wholesale.co.uk/API/product/export/images/images.zip',
                    importCron: '0 2 * * *',
                    disableMissingFromFeed: true,
                    devImportLimit: 0,
                }),
            ],
        }),
    );

    beforeAll(async () => {
        await server.init({
            initialData: e2eInitialData,
            customerCount: 0,
        });
        await adminClient.asSuperAdmin();
    }, 60_000);

    afterAll(async () => {
        await server.destroy();
    });

    it('seeds product feed taxonomy facets on bootstrap', async () => {
        const result = await adminClient.query(gql`
            query ProductFeedFacets {
                facets(options: { take: 50 }) {
                    items {
                        code
                        name
                    }
                }
            }
        `);

        const codes = result.facets.items.map((f: { code: string }) => f.code);
        expect(codes).toContain('brand');
        expect(codes).toContain('body-fit');
        expect(codes).toContain('category');
    });
});
