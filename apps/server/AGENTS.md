# Vendure Server Agent

This guide applies to work in `apps/server/` — the Vendure **3.7.1** backend for the bsk monorepo. See root [`AGENTS.md`](../../AGENTS.md) for workspace commands.

## Role and boundaries

- Implement custom functionality as **Vendure plugins** in `src/plugins/`.
- Work only in `apps/server/` unless explicitly asked otherwise.
- Do not modify `apps/storefront/`. When adding Shop API fields or mutations, document the GraphQL shape the storefront should consume.
- Minimize diff scope; no drive-by refactors.
- No commits unless the user asks. Never commit `.env` or hardcode secrets.
- Read env vars in `vendure-config.ts` and pass values into plugins via `Plugin.init()` options. Extend `src/environment.d.ts` for new vars.

## Architecture (Vendure overview)

Vendure is headless e-commerce: all functionality is exposed via GraphQL APIs.

| Component | Role |
|-----------|------|
| **Server** | Handles Shop API + Admin API requests; enqueues jobs for the worker |
| **Worker** | Background tasks: search index, emails, retries, long-running work |
| **Dashboard** | Admin UI at `/dashboard` (React) |
| **Storefront** | Separate app (`apps/storefront`) consuming the Shop API |

**Stack:** TypeScript, Node.js, NestJS, TypeORM (PostgreSQL here), GraphQL (Apollo Server).

**Design principles:** flexible (strategy pattern), modular (plugins), type-safe.

## This project's layout

```
apps/server/
├── src/
│   ├── index.ts              # runMigrations → bootstrap
│   ├── index-worker.ts       # worker + job queue
│   ├── vendure-config.ts     # central config; register plugins here
│   ├── environment.d.ts      # typed process.env
│   ├── migrations/           # DB migrations (generate after schema changes)
│   └── plugins/              # all custom functionality lives here
└── static/                   # assets, email templates
```

**Current config highlights** (`vendure-config.ts`):

- PostgreSQL with `synchronize: false` — **always use migrations** for schema changes
- Plugins: Graphiql, AssetServer, Scheduler, JobQueue, Search, Email, Dashboard
- Payment: `dummyPaymentHandler` only
- `customFields: {}` — no custom fields yet

**Dev commands:**

```bash
npm run dev:server          # from repo root
npm run build:server        # after backend changes
npx vendure migrate         # generate / run migrations
npx vendure add             # scaffold plugins, entities, etc.
```

GraphiQL (dev): `http://localhost:3000/graphiql/shop-api` and `.../admin-api`

## Documentation sources

Canonical Vendure developer docs live in the vendure repo as MDX — easier to ingest than the rendered site:

- **Browse:** [github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide)
- **Raw (for agents):** `https://raw.githubusercontent.com/vendurehq/vendure/master/docs/docs/guides/developer-guide/<topic>/index.mdx`

Read relevant topic pages before implementing unfamiliar patterns (plugins, migrations, events, job queues, etc.).

## AI-assisted development (Vendure guidance)

From Vendure's [ai-assisted-development](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/ai-assisted-development) guide:

- Read this file and root `AGENTS.md` before making changes.
- Prefer **non-interactive CLI** over manual boilerplate:

```bash
npx vendure add -p reviews                              # create plugin
npx vendure add -s ReviewService --selected-plugin ReviewsPlugin
npx vendure add -j ReviewsPlugin --name sync-reviews --selected-service ReviewService
```

- Plugins must **not** read `process.env` directly — read env in `vendure-config.ts`, pass via `Plugin.init({ … })`, inject options token in services.
- Always pass `RequestContext` to services and `TransactionalConnection` methods.
- Job queues: create in `onModuleInit()`; do **not** pass raw `RequestContext` as job data — use `ctx.serialize()` or pass only the fields needed to recreate context in the worker.

## Plugin development

Plugins are the unit of custom functionality. Prefer `npx vendure add -p my-feature` (or interactive `npx vendure add`).

### Minimal plugin

```ts
import { PluginCommonModule, VendurePlugin } from '@vendure/core';

@VendurePlugin({
    imports: [PluginCommonModule],
})
export class MyPlugin {}
```

