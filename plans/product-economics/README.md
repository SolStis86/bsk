# Product Economics

Provider-aware product economics for feed-managed catalog items.

## Pricing assumptions

| Field | Semantics |
|---|---|
| Feed RRP | VAT-inclusive (gross). Stored in Vendure as tax-inclusive minor units when `pricesIncludeTax` is enabled on the channel. |
| Feed trade price | VAT-exclusive (net) wholesale goods cost. Stored on `ProductVariant.customFields.tradePrice`. |
| Supplier shipping rules | Estimated landed-cost tiers per provider (ex VAT). Not customer checkout rates. |

## Margin calculation

Global setting `GlobalSettings.customFields.profitCalculationVatMode`:

- `net` (VAT registered): compare ex-VAT revenue vs ex-VAT trade cost
- `gross` (not VAT registered): compare inc-VAT revenue vs inc-VAT trade cost

Example (SKU N8440, net mode):

- RRP inc VAT: £6.99 → ex VAT £5.83
- Trade ex VAT: £2.80
- Unit margin ex VAT: £3.03 (~52%)

Formula helpers live in `utils/economics.utils.ts`.

## 1on1 provider defaults

Seeded (and synced) on bootstrap from `constants/one-on-one-shipping-rules.ts`:

| Shipping rule | Cost (ex VAT) | Default | Customer method code |
|---|---|---|---|
| `evri_standard` | £3.40 | yes | `evri-standard` |
| `evri_express` | £4.13 | | `evri-express` |
| `dhl_express` | £4.95 | | `dhl-express` |
| `europe` | £15.30 | | `europe-dropship` |
| `rest_of_world` | £25.40 | | `row-dropship` |
| `us` | £26.00 | | `us-dropship` |

These are **supplier wholesale costs** used for profit snapshots. Customer checkout rates are configured separately as Vendure shipping methods (Admin → Settings → Shipping methods). Link them via `customerShippingMethodCode` on each rule when you want order profit snapshots to use the selected checkout method instead of the provider default.

Products imported via the product feed are tagged with `Product.customFields.supplierProviderCode` (default `1on1`).

## Order profit snapshot

When an order transitions to `PaymentSettled`, the plugin stores a JSON snapshot on `Order.customFields.profitSnapshot` containing:

- Revenue (ex/inc VAT)
- Estimated COGS from variant trade prices
- Estimated supplier shipping (provider default rule)
- Estimated profit and margin %

View the snapshot on the order detail page in the admin dashboard.

## Admin surfaces

- **Settings → Supplier providers**: manage provider metadata and shipping tiers
- **Product variant detail**: variant economics panel (margin summary)
- **Order detail**: profit snapshot panel (read-only)

## Channel tax

The plugin enforces `channel.pricesIncludeTax = true` on bootstrap and via migration `1785000000006-product-economics-foundation.ts`.
