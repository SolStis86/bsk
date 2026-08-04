# First-time database setup

The Vendure server ships **incremental** migrations (custom fields, plugins) but not an
`initial-schema` migration. Those migrations assume core Vendure tables (`product`, `zone`,
etc.) already exist.

On a **brand-new empty Postgres database** (e.g. `bsk_dev` on the Plesk stack), the server
will fail with:

```
Migration "ProductFeedCustomFields1784905397470" failed: relation "product" does not exist
```

## One-time bootstrap (recommended)

1. Ensure the database is empty (drop/recreate if a previous failed attempt left partial state):

   ```sql
   DROP DATABASE IF EXISTS bsk_dev;
   CREATE DATABASE bsk_dev;
   ```

2. In `deploy/development/.env` (or production), add for **one startup only**:

   ```env
   DB_SYNCHRONIZE=true
   ```

3. Restart **only the Vendure server** container (worker can follow after schema exists):

   ```bash
   docker compose up -d vendure-server
   ```

4. Confirm logs show `Database schema synchronized successfully.` and `Stamped migration: …`
   lines, then remove `DB_SYNCHRONIZE=true` from `.env` and restart the stack.

5. Leave `DB_SYNCHRONIZE` unset (or `false`) for all normal operation.

## If bootstrap failed partway through

A failed `DB_SYNCHRONIZE` run may stamp migrations without creating tables (older images).
Either:

- **Reset the database** (safest): drop/recreate `bsk_dev`, keep `DB_SYNCHRONIZE=true`, pull
  the latest `dev` image, and restart; or
- **Retry on the same database** with a fixed image: leave `DB_SYNCHRONIZE=true`, restart
  `vendure-server` — synchronize will create missing tables and skip already-stamped
  migrations.

## Asset volume permissions

Uploaded product images are stored in the `vendure_assets` volume at
`/var/lib/vendure/assets` inside the container (configured via `ASSET_UPLOAD_DIR`).
The image pre-creates this directory owned by the non-root `vendure` user — no
entrypoint or root privileges required at runtime.

## Why not leave synchronize enabled?

`synchronize: true` auto-alters schema on every deploy. That is unsafe once you have real
data. The one-time flag creates the schema, marks bundled migrations as applied, and then
normal migration-based updates take over.

## Longer-term fix

Generate and commit an initial migration so fresh databases do not need `DB_SYNCHRONIZE`:

```bash
# Against a local empty Postgres matching production
npx vendure migrate -g initial-schema
```

Commit the generated file under `apps/server/src/migrations/` with a timestamp **before**
the first existing migration (`1784905397470`).
