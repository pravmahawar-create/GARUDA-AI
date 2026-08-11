# GARUDA KINGDOM — MASTER DOCUMENT

> Canonical architecture map for the GARUDA AI Kingdom. This is a RECOVERY + DOCUMENTATION
> system built on evidence from the repository and recovered design work — NOT a redesign.
> Nothing here overrides the Constitution, founder-locked decisions (FD-001…FD-020, FD-101…FD-108),
> or the Master Inventory. Every item carries an explicit recovery status.

---

## 1. Kingdom Vision

GARUDA is an **AI Operating System / AI Kingdom** containing multiple interconnected **Universes**.
Each Universe is an operating system for a domain of human or machine work. Together they form an
AI civilization under **founder control**.

Three layers, in order:

1. **Core Mind** — shared reasoning / memory / knowledge (the thinking core).
2. **Domain Knowledge** — per-domain knowledge packs (data, not code).
3. **Business Understanding + Generation** — intake → Business Profile → generated work.

The founder is sovereign. Founder words are last. **Autonomous never means uncontrolled.**

## 2. What a Universe means

- A **Universe** is a domain operating system (e.g. Knowledge, Revenue, Creative, Security).
- A **Product** is a capability a Universe ships (e.g. One-Tap Composer).
- An **Engine** is a processing unit inside a Universe (e.g. Music Brain, Planner).
- An **Agent** is an actor that uses engines/products under permissions.
- A **Workflow** is a defined sequence of input → understanding → decision → execution → validation → output → learning.
- **Intelligence / Data / Automation / Cross-Universe orchestration** connect everything.

Hierarchy:

```
GARUDA KINGDOM
→ UNIVERSES
→ PRODUCTS
→ ENGINES
→ AGENTS
→ WORKFLOWS
→ INTELLIGENCE
→ DATA
→ AUTOMATION
→ CROSS-UNIVERSE ORCHESTRATION
```

## 3. Current Universe index

Source of truth for the 27-universe map: `frontend/src/config/universes.js`.

- **Public (16):** Creative(19), Career(13), Finance(12), Business(11), Education(14), Health(15),
  Relationship(16), Travel(17), Lifestyle(18), Content(20), Brand(21), Digital Presence(22),
  Entertainment(23), Innovation(25), Collective Intelligence(26), Consciousness & Future(27).
- **Founder-internal (11):** Knowledge(1), Reasoning(2), Memory(3), Learning(4), Decision(5),
  Automation(6), Communication(7), Security(8), Governance(9), Revenue(10), Wealth(24).
- **Revenue(10) is the reporting hub.** All universes report to it.

Deep-documented universes live under `docs/kingdom/universes/`.

## 4. Recovery status system

| Status | Meaning |
|---|---|
| **RECOVERED** | Historical information recovered with reasonable confidence. |
| **PARTIAL** | Some historical information recovered; significant details missing. |
| **IMPLEMENTED** | Confirmed to exist in the current repository/codebase. |
| **RECONSTRUCTED** | Logically reconstructed from known architecture, not verified as original. |
| **UNVERIFIED** | Mentioned or suspected; requires evidence. |
| **DEPRECATED** | Explicitly retired by Founder. |

Never silently convert PARTIAL / RECONSTRUCTED / UNVERIFIED into RECOVERED.

## 5. Governance

- Founder is supreme authority; approval-gated execution is mandatory (see `GARUDA_APPROVAL_MATRIX.md`).
- Constitution + founder-locked decisions override Kingdom docs on any conflict.
- The Kingdom doc set is **additive documentation only** — it never changes production architecture.

## 6. Links

- `UNIVERSE_INDEX.md` — all universes with status.
- `KINGDOM_RECOVERY_STATUS.md` — what is recovered / partial / reconstructed / unverified.
- `KINGDOM_GOVERNANCE.md` — how the Kingdom is governed.
- `universes/` — deep-docs: creative, autonomous, security, sovereign, revenue.
- `GARUDA_KINGDOM_MANIFEST.json` — machine-readable metadata.
