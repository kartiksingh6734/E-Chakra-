# Sources and open evidence

[Project overview](../README.md) · [Data plan](data-plan.md) · [Validation plan](validation-plan.md)

Reviewed on **7 October 2026**. External sources provide context and design constraints; they do not validate E-CHAKRA's performance.

## Primary sources

| Source | What it supports here |
| --- | --- |
| [CPCB-hosted 2022 e-waste rules](https://eprewaste.cpcb.gov.in/assets/PDF/e-waste_rules_2022.pdf), Rule 2 | The separation of waste batteries from this e-waste framework. This is the original notification, not a consolidated set of all amendments. |
| [CPCB FAQ](https://eprewaste.cpcb.gov.in/assets/PDF/faqewaste.pdf), sections A–C | Distinct participant roles, registration checks and the distinction between transaction records and the official EPR process. |
| [CPCB e-waste portal](https://eprewaste.cpcb.gov.in/) | Official entry point for e-waste registration and related information. No live API integration with this portal is implemented or claimed. |
| [CPCB battery portal](https://eprbattery.cpcb.gov.in/) | The separate battery framework and recipient registration context. |
| [ITU/UNITAR Global E-waste Monitor 2024](https://ewastemonitor.info/the-global-e-waste-monitor-2024/) | Global context: 22.3% of e-waste generated worldwide in 2022 was documented as formally collected and recycled. This is not India's collection-to-recycler share or an E-CHAKRA baseline. |

Before a live pilot, check the current rules, amendments and recipient permissions for the specific activity and material. This documentation does not certify compliance or recipient eligibility.

## Problem statement reference

The team's supplied brief identifies **Smart India Hackathon 2026**, short reference **229**, and the title **Kabadiwala Connect — Bringing the Informal Collector into the Formal Recycling Chain**. Those details have been retained as the team's reference.

The [official SIH site](https://sih.gov.in/) could not be retrieved during this review. An exact official submission ID and a copy or direct link to the issued brief still need to be checked against the team's portal. The short reference should not be treated as a verified submission code. This review does not claim to reproduce an official judging rubric.

## What is established and what is proposed

| Item | Evidence status |
| --- | --- |
| Project goal, planned workflow and PostgreSQL choice | Documented project decisions. |
| Language preferences, buyer availability and willingness to switch | Design assumptions requiring local interviews and testing. |
| Interface, offline sync and ML functions | Planned; no implementation or performance evidence in this repository. |
| National diversion rates or increased collector income | No project-specific baseline or measured result available. |
| Partnerships, interviews and pilot transactions | No supporting records included; none are claimed as completed. |
| Offer figures in the workflow | Synthetic illustration, not a market-price dataset. |

Use this distinction in slides and demonstrations too. Date every external statistic, name its geography and denominator, and keep forecasts separate from observations. When evidence becomes available, add its source, collection method and limits rather than replacing a planned label with an unsupported success claim.
