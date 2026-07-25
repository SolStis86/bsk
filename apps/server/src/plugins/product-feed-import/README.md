# Product Feed Import Plugin

Imports product catalog data from the 1on1wholesale CSV export API into Vendure.

## Configuration

Set via `ProductFeedImportPlugin.init()` in `vendure-config.ts` (not `process.env` in plugin code):

| Option | Description |
|--------|-------------|
| `feedUrl` | Remote CSV export URL |
| `imageZipUrl` | Remote zip of all product images (filenames match feed `AllImages` / `ImageName`) |
| `importCron` | Cron schedule for overnight sync (wired in Phase 5) |
| `disableMissingFromFeed` | Disable SKUs absent from feed after a successful import (Phase 5) |
| `devImportLimit` | Default import cap when mutation/CLI omit `importLimit` (`0` = no limit) |

Custom fields for the feed import are defined in [`apps/server/src/custom-fields.ts`](../../../apps/server/src/custom-fields.ts) and registered via `vendure-config.ts` (not in this plugin).

Environment variables (read in `vendure-config.ts` only):

- `PRODUCT_FEED_URL`
- `PRODUCT_FEED_IMAGE_ZIP_URL`
- `PRODUCT_FEED_CRON`
- `PRODUCT_FEED_DEV_IMPORT_LIMIT`

## Import runbook (Phase 3)

| Step | Command |
|------|---------|
| Build | `npm run build:server` |
| Full remote import | Dashboard → Catalog → **Product feed import**, or `npm run import:feed -w server` |
| Dev smoke (10 products) | Dashboard import page with limit `10`, or CLI `--limit 10` |
| Offline fixture import | `npm run import:feed -w server -- --fixture ../../data/active-products.csv` |
| Local image zip (offline assets) | `npm run import:feed -w server -- --image-zip /path/to/images.zip` |
| Admin API | GraphQL mutation `importProductFeed(importLimit: Int)` returns `{ jobId }`; poll `productFeedImportProgress(jobId)` for live stage/progress (SuperAdmin) |

The dashboard import page polls progress automatically. Imports run as a background job — ensure the **worker** is running (`npm run dev` starts server + worker + dashboard).

Re-import is safe — upserts by `sourceProductCode` / variant SKU. Product images are loaded from the wholesale image zip (one download per import run); individual feed URLs are used only as fallback when a file is missing from the zip. A search reindex job is queued automatically when products are created or updated.

HTML descriptions are sanitised on import. OOS products import as enabled with zero stock.

## Category availability

Settings → **Product categories** lists feed categories grouped by collection (catalogue). Expand a collection to toggle individual category tags from `all_cats`. Click **Update categories** to enable/disable imported products in bulk and queue a **search reindex**. Future imports respect the same settings.

Products are visible only when **all** of their category tags are enabled. Disabling one category (e.g. Men's Sexy Underwear) disables products tagged with it, even if they also belong to other enabled categories. Products with no category tags remain enabled.

## Taxonomy

Facets seeded on server bootstrap:

- **brand** — Manufacturer
- **body-fit** — Descriptive fit/dimensions from feed `Size (met)` (not variant options)
- **category** — Tags from feed `all_cats` (skips `Tiered Pricing`)

Collections (Phase 3):

- **Parent (16)** — Products are assigned from feed `all_cats` category tags. Tags that match a parent catalogue name (e.g. `Vibrators`, `New In`) map directly; subcategory tags (e.g. `Butt Plugs`, `Lubricants`) map via `constants/category-collection-mapping.constants.ts`.
- **Child** — `Catalogue` → parent, `Range` → child (when both are present). Slug helpers in `constants/taxonomy.constants.ts`.

## Discontinued product policy (Phase 5)

After each **successful full** feed parse:

1. Collect all `sourceUniqueId` values from the feed
2. Variants in Vendure not in the feed → `enabled: false`
3. Product with no enabled variants → disable product
4. Do not hard-delete — allows recovery if a SKU reappears

`lastSeenInFeedAt` custom fields on Product and ProductVariant support this workflow.

**Important:** Discontinued cleanup must not run if the feed fetch or parse fails (avoids false positives).

## Phases

- **Phase 1:** Schema, custom fields, facet shells
- **Phase 2:** CSV parser + mapper
- **Phase 3:** Catalog sync + initial load (this)
- **Phase 4:** Storefront integration
- **Phase 5:** Overnight scheduler, delta sync, asset queue

## Testing

Follows [Vendure testing guide](https://docs.vendure.io/current/core/developer-guide/testing).

| Command | Scope |
|---------|--------|
| `npm run test -w server` | Unit tests (`*.spec.ts`) — parser/mapper logic in Phase 2+ |
| `npm run test:e2e -w server` | Plugin e2e tests (`*.e2e-spec.ts`) via `@vendure/testing` + SQL.js |

From repo root: `npm run test:server` / `npm run test:server:e2e`.

- Unit tests: `src/plugins/product-feed-import/**/*.spec.ts`
- E2E tests: `src/plugins/product-feed-import/e2e/**/*.e2e-spec.ts`
- E2E SQLite cache: `e2e/__data__/` (gitignored)

Set `LOG=true` when debugging failing e2e tests.
