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
| ESLint | Verification requires zero lint warnings |
| TypeScript | `pnpm run check`; type-checks application and server code |
| Domain tests | Full journey; retry deduplication; stale updates; handover/payment order; overpayment; demo role/expiry rules; repair eligibility; units/amounts; transport; dispute blocking; UPI reference validation |
| Production build | Compiles UI and Worker routes; does not establish mobile usability |
| Fresh local database | Integration harness applies Drizzle migration to a new temporary D1 store before serving |
| API journey | Create → sample offers → accept → propose/confirm handover → record/confirm payment → persisted paid snapshot |
| API validation and isolation | Duplicate lot and payment requests, stale updates, account switches, cross-owner lot/media access, missing identity, invalid inputs and wrong Origin |
| Media | Round-trip a synthetic PNG, check ownership and reject conflicting retries, incorrect type and oversized uploads |
| PWA assets | Root, manifest, service worker and icons return successfully; worker syntax checked |
| Documentation | Local link targets resolve; external link access and heading fragments remain separate review |

## Desktop Chromium verification

On 20 November 2026, the production build of [commit 4021aca](https://github.com/kartiksingh6734/E-Chakra-/commit/4021aca744ec7f5c7571bbd730d1782af594e638) passed lint, TypeScript, 19 regression tests, the production build and the fresh-database API journey. [GitHub Actions run](https://github.com/kartiksingh6734/E-Chakra-/actions/runs/44673368931)

The browser checks used Chromium 156.0.8078.79 on Debian, local D1/R2 storage, synthetic accounts, a sample image and a simulated microphone. The recording uses a 390-pixel viewport. [Recorded walkthrough](evidence/desktop-chromium/demo.webm)

| Check | Observed result |
| --- | --- |
| Offline capture and retry | A lot with a photo and voice note survived offline reload. Two reconnects produced one server lot with both attachments. [Queued draft](evidence/desktop-chromium/queued.png) |
| Handover and payment | A whole-piece handover accepted two pieces. For a separate 9 kg handover, ₹1,200.19 and ₹1,799.81 settled a ₹3,000 balance only after collector confirmation. The CSV included the confirmed handover and excluded the pending one. [Paid record](evidence/desktop-chromium/records.png) |
| Accounts and device storage | Signing out or switching accounts hid the previous records. Clearing local data from Settings paused both open tabs. Server records remained available after an explicit online reopen. |
| Recovery | A server-acknowledged lot survived a failed refresh and subsequent offline reload. Denying microphone permission preserved the form, and expired offers became unselectable without input. |
| Layout and accessibility | Seven screens fit a 320-pixel viewport in Hindi, Marathi and English. Automated axe-core checks reported zero violations on those screens at 390 and 1,280 pixels. Android hardware and screen-reader acceptance are still pending. |

## Dated local evidence

The 22 October 2026 review records actual commands and outcomes in [verification.json](evidence/verification.json), with [domain output](evidence/domain-tests.txt), [API output](evidence/api-integration.txt) and [build output](evidence/build.txt). [Source hashes](evidence/source-manifest.json) identify the code/configuration tested. Re-run the checks when those files change.

A [23 October follow-up](evidence/verification-followup.txt) repeated the complete local verification after improving failure diagnostics in the integration harness. No page or API assertion was removed.

The initial local verification reuses installed locked dependencies from the earlier prototype workspace; it is not evidence of a fresh internet dependency installation. GitHub Actions performs its own dependency installation. Neither automated path is a physical-device test or a penetration test.

## Test GitHub Pages sign-in locally

On 26 November 2026, Chromium and the Firebase Auth Emulator exercised Google sign-in, SMS code rejection and acceptance, photo and lot persistence, and sign-out across two tabs. The phone account opened an empty workspace. Returning to the Google account restored its lot. These checks use local identities and fictional numbers. Live provider activation requires the [project owner's Firebase setup](github-pages.md).

To repeat the optional [browser test](../prototype/tests/pages-auth.browser.py), run these commands from `prototype/` in separate terminals. Install Python Playwright and its Chromium browser first (`python -m pip install playwright` and `python -m playwright install chromium`). The standard `pnpm run verify` also builds the GitHub Pages release.

```sh
# Terminal 1
npx --yes firebase-tools@15.37.0 emulators:start --only auth --project demo-echakra --config github-pages/firebase.emulator.json
```

```sh
# Terminal 2
VITE_FIREBASE_AUTH_EMULATOR=true \
VITE_FIREBASE_CONFIG='{"apiKey":"test-only","authDomain":"demo-echakra.firebaseapp.com","projectId":"demo-echakra","appId":"1:123456:web:abc"}' \
pnpm run dev:pages --host 127.0.0.1 --port 8190 --strictPort
```

```sh
# Terminal 3
python tests/pages-auth.browser.py
```

## Manual device acceptance

**Physical Android acceptance is pending.** Record the commit, phone model, OS/browser, language, date, observed result and a sanitised screenshot or video for each test.

| ID | Procedure | Pass condition |
| --- | --- | --- |
| M01 | Open production online and install from Chrome | Home-screen app opens with correct icon/name and usable navigation |
| M02 | After online initialisation/cache, disconnect; create a lot with photo/audio; reload | Draft and attachment remain; queued/offline status is clear |
| M03 | Reconnect with app open; manually retry sync twice | One server lot exists with its attachments; no duplicate |
| M04 | Follow the [two-part payment demo](demo.md) | Balance changes only on collector confirmation |
| M05 | Repeat core tasks in Hindi/Marathi/English | Labels fit, controls readable, errors understandable; record assistance needed |
| M06 | Deny camera/microphone permissions, then retry permitted capture | Clear fallback/error; no crash or lost saved draft |
| M07 | Test small screen, keyboard navigation, zoom and screen reader | No blocked controls, clipped critical text or inaccessible actions |
| M08 | Switch accounts online, then clear offline data from Settings with two tabs open | The previous account’s records disappear on an online account change. Both tabs stop showing cached records after clearing. Reopen online to resume. |
| M09 | Interrupt upload and reload after reconnect | Retry succeeds or clearly reports failure; record any lost/unlinked media |

A development server skips production service-worker registration. Run M01–M03 against a production build with an appropriate trusted identity boundary. API retry tests alone do not satisfy these browser checks.

## Field results

The deck links research material, but respondent-level evidence was not available for audit. No interview count, partner verification, income uplift, safety result, model accuracy or recycling volume is claimed. Use the [field protocol](validation-plan.md) and publish only consented, de-identified summaries.
