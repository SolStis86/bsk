import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const vendureAssetHostname = process.env.VENDURE_ASSET_HOSTNAME;

const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'),
    cacheComponents: true,
    images: {
        // This is necessary to display images from your local Vendure instance
        dangerouslyAllowLocalIP: true,
        remotePatterns: [
            {
                hostname: 'readonlydemo.vendure.io',
            },
            {
                hostname: 'demo.vendure.io'
            },
            {
                hostname: 'localhost'
            },
            ...(vendureAssetHostname ? [{hostname: vendureAssetHostname}] : []),
        ],
    },
    experimental: {
        rootParams: true
    }
};

export default withNextIntl(nextConfig);
