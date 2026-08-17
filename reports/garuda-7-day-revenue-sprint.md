# GARUDA 7-DAY REVENUE SPRINT — DAILY TASK BREAKDOWN

- **Sprint window:** 7 days from founder approval
- **Realistic target:** first real paid customer + ~₹50,000 received (honest, verified payments only)
- **Stretch goal (founder-nominated):** $50k/7 days — treated as a pace target, never reported as revenue until real payment evidence exists.
- **Guiding rule (GARUDA Constitution):** no fabricated revenue, no false hope. `pending` until verified.

---

## Day 1 — Pipeline Foundation & P1/P2 Shipped
- [ ] **P1 shipped**: Approval-page shows WHO gave WHAT (client, deliverable, scope, price, deadline, acceptance criteria) — `ExecutionView.jsx` work-context card.
- [ ] **P2 shipped**: Multi-currency payment links unlocked (INR gate removed; webhook already currency-agnostic).
- [ ] **P3 shipped**: Bot brain fixed — phantom `OPENCODE` provider replaced with working Gemini; stronger NVIDIA fallback; Telegram tone/length guard.
- [ ] **P4 shipped**: 24x7 wake — GitHub Actions cron (`*.github/workflows/garuda-wake.yml`) pinging Render every 5 min; cron-job.org backup account created.
- [ ] Confirm deployment: `garuda-ai-xfif.onrender.com` healthy, `garudaos.in` serving new bundle.

## Day 2 — Founder review of the 88-opportunity pipeline
- [ ] Open `/revenue` → Discovery: review the 88 pending opportunities (₹59,260 pipeline).
- [ ] Approve top 3–5 GARUDA-deliverable candidates (no interviews/CV gates) → Execution Missions.
- [ ] Fill verified real-work intake for each: client, deliverable, price, currency, deadline, acceptance criteria.
- [ ] Founder approves missions → GARUDA prepares bounded work packages.

## Day 3 — First deliverables + outreach
- [ ] Run Architect → Engineering → Tester → Reviewer evidence chain on 1–2 approved missions.
- [ ] GARUDA drafts client-facing proposals from verified intake (no invented figures).
- [ ] Founder approves outreach/proposal send; GARUDA sends via governed SMTP (garudaos.ai@gmail.com).
- [ ] Follow-up scheduler armed for Day 5/7.

## Day 4 — Qualification & lead flow
- [ ] Respond to client replies with GARUDA (founder-in-the-loop).
- [ ] Insurance lead flow: Telegram/public chat → InsuranceLead → founder-gated Opportunity.
- [ ] Revenue: keep `pending` honest — no premature `received` status.

## Day 5 — Close loop part 1
- [ ] First follow-up batch to contacted clients.
- [ ] Convert strongest lead into confirmed brief + payment link (Razorpay live).
- [ ] **Milestone check**: real customer pays → verify webhook → RevenueRecord `received`.

## Day 6 — Close loop part 2
- [ ] Deliver the agreed scope; record production delivery + client acceptance.
- [ ] Settlement ledger updated from verified payment.
- [ ] Second follow-up batch; pitch remaining qualified leads.

## Day 7 — Sprint report & review
- [ ] Final sprint report: real numbers only — received, pending, pipeline, deliveries.
- [ ] Decision: renew sprint with the winning channel/capability; drop losers.
- [ ] Update `scripts/mother/memory.json` with verified sprint facts.

---

## Guardrails (every day)
- **No automatic outreach/application/contract/payment/delivery** without its own founder approval.
- **Revenue `received` only after explicit payment verification** (Razorpay webhook / provider receipt).
- **No fabrication**: any number not in verified context is reported as "not confirmed".
- **Git**: commit only founder-approved files; never commit secrets, `.env*`, `data/knowledge-index.json`, `.vercel/`.
