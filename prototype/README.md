# E-CHAKRA working prototype

A mobile-first, installable web app for SIH 2026 PS 26229 (team 135129, The Optimist). Based on the team's October 8 presentation and existing repository workflow.

## Try the app

Open the private deployed link while signed in to the owning ChatGPT account. On Android Chrome, open the browser menu and choose **Add to Home screen / Install app**. This build is a PWA, not a native APK or a Play Store release.

1. Select Hindi, Marathi or English.
2. Create a lot: add a photo or voice note, manually confirm its category, and enter quantity and location.
3. Save it. An offline lot stays in IndexedDB; reconnect and use Sync now if needed.
4. Open the lot and choose **Add demo offers**, or open the recycler demo and submit your own offer.
5. As collector, choose an offer.
6. Switch to the recycler demo and record the received quantity, final amount and handover location.
7. Return to collector and confirm those terms.
8. As recycler, record a cash payment or an externally paid UPI reference.
9. As collector, separately confirm the money received. Download the receipt or export the ledger.

The two demo roles belong to the same private owner. Switching roles demonstrates both sides; it is not independent buyer authentication.

## What works

- Hindi, Marathi and English navigation and forms.
- Eight material categories with kg/piece units and manual category confirmation.
- Compressed photo capture/upload and a voice recording of up to 30 seconds, subject to device/browser permissions.
- Persistent offline drafts, images and recordings; foreground reconnection sync with idempotent lot creation.
- Persistent server records and private media.
- Demo offer comparison, transport deductions and expired-offer rejection.
- Received quantity and price proposal followed by collector confirmation.
- Partial payments, pending dues and separate collector receipt confirmation.
- Downloadable text receipts and CSV records.
- Issue reporting that freezes the transaction for review.
- Pictorial safety guidance, with device speech output where a suitable language voice is installed.

Open once online before testing offline mode. Keep the app open to sync; background sync with the app closed is not implemented. Local records can be lost if browser/app storage is cleared. Up to 500 recent server lots are loaded in this prototype.

## Stack decision

| Part | This build | Reason |
| --- | --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS | Builds on the presentation's React direction, with one responsive interface |
| App packaging | PWA manifest and service worker | Installable from Android Chrome without an app-store release |
| Offline | IndexedDB draft/media queue and cached app shell | Preserves capture while disconnected |
| API | TypeScript route handlers on a Cloudflare Worker, via Vinext | One deployable service for the first working demo |
| Structured storage | Cloudflare D1 (SQLite), generated Drizzle migrations | Persistent hosted records without a separately provisioned database |
| Media | Cloudflare R2 | Photo/audio bytes kept outside the database |
| Workflow rules | Pure TypeScript domain functions | Independently testable status, role and payment rules |

**Difference from the slide:** this hosted prototype uses SQLite and a Worker API rather than PostgreSQL and Express. PostgreSQL remains the proposed larger-deployment database. A separate Python/FastAPI ML service should be added only when a sourced training dataset and evaluated models exist.

## Explicit prototype limits

Prices, buyer names, distances and authorisation labels are sample data, not live market information or verified partner claims. Estimates, offers and final sale values remain separate.

Material recognition, trained price prediction and ML matching are not implemented. Categories are confirmed manually, estimates use a transparent sample-rate table, and demo buyers are filtered by material/condition. There is no live Razorpay/payment transfer, Google Maps integration, loan approval, EPR certificate generation, independently authenticated recycler account, rewards payout or aggregator batching.

The private hosting boundary and account-scoped records protect this demonstration. Before a real collector pilot, add independent phone/role authentication, authorisation verification, stronger offline device privacy, tested Android compatibility, real location/rate data, operational dispute handling and retention rules. Avoid entering real personal or financial information into a demo.

## Develop

Use Node 24 and pnpm (the version in package.json). Install with `pnpm install --frozen-lockfile`.

```sh
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_watery_storm.sql
pnpm run dev
```

Apply that initial migration only once to a new local database. The hosting platform applies versioned migrations on deployment. In this managed workspace, use the Sites preview/publish workflow. On a normal development machine, the starter selects its portable execution profile.

Development mode uses a local demo owner when no platform identity is present. Production requires the platform-authenticated user header. An independent deployment must replace that adapter with genuine server-validated authentication; do not trust client-supplied identity headers on a publicly exposed origin.

```sh
node node_modules/typescript/bin/tsc --noEmit
node --experimental-transform-types --test tests/domain.test.mjs
```

## Structure

- `app/collector-app.tsx`: collector/recycler UI.
- `lib/domain.ts`: workflow, money and matching rules.
- `lib/offline.ts`: IndexedDB and upload queue.
- `lib/i18n.ts`: three-language copy.
- `app/api/ec/route.ts`: record/profile API.
- `app/api/media/route.ts`: private attachment API.
- `db/schema.ts`, `drizzle/`: schema and generated migrations.
- `public/sw.js`, `public/manifest.webmanifest`: PWA shell.
- `tests/`: workflow checks.

A confirmed handover is a receipt record, not evidence that downstream recycling was completed.

## Validation of this build

TypeScript checks and the production build pass. Ten domain tests cover payment separation, retries, stale updates, role restrictions, expired offers, repair eligibility, units, transport deductions and disputes. The built HTTP API passed the complete lot-to-payment journey, photo upload/read-back, account isolation, missing-auth and cross-origin rejection, and PWA asset checks. Browser-based installation, offline reload, camera/microphone and layout checks on an actual Android device remain to be performed. WebMCP registration could not be exercised in a supported browser context.
