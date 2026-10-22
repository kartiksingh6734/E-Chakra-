# Judge's guide

[Home](../README.md) · [Demo](demo.md) · [Requirements](requirements.md) · [Evidence](testing.md)

E-CHAKRA demonstrates a collector's sale from lot capture to payment acknowledgement. It is a functional prototype with simulated market participants. This guide maps review questions to evidence; it is not an official SIH GitHub scoring rubric.

## Two-minute review

1. Read the [PS provenance and scope](problem-statement.md).
2. Read the [implemented / partial / simulated / planned matrix](requirements.md).
3. Open the [application](../prototype/app/collector-app.tsx), [transaction rules](../prototype/lib/domain.ts) and [verification results](testing.md).

## Demonstration review

Follow [the scripted example](demo.md): a synthetic 10 kg PCB lot, compared offers, a final 9 kg / ₹3,000 agreement, two payment claims and two collector confirmations. Observe the balance between confirmations. The recycler role belongs to the same private owner workspace, not a separately authenticated business.

The hosted deployment is owner-private. Use a maintainer-led session or [local setup](setup.md). The presentation links a [team-provided video](https://drive.google.com/file/d/1beBZdxFbpla45hIuDcNdBsqNrNQS-4br/view); access and correspondence to the current code have not been verified. The written script and source are the reproducible fallback.

## Evidence by review question

| Review question | Evidence | What it establishes / does not establish |
| --- | --- | --- |
| Problem understanding | [Scope](problem-statement.md), [requirements](requirements.md) | Response to the team's brief; official organisation and issued text need confirmation |
| Differentiation | [Product rationale](feasibility.md#product-rationale) | Offline capture, transparent deductions and separate acknowledgements; no globally unique invention claim |
| Functionality | [Demo](demo.md), [API](api.md), [workflow](collector-workflow.md) | One executable core journey; real organisations are not onboarded |
| Engineering | [Architecture](system-architecture.md), [schema](../prototype/db/schema.ts) | Actual implementation, boundaries and trade-offs |
| Reliability | [Tests](testing.md) | Domain and local built-API behaviour; not Android certification or load testing |
| User experience | [Languages](../prototype/lib/i18n.ts), [device acceptance](testing.md#manual-device-acceptance) | Three-language implementation; user task success remains unmeasured |
| Data and AI | [Data plan](data-plan.md) | Synthetic catalog and evaluation design; no trained-model accuracy claim |
| Feasibility and impact | [Feasibility](feasibility.md), [pilot plan](validation-plan.md) | Cost drivers and validation method; no proven revenue or national impact |
| Privacy | [Security](../SECURITY.md) | Owner scope/private-host assumptions; role switching is not participant authentication |
| Team understanding | [Credits](team-and-credits.md), source and history | Verified maintainer and AI-assisted implementation; other responsibilities need confirmation |

## Questions we welcome

- Why keep the accepted offer, final handover amount and confirmed payment separate?
- What happens if a draft is uploaded twice or an older update arrives?
- What cannot be completed offline, and why?
- Which checks establish buyer eligibility today? (Synthetic demo rules; real verification is pending.)
- What evidence would justify replacing manual categorisation with ML?

## Submission readiness

The code and review documents can be inspected now. Before a field pilot, close the [release gates](limitations.md#release-gates): official PS confirmation, device testing, reviewer access, participant authentication/verification, reviewed research and a bounded pilot. Repository presentation alone cannot establish those outcomes.
