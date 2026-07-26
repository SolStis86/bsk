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
import { ProductFeedImportPlugin } from '../product-feed-import.plugin';
import { ProductFeedImportService } from '../services/product-feed-import.service';
import { defaultProductFeedImportPluginOptions } from '../test/plugin-options.fixture';
import { e2eInitialData } from './fixtures/e2e-initial-data';

const sqliteDataDir = path.join(__dirname, '__data-catalog-sync-v2');
const fixturesDir = path.join(__dirname, '../__fixtures__');

registerInitializer('sqljs', new SqljsInitializer(sqliteDataDir));

function combineCsvFixtures(...files: string[]): Buffer {
    const parts = files.map((file, index) => {
        const content = fs.readFileSync(path.join(fixturesDir, file)).toString('latin1');
        return index === 0 ? content.trim() : content.split('\n').slice(1).join('\n');
    });
    return Buffer.from(parts.join('\n'), 'latin1');
}

describe('ProductFeedImport catalog sync e2e', () => {
    const { server, adminClient } = createTestEnvironment(
        mergeConfig(testConfig, {
            apiOptions: {
                port: 3052,
            },
            paymentOptions: {
                paymentMethodHandlers: [dummyPaymentHandler],
            },
            customFields: productFeedCustomFields,
            plugins: [ProductFeedImportPlugin.init(defaultProductFeedImportPluginOptions)],
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

    it('imports fixture products into Vendure', async () => {
        const singleVariant = fs.readFileSync(path.join(fixturesDir, 'single-variant.csv'));

        const importService = server.app.get(ProductFeedImportService);
        const requestContextService = server.app.get(RequestContextService);
        const ctx = await requestContextService.create({ apiType: 'admin' });

        const result = await importService.importFromBuffer(ctx, singleVariant, {
            skipAssets: true,
            deferAssets: false,
        });

        expect(result.errors).toEqual([]);
        expect(result.productsCreated).toBe(1);
        expect(result.variantsCreated).toBe(1);

        const products = await adminClient.query(gql`
            query ImportedProducts {
                products(options: { take: 20 }) {
                    totalItems
                    items {
                        slug
                        customFields {
                            sourceProductCode
                        }
                        variants {
                            sku
                            stockOnHand
                        }
                        facetValues {
                            name
                            facet {
                                code
                            }
                        }
                    }
                }
            }
        `);

        expect(products.products.totalItems).toBe(1);

        const n8440 = products.products.items[0];
        expect(n8440.customFields.sourceProductCode).toBe('N8440');
        expect(n8440.variants).toHaveLength(1);

        const bodyFit = n8440.facetValues.find(
            (fv: { facet: { code: string } }) => fv.facet.code === 'body-fit',
        );
        expect(bodyFit?.name).toBe('32cm length');

        const collections = await adminClient.query(gql`
            query ImportedCollections {
                collections(options: { take: 50 }) {
                    items {
                        slug
                        parent {
                            slug
                        }
                    }
                }
            }
        `);

        const slugs = collections.collections.items.map((c: { slug: string }) => c.slug);
        expect(slugs).toContain('anal-toys');
        expect(slugs).toContain('anal-toys-anal-beads');
    });

    it('registers importProductFeed admin mutation', async () => {
        const result = await adminClient.query(gql`
            query ImportMutationField {
                __type(name: "Mutation") {
                    fields {
                        name
                    }
                }
            }
        `);

        const fieldNames = result.__type.fields.map((f: { name: string }) => f.name);
        expect(fieldNames).toContain('importProductFeed');
    });

    it('disables variants missing from a subsequent full import', async () => {
        const combined = combineCsvFixtures('single-variant.csv', 'multi-variant-flavour.csv');

        const importService = server.app.get(ProductFeedImportService);
        const requestContextService = server.app.get(RequestContextService);
        const ctx = await requestContextService.create({ apiType: 'admin' });

        await importService.importFromBuffer(ctx, combined, {
            skipAssets: true,
            deferAssets: false,
        });

        const subsetOnly = fs.readFileSync(path.join(fixturesDir, 'single-variant.csv'));
        await importService.importFromBuffer(ctx, subsetOnly, {
            skipAssets: true,
            deferAssets: false,
        });

        const products = await adminClient.query(gql`
            query DisabledVariants {
                products(options: { take: 20 }) {
                    items {
                        enabled
                        variants {
                            sku
                            enabled
                        }
                    }
                }
            }
        `);

        const allVariants = products.products.items.flatMap(
            (product: { variants: Array<{ sku: string; enabled: boolean }> }) => product.variants,
        );
        const disabledSkus = allVariants.filter(v => !v.enabled).map(v => v.sku);
        expect(disabledSkus.length).toBeGreaterThan(0);
        expect(allVariants.some((v: { sku: string }) => v.sku === 'N8440' && v.enabled)).toBe(true);
    });
});
