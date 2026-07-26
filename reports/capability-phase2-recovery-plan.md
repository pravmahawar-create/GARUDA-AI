# GARUDA REVENUE BRAIN — PHASE 2 CONTROLLED RECOVERY PLAN

## Executive Summary
Following the detection of score distortion in Phase 2 attempt 1 (commit `ccb6c6c`), the regressed scoring logic was reverted via `86b99b0`, successfully restoring the approved Phase 1 baseline (**56% Capability Mapping / 52% Overall Benchmark Accuracy**).

Future capability intelligence enhancements will be introduced incrementally with single-change patches and benchmark acceptance gates.

---

## Incremental Patch Sequence

### Patch A: Diagnostic Scoring Trace
- **Scope**: Add diagnostic scoring trace fields to `revenueOrchestratorService.js` output without altering score calculations or match ordering.
- **Expected Benefit**: Full visibility into keyword match scores per scenario.
- **Regression Risk**: Zero (No behavioral change).
- **Acceptance Gate**: 56% Capability / 52% Overall.

### Patch B: Safe Exact-Token Normalization
- **Scope**: Normalize punctuation and case during token matching without adding arbitrary score multipliers.
- **Expected Benefit**: Eliminates minor formatting mismatches.
- **Regression Risk**: Low.
- **Acceptance Gate**: $\ge 56\%$ Capability / $\ge 52\%$ Overall.

### Patch C: Domain-Bounded Synonym Matching
- **Scope**: Introduce `SYNONYM_MAP` restricted to explicit 1-to-1 canonical mappings (`i18n` $\rightarrow$ `translation`, `postgres` $\rightarrow$ `database`, `csv` $\rightarrow$ `spreadsheet`).
- **Expected Benefit**: Resolves vocabulary mismatch failures.
- **Regression Risk**: Medium (Requires domain boundary verification).
- **Acceptance Gate**: $\ge 58\%$ Capability / $\ge 54\%$ Overall.

### Patch D: Opt-in Composite Capability Field
- **Scope**: Expose `compositeCapabilities` array in matching output without altering primary capability selection or validator set contract.
- **Expected Benefit**: Supports multi-skill opportunity execution while preserving single-deliverable benchmark precision.
- **Regression Risk**: Low.
- **Acceptance Gate**: $\ge 58\%$ Capability / $\ge 54\%$ Overall.

### Patch E: Measured Threshold Calibration
- **Scope**: Calibrate `minimumScore` threshold based on measured score distribution from Patch A traces.
- **Expected Benefit**: Reduces false positive noise matches.
- **Regression Risk**: Low.
- **Acceptance Gate**: $\ge 60\%$ Capability / $\ge 56\%$ Overall.

---

## Rollback Rule
If any incremental patch reduces capability accuracy below 56.00% or overall benchmark accuracy below 52.00%, the patch must be immediately reverted before proceeding.
