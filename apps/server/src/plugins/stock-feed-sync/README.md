# Stock Feed Sync Plugin

Polls the wholesale stock CSV export and updates Vendure variant stock levels by SKU.

## Behaviour

- Downloads CSV from the configured `feedUrl` (default: 1on1 wholesale stock export)
- Parses columns: `SKU`, `Stock`, `StockLevel`, `Price` (Price is ignored in v1)
- Updates **only SKUs present in the feed**; other catalog variants are left unchanged
- Stock mapping matches the product feed import rules:
  - `"In Stock"` → `StockLevel` (integer)
  - `"Out Stock"` / `Discontinued` → `0`
- Variants are not disabled based on stock status
- Scheduled task runs every 5 minutes in non-dev environments (configurable)

## Configuration

Set in `vendure-config.ts` via environment variables:

| Env var | Default | Description |
|---------|---------|-------------|
| `STOCK_FEED_URL` | `https://www.1on1wholesale.co.uk/API/product/export/stock/` | Remote CSV URL |
| `STOCK_FEED_CRON` | `*/5 * * * *` | Cron schedule |
| `STOCK_FEED_SCHEDULE_ENABLED` | `true` (non-dev) | Set `false` to disable scheduled sync |
| `STOCK_FEED_DEV_SYNC_LIMIT` | `0` | Cap rows processed in dev when > 0 |

## Admin

- **Dashboard:** Catalog → Stock feed sync
- **GraphQL:**
  - `lastStockFeedSync` — most recent completed run
  - `stockFeedSyncRuns(take: Int)` — recent run history
  - `triggerStockFeedSync(syncLimit: Int)` — manual sync

## Local testing

Use the fixture at `__fixtures__/stock-feed.csv` or the repo sample at `data/stock-feed.csv`:

```ts
await stockFeedSyncService.runSync(ctx, runId, {
  fixturePath: '/path/to/stock-feed.csv',
});
```

## Relationship to product feed import

The nightly **product feed import** creates/updates catalog data and sets initial stock. This plugin keeps stock levels fresh between full imports without re-importing products, images, or taxonomy.
