import {
    api,
    Button,
    Input,
    Label,
    Page,
    PageBlock,
    PageLayout,
    PageTitle,
    toast,
    useMutation,
    useQuery,
} from '@vendure/dashboard';
import { useEffect, useMemo, useState } from 'react';

import {
    importJobStatusDocument,
    importProductFeedDocument,
    lastProductFeedImportDocument,
    productFeedImportProgressDocument,
} from './product-feed-import.graphql';

type ImportResult = {
    productsCreated: number;
    productsUpdated: number;
    variantsCreated: number;
    variantsUpdated: number;
    variantsDisabled: number;
    productsDisabled: number;
    assetsImported: number;
    assetsEnqueued: number;
    warnings: string[];
    errors: string[];
};

type ImportProgress = {
    jobId: string;
    stage: string;
    message: string;
    progress: number;
    processedProducts: number;
    totalProducts: number;
    currentProductCode?: string | null;
    assetsPending?: number;
    error?: string | null;
    result?: ImportResult | null;
};

type LastImportSummary = {
    jobId: string;
    completedAt: string;
    source: string;
    assetsPending: number;
    result: ImportResult;
};

const STAGE_LABELS: Record<string, string> = {
    QUEUED: 'Queued',
    DOWNLOADING_FEED: 'Downloading feed',
    PREPARING_IMAGES: 'Preparing images',
    PARSING_FEED: 'Parsing feed',
    SYNCING_PRODUCTS: 'Syncing products',
    DISABLING_MISSING: 'Disabling missing SKUs',
    ENQUEUING_ASSETS: 'Queueing asset imports',
    APPLYING_COLLECTIONS: 'Applying collections',
    REINDEXING_SEARCH: 'Reindexing search',
    COMPLETE: 'Complete',
    FAILED: 'Failed',
};

const STALE_THRESHOLD_HOURS = 36;

function isTerminalStage(stage: string | undefined): boolean {
    return stage === 'COMPLETE' || stage === 'FAILED';
}

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString();
}

function hoursSince(value: string): number {
    return (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60);
}