Register in `vendure-config.ts` → `plugins: [MyPlugin]`.

### Plugin metadata (key properties)

| Property | Purpose |
|----------|---------|
| `imports` | NestJS modules; always include `PluginCommonModule` for core services |
| `providers` | Services, resolvers as injectable providers |
| `entities` | Custom TypeORM entities |
| `configuration` | Modify `VendureConfig` before bootstrap (custom fields, etc.) |
| `shopApiExtensions` | Extend Shop GraphQL (schema + resolvers) |
| `adminApiExtensions` | Extend Admin GraphQL |
| `controllers` | REST endpoints |
| `compatibility` | Semver range for npm-published plugins (e.g. `'^3.0.0'`) |

### Recommended plugin structure

```
src/plugins/my-feature/
├── my-feature.plugin.ts
├── entities/
├── services/
├── api/
│   ├── api-extensions.ts
│   └── my-feature.resolver.ts
├── types.ts                  # module augmentation for custom fields
└── constants.ts
```

### Lifecycle hooks

Plugins support NestJS lifecycle hooks (`onModuleInit`, `onApplicationBootstrap`, etc.). Hooks run in **both** server and worker — guard with `ProcessContext`:

```ts
constructor(private processContext: ProcessContext) {}

async onApplicationBootstrap() {
    if (this.processContext.isWorker) return;
    // server-only startup
}
```

For startup work that calls Vendure services outside a request, create a `RequestContext` manually (see Vendure stand-alone scripts docs).

**Job queues:** create in `onModuleInit()` or `onApplicationBootstrap()`, reuse the queue instance when enqueueing jobs.

## The API layer

Request flow: **middleware → resolver → service → database**.

### Resolver conventions

- Keep resolvers **thin** — delegate to services.
- Always inject `@Ctx() ctx: RequestContext` as the first argument and pass it to services.
- Use `@Allow(Permission.…)` for authorization.
- Use `@Transaction()` on mutations (requires `RequestContext`; rolls back on error).
- Use `@Query()` / `@Mutation()` from `@nestjs/graphql`.
- Field resolvers: `@Resolver('TypeName')` + `@ResolveField()` + `@Parent()`.

```ts
@Resolver()
export class ShopMyFeatureResolver {
    constructor(private myService: MyFeatureService) {}

    @Query()
    @Allow(Permission.Owner)
    myItems(@Ctx() ctx: RequestContext) {
        return this.myService.findAll(ctx);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    createMyItem(@Ctx() ctx: RequestContext, @Args() args: { name: string }) {
        return this.myService.create(ctx, args.name);
    }
}
```

### GraphQL extensions

Define SDL in `api/api-extensions.ts` with `graphql-tag`, then wire in the plugin:

```ts
shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [ShopMyFeatureResolver],
},
```

Shop API = storefront-facing. Admin API = dashboard / back-office.

## The service layer

Services hold business logic and database access. They are NestJS `@Injectable()` providers.

### Using core services

Import `PluginCommonModule` in the plugin, then inject core services (e.g. `ProductService`, `OrderService`) from `@vendure/core`.

### Database access

Use `TransactionalConnection` — **always pass `ctx`** so operations participate in active transactions.

**Find API** (preferred — type-safe):

```ts
return this.connection.getRepository(ctx, MyEntity).findOne({
    where: { id, deletedAt: IsNull() },
    relations: { relatedEntity: true },
});
```

**QueryBuilder** for complex queries. **EntityHydrator** when an entity is passed in without guaranteed relations joined.

Core services often accept a `relations` array in `findOne()` / `findMany()`.

## Database entities

Scaffold with `npx vendure add` → add entity to plugin.

```ts
import { DeepPartial, EntityId, ID, VendureEntity } from '@vendure/core';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class MyEntity extends VendureEntity {
    constructor(input?: DeepPartial<MyEntity>) {
        super(input);
    }

    @Column()
    name: string;

    @ManyToOne(() => Product)
    product: Product;

    @EntityId()
    productId: ID;
}
```

**Rules:**

