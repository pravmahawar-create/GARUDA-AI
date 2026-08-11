# REVENUE UNIVERSE

> Recovery status: **IMPLEMENTED** (multiple docs + live services) / **PARTIAL** (some concepts).

## 1. Mission

Generate income for GARUDA through verified opportunity discovery, qualification, proposals,
delivery, and payment collection.

## 2. Scope

- Inside: lead discovery, qualification, proposal engine, delivery, payments, reporting.
- Outside: any unverified or unapproved income action (revenue constitution forbids shortcuts).

## 3. Implemented components

| Component | File / Doc | Status |
|---|---|---|
| Opportunity Discovery | `src/services/*`, `docs/REVENUE_UNIVERSE.md` | IMPLEMENTED |
| Revenue Intelligence Engine | `docs/revenue-brain-v1-freeze.md` | IMPLEMENTED |
| Lead-gen + outreach | `src/services/insuranceLeadGenService.js`, `insuranceOutreachService.js` | IMPLEMENTED |
| Payment page (Razorpay) | `GARUDA_PAYMENT_PAGE_URL` = https://razorpay.me/@garudaosincompany | IMPLEMENTED |
| Delivery tracking | `src/services/revenueClosingSystemService.js` | IMPLEMENTED |
| CRO / deal tracker | `src/services/garudaCroService.js` | IMPLEMENTED |
| Dispatch CLI | `scripts/garuda-dispatch.js` | IMPLEMENTED |

## 4. Revenue pipeline (recovered/implemented)

```
DISCOVER OPPORTUNITY → QUALIFY → ACQUIRE CLIENT → EXECUTE WORK → DELIVER
→ CLIENT ACCEPTS → COLLECT PAYMENT → LEARN → FIND NEXT OPPORTUNITY
```

## 5. Multi-industry direction (FD-107)

The lead-gen engine is currently insurance/ABSLI-locked in content. Decision: make it
multi-industry via a generic config/knowledge-pack layer (Business Intake → Business Profile →
generic message generator), with insurance as the first domain, backward-compatible.
**This is planning direction, not yet implemented.**

## 6. Reporting hub role

- Every universe reports to Revenue (10).
- Founder dashboard shows Revenue as the hub (see `FounderUniversesStrip`).

## 7. Governance

- Verified opportunity → founder approval → authorized action → evidence → record → settlement
  (revenue constitution). No shortcuts, no fabricated activity.