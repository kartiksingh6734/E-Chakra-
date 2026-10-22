# API and record contract

[Home](../README.md) · [Architecture](system-architecture.md) · [Security](../SECURITY.md)

Source: [record routes](../prototype/app/api/ec/route.ts), [media routes](../prototype/app/api/media/route.ts), [domain types/rules](../prototype/lib/domain.ts).

## Routes

| Method / path | Purpose | Input / response |
| --- | --- | --- |
| `GET /api/ec` | Read this owner's snapshot | `scope`, up to 500 recent `lots`, `profile`, `samplePrices: true` |
| `POST /api/ec` | Update profile | `action: profile`, `profile: {name, location, language}` |
| `POST /api/ec` | Create a lot idempotently | `action: create_lot`, `lot: {id, category, quantity, condition, location, notes, createdAt, photoId?, audioId?}`; returns `lot` |
| `POST /api/ec` | Apply a transaction action | `action`, `id`, `version`, `opId`, `role`, plus fields below; returns updated `lot` |
| `PUT /api/media?id=UUID` | Upload attachment bytes | JPEG/PNG/WebP or WebM/MP4/OGG audio; >0 and at most 2,000,000 bytes; returns `id` |
| `GET /api/media?id=UUID` | Read owned attachment | Binary body with recorded media type; another owner receives 404 |

Uploaded attachment IDs must belong to the owner before being linked to a lot. Input category is one of the eight [catalog entries](../prototype/lib/domain.ts); LCD panels/motors use whole pieces, other categories use kg. Quantities must be positive and at most 100,000. Creation requests are limited to 20,000 characters by the record endpoint.

## Mutations

| Action | Demo role | Additional fields / rule |
| --- | --- | --- |
| `sample_offers` | Either demo role | Open lot with no offers; creates synthetic quotes |
| `create_offer` | Recycler | `buyerId`, `rate`, `charge`, `pickup`; compatible demo buyer |
| `accept_offer` | Collector | `offerId`; open lot, unexpired quote |
| `propose_handover` | Recycler | `quantity`, `amount`, `location`; accepted lot |
| `confirm_handover` | Collector | Proposed handover exists |
| `record_payment` | Recycler | `amount`, `method: cash/upi`, `reference` for UPI; acknowledged handover |
| `confirm_payment` | Collector | `paymentId`; unconfirmed payment claim |
| `dispute` | Collector | `reason` of at least five characters; accepted/handover/received state |

`opId` identifies the intended mutation, not each network attempt. Retrying the same mutation should reuse it. The UI currently creates a fresh operation ID on a new user attempt; lot creation reuses the persisted draft UUID. Only the last 256 mutation IDs are retained. A stale `version` returns 409.

## Authentication and errors

Production trusts a hosting-injected owner header. This is a private demo deployment adapter, not a general-purpose public authentication API. Domain `role` values arrive from the client and simulate the two sides. See [security](../SECURITY.md) before adapting hosting.

| HTTP code | Meaning |
| --- | --- |
| 400 | Invalid input, unknown transition or business rule failure |
| 401 | Missing production owner identity |
| 403 | Provided request origin differs from the application's origin |
| 404 | Lot/media not available to this owner |
| 409 | Stale update or media identifier conflict |
| 413 | Oversized record request or media attachment |
| 503 | Storage or unexpected server failure |

Record responses are `no-store`. Media responses are private-cacheable for up to one hour. Request origin checking is one boundary check; it does not replace real session authentication or a complete CSRF design. [Integration tests](../prototype/tests/integration.mjs) exercise the compiled routes with synthetic trusted identities in a local harness.
