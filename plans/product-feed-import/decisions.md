# Decisions and open questions

## Locked in

### Body Fit facet

- **Name:** Body Fit
- **Source:** `Size (met)` from feed (metric; store `Size (imp)` in optional custom field)
- **Purpose:** Descriptive fit / dimensions / volume (e.g. `32cm length`, `One Size`, `236ml`)
- **Not** used for variant option groups in the current feed
- **Future:** Add separate facets (Cup size, Waist size, Dress size) and variant option groups when standardized sizing products arrive — do not overload Body Fit

### Native Vendure variants

- Group by `Product Code`; each row (or lone row) → `ProductVariant`
- Option groups inferred from what varies (typically **Flavour** from product name)
- SKU = `Unique ID`; sync key for delta imports

### Pricing

- **RRP** → variant price (storefront)
- **Trade Price** → variant custom field, admin-only (unless B2B storefront later)

### Plugin approach

- Custom `ProductFeedImportPlugin` in `apps/server/src/plugins/`
- Not direct use of Vendure's native product CSV format

## Open questions (confirm before Phase 3)

| # | Question | Options |
|---|----------|---------|
| 1 | Out-of-stock rows (`Out Stock`, `StockLevel` 0) | Import disabled vs import visible as OOS |
| 2 | N10164-style bad groups | Skip / import as separate products / manual cleanup list |
| 3 | HTML descriptions | Sanitise (strict) vs trusted HTML on PDP |
| 4 | `all_cats` tags like `Offers`, `Tiered Pricing` | Import as facets vs ignore until promotions exist |
| 5 | Collection hierarchy | `Catalogue` → parent collection, `Range` → child vs both as facets |
| 6 | One-off vs recurring feed | File drop only vs scheduled re-import |
| 7 | Imperial sizes | Store `Size (imp)` custom field or drop |

## Recommended defaults (if undecided)

1. Import OOS products as **enabled with zero stock** (show on site, not purchasable)
2. Bad variant groups → **import as separate products** + log warning
3. **Sanitise** HTML descriptions server-side on import
4. Import `all_cats` as facets **except** `Tiered Pricing` (skip)
5. **Catalogue** = parent collection, **Range** = child collection
6. Build for **recurring sync** from Phase 5; Phase 3 is manual trigger
7. Keep **Size (imp)** in product custom field for admin reference
