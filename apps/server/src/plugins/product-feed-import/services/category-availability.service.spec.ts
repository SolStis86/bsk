import { describe, expect, it, vi } from 'vitest';

import { allStaticCategoryTags } from '../constants/category-hierarchy.constants';
import { CategoryAvailabilityService } from './category-availability.service';

describe('CategoryAvailabilityService', () => {
    const service = new CategoryAvailabilityService(
        {
            getSettings: vi.fn().mockResolvedValue({ customFields: {} }),
            updateSettings: vi.fn(),
        } as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        { revalidateCatalogCaches: vi.fn().mockResolvedValue(undefined) } as never,
    );

    it('enables products only when all category tags are enabled', () => {
        expect(service.isProductEnabled(['Butt Plugs', 'New In'], ['Butt Plugs', 'New In'])).toBe(true);
        expect(service.isProductEnabled(["Men's Sexy Underwear", 'Offers'], ['Offers'])).toBe(false);
        expect(service.isProductEnabled(['Butt Plugs'], ['Vibrators'])).toBe(false);
    });

    it('disables tagged products when any of their categories is disabled', () => {
        expect(service.isProductEnabled(["Men's Sexy Underwear"], ['Offers'])).toBe(false);
    });

    it('treats all category tags as enabled when settings are missing', async () => {
        const tags = await service.getEnabledTags({} as never);
        expect(tags).toEqual(allStaticCategoryTags());
    });
});
