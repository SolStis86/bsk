import {
    api,
    Button,
    Page,
    PageBlock,
    PageLayout,
    PageTitle,
    toast,
    useMutation,
    useQuery,
} from '@vendure/dashboard';
import { useState } from 'react';

import {
    lastStockFeedSyncDocument,
    triggerStockFeedSyncDocument,
} from './stock-feed-sync.graphql';

type SyncResult = {
    rowsParsed: number;
    matched: number;
    updated: number;
    unchanged: number;
    unknownSkus: number;
    errors: string[];
};

type SyncRun = {
    runId: string;
    status: string;
    source: string;
    message: string;
    startedAt: string;
    completedAt?: string | null;
    durationMs?: number | null;
    error?: string | null;
    result?: SyncResult | null;
};

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString();
}

function SyncRunDetails({ run }: { run: SyncRun }) {
    return (
        <dl className="grid gap-2 text-sm">
            <div className="flex gap-2">
                <dt className="font-medium w-32">Status</dt>
                <dd>{run.status}</dd>
            </div>
            <div className="flex gap-2">
                <dt className="font-medium w-32">Source</dt>
                <dd>{run.source}</dd>
            </div>
            <div className="flex gap-2">
                <dt className="font-medium w-32">Started</dt>
                <dd>{formatDateTime(run.startedAt)}</dd>
            </div>
            {run.completedAt && (
                <div className="flex gap-2">
                    <dt className="font-medium w-32">Completed</dt>
                    <dd>{formatDateTime(run.completedAt)}</dd>
                </div>
            )}
            {run.durationMs != null && (
                <div className="flex gap-2">
                    <dt className="font-medium w-32">Duration</dt>
                    <dd>{(run.durationMs / 1000).toFixed(1)}s</dd>
                </div>
            )}
            {run.message && (
                <div className="flex gap-2">
                    <dt className="font-medium w-32">Message</dt>
                    <dd>{run.message}</dd>
                </div>
            )}
            {run.error && (
                <div className="flex gap-2 text-destructive">
                    <dt className="font-medium w-32">Error</dt>
                    <dd>{run.error}</dd>
                </div>
            )}
            {run.result && (
                <>
                    <div className="flex gap-2">
                        <dt className="font-medium w-32">Rows parsed</dt>
                        <dd>{run.result.rowsParsed}</dd>
                    </div>
                    <div className="flex gap-2">
                        <dt className="font-medium w-32">Matched</dt>
                        <dd>{run.result.matched}</dd>
                    </div>
                    <div className="flex gap-2">
                        <dt className="font-medium w-32">Updated</dt>
                        <dd>{run.result.updated}</dd>
                    </div>
                    <div className="flex gap-2">
                        <dt className="font-medium w-32">Unchanged</dt>
                        <dd>{run.result.unchanged}</dd>
                    </div>
                    <div className="flex gap-2">
                        <dt className="font-medium w-32">Unknown SKUs</dt>
                        <dd>{run.result.unknownSkus}</dd>
                    </div>
                    {run.result.errors.length > 0 && (
                        <div className="flex gap-2">
                            <dt className="font-medium w-32">Errors</dt>
                            <dd>{run.result.errors.join('; ')}</dd>
                        </div>
                    )}
                </>
            )}
        </dl>
    );
}

export function StockFeedSyncPage() {
    const [latestRun, setLatestRun] = useState<SyncRun | null>(null);

    const { data: lastSyncData } = useQuery({
        queryKey: ['lastStockFeedSync'],
        queryFn: () => api.query(lastStockFeedSyncDocument, {}),
    });

    const triggerMutation = useMutation({
        mutationFn: () => api.mutate(triggerStockFeedSyncDocument, {}),
        onSuccess: data => {
            const run = data.triggerStockFeedSync as SyncRun;
            setLatestRun(run);
            toast.success('Stock feed sync complete');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Stock feed sync failed');
        },
    });

    const displayRun = latestRun ?? (lastSyncData?.lastStockFeedSync as SyncRun | null | undefined);

    return (
        <Page pageId="stock-feed-sync">
            <PageTitle>Stock feed sync</PageTitle>
            <PageLayout>
                <PageBlock column="main" blockId="actions">
                    <div className="flex flex-wrap items-center gap-4">
                        <Button
                            type="button"
                            onClick={() => triggerMutation.mutate()}
                            disabled={triggerMutation.isPending}
                        >
                            {triggerMutation.isPending ? 'Syncing…' : 'Run sync now'}
                        </Button>
                        {triggerMutation.isPending && (
                            <p className="text-sm text-muted-foreground">
                                Downloading feed and updating stock levels…
                            </p>
                        )}
                    </div>
                </PageBlock>

                <PageBlock column="main" blockId="status">
                    <h3 className="text-lg font-semibold mb-3">Last sync</h3>
                    {!displayRun ? (
                        <p className="text-muted-foreground">No stock feed sync has completed yet.</p>
                    ) : (
                        <SyncRunDetails run={displayRun} />
                    )}
                </PageBlock>
            </PageLayout>
        </Page>
    );
}
