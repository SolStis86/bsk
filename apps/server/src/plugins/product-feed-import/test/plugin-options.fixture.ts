import { PluginInitOptions } from '../types';

export const defaultProductFeedImportPluginOptions: PluginInitOptions = {
    feedUrl: 'https://example.com/feed.csv',
    imageZipUrl: 'https://example.com/images.zip',
    importCron: '0 2 * * *',
    disableMissingFromFeed: true,
    devImportLimit: 0,
    providerCode: '1on1',
    storefrontUrl: 'http://localhost:3001',
    revalidationSecret: 'test-secret',
    scheduleEnabled: false,
    assetQueueEnabled: false,
    staleImportThresholdHours: 36,
};
