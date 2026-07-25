declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductFields {
        sourceProductCode: string;
        materials: string;
        power: string;
        sizeImperial: string;
        lastSeenInFeedAt: Date | null;
    }

    interface CustomProductVariantFields {
        sourceUniqueId: string;
        tradePrice: number;
        barcode: string;
        mpn: string;
        weight: number;
        lastSeenInFeedAt: Date | null;
    }

    interface CustomCollectionFields {
        showInMainNav: boolean;
        navSortOrder: number;
        navHighlight: boolean;
    }

    interface CustomGlobalSettingsFields {
        enabledParentCategorySlugs: string;
        enabledCategoryTags: string;
    }
}
