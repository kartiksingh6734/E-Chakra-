# E-CHAKRA collector PWA

This directory contains the executable collector prototype and recycler demo mode.

[Project overview](../README.md) · [Run locally](../docs/setup.md) · [Demo](../docs/demo.md) · [Architecture](../docs/system-architecture.md) · [Tests](../docs/testing.md) · [Limitations](../docs/limitations.md)

## Quick start

Use Node 24 and pnpm 11.25.0. No cloud credentials are needed for local development.

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:local
pnpm run dev
```

Open `http://localhost:5173`. `db:local` applies migrations locally and can be repeated safely. Use the [synthetic walkthrough](../docs/demo.md); no dataset seed is required.

```bash
pnpm run verify
```

Verification covers documentation links, types, 10 domain tests, service-worker syntax, build and the API on an isolated fresh local database. Manual installation/camera/offline reload tests remain separate.

## Code map

| Path | Responsibility |
| --- | --- |
| [app/collector-app.tsx](app/collector-app.tsx) | Collector/recycler demonstration UI |
| [lib/domain.ts](lib/domain.ts) | Workflow, quantities, offer and payment rules |
| [lib/offline.ts](lib/offline.ts) | IndexedDB drafts/media and API helpers |
| [lib/i18n.ts](lib/i18n.ts) | Hindi, Marathi and English copy |
| [app/api/ec/route.ts](app/api/ec/route.ts) | Scoped profile/lot API |
| [app/api/media/route.ts](app/api/media/route.ts) | Private attachments |
| [db/schema.ts](db/schema.ts), [drizzle/](drizzle/) | D1 schema and generated migration |
| [public/sw.js](public/sw.js) | Production app-shell cache |
| [tests/](tests/) | Domain and compiled-API checks |

The app is a PWA, not a native APK. Synthetic buyers/rates and a single-owner role switch are deliberate demo boundaries. Manual category selection is not AI inference; payment records do not move funds. See [security](../SECURITY.md) before adapting the hosted identity mechanism.

## Standalone Cloudflare option

For a separate free-hosted judge demo without ChatGPT login, use the [Cloudflare guide](../docs/cloudflare-deployment.md). `cloudflare:build`, `cloudflare:db:local` and `cloudflare:dev` run the standalone mode locally. `cloudflare:test` covers its sessions, uploads and complete transaction journey. The ordinary `verify` command checks both modes. Deployment requires the team's Cloudflare account and a dedicated D1 database; it does not migrate the private hosted data.
