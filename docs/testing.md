# Verification and evidence

[Home](../README.md) · [Setup](setup.md) · [Domain tests](../prototype/tests/domain.test.mjs) · [API test](../prototype/tests/integration.mjs)

## Reproduce

From `prototype/`, install the locked dependencies and run:

```bash
pnpm run verify
```

The [CI workflow](../.github/workflows/verify.yml) runs the same command. The workflow badge links to actual GitHub execution status; no manual pass badge is used.

## Automated coverage

| Check | Evidence / invariant |
| --- | --- |
| TypeScript | `pnpm run check`; type-checks application and server code |
| 10 domain tests | Full journey; retry deduplication; stale updates; handover/payment order; overpayment; demo role/expiry rules; repair eligibility; units/amounts; transport; dispute blocking; UPI reference validation |
| Production build | Compiles UI and Worker routes; does not establish mobile usability |
| Fresh local database | Integration harness applies Drizzle migration to a new temporary D1 store before serving |
| API journey | Create → sample offers → accept → propose/confirm handover → record/confirm payment → persisted paid snapshot |
| Negative API checks | Negative quantity, duplicate creation, cross-owner lot/media access, missing identity and wrong Origin |
| Media | Upload and read back a synthetic PNG with an owner check |
| PWA assets | Root, manifest, service worker and icons return successfully; worker syntax checked |
| Documentation | Local link targets resolve; external link access and heading fragments remain separate review |

## Dated local evidence

The 22 October 2026 review records actual commands and outcomes in [verification.json](evidence/verification.json), with [domain output](evidence/domain-tests.txt), [API output](evidence/api-integration.txt) and [build output](evidence/build.txt). [Source hashes](evidence/source-manifest.json) identify the code/configuration tested. Re-run the checks when those files change.

A [23 October follow-up](evidence/verification-followup.txt) repeated the complete local verification after improving failure diagnostics in the integration harness. No page or API assertion was removed.

The initial local verification reuses installed locked dependencies from the earlier prototype workspace; it is not evidence of a fresh internet dependency installation. GitHub Actions performs its own dependency installation. Neither automated path is a physical-device test or a penetration test.

## Manual device acceptance

**Status: pending.** No browser screenshots, physical-device results or recorded user success rate are fabricated. Capture the commit, phone model, OS/browser, language, date, observed result and a sanitised screenshot/video for each test.

| ID | Procedure | Pass condition |
| --- | --- | --- |
| M01 | Open production online and install from Chrome | Home-screen app opens with correct icon/name and usable navigation |
| M02 | After online initialisation/cache, disconnect; create a lot with photo/audio; reload | Draft and attachment remain; queued/offline status is clear |
| M03 | Reconnect with app open; manually retry sync twice | One server lot exists with its attachments; no duplicate |
| M04 | Follow the [two-part payment demo](demo.md) | Balance changes only on collector confirmation |
| M05 | Repeat core tasks in Hindi/Marathi/English | Labels fit, controls readable, errors understandable; record assistance needed |
| M06 | Deny camera/microphone permissions, then retry permitted capture | Clear fallback/error; no crash or lost saved draft |
| M07 | Test small screen, keyboard navigation, zoom and screen reader | No blocked controls, clipped critical text or inaccessible actions |
| M08 | Log out/change owner and inspect cached/offline data | Record current privacy gaps; do not assume automatic cache erasure |
| M09 | Interrupt upload and reload after reconnect | Retry succeeds or clearly reports failure; record any lost/unlinked media |

A development server skips production service-worker registration. Run M01–M03 against a production build with an appropriate trusted identity boundary. API retry tests alone do not satisfy these browser checks.

## Field results

The deck links research material, but respondent-level evidence was not available for audit. No interview count, partner verification, income uplift, safety result, model accuracy or recycling volume is claimed. Use the [field protocol](validation-plan.md) and publish only consented, de-identified summaries.
