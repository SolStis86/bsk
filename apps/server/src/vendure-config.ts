import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { productFeedCustomFields } from './custom-fields';
import './custom-fields.types';
import { ProductFeedImportPlugin } from './plugins/product-feed-import/product-feed-import.plugin';
import { StockFeedSyncPlugin } from './plugins/stock-feed-sync/stock-feed-sync.plugin';
import { WishlistPlugin } from './plugins/wishlist/wishlist.plugin';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;
const storefrontUrl = process.env.STOREFRONT_URL ?? 'http://localhost:3001';
const storefrontDefaultLocale = process.env.STOREFRONT_DEFAULT_LOCALE ?? 'en';

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: productFeedCustomFields,
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: IS_DEV ? undefined : 'https://www.my-shop.com/assets/',
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: '"Buy Some Knickers" <noreply@example.com>',
                verifyEmailAddressUrl: `${storefrontUrl}/${storefrontDefaultLocale}/verify`,
                passwordResetUrl: `${storefrontUrl}/${storefrontDefaultLocale}/reset-password`,
                changeEmailAddressUrl: `${storefrontUrl}/${storefrontDefaultLocale}/account/verify-email`,
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
        ProductFeedImportPlugin.init({
            feedUrl:
                process.env.PRODUCT_FEED_URL ??
                'https://www.1on1wholesale.co.uk/API/product/export/?type=1',
            imageZipUrl:
                process.env.PRODUCT_FEED_IMAGE_ZIP_URL ??
                'https://www.1on1wholesale.co.uk/API/product/export/images/images.zip',
            importCron: process.env.PRODUCT_FEED_CRON ?? '0 2 * * *',
            disableMissingFromFeed: true,
            devImportLimit: +(process.env.PRODUCT_FEED_DEV_IMPORT_LIMIT ?? 0),
            storefrontUrl: process.env.STOREFRONT_URL ?? 'http://localhost:3001',
            revalidationSecret: process.env.REVALIDATION_SECRET ?? '',
            scheduleEnabled: process.env.PRODUCT_FEED_SCHEDULE_ENABLED !== 'false' && !IS_DEV,
            assetQueueEnabled: process.env.PRODUCT_FEED_ASSET_QUEUE_ENABLED !== 'false',
            staleImportThresholdHours: +(process.env.PRODUCT_FEED_STALE_HOURS ?? 36),
        }),
        StockFeedSyncPlugin.init({
            feedUrl:
                process.env.STOCK_FEED_URL ??
                'https://www.1on1wholesale.co.uk/API/product/export/stock/',
            syncCron: process.env.STOCK_FEED_CRON ?? '*/5 * * * *',
            scheduleEnabled: process.env.STOCK_FEED_SCHEDULE_ENABLED !== 'false' && !IS_DEV,
            devSyncLimit: +(process.env.STOCK_FEED_DEV_SYNC_LIMIT ?? 0),
        }),
        WishlistPlugin,
    ],
};
