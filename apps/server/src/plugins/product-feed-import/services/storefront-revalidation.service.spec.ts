import { describe, expect, it, vi } from 'vitest';

import { defaultProductFeedImportPluginOptions } from '../test/plugin-options.fixture';
import { StorefrontRevalidationService } from './storefront-revalidation.service';

describe('StorefrontRevalidationService', () => {
    it('posts broad cache tags with bearer auth', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => '',
        });
        vi.stubGlobal('fetch', fetchMock);

        const service = new StorefrontRevalidationService(defaultProductFeedImportPluginOptions);
        await service.revalidateCatalogCaches();

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3001/api/revalidate',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-secret',
                }),
            }),
        );

        const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
        expect(body.tags).toEqual([
            'collections',
            'navbar-collections',
            'mobile-nav',
            'homepage-categories',
            'featured',
            'products',
        ]);

        vi.unstubAllGlobals();
    });

    it('posts navigation cache tags when collections change in admin', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => '',
        });
        vi.stubGlobal('fetch', fetchMock);

        const service = new StorefrontRevalidationService(defaultProductFeedImportPluginOptions);
        await service.revalidateNavigationCaches();

        const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
        expect(body.tags).toEqual([
            'collections',
            'navbar-collections',
            'mobile-nav',
            'homepage-categories',
        ]);

        vi.unstubAllGlobals();
    });

    it('skips revalidation when secret is missing', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const service = new StorefrontRevalidationService({
            ...defaultProductFeedImportPluginOptions,
            revalidationSecret: '',
        });
        await service.revalidateCatalogCaches();

        expect(fetchMock).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });
});
