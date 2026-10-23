# Security and demo data boundaries

[Home](README.md) · [Architecture](docs/system-architecture.md) · [Tests](docs/testing.md)

The original hosted build is a private demonstration using synthetic buyers, prices and transactions. An optional standalone Cloudflare build adds isolated browser sessions for a public judge demo. Neither mode is ready to store real collector financial records in a public pilot.

## Original Sites deployment controls

- Production requires the `oai-authenticated-user-id` identity supplied by the trusted hosting boundary; development has a local demo fallback.
- SQL reads/writes are owner-scoped and parameterised. Lot mutations use optimistic version checks. Media lookups require the same owner.
- Record fields are validated; attachment type/size and ownership are checked. MIME labels are not a full content or malware inspection.
- Browser mutations reject a supplied cross-origin Origin header. This does not establish a complete public session/CSRF design.
- The service worker excludes API/auth routes. API record responses use `Cache-Control: no-store`; private media is cacheable for one hour.
- CSV fields are quoted and values beginning with common spreadsheet formula prefixes are escaped.

The [compiled API tests](prototype/tests/integration.mjs) cover missing production identity, cross-owner lot/media access and an incorrect Origin. They are targeted checks, not a penetration test.

## Standalone Cloudflare demo controls

The [standalone Worker](prototype/cloudflare/worker.ts) never trusts a client-supplied hosting identity header. It validates an unguessable 256-bit browser-session token against a stored digest and expiration. The cookie is HttpOnly, Secure and SameSite=Strict. Writes require a matching Origin, cross-site browser requests are rejected, and request bodies have streaming size limits.

Lots, profiles and attachments are session-scoped. Attachments are written in transactional D1 chunks with per-session/global storage caps. The hourly retention job cascades expired sessions after 30 days. API/media responses are not cacheable, and static assets include CSP and framing restrictions. [Integration tests](prototype/tests/cloudflare.integration.mjs) exercise forged identity headers, other-session reads/writes, private uploads, retries, CSRF checks, quotas and expiry cleanup.

This is device-session separation, **not verified collector/recycler authentication**. Clearing cookies loses server access; offline IndexedDB data is not automatically erased. Rate limiting, malware scanning, recovery accounts and real participant permissions remain absent. Use synthetic inputs only. See the [deployment boundaries](docs/cloudflare-deployment.md) before publishing.

## Trust boundaries and gaps

| Boundary | Current limitation |
| --- | --- |
| Participant roles | Collector/recycler is a client-selected demo role within one owner. It is not independent role-based authentication. |
| Hosting | The original Sites entry point requires its trusted proxy. Use the separate session-validating Worker for the judge demo; real participant authentication remains a pilot requirement. |
| Device storage | IndexedDB caches the last owner's data without application-level encryption or a complete logout purge. Shared/lost devices and storage eviction are untested. |
| Transactions | Event history is editable application data, not an immutable audit ledger or proof of physical receipt. |
| Media | No malware scanning or image-signature validation. Standalone session expiry also removes unattached media; the original Sites store has no retention job. |
| Operations | No verified disaster recovery, production rate limits, incident process or independent security assessment. Standalone cleanup is limited to disposable demo sessions. |
| Recipient claims | Demo buyers have not undergone real registration/material-scope verification. |

## Repository hygiene

Do not commit `.env` secrets, private keys, cloud tokens, collector contacts, exact personal locations, receipts, survey responses or identifiable photos. [`.env.example`](prototype/.env.example) contains only optional non-secret local settings. Generated local databases are ignored.

For public bug reports use synthetic steps and sanitised logs. Report security-sensitive details privately through an existing trusted channel to the repository maintainer; do not post exploit details or personal data in public Issues. A dedicated security contact and response policy still need to be established before a pilot.
