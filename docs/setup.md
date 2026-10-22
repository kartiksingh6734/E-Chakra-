# Run and verify E-CHAKRA

[Home](../README.md) · [Demo](demo.md) · [Test evidence](testing.md) · [Security](../SECURITY.md)

## Requirements

- Node.js **24.x**, recorded in [`.nvmrc`](../prototype/.nvmrc).
- pnpm **11.25.0**, pinned by [`packageManager`](../prototype/package.json).
- Internet for the initial dependency installation; local D1/R2 emulation requires no cloud account or API keys.
- A supported desktop OS/browser. Physical Android compatibility remains a separate acceptance check.

If you already use nvm, run `nvm install` then `nvm use` inside `prototype/`. Install the package manager with `npm install --global pnpm@11.25.0`. Do not use `sudo` with an nvm-managed Node installation.

## Fresh clone

```bash
git clone https://github.com/kartiksingh6734/E-Chakra-.git
cd E-Chakra-/prototype
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:local
pnpm run dev
```

Open `http://localhost:5173`. Local development supplies a demo owner. Select English if following the [English walkthrough](demo.md), or use Hindi/Marathi. Start with an empty lot list; sample buyers/rates are in code, and **Add demo offers** creates quotes for a saved lot. No customer dataset import is needed.

`db:local` always operates locally and uses a migration ledger. Repeating it is safe. Generated configuration and data stay in ignored `.wrangler/` directories. Avoid running the old one-off `d1 execute --file` command against a database that has already received the initial migration.

## Verification

```bash
pnpm run verify
```

This runs link checks, TypeScript, 10 domain tests, service-worker syntax validation, the production build and the built API integration test. The integration test creates an isolated temporary D1/R2 store, applies migrations, starts its own loopback server, performs synthetic transactions and removes that store when finished. It does not modify the local interactive demo database or hosted data.

Individual commands:

```bash
pnpm run check
pnpm test
pnpm run build
pnpm run test:integration
node ../scripts/check-docs.mjs
```

The API test requires a completed build. The [GitHub workflow](../.github/workflows/verify.yml) installs the pinned dependencies and runs the same `verify` command; use its actual run status as CI evidence.

## Configuration and deployment

[`.env.example`](../prototype/.env.example) describes optional local tool settings. No application API secret is needed for this build. `DB` and `BUCKET` are logical D1/R2 bindings. [Hosting configuration](../prototype/.openai/hosting.json) identifies the existing private deployment and contains no secret token.

Production requires trusted server-supplied identity. Do not expose the built Worker as a public standalone service while trusting a client-provided `oai-authenticated-user-id` header. Replace that adapter with genuine authentication if changing the hosting boundary. See [security](../SECURITY.md).

The maintained hosted app is owner-private. Repository visibility does not grant app access. Arrange a maintainer-led review or run locally. No deployment or sharing change is performed by the CI workflow.

## Offline / install testing

The development server intentionally does not register the production service worker. Use the installed/hosted production build for the manual Android offline and installation checklist in [testing](testing.md#manual-device-acceptance). Open online once, wait for caching, then test without connectivity. Keeping the app open is required for sync.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `pnpm` not found | Install the pinned version using the active Node installation |
| Unsupported Node / dependency engine | Switch to Node 24; do not remove the lockfile |
| Missing `dist/server/wrangler.json` | Run `pnpm run build` first |
| Missing database table | Run `pnpm run db:local`, then restart development |
| Port 5173 occupied | Stop your other local development server and restart `pnpm run dev` |
| Hosted sign-in/access prompt | Use the owning account for a maintainer-led session; this is not public reviewer access |
| Camera/microphone blocked | Check browser permissions and secure-context support; file upload remains available |
| Sample quotes expired | Create a new demo lot; quotes have a three-day validity period |

On a 4 GB laptop, close heavy apps while installing/building. The domain tests run without a browser; a production build may need more memory. If a build runs out of memory, use the GitHub Actions verification logs or a better-equipped machine; no low-end performance result is claimed.
