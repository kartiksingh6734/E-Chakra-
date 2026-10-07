# Feasibility and validation plan

[Project overview](../README.md) · [Collector workflow](collector-workflow.md) · [Sources and open evidence](references.md)

The test that matters is whether a collector can complete a worthwhile sale and whether the material reaches the intended recycler. Screen count, downloads and model accuracy alone will not answer that.

This is a proposed plan. No interviews, recruited partners, completed transactions, usability scores or financial results are claimed in this repository.

## Start by checking the assumptions

Use a small initial discovery group: **10–15 collectors and 2–3 recycler representatives in one service area**. These are proposed recruitment numbers, not completed research or a statistically representative sample. Include people who need assistance using a phone.

Ask collectors about their last sale: material and quantity, buyer, price, travel time, payment timing, available phone access and why they chose that buyer. Ask permission before recording personal information. Do not treat a positive answer to “Would you use this app?” as proof of adoption.

Ask recyclers what they actually buy, minimum lot sizes, inspection and weighing procedures, reasons for rejection, service area, payment terms and evidence they can provide at receipt. A willing and eligible receiving partner is a prerequisite for a material pilot.

## Keep the first prototype focused

| Phase | Work | Evidence needed to move on |
| --- | --- | --- |
| Discovery | Check the official PS brief, interview participants and review buyer eligibility. | Anonymised notes, a bounded service area and an agreed initial material catalogue. |
| Interface prototype | Walk through lot capture, offer comparison, handover and payment screens using labelled example data. | Users can explain the offer terms and distinguish “received” from “paid”. |
| Functional demonstration | Build the core flow and offline sync once implementation begins. | The demonstration cases below work and errors are recorded. |
| Supervised pilot | Observe real transactions with consenting participants and checked recipients. | Reconciled quantities, payments, support effort, failures and repeat use. |
| Expansion | Consider aggregation, reuse referrals, more languages/areas and evaluated ML. | The core transaction works reliably and the next route has suitable participants and a support owner. |

Hindi and Marathi remain planned language options. Test wording with speakers in the selected area; use the locally relevant language first. Recorded instructions and assisted onboarding are design options to test, not evidence that literacy barriers have been solved.

## Demonstration acceptance checks

These are acceptance criteria for the future prototype, not completed tests:

- Create and reopen a draft without internet. Restore connectivity and retry the same upload; exactly one lot should appear.
- Compare two offers with different transport costs and payment timings. Ask the participant to explain the choice.
- Try to accept an expired offer and an offer from an ineligible buyer; both should require correction before proceeding.
- Change the final weight or price. The original offer remains available and the new terms need acknowledgement.
- Accept part of a lot. Received and remaining quantities reconcile without losing source ownership.
- Record a handover while payment is pending, then a part-payment and the remaining balance.
- Demonstrate a dispute and a cancellation; neither should appear as a completed, paid transaction.
- Check that another collector cannot view or modify the first collector's private records.

Use synthetic data for demonstrations and label it on screen. Real pilot records require controlled access; public evidence should be de-identified.

## Measure outcomes consistently

| Measure | Definition and caution |
| --- | --- |
| Material delivered to recyclers | Sum of accepted measured kg at the final checked recycler, backed by acknowledgements. Count source quantities once; exclude intermediate aggregation and reuse referrals. |
| Confirmed handover rate | Confirmed recycler handovers divided by agreed recycler transactions in a defined cohort. Show pending, cancelled, rejected and disputed counts separately. |
| Collector proceeds | Confirmed amount received minus recorded costs paid by the collector. Show unpaid balances separately; compare like materials and grades. |
| Payment delay | Time from confirmed handover to confirmation of full payment. Report the unpaid share and its age so settled transactions do not hide failures. |
| Usability | Task completion, time and assistance required, with the participant count and phone/language conditions. |
| Repeat participation | Collectors completing a second handover within a predeclared follow-up period, divided by first-time participants with a full observation window. |
| Service effort | Staff time, support contacts, failed pickups and data/hosting costs per confirmed transaction. |

For a claim that routing has increased, compare the same participants' documented baseline period with a comparable pilot period. State the dates, categories, verified destinations and missing records. If estimating a share of collected material, the denominator must include all measured material collected in that cohort, including material sold outside the platform. Without that denominator, report delivered kilograms rather than a diversion percentage.

A small pilot cannot establish national impact or prove that the platform caused every change. Actual recycling requires downstream evidence beyond a delivery receipt.

## Feasibility depends on more than software

| Area | Why the first version is manageable | What could stop it working |
| --- | --- | --- |
| Technical | A single backend, structured records and manual category confirmation can support the core flow. | Lost drafts, duplicate events, weak device support or unclear conflict handling. |
| Operational | Start in one area with known material requirements and named receiving contacts. | Minimum lot sizes, transport costs, buyer cancellations or an unresolved dispute process. |
| Economic | Compare collector proceeds and record the cost of completing each transaction. | Support or pickup costs exceeding the value created for collectors and buyers. |
| Adoption | Test assisted onboarding, readable offers and payment confirmation with actual users. | Existing buyers offering better convenience, credit or faster cash. |
| Expansion | Shared records can support additional participants and areas after a pilot. | Local buyer coverage and support capacity growing more slowly than registrations. |

A higher quoted price is useful only if the collector is better off after costs and waiting time. Record buyer value too: usable supply, rejection rate and procurement effort.

## Funding and incentives

The payer and fee model remain to be validated with participants. Candidate buyer-paid coordination or service fees are hypotheses, not booked revenue. The initial evaluation must include onboarding, buyer verification, communications, hosting, support and any transport subsidy.

Calculate contribution per completed transaction as actual service revenue minus variable delivery/support costs and incentives. Record setup costs separately. Do not assume free logistics or permanent rewards.

If referrals are introduced, set a funding limit, define a qualifying delivery and check source-lot history for duplicate rewards. Measure repeat use after the incentive ends before claiming sustainable adoption.

## Evidence needed before submission

- Exact official problem statement ID, title and edition, checked against the submission portal or issued brief.
- Team details and responsibilities, confirmed by the people named.
- A walkthrough of the actual prototype when it exists, labelled with its current limitations.
- Consented discovery notes, buyer eligibility checks and a documented material scope.
- Measured results with sample sizes, dates and failures, rather than projected outcomes presented as achievements.

These items are outstanding work. Documentation makes the proposal clearer; it cannot substitute for them.
