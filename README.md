# E-CHAKRA

### Helping informal collectors sell e-waste into the formal recycling chain

A collector needs to know who will buy a lot, what they will receive after transport costs, and when they will be paid. E-CHAKRA brings those decisions into one simple flow: record the material, compare suitable buyers, agree on a handover and keep a receipt.

**Our goal is to increase the supply of e-waste reaching authorised recyclers while making the transaction worthwhile for the collector.**

**Smart India Hackathon 2026 · Team's PS reference: 229**  
*Kabadiwala Connect — Bringing the Informal Collector into the Formal Recycling Chain*

**Stage: concept and documentation.** The workflow, architecture and validation approach are documented here. A working application, field study and measured results are not yet included. The exact official submission ID is an [open verification item](docs/references.md#problem-statement-reference).

[Collector workflow](docs/collector-workflow.md) · [Architecture](docs/system-architecture.md) · [Data plan](docs/data-plan.md) · [Validation plan](docs/validation-plan.md) · [Sources](docs/references.md)

## The problem we are working on

Informal collectors already provide a collection network. Our project focuses on the next sale: helping a collector reach a suitable formal buyer without losing time, money or visibility over the transaction.

These are the main barriers we want to validate through local interviews:

| Collector's question | Proposed response |
| --- | --- |
| Who will accept this material and quantity? | Buyers filtered by checked registration details, accepted materials, service area and minimum lot size. |
| Is this offer worth the trip? | Price, transport responsibility, deductions and payment timing shown together. |
| What if the buyer changes the weight or price? | Both sides confirm the received quantity and final terms; the original offer stays in the record. |
| Can I use this with limited connectivity or reading ability? | Offline drafts, pictures, short labels, Hindi and Marathi support, and assisted onboarding. |

## How a transaction would work

1. **Create a lot:** add a photo, confirmed category, condition and approximate quantity.
2. **Compare offers:** review suitable buyers and expected proceeds after stated costs.
3. **Arrange the handover:** agree on pickup or drop-off, timing and payment terms.
4. **Confirm receipt:** both sides acknowledge the accepted quantity and final amount.
5. **Track payment:** record the amount received and any outstanding balance.

The [detailed workflow](docs/collector-workflow.md) explains partial acceptance, expired offers, disputes and interrupted connections.

## What the first prototype should prove

Start in **one service area with collectors and a small group of checked recyclers**. The first version should demonstrate offline lot capture, manual category confirmation, offer comparison, a confirmed handover and payment records.

Matching can start with material, area and quantity filters. Price references can start with dated, reviewed observations. This lets us test whether the transaction works for both sides before a trained model is available.

ML remains planned for material classification, price estimation/prediction and recycler matching, evaluated against those simpler baselines. Estimates will be clearly separated from buyer offers.

Aggregation, repair/refurbishment referrals and referral rewards are later extensions. Aggregation must preserve each collector's share; reuse handovers need separate reporting; rewards need funding and duplicate-claim checks.

## What we want to get right

The design priorities are the collector's net return, usable offline capture, and a record that follows material through each handover. We will assess these through:

- **Recycler deliveries:** distinct kilograms received, without counting intermediate transfers again.
- **Collector benefit:** proceeds after recorded costs and time taken to receive payment.
- **Usability:** successful lot creation, assistance required and repeat participation.
- **Reliability:** rejected, disputed and unresolved transactions alongside successful ones.

A receipt establishes a recorded delivery. Completed recycling needs downstream evidence, and EPR certification follows the official process. The [validation plan](docs/validation-plan.md) defines the measures and the evidence needed before claiming impact.

Project questions and documented feedback can be raised through [GitHub Issues](https://github.com/kartiksingh6734/E-Chakra-/issues). Keep personal contact details and real transaction records out of public issues.
