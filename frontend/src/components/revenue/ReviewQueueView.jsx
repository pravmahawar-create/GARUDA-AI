import React, { useEffect, useState } from "react";
import {
  listPermissionReviews,
  getPermissionReviewStats,
  getPermissionReview,
  decidePermissionReview,
  decidePermissionReviews
} from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, BLUE, RED, formatAmount, formatDate, titleCase } from "./format";
import Badge from "./Badge";

const ATTESTATION =
  "I confirm that I have sufficient basis to pursue this opportunity through the founder-engaged GARUDA-assisted model and that I am not overriding any known client, employer, platform, contractual, identity, credential, confidentiality, or AI-use restriction.";

const MODE_TONE = {
  DIRECT_GARUDA: GREEN,
  FOUNDER_ENGAGED_GARUDA_ASSISTED: BLUE,
  PERMISSION_UNKNOWN: AMBER,
  NOT_ELIGIBLE: RED
};

const DECISION_TONE = {
  PERMISSION_CONFIRMED: GREEN,
  PERMISSION_PROHIBITED: RED,
  DISMISS: MUTED,
  NEEDS_INFORMATION: AMBER
};

const EVIDENCE_OPTIONS = [
  { value: "CLIENT_EMPLOYER_EXPLICIT_PERMISSION", label: "Client / Employer explicit permission" },
  { value: "PLATFORM_JOB_RULE_CHECK", label: "Platform / job-rule check" },
  { value: "CONTRACT_ENGAGEMENT_TERMS", label: "Contract / engagement terms" },
  { value: "FOUNDER_ATTESTATION", label: "Founder attestation" }
];

const emptyAction = { decision: "", evidenceType: "", evidenceSource: "", evidenceSummary: "", note: "", attestation: false, error: "" };
const emptyBatchAction = { decision: "", evidenceSource: "", evidenceSummary: "", note: "", attestation: false, error: "" };
const BATCH_CAP = 50;

