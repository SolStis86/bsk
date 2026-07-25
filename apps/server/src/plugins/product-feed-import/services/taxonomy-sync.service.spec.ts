import { describe, expect, it, vi } from 'vitest';

import { LanguageCode } from '@vendure/core';

import { FACET_BRAND } from '../constants/taxonomy.constants';
import { TaxonomySyncService } from './taxonomy-sync.service';

describe('TaxonomySyncService', () => {
    it('find-or-creates facet values using cache', async () => {
        const facetValueService = {
            findByFacetId: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({ id: 'fv-1', name: 'Nasstoys' }),
        };
        const facetService = {
            findByCode: vi.fn().mockResolvedValue({ id: 'f-1', code: FACET_BRAND.code }),
        };

        const service = new TaxonomySyncService(
            {} as never,
            facetService as never,
            facetValueService as never,
            {} as never,
        );

        const ctx = { languageCode: LanguageCode.en } as never;
        const ids = await service.resolveFacetValueIds(ctx, {
            brand: 'Nasstoys',
            categoryTags: [],
        });

        expect(ids).toEqual(['fv-1']);
        expect(facetValueService.create).toHaveBeenCalledOnce();
    });
});