- All custom entities **must extend `VendureEntity`** (provides `id`, `createdAt`, `updatedAt`).
- Register in plugin `entities: [MyEntity]`.
- Use `@EntityId()` for foreign-key ID columns (supports numeric and string IDs).
- Use `@Money()` for monetary columns.
- This project already sets `"useDefineForClassFields": false` in `tsconfig.json` (required for TypeORM entities on ES2022+).

After adding entities or custom fields → **generate and run a migration**:

```bash
npx vendure migrate my-feature-plugin
# select "Generate a new migration", then run again to apply
```

Migrations run automatically on server start via `runMigrations()` in `index.ts`.

## Custom fields

Define in **`vendure-config.ts`** under `customFields` (see [Custom fields guide](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/custom-fields)). This is the primary approach for project-specific fields:

```ts
// apps/server/src/vendure-config.ts
import { productFeedCustomFields } from './custom-fields';
import './custom-fields.types';

export const config: VendureConfig = {
    customFields: productFeedCustomFields,
    // ...
};
```

Add TypeScript augmentation in `custom-fields.types.ts`:

```ts
declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductFields {
        myField: string;
    }
}
```

Import `'./custom-fields.types'` in `vendure-config.ts`. Custom fields require migrations (`npx vendure migrate -g <name>`).

**Plugins:** use the plugin `configuration` callback to `push` custom fields only when a **reusable npm plugin** must extend entities. For this monorepo’s app-specific fields, prefer `vendure-config.ts` over plugin configuration.

## Importing data

### CSV product import

Flat `.csv` for bulk products, variants, assets, facets, and custom field columns (`product:fieldName`, `variant:fieldName`). Empty `name` rows are variants of the preceding product.

Use `populate()` from `@vendure/core/cli` with `InitialData` for payment methods, roles, countries, tax rates, shipping methods, and collections.

For advanced setup (custom shipping checkers, etc.), write a custom populate script rather than relying on `InitialData` alone.

Reference: [Vendure demo products.csv](https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/products.csv)

## Storefront coordination

When exposing new Shop API functionality, specify for the storefront agent:

- GraphQL operation names and shapes (query/mutation + args + return type)
- Required permissions / auth (guest vs signed-in customer)
- Whether data is channel- or locale-aware
- Any new env vars (storefront uses `VENDURE_SHOP_API_URL`)

The storefront fetches via `query()` / `mutate()` in `apps/storefront/src/lib/vendure/` with `gql.tada` — match existing patterns there.

## Quality checks

After substantive backend changes:

```bash
npm run build:server
```

Also run migrations locally when schema changed. Fix type and build errors introduced by the change.

For npm-published plugins, set `compatibility: '^3.0.0'` (match this project's Vendure major).

## Reference documentation

Base: [developer-guide on GitHub](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide)

### Core (read first)

| Topic | GitHub |
|-------|--------|
| Overview | [overview](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/overview) |
| Plugins | [plugins](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/plugins) |
| API layer | [the-api-layer](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/the-api-layer) |
| Service layer | [the-service-layer](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/the-service-layer) |
| Database entities | [database-entity](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/database-entity) |
| AI-assisted dev | [ai-assisted-development](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/ai-assisted-development) |
| CLI | [cli](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/cli) |
| Migrations | [migrations](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/migrations) |

### Common plugin topics

| Topic | GitHub |
|-------|--------|
| Custom fields | [custom-fields](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/custom-fields) |
| Extend GraphQL API | [extend-graphql-api](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/extend-graphql-api) |
| Events | [events](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/events) |
| Worker / job queue | [worker-job-queue](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/worker-job-queue) |
| REST endpoints | [rest-endpoint](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/rest-endpoint) |
| Importing data | [importing-data](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/importing-data) |
| Stand-alone scripts | [stand-alone-scripts](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/stand-alone-scripts) |
| Testing | [testing](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/testing) |
| Translatable entities | [translatable](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/translatable) |
| Channel-aware entities | [channel-aware](https://github.com/vendurehq/vendure/tree/master/docs/docs/guides/developer-guide/channel-aware) |

### Examples

- [real-world-vendure](https://github.com/vendurehq/real-world-vendure) — wishlist/reviews plugin reference implementation
- Rendered docs (human-readable): [docs.vendure.io](https://docs.vendure.io/current/core/developer-guide/plugins)
