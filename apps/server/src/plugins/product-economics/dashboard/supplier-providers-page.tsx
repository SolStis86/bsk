import {
    api,
    Button,
    Input,
    Label,
    Page,
    PageBlock,
    PageLayout,
    PageTitle,
    Switch,
    toast,
    useMutation,
    useQuery,
} from '@vendure/dashboard';
import { useState } from 'react';

import {
    productSupplierProvidersDocument,
    updateProductSupplierProviderDocument,
    upsertSupplierShippingRuleDocument,
} from './product-economics.graphql';

type ShippingRule = {
    id: string;
    code: string;
    name: string;
    costExVat: number;
    isDefault: boolean;
    sortOrder: number;
};

type Provider = {
    id: string;
    code: string;
    name: string;
    tradePriceIncludesVat: boolean;
    defaultVatRatePercent: number;
    active: boolean;
    shippingRules: ShippingRule[];
};

export function SupplierProvidersPage() {
    const { data, refetch, isLoading } = useQuery({
        queryKey: ['product-supplier-providers'],
        queryFn: () => api.query(productSupplierProvidersDocument),
    });
    const providers: Provider[] = data?.productSupplierProviders ?? [];
    const [draftRules, setDraftRules] = useState<Record<string, { costExVat: string; isDefault: boolean }>>(
        {},
    );

    const updateProvider = useMutation({
        mutationFn: api.mutate(updateProductSupplierProviderDocument),
        onSuccess: async () => {
            toast('Provider updated');
            await refetch();
        },
        onError: error => {
            toast('Failed to update provider', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });

    const upsertRule = useMutation({
        mutationFn: api.mutate(upsertSupplierShippingRuleDocument),
        onSuccess: async () => {
            toast('Shipping rule saved');
            await refetch();
        },
        onError: error => {
            toast('Failed to save shipping rule', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });

    return (
        <Page pageId="supplier-providers">
            <PageTitle>Supplier providers</PageTitle>
            <PageLayout>
                <PageBlock column="main" blockId="providers">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading providers…</div>
                    ) : (
                        <div className="space-y-6">
                            {providers.map(provider => (
                                <div key={provider.id} className="rounded-lg border p-4 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-semibold">{provider.name}</div>
                                            <div className="text-sm text-muted-foreground">{provider.code}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={provider.active}
                                                onCheckedChange={checked =>
                                                    updateProvider.mutate({
                                                        input: { id: provider.id, active: checked },
                                                    })
                                                }
                                            />
                                            <Label>Active</Label>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <Label>Default VAT rate (%)</Label>
                                            <Input
                                                type="number"
                                                defaultValue={provider.defaultVatRatePercent}
                                                onBlur={event =>
                                                    updateProvider.mutate({
                                                        input: {
                                                            id: provider.id,
                                                            defaultVatRatePercent: Number(event.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="font-medium">Shipping rules (ex VAT)</div>
                                        {provider.shippingRules.map(rule => {
                                            const draft = draftRules[rule.id] ?? {
                                                costExVat: String(rule.costExVat),
                                                isDefault: rule.isDefault,
                                            };
                                            return (
                                                <div
                                                    key={rule.id}
                                                    className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto] items-end"
                                                >
                                                    <div>
                                                        <Label>{rule.name}</Label>
                                                        <div className="text-xs text-muted-foreground">
                                                            {rule.code}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Cost (£)</Label>
                                                        <Input
                                                            value={draft.costExVat}
                                                            onChange={event =>
                                                                setDraftRules(current => ({
                                                                    ...current,
                                                                    [rule.id]: {
                                                                        ...draft,
                                                                        costExVat: event.target.value,
                                                                    },
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pb-2">
                                                        <Switch
                                                            checked={draft.isDefault}
                                                            onCheckedChange={checked =>
                                                                setDraftRules(current => ({
                                                                    ...current,
                                                                    [rule.id]: {
                                                                        ...draft,
                                                                        isDefault: checked,
                                                                    },
                                                                }))
                                                            }
                                                        />
                                                        <Label>Default</Label>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            upsertRule.mutate({
                                                                input: {
                                                                    id: rule.id,
                                                                    providerId: provider.id,
                                                                    code: rule.code,
                                                                    name: rule.name,
                                                                    costExVat: Number(draft.costExVat),
                                                                    isDefault: draft.isDefault,
                                                                    sortOrder: rule.sortOrder,
                                                                },
                                                            })
                                                        }
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PageBlock>
            </PageLayout>
        </Page>
    );
}
