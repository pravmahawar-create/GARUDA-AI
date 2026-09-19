# 13 Sovereign Post-Mission Lessons & Self-Evolution Registry

> **Constitutional Authority**: FD-024 & Section 9 of AGENTS.md / GEMINI.md.
> **Law**: "Har Kaam Ke Baad Self-Learning & Zero-Repeat Law".
> After every mission, task, bug-fix, or deploy, GARUDA autonomously documents the root causes,
> failure modes, and architectural countermeasures so that the same error can NEVER repeat.


---

### Mission: Local Client Radar, Direct Outreach & Vercel SPA CleanUrls Demohosting
- **Timestamp**: 2026-09-19T10:37:38.365Z
- **Commit SHA**: `961cb52`
- **Category**: `outreach_and_web_routing`
- **Verification Evidence**: Live verification confirmed 8/8 URLs return HTTP 200 OK with custom prospect titles. Mobile screenshot captured and verified.

#### 1. Failure Modes & Hemorrhages Encountered
1. **Custom client demo link (e.g. /demos/3r-car-care/index.html) redirected to the root GARUDA homepage instead of the client portal, violating 100% Anti-Fabrication Law.**
2. **Vercel SPA cleanUrls: true stripped /index.html and issued a 308 redirect to /demos/:slug, which failed to find a static file and collapsed to the catch-all SPA rewrite (/:match* -> /).**

#### 2. Root Cause Forensic Analysis
1. Static demo HTML files were originally written only to directory index.html and root public/ instead of frontend/public/.
2. In Vercel, when cleanUrls is active, requests to /demos/:slug require either a flat /demos/:slug.html static file or an explicit rewrite rule pointing to /demos/:slug/index.html before the catch-all rewrite.
3. Outreach messages were initially queued before verifying live HTTP 200 responses for each generated demo URL.

#### 3. Permanent Architectural Countermeasure
1. Dual-format static output: instant-demo-builder.js now builds BOTH directory index.html and direct flat [slug].html in frontend/public/demos/.
2. Explicit Vercel rewrites: vercel.json now explicitly maps /demos/:slug, /demos/:slug/, /demos/:slug.html, and /demos/:slug/index.html before /:match*.
3. Automated Pre-Outreach Link Verifier: scripts/governance/pre-outreach-verifier.js now executes an automated HTTP GET check verifying status 200 OK, title matching the prospect name, and rejection of homepage fallbacks before ANY message is dispatched.

#### 4. Inscribed Permanent Law / Guardrail
> **LAW: Never dispatch any client communication containing an external URL without an automated HTTP 200 OK verification showing verified prospect content. All static sub-demos must include flat HTML and explicit Vercel rewrites.**
