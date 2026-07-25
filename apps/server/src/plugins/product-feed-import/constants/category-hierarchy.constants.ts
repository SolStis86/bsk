import { CATEGORY_TAG_TO_PARENT_COLLECTION } from './category-collection-mapping.constants';
import {
    normalizeCollectionLabel,
    PARENT_COLLECTION_NAMES,
    parentCollectionSlug,
    type ParentCollectionName,
} from './taxonomy.constants';

const PARENT_COLLECTION_BY_NORMALIZED_LABEL = new Map<string, ParentCollectionName>(
    PARENT_COLLECTION_NAMES.map(name => [normalizeCollectionLabel(name), name]),
);

export interface CategoryTagDefinition {
    tag: string;
    collectionName: ParentCollectionName;
    collectionSlug: string;
}

export interface CategoryCollectionGroup {
    name: ParentCollectionName;
    slug: string;
    categories: CategoryTagDefinition[];
}

export function resolveParentCollectionForCategoryTag(tag: string): ParentCollectionName | null {
    if (!tag?.trim()) {
        return null;
    }

    const directMatch = PARENT_COLLECTION_BY_NORMALIZED_LABEL.get(normalizeCollectionLabel(tag));
    if (directMatch) {
        return directMatch;
    }

    const mapped = CATEGORY_TAG_TO_PARENT_COLLECTION[tag];
    if (!mapped) {
        return null;
    }

    return PARENT_COLLECTION_BY_NORMALIZED_LABEL.get(normalizeCollectionLabel(mapped)) ?? null;
}

/** Static catalogue hierarchy: collections grouped with their category tags. */
export function buildStaticCategoryHierarchy(): CategoryCollectionGroup[] {
    const tagsByCollection = new Map<ParentCollectionName, Set<string>>();

    for (const collectionName of PARENT_COLLECTION_NAMES) {
        tagsByCollection.set(collectionName, new Set([collectionName]));
    }

    for (const [tag, parentName] of Object.entries(CATEGORY_TAG_TO_PARENT_COLLECTION)) {
        const collectionName = PARENT_COLLECTION_BY_NORMALIZED_LABEL.get(
            normalizeCollectionLabel(parentName),
        );
        if (collectionName) {
            tagsByCollection.get(collectionName)?.add(tag);
        }
    }

    return PARENT_COLLECTION_NAMES.map(collectionName => {
        const tags = [...(tagsByCollection.get(collectionName) ?? [])].sort((a, b) =>
            a.localeCompare(b),
        );

        return {
            name: collectionName,
            slug: parentCollectionSlug(collectionName),
            categories: tags.map(tag => ({
                tag,
                collectionName,
                collectionSlug: parentCollectionSlug(collectionName),
            })),
        };
    });
}

export function allStaticCategoryTags(): string[] {
    const tags = new Set<string>();
    for (const group of buildStaticCategoryHierarchy()) {
        for (const category of group.categories) {
            tags.add(category.tag);
        }
    }
    return [...tags];
}

export function expandCollectionSlugsToCategoryTags(collectionSlugs: string[]): string[] {
    const slugSet = new Set(collectionSlugs);
    const tags = new Set<string>();

    for (const group of buildStaticCategoryHierarchy()) {
        if (slugSet.has(group.slug)) {
            for (const category of group.categories) {
                tags.add(category.tag);
            }
        }
    }

    return [...tags];
}

export function assignCategoryTagToGroup(
    groups: CategoryCollectionGroup[],
    tag: string,
): CategoryCollectionGroup[] {
    const collectionName = resolveParentCollectionForCategoryTag(tag);
    if (!collectionName) {
        return groups;
    }

    return groups.map(group => {
        if (group.name !== collectionName) {
            return group;
        }

        if (group.categories.some(category => category.tag === tag)) {
            return group;
        }

        return {
            ...group,
            categories: [
                ...group.categories,
                {
                    tag,
                    collectionName,
                    collectionSlug: group.slug,
                },
            ].sort((a, b) => a.tag.localeCompare(b.tag)),
        };
    });
}

export function mergeCategoryTagsIntoHierarchy(tags: string[]): CategoryCollectionGroup[] {
    return tags.reduce(
        (groups, tag) => assignCategoryTagToGroup(groups, tag),
        buildStaticCategoryHierarchy(),
    );
}