export default function ReviewQueueView() {
  const [state, setState] = useState({ loading: true, error: "", items: [], stats: null });
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(emptyAction);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterDraft, setFilterDraft] = useState({ source: "", minScore: "" });
  const [filters, setFilters] = useState({ source: "", minScore: "" });
  const [batchAction, setBatchAction] = useState(emptyBatchAction);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);

  const load = () => {
    setState((prev) => ({ ...prev, loading: true }));
    Promise.all([listPermissionReviews(filters), getPermissionReviewStats()])
      .then(([items, stats]) => {
        setState({ loading: false, error: "", items: Array.isArray(items) ? items : [], stats });
        setSelectedIds(new Set());
        setBatchResult(null);
      })
      .catch((error) => setState((prev) => ({ ...prev, loading: false, error: error.message || "Failed to load review queue." })));
  };

  useEffect(() => { load(); }, [filters]);

  const openDetail = async (item) => {
    setAction(emptyAction);
    try {
      const detail = await getPermissionReview(item.id);
      setSelected(detail || item);
    } catch (error) {
      setSelected(item);
    }
  };

  const submitDecision = async () => {
    if (!selected) return;
    setAction((prev) => ({ ...prev, error: "" }));
    const a = action;
    const payload = { decision: a.decision };
    if (a.decision === "PERMISSION_CONFIRMED") {
      if (!a.evidenceType) return setAction((prev) => ({ ...prev, error: "Select an evidence type." }));
      if (!a.evidenceSource.trim()) return setAction((prev) => ({ ...prev, error: "Evidence source is required." }));
      if (!a.evidenceSummary.trim()) return setAction((prev) => ({ ...prev, error: "Evidence summary is required." }));
      if (!a.attestation) return setAction((prev) => ({ ...prev, error: "You must confirm the attestation." }));
      payload.evidenceType = a.evidenceType;
      payload.evidenceSource = a.evidenceSource.trim();
      payload.evidenceSummary = a.evidenceSummary.trim();
      payload.founderAttestation = ATTESTATION;
    } else if (a.decision === "PERMISSION_PROHIBITED") {
      if (!a.evidenceSource.trim()) return setAction((prev) => ({ ...prev, error: "Evidence source of the prohibition is required." }));
      if (!a.evidenceSummary.trim()) return setAction((prev) => ({ ...prev, error: "Evidence summary of the prohibition is required." }));
      payload.evidenceType = a.evidenceType || "UNKNOWN";
      payload.evidenceSource = a.evidenceSource.trim();
      payload.evidenceSummary = a.evidenceSummary.trim();
    } else {
      payload.evidenceType = a.evidenceType || "UNKNOWN";
      payload.evidenceSummary = a.evidenceSummary.trim();
      payload.note = a.note.trim();
    }

    setBusy(true);
    try {
      await decidePermissionReview(selected.id, payload);
      setSelected(null);
      setAction(emptyAction);
      load();
    } catch (error) {
      setAction((prev) => ({ ...prev, error: error.message || "Failed to record review decision." }));
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === state.items.length ? new Set() : new Set(state.items.map((i) => i.id))));
  };

  const applyFilters = () => setFilters({ source: filterDraft.source.trim(), minScore: filterDraft.minScore.trim() });
  const resetFilters = () => { setFilterDraft({ source: "", minScore: "" }); setFilters({ source: "", minScore: "" }); };

  const applyBatch = async () => {
    if (selectedIds.size === 0) return;
    if (selectedIds.size > BATCH_CAP) return setBatchAction((prev) => ({ ...prev, error: `Batch safety cap is ${BATCH_CAP} candidates (${selectedIds.size} selected).` }));
    const b = batchAction;
    if (!b.decision) return setBatchAction((prev) => ({ ...prev, error: "Choose a batch decision." }));
    const payload = { decision: b.decision };
    if (b.decision === "PERMISSION_CONFIRMED") {
      if (!b.evidenceSummary.trim()) return setBatchAction((prev) => ({ ...prev, error: "Shared evidence summary is required." }));
      if (!b.attestation) return setBatchAction((prev) => ({ ...prev, error: "You must confirm the Founder attestation." }));
      payload.evidenceType = "FOUNDER_ATTESTATION";
      payload.evidenceSource = b.evidenceSource.trim() || "Founder batch permission review of the selected candidates";
      payload.evidenceSummary = b.evidenceSummary.trim();
      payload.founderAttestation = ATTESTATION;
    } else if (b.decision === "PERMISSION_PROHIBITED") {
      if (!b.evidenceSource.trim()) return setBatchAction((prev) => ({ ...prev, error: "Evidence source of the prohibition is required." }));
      if (!b.evidenceSummary.trim()) return setBatchAction((prev) => ({ ...prev, error: "Evidence summary of the prohibition is required." }));
      payload.evidenceType = "UNKNOWN";
      payload.evidenceSource = b.evidenceSource.trim();
      payload.evidenceSummary = b.evidenceSummary.trim();
    } else {
      payload.evidenceType = "UNKNOWN";
      payload.evidenceSummary = b.evidenceSummary.trim();
      payload.note = b.note.trim();
    }

    setBatchBusy(true);
    setBatchAction((prev) => ({ ...prev, error: "" }));
    try {
      const result = await decidePermissionReviews(Array.from(selectedIds), payload);
      setBatchResult(result);
      setSelectedIds(new Set());
      setBatchAction(emptyBatchAction);
      load();
    } catch (error) {
      setBatchAction((prev) => ({ ...prev, error: error.message || "Failed to apply batch decision." }));
    } finally {
      setBatchBusy(false);
    }
  };

  const { loading, error, items, stats } = state;
  const counts = (stats && stats.counts) || {};

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p className="fd-eyebrow" style={{ margin: 0 }}>FOUNDER ENGAGEMENT REVIEW QUEUE</p>
          <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Permission Review</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
            Controlled permission &amp; Founder approval workflow. Reviewing permission <strong>never</strong> sends email, applies to jobs, contacts companies, accepts contracts, or triggers payment.
          </p>
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem", marginBottom: "1rem" }}>
          {[
            ["Awaiting review", counts.PERMISSION_UNKNOWN || 0, AMBER],
            ["Founder-engaged", counts.FOUNDER_ENGAGED_GARUDA_ASSISTED || 0, BLUE],
            ["Direct GARUDA", counts.DIRECT_GARUDA || 0, GREEN],
            ["Blocked / not eligible", counts.NOT_ELIGIBLE || 0, RED],
            ["Review decisions", stats.reviewedCandidates || 0, GOLD]
          ].map(([label, value, color]) => (
            <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.02)" }}>
              <p style={{ margin: 0, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800, color: MUTED }}>{label.toUpperCase()}</p>
              <p style={{ margin: "0.2rem 0 0", fontWeight: 800, fontSize: "1.15rem", color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.2rem" }}>SOURCE</label>
          <input
            value={filterDraft.source}
            onChange={(e) => setFilterDraft((prev) => ({ ...prev, source: e.target.value }))}
            placeholder="e.g. Upwork"
            style={{ padding: "0.4rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.2rem" }}>MIN SCORE</label>
          <input
            value={filterDraft.minScore}
            onChange={(e) => setFilterDraft((prev) => ({ ...prev, minScore: e.target.value }))}
            placeholder="e.g. 60"
            style={{ width: 90, padding: "0.4rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem" }}
          />
        </div>
        <button type="button" onClick={applyFilters} style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.42rem 0.8rem", borderRadius: 8, border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.12)", color: "#f5d76e", cursor: "pointer" }}>Apply filters</button>
        <button type="button" onClick={resetFilters} style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.42rem 0.8rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: MUTED, cursor: "pointer" }}>Reset</button>
        <span style={{ fontSize: "0.72rem", color: MUTED, marginLeft: "0.4rem" }}>
          {state.items.length} awaiting review
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, padding: "0.6rem 0.9rem", background: "rgba(212,175,55,0.06)", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#f5d76e" }}>
            {selectedIds.size} selected{selectedIds.size > BATCH_CAP ? ` — exceeds batch cap ${BATCH_CAP}` : ""}
          </span>
          <button type="button" onClick={toggleSelectAll} style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#c7ccd8", cursor: "pointer" }}>{selectedIds.size === state.items.length ? "Clear selection" : "Select all (filtered)"}</button>
          <button type="button" onClick={() => setSelectedIds(new Set())} style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: MUTED, cursor: "pointer" }}>Clear</button>
          <button type="button" disabled={batchBusy} onClick={() => { setBatchOpen(true); setBatchResult(null); }} style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 800, padding: "0.4rem 0.9rem", borderRadius: 8, border: "1px solid rgba(212,175,55,0.5)", background: "linear-gradient(135deg, #d4af37, #f5d76e)", color: "#0a0d13", cursor: "pointer" }}>Apply batch decision</button>
        </div>
      )}

      {error && (
        <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1rem 1.25rem", color: "#fca5a5", fontSize: "0.88rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading review queue…</div>
      ) : (
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: "left" }}>
                  <th style={{ padding: "0.7rem 0.6rem 0.7rem 1.2rem", width: 34 }}>
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onChange={toggleSelectAll}
                      title="Select all (filtered)"
                      style={{ cursor: "pointer", accentColor: "#d4af37" }}
                    />
                  </th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>TITLE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>COMPANY</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>SOURCE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>SCORE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>LAST REVIEW</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "1.4rem 1.2rem", color: MUTED, textAlign: "center" }}>No candidates awaiting permission review.</td></tr>
                )}
                {items.map((item) => (
                  <tr key={item.id} onClick={() => openDetail(item)} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                    <td style={{ padding: "0.7rem 0.6rem 0.7rem 1.2rem" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        style={{ cursor: "pointer", accentColor: "#d4af37" }}
                      />
                    </td>
                    <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>{item.title}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{item.company || "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{item.source || "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem" }}>
                      <Badge label={String(item.status || "ranked").toUpperCase()} color={item.status === "rejected" ? RED : item.status === "approved" ? GREEN : AMBER} />
                    </td>
                    <td style={{ padding: "0.7rem 1.2rem", color: GOLD, fontWeight: 700 }}>{item.score != null ? item.score : "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>
                      {item.latestReview ? (
                        <span style={{ color: DECISION_TONE[item.latestReview.decision] || MUTED }}>{titleCase(item.latestReview.decision)}</span>
                      ) : (
                        "Never reviewed"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.72)", zIndex: 50, display: "grid", placeItems: "center", padding: "1.25rem" }} onClick={() => { if (!busy) { setSelected(null); setAction(emptyAction); } }}>
          <div className="fd-card" style={{ maxWidth: 760, width: "100%", maxHeight: "86vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <Badge label="PERMISSION UNKNOWN" color={AMBER} />
                <h3 className="fd-heading" style={{ margin: "0.5rem 0 0", fontSize: "1.2rem" }}>{selected.title}</h3>
                <p style={{ margin: "0.25rem 0 0", color: MUTED, fontSize: "0.85rem" }}>
                  {selected.company || "—"} · {selected.source || "—"} · {selected.url ? <a href={selected.url} target="_blank" rel="noreferrer" style={{ color: BLUE }}>source</a> : "no link"}
                </p>
              </div>
              <button type="button" disabled={busy} onClick={() => { setSelected(null); setAction(emptyAction); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#eef1f6", borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
            </div>

            {selected.description && (
              <p style={{ margin: "0.9rem 0 0", fontSize: "0.85rem", color: "#c7ccd8", lineHeight: 1.5 }}>{selected.description}</p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem", marginTop: "1rem" }}>
              {[
                ["Current mode", selected.resolvedState ? titleCase(selected.resolvedState.earningMode) : "PERMISSION_UNKNOWN"],
                ["Contract permission", selected.resolvedState ? titleCase(selected.resolvedState.contractPermission) : "UNKNOWN"],
                ["Channel", selected.resolvedState ? titleCase(selected.resolvedState.opportunityChannel) : "—"],
                ["Score", selected.score != null ? selected.score : "—"],
                ["Discovered", formatDate(selected.discoveredAt)],
                ["Capability match", selected.hasCapabilityMatch ? "Yes" : "No"]
              ].map(([label, value]) => (
                <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                  <p style={{ margin: "0.2rem 0 0", fontWeight: 700, fontSize: "0.9rem" }}>{value}</p>
                </div>
              ))}
            </div>

            {selected.valueModel && selected.valueModel.estimatedINR != null && (
              <p style={{ margin: "0.9rem 0 0", fontSize: "0.82rem", color: MUTED }}>
                Potential: <strong style={{ color: GOLD }}>{formatAmount(selected.valueModel.estimatedINR, "INR")}</strong> {selected.valueModel.payUnit ? `(${selected.valueModel.payUnit})` : ""} — potential, never received revenue.
              </p>
            )}

            {selected.history && selected.history.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.1em", fontWeight: 800, color: MUTED }}>REVIEW HISTORY</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {selected.history.map((h) => (
                    <div key={h.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Badge label={titleCase(h.decision)} color={DECISION_TONE[h.decision] || MUTED} />
                        <span style={{ fontSize: "0.72rem", color: MUTED }}>{formatDate(h.decidedAt)} · {h.reviewer || "founder"}</span>
                      </div>
                      {h.evidenceType && h.evidenceType !== "UNKNOWN" && (
                        <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: MUTED }}>Evidence: {titleCase(h.evidenceType)}{h.evidenceSource ? ` · ${h.evidenceSource}` : ""}</p>
                      )}
                      {h.evidenceSummary && <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "#c7ccd8" }}>{h.evidenceSummary}</p>}
                      {h.note && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: MUTED }}>Note: {h.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!action.decision ? (
              <div style={{ marginTop: "1.1rem", display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: MUTED, fontWeight: 700 }}>Founder decision:</span>
                {[
                  ["PERMISSION_CONFIRMED", GREEN, "Confirm Permission"],
                  ["PERMISSION_PROHIBITED", RED, "Mark Prohibited"],
                  ["DISMISS", MUTED, "Dismiss"],
                  ["NEEDS_INFORMATION", AMBER, "Needs Information"]
                ].map(([decision, color, label]) => (
                  <button
                    key={decision}
                    type="button"
                    disabled={busy}
                    onClick={() => setAction({ ...emptyAction, decision })}
                    style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.4rem 0.7rem", borderRadius: 8, border: `1px solid ${color}55`, background: `${color}12`, color, cursor: "pointer" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.9rem 1rem", background: "rgba(255,255,255,0.02)" }}>
                {action.decision === "PERMISSION_CONFIRMED" && (
                  <>
                    <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: GREEN }}>Confirm Permission — FOUNDER_ENGAGED_GARUDA_ASSISTED + PERMITTED</p>
                    <div style={{ border: "1px solid rgba(212,175,55,0.3)", borderRadius: 10, padding: "0.7rem 0.85rem", background: "rgba(212,175,55,0.05)", fontSize: "0.78rem", color: "#e5ddb8", lineHeight: 1.5, marginBottom: "0.6rem" }}>
                      {ATTESTATION}
                    </div>
                  </>
                )}
                {action.decision === "PERMISSION_PROHIBITED" && (
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: RED }}>Mark Prohibited — NOT_ELIGIBLE + PROHIBITED (cannot be overridden)</p>
                )}
                {action.decision === "DISMISS" && (
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: MUTED }}>Dismiss — NOT_ELIGIBLE via the existing dismissal mechanism</p>
                )}
                {action.decision === "NEEDS_INFORMATION" && (
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: AMBER }}>Needs Information — stays PERMISSION_UNKNOWN in the queue</p>
                )}

                {action.decision !== "DISMISS" && action.decision !== "NEEDS_INFORMATION" && (
                  <div style={{ marginBottom: "0.6rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>EVIDENCE TYPE</label>
                    <select
                      value={action.evidenceType}
                      onChange={(e) => setAction((prev) => ({ ...prev, evidenceType: e.target.value }))}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem" }}
                    >
                      <option value="">Select evidence type…</option>
                      {EVIDENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(action.decision === "PERMISSION_CONFIRMED" || action.decision === "PERMISSION_PROHIBITED") && (
                  <div style={{ marginBottom: "0.6rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>EVIDENCE SOURCE</label>
                    <input
                      type="text"
                      value={action.evidenceSource}
                      onChange={(e) => setAction((prev) => ({ ...prev, evidenceSource: e.target.value }))}
                      placeholder="Where is this evidence found (email, contract, platform rules, listing terms)?"
                      style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem" }}
                    />
                  </div>
                )}
                {(action.decision === "PERMISSION_CONFIRMED" || action.decision === "PERMISSION_PROHIBITED") && (
                  <div style={{ marginBottom: "0.6rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>EVIDENCE SUMMARY</label>
                    <textarea
                      value={action.evidenceSummary}
                      onChange={(e) => setAction((prev) => ({ ...prev, evidenceSummary: e.target.value }))}
                      rows={3}
                      placeholder="Describe the concrete evidence that establishes or prohibits permission."
                      style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem", resize: "vertical" }}
                    />
                  </div>
                )}
                {(action.decision === "DISMISS" || action.decision === "NEEDS_INFORMATION") && (
                  <div style={{ marginBottom: "0.6rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>NOTE</label>
                    <textarea
                      value={action.note}
                      onChange={(e) => setAction((prev) => ({ ...prev, note: e.target.value }))}
                      rows={2}
                      placeholder="Founder note (recorded in the audit trail)."
                      style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem", resize: "vertical" }}
                    />
                  </div>
                )}
                {action.decision === "PERMISSION_CONFIRMED" && (
                  <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.78rem", color: "#c7ccd8", cursor: "pointer", marginBottom: "0.6rem" }}>
                    <input type="checkbox" checked={action.attestation} onChange={(e) => setAction((prev) => ({ ...prev, attestation: e.target.checked }))} />
                    <span>I confirm the Founder attestation above.</span>
                  </label>
                )}
                {action.error && <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", color: RED }}>{action.error}</p>}
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={submitDecision}
                    style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid rgba(212,175,55,0.4)", background: "linear-gradient(135deg, #d4af37, #f5d76e)", color: "#0a0d13", cursor: "pointer" }}
                  >
                    {busy ? "Recording…" : "Record decision"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setAction(emptyAction)}
                    style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#c7ccd8", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(batchOpen) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.72)", zIndex: 50, display: "grid", placeItems: "center", padding: "1.25rem" }} onClick={() => { if (!batchBusy) { setBatchAction(emptyBatchAction); setBatchResult(null); setBatchOpen(false); } }}>
          <div className="fd-card" style={{ maxWidth: 720, width: "100%", maxHeight: "86vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <Badge label={`BATCH · ${selectedIds.size} CANDIDATES`} color={AMBER} />
                <h3 className="fd-heading" style={{ margin: "0.5rem 0 0", fontSize: "1.2rem" }}>Batch founder decision</h3>
                <p style={{ margin: "0.25rem 0 0", color: MUTED, fontSize: "0.8rem" }}>
                  One shared decision + evidence applied per candidate, each keeping its own audit document. Cap: {BATCH_CAP}.
                </p>
              </div>
              <button type="button" disabled={batchBusy} onClick={() => { setBatchAction(emptyBatchAction); setBatchResult(null); setBatchOpen(false); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#eef1f6", borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
            </div>

            {!batchResult ? (
              <>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: MUTED, fontWeight: 700 }}>Batch decision:</span>
                  {[
                    ["PERMISSION_CONFIRMED", GREEN, "Confirm Permission"],
                    ["PERMISSION_PROHIBITED", RED, "Mark Prohibited"],
                    ["DISMISS", MUTED, "Dismiss"],
                    ["NEEDS_INFORMATION", AMBER, "Needs Information"]
                  ].map(([decision, color, label]) => (
                    <button
                      key={decision}
                      type="button"
                      disabled={batchBusy}
                      onClick={() => setBatchAction({ ...emptyBatchAction, decision })}
                      style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.4rem 0.7rem", borderRadius: 8, border: `1px solid ${batchAction.decision === decision ? color : `${color}55`}`, background: batchAction.decision === decision ? `${color}22` : `${color}12`, color, cursor: "pointer" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {batchAction.decision && (
                  <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.9rem 1rem", background: "rgba(255,255,255,0.02)" }}>
                    {batchAction.decision === "PERMISSION_CONFIRMED" && (
                      <>
                        <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: GREEN }}>Confirm Permission — shared FOUNDER_ATTESTATION for {selectedIds.size} candidates</p>
                        <div style={{ border: "1px solid rgba(212,175,55,0.3)", borderRadius: 10, padding: "0.7rem 0.85rem", background: "rgba(212,175,55,0.05)", fontSize: "0.78rem", color: "#e5ddb8", lineHeight: 1.5, marginBottom: "0.6rem" }}>
                          {ATTESTATION}
                        </div>
                      </>
                    )}
                    {batchAction.decision === "PERMISSION_PROHIBITED" && (
                      <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: RED }}>Mark Prohibited — shared prohibition evidence for {selectedIds.size} candidates</p>
                    )}
                    {batchAction.decision === "DISMISS" && (
                      <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: MUTED }}>Dismiss — shared note, no evidence required</p>
                    )}
                    {batchAction.decision === "NEEDS_INFORMATION" && (
                      <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 800, color: AMBER }}>Needs Information — stays PERMISSION_UNKNOWN</p>
                    )}

                    {(batchAction.decision === "PERMISSION_CONFIRMED" || batchAction.decision === "PERMISSION_PROHIBITED") && (
                      <div style={{ marginBottom: "0.6rem" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>EVIDENCE SOURCE {batchAction.decision === "PERMISSION_PROHIBITED" ? "(required)" : "(optional)"}</label>
                        <input
                          type="text"
                          value={batchAction.evidenceSource}
                          onChange={(e) => setBatchAction((prev) => ({ ...prev, evidenceSource: e.target.value }))}
                          placeholder={batchAction.decision === "PERMISSION_CONFIRMED" ? "Founder batch permission review of the selected candidates" : "Where is the prohibition evidence found?"}
                          style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem" }}
                        />
                      </div>
                    )}
                    <div style={{ marginBottom: "0.6rem" }}>
                      <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>EVIDENCE SUMMARY</label>
                      <textarea
                        value={batchAction.evidenceSummary}
                        onChange={(e) => setBatchAction((prev) => ({ ...prev, evidenceSummary: e.target.value }))}
                        rows={3}
                        placeholder="Shared evidence summary that applies to all selected candidates."
                        style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem", resize: "vertical" }}
                      />
                    </div>
                    {(batchAction.decision === "DISMISS" || batchAction.decision === "NEEDS_INFORMATION") && (
                      <div style={{ marginBottom: "0.6rem" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, display: "block", marginBottom: "0.25rem" }}>NOTE</label>
                        <textarea
                          value={batchAction.note}
                          onChange={(e) => setBatchAction((prev) => ({ ...prev, note: e.target.value }))}
                          rows={2}
                          placeholder="Shared founder note (recorded in each audit trail)."
                          style={{ width: "100%", padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "#0a0d13", color: "#eef1f6", fontSize: "0.8rem", resize: "vertical" }}
                        />
                      </div>
                    )}
                    {batchAction.decision === "PERMISSION_CONFIRMED" && (
                      <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.78rem", color: "#c7ccd8", cursor: "pointer", marginBottom: "0.6rem" }}>
                        <input type="checkbox" checked={batchAction.attestation} onChange={(e) => setBatchAction((prev) => ({ ...prev, attestation: e.target.checked }))} />
                        <span>I confirm the Founder attestation applies to all {selectedIds.size} selected candidates.</span>
                      </label>
                    )}
                    {batchAction.error && <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", color: RED }}>{batchAction.error}</p>}
                    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={batchBusy}
                        onClick={applyBatch}
                        style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid rgba(212,175,55,0.4)", background: "linear-gradient(135deg, #d4af37, #f5d76e)", color: "#0a0d13", cursor: "pointer" }}
                      >
                        {batchBusy ? "Applying…" : `Apply to ${selectedIds.size} candidates`}
                      </button>
                      <button
                        type="button"
                        disabled={batchBusy}
                        onClick={() => setBatchAction(emptyBatchAction)}
                        style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#c7ccd8", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.9rem 1rem", background: "rgba(255,255,255,0.02)" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", fontWeight: 800, color: "#f5d76e" }}>Batch result</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  {[
                    ["Confirmed", batchResult.summary.confirmed, GREEN],
                    ["Prohibited", batchResult.summary.prohibited, RED],
                    ["Dismissed", batchResult.summary.dismissed, MUTED],
                    ["Needs info", batchResult.summary.needsInformation, AMBER],
                    ["Failed", batchResult.summary.failed, RED]
                  ].map(([label, count, color]) => (
                    <span key={label} style={{ border: `1px solid ${color}55`, background: `${color}12`, color, borderRadius: 8, padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontWeight: 800 }}>
                      {label}: {count}
                    </span>
                  ))}
                </div>
                {batchResult.results && batchResult.results.some((r) => !r.ok) && (
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(248,113,113,0.05)" }}>
                    <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "#fca5a5" }}>INDIVIDUAL FAILURES (others applied)</p>
                    {batchResult.results.filter((r) => !r.ok).map((r) => (
                      <p key={r.candidateId} style={{ margin: "0 0 0.35rem", fontSize: "0.78rem", color: "#c7ccd8" }}>
                        <strong style={{ color: "#fca5a5" }}>{r.title || r.candidateId}:</strong> {r.error}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setBatchAction(emptyBatchAction); setBatchResult(null); setBatchOpen(false); }}
                  style={{ marginTop: "0.75rem", fontSize: "0.75rem", fontWeight: 800, padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#c7ccd8", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}