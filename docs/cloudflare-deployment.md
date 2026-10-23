# Standalone Cloudflare judge demo

[Home](../README.md) · [Setup](setup.md) · [Security](../SECURITY.md) · [Test coverage](testing.md)

This deployment option serves the collector prototype on a Cloudflare `workers.dev` address, with no ChatGPT login. It is a **separate synthetic-data demo**. It does not copy the existing private hosted database or change the original site's audience.

The proposed address is `echakra.theoptimist.workers.dev`. `echakra` is the configured Worker name; `theoptimist` would be the account's Workers subdomain. The account subdomain must be available and selected in Cloudflare. **This address is not a live deployment claim.** No `.tech` domain is registered by this setup.

## What changes

| Concern | Original hosted version | Standalone judge demo |
| --- | --- | --- |
| UI | React through Vinext | Same React collector UI, built as static assets with Vite |
| API/workflow | Vinext API wrappers | Small Worker using the shared collector API and domain rules |
| Visitor access | Trusted hosting identity | Random, server-validated browser session; no identity verification |
| Records | Private hosted D1 | New D1 database in the team's own account |
| Attachments | R2 objects | Small D1 chunks, capped for demonstration use |
| Billing setup | Managed by original host | Workers Free + D1; no R2 subscription or paid upgrade required by this configuration |

Visitor sessions use an HttpOnly, Secure, SameSite=Strict cookie. Only a SHA-256 digest of the random token is stored. The standalone Worker ignores caller-supplied hosting identity headers. Write requests require a matching Origin; cross-site browser requests are rejected. Collector/recycler switching remains a simulation inside one session, not separate participant authentication.

## Local verification

From `prototype/`, with Node 24 and the locked dependencies installed:

```bash
pnpm run cloudflare:build
pnpm run cloudflare:db:local
pnpm run cloudflare:dev
```

Open the localhost URL Wrangler prints. Test with sample inputs only. The secure session cookie works in browsers that treat localhost as trustworthy; an arbitrary HTTP LAN address will not work. Use HTTPS for hosted or phone testing.

```bash
pnpm run cloudflare:test
pnpm run cloudflare:deploy --dry-run
```

The integration test uses its own temporary database. The dry run builds the assets and bundles the Worker without provisioning or publishing anything. `pnpm run verify` also checks both deployment modes and the shared workflow rules.

## First deployment in the team's account

1. Sign in to Cloudflare. Keep **Workers Free**; no card, R2 activation or paid upgrade is part of this deployment.
2. In Workers & Pages, select the account's available `workers.dev` subdomain. Confirm the final address before changing an existing account subdomain that serves other projects.
3. Authenticate Wrangler on a trusted computer with `pnpm exec wrangler login`. Never paste tokens or sign-in codes into chat or commit them.
4. Create a dedicated D1 database:

   ```bash
   pnpm exec wrangler d1 create echakra-demo
   ```

5. Copy the **database UUID**, not a credential, from that result:

   ```bash
   pnpm run cloudflare:configure YOUR_D1_DATABASE_UUID
   ```

   Optionally pass the Cloudflare account ID as a second argument when more than one account is accessible. The command writes an ignored local configuration. The checked-in placeholder is only for local emulation and dry runs.

6. After local verification, publish:

   ```bash
   pnpm run cloudflare:deploy
   ```

   This command builds static assets, applies the separate Cloudflare migrations to the selected remote D1 database, and deploys Worker `echakra`. It stops if no real database is configured or any step fails. Use only the dedicated demo database; the migration is not designed for an existing Sites schema.

7. Open the exact URL printed by Wrangler, in two separate browser profiles. Check that each starts with its own empty lot list. In one profile, complete a photo/voice lot, sample offers, handover, payment confirmation and reload. Verify that the other profile cannot see those records. Check Hindi/Marathi/English, mobile layout and offline draft/reconnect behavior before sharing with judges.

Cloudflare's GitHub build integration is optional. If used later, keep the root directory at `prototype`, build with `pnpm run cloudflare:build`, and generate the local config from the non-secret database/account IDs before `pnpm run cloudflare:deploy`. Connecting GitHub or granting cloud permissions is a separate account action; the repository's verification workflow never deploys automatically.

## Demo limits and retention

- Browser sessions expire 30 days after creation. Access is lost if cookies are cleared; there is no password recovery or cross-device account. Local drafts/caches can remain on the device.
- An hourly job deletes expired sessions and cascades their server records and attachments, in batches of 100. Cloudflare backup retention is separate; this is not a guarantee of immediate deletion from backups.
- Maximum 100 lots and 20 attachments per session; 10 MB of attachments per session; each attachment at most 2 MB.
- Global caps: 500 sessions, 2,000 lots and 64 MB of attachments. SQL triggers enforce caps atomically. A lot document is limited to 100 KB.
- No R2 billing subscription is enabled. The D1 attachment adapter is for a bounded demo, not production media storage. Large upload performance and free-plan CPU headroom must be checked on the actual deployment.
- Free platform limits still apply. If storage, request or CPU limits are reached, the app can fail or pause; this configuration does not enable automatic paid overages. Application caps are not a complete anti-abuse or production rate-limit system.
- Do not enter actual financial records, personal contacts or identifiable collector photos. Existing safety/sample-data labels remain visible.

## Official platform references

- [Workers.dev naming and routing](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 setup](https://developers.cloudflare.com/d1/get-started/) and [migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [R2 setup](https://developers.cloudflare.com/r2/get-started/) explains the subscription flow avoided by this demo adapter.
