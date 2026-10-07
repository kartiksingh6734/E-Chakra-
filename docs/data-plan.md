# Data plan

[Project overview](../README.md) · [Architecture](system-architecture.md) · [Validation plan](validation-plan.md)

The project does not yet include a collected dataset. This plan defines what to collect, how to check it and how each record will be used. Real observations, participant statements and demonstration data must remain distinguishable.

## Start with a small, reviewable catalogue

Begin with material types that a pilot recycler confirms it can accept, such as intact small electronics and cable lots. Capture category, subcategory, condition and unit separately. A count of devices is not a measured weight, and a photograph alone does not establish metal content or grade.

The original candidate list includes CRTs, LCD panels, PCBs, motors, magnet-bearing assemblies and electronic plastics. These need category-specific buyer and handling checks before inclusion. The interface must not ask collectors to dismantle equipment to identify or photograph its contents.

Waste batteries require a separate route and recipient checks. They are excluded from the ordinary e-waste demo catalogue until that route is defined; the [2022 e-waste rules](https://eprewaste.cpcb.gov.in/assets/PDF/e-waste_rules_2022.pdf) distinguish them from the e-waste stream. See [sources](references.md) for the separate battery framework.

## Essential records

| Record | Minimum information | Source and verification |
| --- | --- | --- |
| Collector | Internal reference, preferred name, necessary contact method, language, operating area and consent record. | Collector or assisted entry confirmed with the collector. Record who provided assistance. |
| Lot | Owner, category/subcategory, condition, quantity, unit, whether quantity is estimated or measured, photos and capture date. | Collector entry; retain corrections made at handover. |
| Buyer | Role, legal/facility identity, service area, accepted categories, minimum lot size, registration reference, check source/date and status. | Participant information checked against relevant official records; keep evidence and review history. |
| Price observation | Category, condition/grade, area, observation date, rate or total amount, currency, unit, source and verification status. | Dated buyer quotations, field observations and confirmed transactions, each labelled by type. |
| Offer | Lot and buyer references, rate/unit, quantity conditions, deductions, pickup/drop-off terms, validity and payment timing. | Buyer submission; retain the exact version accepted by the collector. |
| Handover | Source lots, parties, accepted and rejected quantities, units, final terms, time and both acknowledgements. | Participant confirmations and receipt evidence; unresolved discrepancies stay flagged. |
| Payment | Linked transaction, amount, currency, method, claimed time, recipient confirmation and remaining balance. | Payment claim plus confirmation; a screenshot or entered reference alone is not conclusive proof. |

Repair/refurbishment participants have a separate role. An aggregator or repair shop must not inherit recycler status just by joining the platform. Relevant registration and material scope need checking before a formal referral is enabled.

## Price meanings must stay clear

| Value | Meaning |
| --- | --- |
| Historical observation | A dated record for a particular material, condition, unit and area. |
| Indicative estimate | A reference derived from comparable reviewed observations, or later from an evaluated model. |
| Buyer offer | A buyer's proposal with validity, quantity conditions and stated costs. |
| Final payable amount | The amount agreed for the quantity actually accepted, after agreed deductions. |
| Amount received | Confirmed payment, which may cover only part of the payable amount. |

For initial estimates, compare records with compatible categories, grades, locations, units and dates. Show the observation count, date range and a representative range or median. If records are too sparse or incompatible, display “Price reference unavailable” and allow buyers to quote.

Do not mix per-item prices with per-kilogram prices or use an unverified average as a guaranteed market rate. Store model-generated estimates separately from observed sale prices so estimates do not become their own training targets.

## Validation and maintenance

- Reject missing units, impossible quantities and repeated event identifiers. Treat missing values differently from zero.
- Keep estimates, accepted quantities and rejected quantities separately. Reconcile source contributions when lots are split or combined.
- Review unusual prices with their source before excluding or correcting them. Keep the reason and previous value.
- Recheck buyer records before onboarding and when their status, validity or material scope changes. Record the evidence date shown to collectors.
- Collect consent for field images and dataset use. Avoid household faces, private documents and unrelated device-screen contents.
- Keep contact details, receipts and exact locations out of this public repository. Publish only consented, de-identified examples or clearly labelled synthetic data.

The pilot plan must assign a person to review each data type and set retention, deletion and access rules before collection begins. “Continuously updated” means an owned review process, not an assumed live connection to a government portal.

## Evaluating the three proposed ML functions

| Function | Baseline | Evidence required before a performance claim |
| --- | --- | --- |
| Material classification | Manual category selection. | Reviewed labels, held-out lots/devices, per-category precision and recall, confusion cases and a low-confidence fallback. |
| Price estimation/prediction | A recent comparable-price median or range. | Later-period evaluation, rupee error by category/unit/area, observation coverage and comparison with the baseline. |
| Recycler matching | Eligibility filters followed by stated offer terms. | Eligible-match coverage, accepted matches and completed handovers; compare against filters alone. |

Keep images and transactions from the same source lot or device in one dataset partition. Do not allow future prices or information only known after handover into an earlier prediction. Version the dataset, evaluation period and model together. Dataset size, class coverage and error rates will be reported only after measurement.