export function ProductFeedImportPage() {
    const [limit, setLimit] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    const { data: lastImportData } = useQuery({
        queryKey: ['last-product-feed-import'],
        queryFn: () => api.query(lastProductFeedImportDocument),
    });

    const lastImport: LastImportSummary | null = lastImportData?.lastProductFeedImport ?? null;
    const isStale =
        lastImport != null && hoursSince(lastImport.completedAt) > STALE_THRESHOLD_HOURS;

    const { mutate, isPending: isStarting } = useMutation({
        mutationFn: (importLimit?: number) =>
            api.mutate(importProductFeedDocument, { importLimit }),
        onSuccess: data => {
            setJobId(data.importProductFeed.jobId);
            setResult(null);
        },
        onError: () => {
            toast.error('Failed to start product feed import');
        },
    });

    const shouldPoll = !!jobId;

    const { data: progressData, isError: progressQueryError } = useQuery({
        queryKey: ['product-feed-import-progress', jobId],
        queryFn: () => api.query(productFeedImportProgressDocument, { jobId: jobId! }),
        enabled: shouldPoll,
        refetchInterval: query => {
            const stage = query.state.data?.productFeedImportProgress?.stage;
            return isTerminalStage(stage) ? false : 1000;
        },
    });

    const { data: jobData } = useQuery({
        queryKey: ['product-feed-import-job', jobId],
        queryFn: () => api.query(importJobStatusDocument, { jobId: jobId! }),
        enabled: shouldPoll,
        refetchInterval: query => {
            const settled = query.state.data?.job?.isSettled;
            return settled ? false : 1000;
        },
    });

    const progress: ImportProgress | null = progressData?.productFeedImportProgress ?? null;
    const job = jobData?.job ?? null;

    const isImportRunning = useMemo(() => {
        if (!jobId) {
            return false;
        }
        if (isStarting) {
            return true;
        }
        if (progress && isTerminalStage(progress.stage)) {
            return false;
        }
        if (job?.isSettled) {
            return false;
        }
        return true;
    }, [job?.isSettled, jobId, isStarting, progress]);

    const displayProgress = useMemo((): ImportProgress | null => {
        if (progress) {
            return progress;
        }
        if (!jobId) {
            return null;
        }
        if (job) {
            return {
                jobId,
                stage: job.state === 'PENDING' ? 'QUEUED' : 'SYNCING_PRODUCTS',
                message:
                    job.state === 'PENDING'
                        ? 'Waiting for worker to start…'
                        : 'Import in progress…',
                progress: job.progress ?? 0,
                processedProducts: 0,
                totalProducts: 0,
            };
        }
        return {
            jobId,
            stage: 'QUEUED',
            message: 'Starting import…',
            progress: 0,
            processedProducts: 0,
            totalProducts: 0,
        };
    }, [job, jobId, progress]);

    useEffect(() => {
        if (!progress || !isTerminalStage(progress.stage)) {
            return;
        }

        if (progress.stage === 'COMPLETE' && progress.result) {
            setResult(progress.result);
            if (progress.result.errors.length > 0) {
                toast.error(`Import finished with ${progress.result.errors.length} error(s)`);
            } else {
                toast.success('Product feed import completed');
            }
            return;
        }

        if (progress.stage === 'FAILED') {
            toast.error(progress.error ?? 'Product feed import failed');
        }
    }, [progress]);

    const handleImport = () => {
        const parsedLimit = limit.trim() ? parseInt(limit, 10) : undefined;

        if (limit.trim() && (!Number.isFinite(parsedLimit) || parsedLimit! <= 0)) {
            toast.error('Import limit must be a positive number');
            return;
        }

        mutate(parsedLimit);
    };

    return (
        <Page pageId="product-feed-import">
            <PageTitle>Product feed import</PageTitle>
            <PageLayout>
                <PageBlock column="main" blockId="last-import">
                    <h3 className="mb-3 text-lg font-semibold">Last successful import</h3>
                    {lastImport ? (
                        <div className="max-w-xl space-y-3 text-sm">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <dt className="text-muted-foreground">Completed</dt>
                                <dd>{formatDateTime(lastImport.completedAt)}</dd>
                                <dt className="text-muted-foreground">Source</dt>
                                <dd>{lastImport.source}</dd>
                                <dt className="text-muted-foreground">Products updated</dt>
                                <dd>
                                    {lastImport.result.productsCreated} created,{' '}
                                    {lastImport.result.productsUpdated} updated
                                </dd>
                                <dt className="text-muted-foreground">Variants updated</dt>
                                <dd>
                                    {lastImport.result.variantsCreated} created,{' '}
                                    {lastImport.result.variantsUpdated} updated
                                </dd>
                                <dt className="text-muted-foreground">Disabled (missing)</dt>
                                <dd>
                                    {lastImport.result.variantsDisabled} variants,{' '}
                                    {lastImport.result.productsDisabled} products
                                </dd>
                                <dt className="text-muted-foreground">Assets</dt>
                                <dd>
                                    {lastImport.result.assetsImported} imported inline,{' '}
                                    {lastImport.result.assetsEnqueued} queued
                                </dd>
                            </dl>
                            {lastImport.assetsPending > 0 ? (
                                <p className="text-muted-foreground">
                                    {lastImport.assetsPending} asset job(s) still pending in the
                                    worker queue.
                                </p>
                            ) : null}
                            {isStale ? (
                                <p className="text-destructive">
                                    Last import was more than {STALE_THRESHOLD_HOURS} hours ago.
                                    Check the scheduled task and worker process.
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No completed imports yet.</p>
                    )}
                    <p className="text-muted-foreground mt-4 text-sm">
                        Scheduled sync runs nightly at 02:00 (configurable via{' '}
                        <code>PRODUCT_FEED_CRON</code>). Disabled in dev unless{' '}
                        <code>PRODUCT_FEED_SCHEDULE_ENABLED=true</code>.
                    </p>
                </PageBlock>

                <PageBlock column="main" blockId="import-controls">
                    <p className="text-muted-foreground mb-4">
                        Import products from the configured wholesale CSV feed and image zip. Safe to
                        re-run — existing products and variants are updated in place. Requires
                        SuperAdmin permission. Progress updates live while the background job runs
                        (the worker process must be running).
                    </p>

                    <div className="mb-6 max-w-sm space-y-2">
                        <Label htmlFor="import-limit">Import limit (optional)</Label>
                        <Input
                            id="import-limit"
                            type="number"
                            min={1}
                            placeholder="Leave empty for full import"
                            value={limit}
                            onChange={event => setLimit(event.target.value)}
                            disabled={isImportRunning}
                        />
                        <p className="text-muted-foreground text-sm">
                            Use a small limit (e.g. 10) for smoke tests. A limited import skips
                            disabling SKUs missing from the feed.
                        </p>
                    </div>

                    <Button onClick={handleImport} disabled={isImportRunning}>
                        {isImportRunning ? 'Import running…' : 'Run import'}
                    </Button>
                </PageBlock>

                {displayProgress ? (
                    <PageBlock column="main" blockId="import-progress">
                        <h3 className="mb-3 text-lg font-semibold">Import progress</h3>
                        <div className="max-w-xl space-y-4">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium">
                                        {STAGE_LABELS[displayProgress.stage] ??
                                            displayProgress.stage}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {Math.round(displayProgress.progress)}%
                                    </span>
                                </div>
                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(displayProgress.progress, 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <p className="text-muted-foreground text-sm">{displayProgress.message}</p>

                            {progressQueryError ? (
                                <p className="text-destructive text-sm">
                                    Could not load detailed progress. The import may still be
                                    running — check job status above.
                                </p>
                            ) : null}

                            {displayProgress.stage === 'SYNCING_PRODUCTS' &&
                            displayProgress.totalProducts > 0 ? (
                                <p className="text-sm">
                                    Product {displayProgress.processedProducts} of{' '}
                                    {displayProgress.totalProducts}
                                    {displayProgress.currentProductCode
                                        ? ` — ${displayProgress.currentProductCode}`
                                        : null}
                                </p>
                            ) : null}

                            {(displayProgress.assetsPending ?? 0) > 0 ? (
                                <p className="text-sm">
                                    Asset jobs pending: {displayProgress.assetsPending}
                                </p>
                            ) : null}

                            {displayProgress.stage === 'FAILED' && displayProgress.error ? (
                                <p className="text-destructive text-sm">{displayProgress.error}</p>
                            ) : null}

                            {job?.state === 'PENDING' && isImportRunning ? (
                                <p className="text-muted-foreground text-sm">
                                    Job is queued. If this persists, ensure the Vendure worker is
                                    running.
                                </p>
                            ) : null}
                        </div>
                    </PageBlock>
                ) : null}

                {result ? (
                    <PageBlock column="main" blockId="import-results">
                        <h3 className="mb-3 text-lg font-semibold">Import summary</h3>
                        <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <dt className="text-muted-foreground">Products created</dt>
                            <dd>{result.productsCreated}</dd>
                            <dt className="text-muted-foreground">Products updated</dt>
                            <dd>{result.productsUpdated}</dd>
                            <dt className="text-muted-foreground">Variants created</dt>
                            <dd>{result.variantsCreated}</dd>
                            <dt className="text-muted-foreground">Variants updated</dt>
                            <dd>{result.variantsUpdated}</dd>
                            <dt className="text-muted-foreground">Variants disabled</dt>
                            <dd>{result.variantsDisabled}</dd>
                            <dt className="text-muted-foreground">Products disabled</dt>
                            <dd>{result.productsDisabled}</dd>
                            <dt className="text-muted-foreground">Assets imported</dt>
                            <dd>{result.assetsImported}</dd>
                            <dt className="text-muted-foreground">Assets queued</dt>
                            <dd>{result.assetsEnqueued}</dd>
                        </dl>

                        {result.warnings.length > 0 ? (
                            <div className="mt-4">
                                <h4 className="mb-2 font-medium">
                                    Warnings ({result.warnings.length})
                                </h4>
                                <ul className="text-muted-foreground max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                                    {result.warnings.slice(0, 50).map(warning => (
                                        <li key={warning}>{warning}</li>
                                    ))}
                                </ul>
                                {result.warnings.length > 50 ? (
                                    <p className="text-muted-foreground mt-2 text-sm">
                                        … and {result.warnings.length - 50} more
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        {result.errors.length > 0 ? (
                            <div className="mt-4">
                                <h4 className="mb-2 font-medium text-destructive">
                                    Errors ({result.errors.length})
                                </h4>
                                <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-destructive">
                                    {result.errors.map(error => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </PageBlock>
                ) : null}
            </PageLayout>
        </Page>
    );
}
