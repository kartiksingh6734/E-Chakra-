# Requirements and implementation evidence

[Home](../README.md) · [PS provenance](problem-statement.md) · [Demo](demo.md) · [Testing](testing.md)

This matrix covers the team's presentation and design, pending reconciliation with the official PS. **Implemented** means present in code, not automatically tested on a phone or validated with collectors. **Partial** means a bounded part works. **Simulated** means synthetic data/participants or demo roles. **Planned** means not implemented.

| ID | Requirement / claim | Status | Implementation | Evidence and boundary |
| --- | --- | --- | --- | --- |
| R01 | Lot category, condition, quantity and location | Implemented | [UI](../prototype/app/collector-app.tsx), [API](../prototype/app/api/ec/route.ts) | Creation/invalid quantity checked; manual category |
| R02 | Photo and voice-supported entry | Partial | [Compression](../prototype/lib/offline.ts), [recording](../prototype/app/collector-app.tsx), [media API](../prototype/app/api/media/route.ts) | Image read/write checked; camera/microphone need device tests; no transcription |
| R03 | Offline capture and synchronisation | Partial | [Queue](../prototype/lib/offline.ts), [service worker](../prototype/public/sw.js), [sync](../prototype/app/collector-app.tsx) | API retry safety checked; complete offline/reload/reconnect test pending; foreground only |
| R04 | Local-language access | Implemented | [Hindi/Marathi/English](../prototype/lib/i18n.ts) | UI/forms exist; native-speaker review and some English error localisation remain |
| R05 | AI material identification | Planned | [ML plan](data-plan.md) | Manual categories; no trained model, dataset or accuracy result |
| R06 | Price discovery / prediction | Simulated | [Sample rates](../prototype/lib/domain.ts), [offers UI](../prototype/app/collector-app.tsx) | Synthetic estimates/offers; no market feed or prediction model |
| R07 | Authorised recycler connections | Simulated | [BUYERS / validBuyer](../prototype/lib/domain.ts) | No real registry check, onboarding or independent buyer identity |
| R08 | Offer expiry / transport deductions | Implemented | [offerTotal / mutateLot](../prototype/lib/domain.ts) | Domain tests cover both; no payment-due-date or minimum-lot filter |
| R09 | Agreed handover terms / records | Implemented | [Domain](../prototype/lib/domain.ts), [versioned API](../prototype/app/api/ec/route.ts) | Built API journey; two roles in one owner's workspace |
| R10 | Cash-first partial payment records | Implemented | [Rules](../prototype/lib/domain.ts), [receipts/export](../prototype/app/collector-app.tsx) | Partial confirmation/overpayment checks; no money transfer |
| R11 | Owner record isolation | Implemented | [Identity](../prototype/lib/server.ts), [scoped SQL](../prototype/app/api/ec/route.ts) | Two-owner API/media tests; trusted hosting identity required |
| R12 | Independent participant login | Planned | [Security](../SECURITY.md) | Client role switch is a demo control, not authentication |
| R13 | Safer handling guidance | Partial | [Help screen](../prototype/app/collector-app.tsx) | Pictorial cards/optional device speech; reviewed curriculum/outcomes pending |
| R14 | Repair-shop route for reuse | Simulated | [validBuyer](../prototype/lib/domain.ts) | Demo shop for reusable LCD/PCB/motors; real recipient checks pending |
| R15 | Report discrepancies | Partial | [dispute](../prototype/lib/domain.ts) | Freezes transitions; resolution/cancellation absent |
| R16 | Collector ID / work history / loans | Planned | [Roadmap](limitations.md) | Lot UUID/history exists; portable collector identity/NBFC integration absent |
| R17 | Referral incentives / bonuses | Planned | [Funding](feasibility.md) | No reward ledger, funding, anti-abuse checks or payouts |
| R18 | EPR / environmental impact | Planned | [Validation](validation-plan.md) | Receipts only; no certificates, measured diversion or causal impact |
| R19 | Installable mobile experience | Partial | [Manifest](../prototype/public/manifest.webmanifest), [SW](../prototype/public/sw.js) | Assets/build checked; Android installation/standalone behaviour pending |

Use these statuses consistently in slides and demonstrations. A screenshot, API test or diagram establishes only what it actually shows. [Testing](testing.md) distinguishes automated results from device acceptance; [data provenance](data-plan.md) separates sample values from field observations.
