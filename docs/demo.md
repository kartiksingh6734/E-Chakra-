# Judge demonstration script

[Home](../README.md) · [Setup](setup.md) · [Workflow](collector-workflow.md) · [Status matrix](requirements.md)

Use synthetic data only. The two roles belong to one owner workspace. Buyer names, prices, distances and authorisation labels are demonstration values. No money is moved and no real recycler is certified by this app.

## Access

- [Hosted prototype](https://e-chakra-collector.kartiksingh6734.chatgpt.site): owner-private, for a maintainer-led session.
- [Local setup](setup.md): reproducible alternative without a cloud account.
- [Team-provided presentation video](https://drive.google.com/file/d/1beBZdxFbpla45hIuDcNdBsqNrNQS-4br/view): external access/content not verified; it may show an older design. Do not treat it as test evidence for this revision.

## Synthetic example

| Field | Enter |
| --- | --- |
| Language / role | English / Collector |
| Category | Circuit boards |
| Condition | Scrap |
| Quantity | 10 kg |
| Location | Demo collection point |
| Notes | Synthetic SIH review lot; no real sale |
| Photo/audio | Optional; use a non-personal sample photo/recording |

Machine-readable reference inputs are in [demo-inputs.json](../assets/demo-inputs.json); this is not a collected dataset or a database backup.

## Complete journey

1. **Create lot.** Enter the above values and save. Open the saved lot. Explain that category selection is manual and the record is persisted through the API.
2. **Add demo offers.** Compare Demo Recycler A (₹350/kg, ₹0 transport; ₹3,500 for 10 kg) with Demo Recycler B (₹385/kg, ₹80 transport; ₹3,770). These figures come from the current synthetic catalog, not live prices.
3. **Accept Demo Recycler A.** Note the accepted quote and lot reference.
4. **Switch to the recycler demo.** Open the same lot. Propose **9 kg**, final amount **₹3,000**, and **Demo receiving desk**. This is a proposed agreement; no payment is received yet.
5. **Return to collector.** Read and confirm the handover terms. Dues are now ₹3,000. The original 10 kg offer remains available; the app does not track the rejected 1 kg as a separate remaining lot.
6. **Recycler demo: record ₹1,200 cash.** Return to collector. The payment is still unconfirmed and dues remain ₹3,000.
7. **Collector: confirm ₹1,200 received.** Confirmed receipts become ₹1,200 and dues become ₹1,800.
8. **Recycler demo: record ₹1,800 cash.** Return to collector and confirm it. The lot becomes paid; confirmed receipts are ₹3,000 and dues ₹0.
9. **Open records.** Download the text receipt and CSV. Show the lot/reference, agreed amount and separate payment confirmations. Neither file certifies completed recycling.

Expected financial checkpoints:

| Checkpoint | Confirmed received | Pending |
| --- | ---: | ---: |
| Handover confirmed | ₹0 | ₹3,000 |
| First cash claim, not confirmed | ₹0 | ₹3,000 |
| First receipt confirmed | ₹1,200 | ₹1,800 |
| Both receipts confirmed | ₹3,000 | ₹0 |

## Optional short checks

- Switch Hindi/Marathi/English and show category names and controls. Voice notes are stored audio, not transcription.
- On a **new** accepted lot, report an issue. Show the disputed state; staff resolution is a roadmap item.
- Follow [manual offline acceptance](testing.md#manual-device-acceptance) on a production build. Do not claim success until the exact reload/reconnect sequence is observed.
- Inspect [automated evidence](testing.md) for expiry, stale writes, overpayment and cross-owner access checks.

## Before presenting

Record the commit shown, device/browser and which checks were actually observed. Ensure the judge can access your chosen demonstration path. A current, public-safe screen recording and actual mobile screenshots still need to be captured; generated mockups are not substitutes for execution evidence.
