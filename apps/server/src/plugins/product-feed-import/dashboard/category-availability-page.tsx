import {
    api,
    Button,
    Checkbox,
    Label,
    Page,
    PageBlock,
    PageLayout,
    PageTitle,
    toast,
    useMutation,
    useQuery,
} from '@vendure/dashboard';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    categoryAvailabilityDocument,
    updateCategoryAvailabilityDocument,
} from './category-availability.graphql';

type CategoryTag = {
    tag: string;
    enabled: boolean;
    productCount: number;
};

type CollectionGroup = {
    name: string;
    slug: string;
    productCount: number;
    categories: CategoryTag[];
};

function setsEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    const setA = new Set(a);
    return b.every(value => setA.has(value));
}

export function CategoryAvailabilityPage() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['category-availability'],
        queryFn: () => api.query(categoryAvailabilityDocument),
    });

    const collections: CollectionGroup[] = data?.categoryAvailability ?? [];
    const allTags = useMemo(
        () => collections.flatMap(collection => collection.categories.map(category => category.tag)),
        [collections],
    );

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized && collections.length > 0) {
            const enabled = collections.flatMap(collection =>
                collection.categories.filter(category => category.enabled).map(category => category.tag),
            );
            setSelectedTags(enabled);
            setExpandedCollections([collections[0]?.slug].filter(Boolean));
            setInitialized(true);
        }
    }, [collections, initialized]);

    const savedTags = useMemo(
        () =>
            collections.flatMap(collection =>
                collection.categories.filter(category => category.enabled).map(category => category.tag),
            ),
        [collections],
    );

    const isDirty = !setsEqual(selectedTags, savedTags);

    const { mutate, isPending } = useMutation({
        mutationFn: (enabledTags: string[]) =>
            api.mutate(updateCategoryAvailabilityDocument, { enabledTags }),
        onSuccess: async result => {
            const updateResult = result.updateCategoryAvailability;
            await refetch();
            setSelectedTags(updateResult.enabledTags);
            toast.success(
                `Categories updated — ${updateResult.productsEnabled} products enabled, ${updateResult.productsDisabled} disabled. Search reindex queued.`,
            );
        },
        onError: () => {
            toast.error('Failed to update category availability');
        },
    });

    const toggleTag = (tag: string, checked: boolean) => {
        setSelectedTags(current => {
            if (checked) {
                return current.includes(tag) ? current : [...current, tag];
            }
            return current.filter(value => value !== tag);
        });
    };

    const toggleCollection = (collection: CollectionGroup, checked: boolean) => {
        const collectionTags = collection.categories.map(category => category.tag);
        setSelectedTags(current => {
            if (checked) {
                return [...new Set([...current, ...collectionTags])];
            }
            const collectionTagSet = new Set(collectionTags);
            return current.filter(tag => !collectionTagSet.has(tag));
        });
    };

    const toggleExpanded = (slug: string) => {
        setExpandedCollections(current =>
            current.includes(slug) ? current.filter(value => value !== slug) : [...current, slug],
        );
    };

    const selectAll = () => {
        setSelectedTags(allTags);
    };

    const clearAll = () => {
        setSelectedTags([]);
    };

    const handleUpdate = () => {
        mutate(selectedTags);
    };

    return (
        <Page pageId="category-availability">
            <PageTitle>Product categories</PageTitle>
            <PageLayout>
                <PageBlock column="main" blockId="category-availability-controls">
                    <p className="text-muted-foreground mb-4 max-w-3xl">
                        Collections group related categories from the product feed. Expand a collection
                        to enable or disable individual categories. Products are visible only when all
                        of their category tags are enabled — disabling one category also disables
                        products that belong to other enabled categories. Click Update to apply
                        changes to existing products and future imports.
                    </p>

                    <div className="mb-4 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={selectAll} disabled={isPending || isLoading}>
                            Select all
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearAll} disabled={isPending || isLoading}>
                            Clear all
                        </Button>
                    </div>

                    {isLoading ? (
                        <p className="text-muted-foreground text-sm">Loading categories…</p>
                    ) : (
                        <div className="max-w-3xl space-y-3">
                            {collections.map(collection => {
                                const collectionTags = collection.categories.map(category => category.tag);
                                const enabledInCollection = collectionTags.filter(tag =>
                                    selectedTags.includes(tag),
                                ).length;
                                const allCollectionEnabled =
                                    collectionTags.length > 0 &&
                                    enabledInCollection === collectionTags.length;
                                const someCollectionEnabled =
                                    enabledInCollection > 0 && !allCollectionEnabled;
                                const isExpanded = expandedCollections.includes(collection.slug);

                                return (
                                    <div key={collection.slug} className="rounded-lg border">
                                        <div className="flex items-start gap-3 p-3">
                                            <Checkbox
                                                id={`collection-${collection.slug}`}
                                                checked={allCollectionEnabled}
                                                indeterminate={someCollectionEnabled}
                                                onCheckedChange={value =>
                                                    toggleCollection(collection, value === true)
                                                }
                                                disabled={isPending}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label
                                                        htmlFor={`collection-${collection.slug}`}
                                                        className="font-medium"
                                                    >
                                                        {collection.name}
                                                    </Label>
                                                    <button
                                                        type="button"
                                                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                                                        onClick={() => toggleExpanded(collection.slug)}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        {enabledInCollection}/{collectionTags.length} categories
                                                        <ChevronDown
                                                            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {collection.productCount}{' '}
                                                    {collection.productCount === 1 ? 'product' : 'products'}
                                                </p>
                                            </div>
                                        </div>

                                        {isExpanded ? (
                                            <div className="border-t px-3 py-3">
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {collection.categories.map(category => {
                                                        const checked = selectedTags.includes(category.tag);
                                                        return (
                                                            <div
                                                                key={category.tag}
                                                                className="flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-border"
                                                            >
                                                                <Checkbox
                                                                    id={`category-${category.tag}`}
                                                                    checked={checked}
                                                                    onCheckedChange={value =>
                                                                        toggleTag(category.tag, value === true)
                                                                    }
                                                                    disabled={isPending}
                                                                />
                                                                <div>
                                                                    <Label
                                                                        htmlFor={`category-${category.tag}`}
                                                                        className="text-sm font-normal"
                                                                    >
                                                                        {category.tag}
                                                                    </Label>
                                                                    <p className="text-muted-foreground text-xs">
                                                                        {category.productCount}{' '}
                                                                        {category.productCount === 1
                                                                            ? 'product'
                                                                            : 'products'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-6">
                        <Button onClick={handleUpdate} disabled={!isDirty || isPending || isLoading}>
                            {isPending ? 'Updating…' : 'Update categories'}
                        </Button>
                    </div>
                </PageBlock>
            </PageLayout>
        </Page>
    );
}
