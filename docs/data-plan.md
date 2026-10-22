# Data provenance and AI evaluation plan

[Home](../README.md) · [Requirements](requirements.md) · [Validation](validation-plan.md) · [Sources](references.md)

## What exists now

No reviewed field dataset, trained model or model evaluation result is included. [The catalog](../prototype/lib/domain.ts) contains eight synthetic material categories and three demonstration buyers. [Demo inputs](../assets/demo-inputs.json) are invented transaction values, not research observations.

| Material | Unit | Synthetic reference rate |
| --- | --- | ---: |
| Circuit boards | kg | ₹350 |
| Wires and cables | kg | ₹180 |
| LCD panels | piece | ₹200 |
| CRT televisions | kg | ₹20 |
| Batteries | kg | ₹250 |
| Motors | piece | ₹70 |
| Magnet assemblies | kg | ₹90 |
| Mixed plastics | kg | ₹12 |

Rates are fixed demonstration constants. They are not live, verified or predicted market values. Buyer distances, pickup labels, multipliers and deductions are also synthetic. Category/condition filters only constrain the demo repair-shop route; they do not verify real recipient permissions or material scope.

The demo includes a battery category but has no separately reviewed battery collection/recipient workflow. Do not treat the broad synthetic catalog as an approved real-pilot material scope. Consult the relevant official material/recipient sources before selecting a pilot scope.

## Transaction meanings

| Value | Meaning in this prototype |
| --- | --- |
| Reference estimate | Synthetic catalog rate times quantity |
| Offer | Demo buyer proposal with rate, transport charge, pickup flag and expiry |
| Expected net | Offer rate times entered quantity minus stated transport charge |
| Final amount | Recycler demo's proposed received terms, subject to collector confirmation |
| Received amount | Only payment claims separately confirmed by the collector |

Lot creation time is supplied by the client; server event/update times are separate. These are application records, not tamper-proof physical-world verification. Quantity units must remain explicit; do not combine kg and piece totals into one material-weight claim.

## Planned collection and review

Collect consented, category-labelled lot images, material condition/unit, dated quotes, observed transaction terms and recipient eligibility evidence. Record provenance, reviewer, collection date, permitted use and correction history. Keep forecasts/model estimates separate from observed prices so predictions do not train on their own output.

Review new observations continuously: check missing units, duplicates, label disagreements, unusual prices and recipient status. Version approved datasets and document exclusions; collecting more records does not by itself establish quality.

Raw contacts, precise personal locations, faces, receipts and survey responses belong in controlled storage, not this public repository. Publish only consented, de-identified summaries or synthetic examples. The linked survey in the team's presentation has not been audited; respondent counts and findings are not asserted here.

## Planned AI functions

| Function | Baseline to beat | Evaluation before making a claim |
| --- | --- | --- |
| Material classification | Manual category selection | Reviewed labels, per-category precision/recall, confusion matrix, low-confidence fallback |
| Price estimation | Dated comparable-price median/range | Later-period evaluation, rupee error by category/unit/area, coverage and baseline comparison |
| Recycler ranking | Eligibility filters and explicit offer terms | Eligible-match coverage, acceptance and completed handovers; recipient eligibility remains a hard rule |

Keep all images/transactions from one source lot or device in the same partition. Prevent future prices or handover-only information leaking into earlier predictions. Record dataset/model versions, split method, sample size and failures. No accuracy percentage, training claim or production recommendation is justified before these steps are completed.
