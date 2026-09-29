# Data Plan

This proposed plan defines information needs for E-CHAKRA. It is not a dataset or database schema and makes no claims about collected data or model accuracy.

| Information | Purpose | Essential fields | Intended source |
| --- | --- | --- | --- |
| Material lots | Describe material and preserve its origin through aggregation. | Lot/collector references; photos; confirmed category/subcategory; approximate weight/unit; condition; area/date; source-lot links and contributor quantities. | Collector entries and photographs; aggregator records; corrections confirmed at handover. |
| Price history and offers | Compare historical prices, estimates and buyer proposals. | Record type; material/condition; area/date; amount or rate, currency and unit; source; buyer/lot references, validity and terms for offers; method/version for estimates. | Dated field observations, voluntarily shared buyer prices, verified transactions and labelled model outputs when available. |
| Recyclers and aggregators | Identify participants and support suitable matches. | Participant reference/role; name/contact; service area; accepted materials; recycler authorisation reference, verification source/date and status. | Participant onboarding, direct confirmation and checks against relevant official authorisation records. |
| Minimal collector profiles | Link lots and payments to collectors and support accessible use. | Unique collector reference; preferred name; necessary contact method; language; broad operating area; consent/notice record. | Collector-provided information, including assisted onboarding confirmed by the collector. |
| Transactions, payments and handover records | Trace transfers and each collector's quantity and payment history. | Transaction/handover, lot and participant references; received quantities/units; final sale amount/currency; per-collector allocation; payment amount/method/status; timestamps; acknowledgements and available receipt/payment reference. | Participant agreements, aggregator allocations, recipient acknowledgements, cash receipts and optional digital-payment confirmations. |
| ML training and validation data | Evaluate only classification, price estimation/prediction and authorised recycler matching. | Source/date and permitted use; labelled photos/categories; material, quantity, condition, area/date and verified price targets; checked recycler attributes and match outcomes; corrections, dataset version and training/validation assignment. | Consented field images, reviewed lots, verified transactions, checked recycler records and recorded participant outcomes. |

Repair shops would have role-specific participant and transaction records; their role must not imply authorised-recycler status.

## Keep price meanings separate

- **Estimated price:** an indicative amount/rate with a stated method and date, not a buyer commitment.
- **Buyer offer:** a proposed price with units, validity and conditions.
- **Final sale amount:** the agreed transaction amount for the recorded quantity. Separate payment records show amounts paid and confirmed.

## Collect, validate and improve

Collect real field data from consenting participants. Record provenance, dates, units and verification status. Check duplicate lots, inconsistent quantities and mismatched payment references; missing values must remain distinguishable from zero.

Confirm corrections with participants and retain an audit trail. Recheck recycler authorisation and outdated price information. Preserve source collectors' quantities and payment allocations when lots are combined.

Version datasets built from reviewed records. Keep related lots/images within one training or validation partition, and use later-period validation for price prediction. Record coverage gaps and evaluate each permitted ML function before claiming performance. Continuously update records and datasets as verified field information arrives.

Related documents: [Project overview](../README.md) · [Proposed system architecture](system-architecture.md).
