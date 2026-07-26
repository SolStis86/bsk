# Stock feed sync

Lightweight scheduled sync that polls the wholesale stock CSV and updates Vendure variant stock by SKU.

## Feed source

- **URL:** `https://www.1on1wholesale.co.uk/API/product/export/stock/`
- **Sample:** [`data/stock-feed.csv`](../../data/stock-feed.csv) (~1,885 rows)
- **Columns:** `SKU`, `Stock`, `StockLevel`, `Price`

## Mapping rules

| Feed `Stock` | Target `stockOnHand` |
|---|---|
| `In Stock` | `StockLevel` |
| `Out Stock` | `0` |
| `Discontinued` | `0` |

Only SKUs listed in the stock feed are updated. Variants not in the feed are unchanged.

## Plugin

Implementation: [`apps/server/src/plugins/stock-feed-sync/`](../../apps/server/src/plugins/stock-feed-sync/)

- Scheduled task: every 5 minutes (`STOCK_FEED_CRON`, default `*/5 * * * *`)
- Disabled in dev unless `STOCK_FEED_SCHEDULE_ENABLED=true`
- Admin dashboard page + manual trigger mutation

## Relationship to product feed import

| Concern | Product feed import | Stock feed sync |
|---|---|---|
| Schedule | Nightly | Every ~5 minutes |
| Scope | Full catalog (products, assets, taxonomy) | Stock levels only |
| SKU coverage | Full product export | Subset (~1.9k SKUs) |
| Missing SKUs | Can disable feed-managed variants | No effect |

The product feed sets initial stock during import; the stock feed keeps levels current between full imports.

## Environment variables

See [`apps/server/src/plugins/stock-feed-sync/README.md`](../../apps/server/src/plugins/stock-feed-sync/README.md).
