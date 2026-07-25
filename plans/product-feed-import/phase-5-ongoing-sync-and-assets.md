# Phase 5 — Ongoing sync and assets

Production-ready feed integration: scheduled delta updates, background asset imports, cache invalidation.

## Goals

- Re-import feed without duplicating catalog entries
- Update stock, price, enabled state on each run
- Import images asynchronously via worker
- Notify storefront to revalidate after import

## Deliverables

- [x] Delta sync by variant SKU (`Unique ID`)
- [x] `DefaultSchedulerPlugin` cron-triggered import job
- [x] Asset import job queue (remote URL → Vendure Asset)
- [x] Skip unchanged assets (filename match against existing entity assets)
- [x] `ProductFeedImportCompleted` event → storefront revalidate
- [x] Monitoring: import history, last run summary, stale feed warning in admin

## Delta sync architecture

```mermaid
flowchart TD
    Trigger[Schedule or file watch] --> Job[import-product-feed queue]
    Job --> Parse[Parse + map feed]
    Parse --> Diff[Diff by SKU + productCode]
    Diff --> Upsert[Upsert changed products variants]
    Diff --> Disable[Disable variants missing from feed?]
    Upsert --> Stock[Update stock + price]
    Upsert --> Facets[Refresh facets collections if changed]
    Upsert --> AssetQ[Enqueue new asset jobs only]
    AssetQ --> Worker[Worker process]
    Worker --> Assets[AssetService.create from URL]
    Upsert --> Event[Publish completion event]
    Event --> Revalidate[POST /api/revalidate]
```

## Sync rules

| Field | On re-import |
|-------|--------------|
| `RRP` | Update variant price if changed |
| `StockLevel` | Update stock on hand |
| `Stock` / OOS | Update availability |
| `Product Name`, description | Update product |
| `all_cats`, Brand, Body Fit | Replace facet assignments |
| `AllImages` | Import only new URLs |
| Missing from feed | Policy: disable variant or leave unchanged — document |

## Job queue

Create in plugin `onModuleInit()`:

```ts
this.importQueue = await this.jobQueueService.createQueue({
    name: 'import-product-feed',
    process: async job => { /* catalog sync */ },
});
```

Asset queue separately — long-running, retry-friendly.

**RequestContext in jobs:** use `ctx.serialize()` or recreate admin context in worker — never pass raw context object.

Reference: [worker-job-queue](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/worker-job-queue)

## Asset import strategy

| Step | Detail |
|------|--------|
| Dedupe | Skip when product/variant assets already match feed filenames |
| Download | HTTP GET from 1on1wholesale.co.uk zip (one copy per import run in temp dir) |
| Failure | Retry with backoff; log; product live without image |
| Variant image | Prefer URL containing `Subproduct Code` |

Consider custom `AssetImportStrategy` if Vendure defaults insufficient.

## Scheduling

Options:

1. **Fixed schedule** — e.g. nightly `0 2 * * *` via `DefaultSchedulerPlugin`
2. **Manual admin** — keep Phase 3 mutation for on-demand
3. **File watch** — if feed dropped to `data/active-products.csv` on deploy

Configure feed path via `ProductFeedImportPlugin.init({ feedUrl })`.

Env: `PRODUCT_FEED_CRON`, `PRODUCT_FEED_SCHEDULE_ENABLED` (disabled in dev by default).

## Storefront cache

Existing route: `apps/storefront/src/app/api/revalidate/route.ts`

After import:

- Revalidate collection layout tags
- Revalidate product slugs (batch or wildcard if supported)
- Coordinate tag names with `lib/vendure/cached.ts`

Server env: `STOREFRONT_URL`, `REVALIDATION_SECRET` (must match storefront).

## Observability

| Metric | Purpose |
|--------|---------|
| `lastProductFeedImport` query | Admin dashboard last-run widget |
| Row counts | created / updated / disabled / errors |
| Duration | Per run (`durationMs` on progress record) |
| Warnings | Bad groups, missing RRP |
| Stale warning | >36h since last successful import |

## Acceptance criteria

- Second import run is idempotent (no duplicate SKUs)
- Stock/price changes in CSV reflect in Shop API within one sync cycle
- New products in CSV appear after scheduled run
- Asset jobs complete in worker without blocking Admin mutation
- Storefront shows updated data after revalidation

## Future extensions (out of scope)

- SFTP / HTTP feed URL instead of local file
- Promotions from `Tiered Pricing` / `Offers` tags
- B2B trade price channel
- Normalised Body Fit filter vocabulary
