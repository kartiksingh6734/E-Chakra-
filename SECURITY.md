# Security and demo data boundaries

[Home](README.md) · [Architecture](docs/system-architecture.md) · [Tests](docs/testing.md)

This build is a private demonstration using synthetic buyers, prices and transactions. It is not ready to store real collector financial records in a public pilot.

## GitHub Pages identity and data

The Pages release uses Firebase's Google and phone sign-in providers. Its IndexedDB keys are scoped to the Pages application, Firebase project and user ID. Sign-out unmounts the workspace and an account change invalidates in-flight local operations. The browser holds the records and media in unencrypted local storage. Anyone with control of that browser profile can inspect its storage. The public walkthrough contains synthetic data. [Activation and device-storage details](docs/github-pages.md)

The following Worker controls apply to the D1/R2 version.

## Current controls

- Production requires the `oai-authenticated-user-id` identity supplied by the trusted hosting boundary; development has a local demo fallback.
- SQL reads/writes are owner-scoped and parameterised. Lot mutations use optimistic version checks. Media lookups require the same owner.
- The API checks record fields, attachment ownership, size and file signatures. Signature checks identify the container format. Full decoding and malware scanning remain outside this build.
- Browser mutations reject a supplied cross-origin Origin header. This does not establish a complete public session/CSRF design.
- The service worker caches the collector shell and its static assets. Record and media responses use `Cache-Control: no-store`.
- CSV fields are quoted and values beginning with common spreadsheet formula prefixes are escaped.

The [compiled API tests](prototype/tests/integration.mjs) cover missing production identity, cross-owner lot/media access and an incorrect Origin. They are targeted checks, not a penetration test.

## Trust boundaries and gaps

| Boundary | Current limitation |
| --- | --- |
| Participant roles | Collector/recycler is a client-selected demo role within one owner. It is not independent role-based authentication. |
| Hosting | A public reverse proxy must not forward arbitrary client identity headers as trusted identity. Add real server-validated authentication before changing this boundary. |
| Device storage | Offline storage on this browser is unencrypted. Settings can clear all locally cached accounts, attachments and queued drafts. A user must reopen online to resume. While a device is offline, it can still show the last workspace saved on it until that data is cleared. |
| Transactions | Event history is editable application data, not an immutable audit ledger or proof of physical receipt. |
| Media | Uploaded media has basic file-signature validation. Malware scanning and orphan-media retention are still open. |
| Operations | No verified disaster recovery, retention/deletion workflow, rate limits, incident process or independent security assessment. |
| Recipient claims | Demo buyers have not undergone real registration/material-scope verification. |

## Repository hygiene

Do not commit `.env` secrets, private keys, cloud tokens, collector contacts, exact personal locations, receipts, survey responses or identifiable photos. [`.env.example`](prototype/.env.example) contains only optional non-secret local settings. Generated local databases are ignored.

For public bug reports use synthetic steps and sanitised logs. Report security-sensitive details privately through an existing trusted channel to the repository maintainer; do not post exploit details or personal data in public Issues. A dedicated security contact and response policy still need to be established before a pilot.
