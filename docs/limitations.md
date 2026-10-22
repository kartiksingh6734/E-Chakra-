# Known limitations and prioritised roadmap

[Home](../README.md) · [Requirements](requirements.md) · [Testing](testing.md)

## Current limits

- The hosted app is owner-private; repository access does not provide app access.
- Collector/recycler role switching is a demonstration inside one workspace. Real buyer identity and permissions are not implemented.
- Manual category selection; no trained AI, speech recognition, live price feed, maps or payment transfer.
- Synthetic buyer names, price rates, distances and authorisation labels; no verified recycler partnership is claimed.
- Offline support covers drafts/cached data with foreground sync. First use requires connectivity; offline handover/payment and closed-app background sync are absent.
- Camera/microphone, Android installation, full offline reload, language usability and accessibility need actual device evidence.
- No partial-lot remaining-quantity ledger, cancellation, revised handover negotiation, staff dispute resolution, aggregation or reward payouts.
- No portable collector identity, NBFC integration, EPR certificate, downstream recycling proof or validated impact metric.
- The API loads at most 500 recent lots. Each lot is a JSON document, event history can grow, and duplicate-mutation tracking retains only the last 256 IDs. No scale/load claim is supported.
- Local cached data is not encrypted/purged through a complete account lifecycle; retention, backup/recovery and incident processes are unfinished.

## Release gates

| Priority | Gate | Acceptance evidence |
| --- | --- | --- |
| P0: submission identity | Confirm exact official PS/issuer/deliverables | Issued public-safe brief or official link reconciled with the requirements matrix |
| P0: demonstrability | Reviewers can run or observe the exact revision | Successful clean-clone setup or arranged session; current recording with commit/device noted |
| P0: mobile acceptance | Complete core tasks on intended devices | Completed [device checklist](testing.md#manual-device-acceptance), screenshots and failures recorded |
| P0: pilot privacy | Real authentication, role permissions and device lifecycle | Separate collector/buyer accounts and negative-access tests, reviewed data handling |
| P0: receiving partners | Verify recipient identity/material scope | Dated eligibility review and receiving process; battery/hazardous-material route review |
| P1: operational completeness | Dispute resolution, cancellation and partial lots | Reconciled quantities, permission rules and repeatable tests |
| P1: field validation | Supervised consenting cohort | Anonymised observations, denominator/sample size, failures, costs and payment timing |
| P2: AI | Evaluated classifier/price/ranking models | Sourced dataset and baseline comparison with held-out evaluation |
| P2: incentives/expansion | Sustainable, funded growth | Cost/revenue evidence, reward budget, anti-abuse checks and local partner coverage |

## Suggested next development sequence

Finish reviewer/device evidence first, then independent participant accounts and buyer verification. Pilot a small material scope in one area with operational support. Introduce ML and incentives only after the required data and funding are available. Each completed item should link to code, a test/run and any field evidence rather than only changing a checkbox.
