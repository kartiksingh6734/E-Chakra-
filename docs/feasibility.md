# Feasibility, product rationale and viability

[Home](../README.md) · [Architecture](system-architecture.md) · [Field validation](validation-plan.md)

## Product rationale

E-CHAKRA brings lot capture, net offer comparison, handover agreement and payment acknowledgement into one collector-facing flow. The design prioritises intermittent connectivity, local-language controls, cash records and visible deductions. This is the team's proposed differentiation, not a proven claim that no similar service exists.

The important hypothesis is that clearer terms and usable records make formal-channel transactions worthwhile for collectors and receiving partners. A working interface alone does not validate that hypothesis.

## Feasibility assessment

| Dimension | Evidence available | Remaining constraint |
| --- | --- | --- |
| Technical | Runnable PWA, generated database migration, versioned API, domain/integration tests | Actual Android, slow-network, storage-eviction, load and recovery evidence |
| Operational | Demo of offer → handover → separate receipt acknowledgement | Independent accounts, real partners, quantity disputes, pickup failure and staff support |
| Economic | One hosted API/database/media service and existing smartphones for a prototype | No measured cost per transaction, paid buyers or verified income gain |
| Market | Clear hypotheses around collector proceeds and dependable buyer supply | Interviews, willingness to pay, switching behaviour and repeat use need evidence |
| Scaling | Shared application and persistent records | Current 500-lot fetch, JSON records, partner density, moderation and support capacity |

## Cost model to measure

Record fixed setup costs separately from recurring API/hosting/database/media, verification, onboarding, support, communications, transport subsidy and incentives. Do not treat cloud credits or referral subsidies as permanent free resources.

**Contribution per completed transaction = actual service revenue − variable support/verification/transport/incentive costs.**

Potential recycler subscriptions or transaction fees remain hypotheses. Price comparisons in the supplied slides are not verified market observations or an established revenue model. Report collector proceeds after recorded costs, and keep unpaid balances separate.

## Incentives and expansion

Referral rewards could encourage adoption only if funded and tied to a qualifying, non-duplicate delivery. The prototype does not pay rewards. Measure repeat participation after incentives stop before claiming sustained adoption. Expand area-by-area only when buyer coverage, material acceptance and support capacity are established.

## Impact claims

No project-specific diversion, earnings uplift, safety improvement or national impact has been measured in the reviewed evidence. The [validation plan](validation-plan.md) defines the cohort, units, denominators and follow-up needed. A recorded handover cannot by itself prove completed recycling.
