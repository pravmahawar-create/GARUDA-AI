import React, { useEffect, useState } from "react";
import {
  listAcquisitions,
  listDiscoveryCandidates,
  draftAcquisitionProposal,
  getDealMetrics,
  submitDeal
} from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, RED, BLUE, PURPLE, formatAmount, formatDate, titleCase } from "./format";
import Badge from "./Badge";

const ACQ_TONE = {
  proposal_drafted: BLUE,
  changes_requested: AMBER,
  source_invalidated: RED,
  handoff_ready: GREEN,
  submitted: PURPLE,
  response_received: AMBER,
  closed_no_award: RED,
  mission_created: GREEN
};

export default function ProposalsView() {
  const [state, setState] = useState({ loading: true, error: "", acquisitions: [], candidates: [], deals: null });
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [proposalType, setProposalType] = useState("application");
  const [summary, setSummary] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = () => {
    Promise.all([listAcquisitions(), listDiscoveryCandidates(), getDealMetrics()])
      .then(([acquisitions, candidates, deals]) => {
        setState({ loading: false, error: "", acquisitions: Array.isArray(acquisitions) ? acquisitions : [], candidates: Array.isArray(candidates) ? candidates : [], deals });
      })
      .catch((error) => setState((prev) => ({ ...prev, loading: false, error: error.message || "Failed to load proposals." })));
  };

  useEffect(() => { load(); }, []);

  const draft = async () => {
    if (!selectedCandidate) return;
    setBusy(true);
    setResult(null);
    try {
      const payload = {};
      if (proposalType) payload.proposalType = proposalType;
      if (summary.trim()) payload.summary = summary.trim();
      if (deliverables.trim()) payload.deliverables = deliverables.split(",").map((d) => d.trim()).filter(Boolean);
      const data = await draftAcquisitionProposal(selectedCandidate, payload);
      setResult({ ok: true, message: "Proposal drafted (internal draft only — no external submission performed).", data });
      load();
    } catch (error) {
      setResult({ ok: false, message: error.message || "Failed to draft proposal." });
    } finally {
      setBusy(false);
    }
  };

  const submitDealRecord = async () => {
    setBusy(true);
    setResult(null);
    try {
      const data = await submitDeal({ dealId: `deal-${Date.now()}`, opportunityCategory: "other", executionMode: "founder_assisted", title: "Founder-tracked deal", client: "Founder manual track", platform: "Direct", pricing: { quotedPrice: 0, currency: "INR" } });
      setResult({ ok: true, message: `Deal recorded: ${data?.dealId || "—"} (tracking only, ₹0).` });
      load();
    } catch (error) {
      setResult({ ok: false, message: error.message || "Failed to record deal." });
    } finally {
      setBusy(false);
    }
  };

  const { loading, error, acquisitions, candidates, deals } = state;

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading proposals…</div>;
  if (error) return (
    <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1.25rem", color: "#fca5a5", fontSize: "0.9rem" }}>
      <strong>Proposal engine unavailable:</strong> {error}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>PROPOSAL WORKFLOW</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Proposals</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Grounded acquisition proposals. Drafts are internal only — no automatic external submission; Founder approval gates any handoff.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <div className="fd-card" style={{ marginBottom: 0 }}>
          <p className="fd-eyebrow" style={{ margin: 0 }}>DRAFT GROUNDED PROPOSAL</p>
          <h3 className="fd-heading" style={{ margin: "0.1rem 0 0.9rem", fontSize: "1rem" }}>From a discovery candidate</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              style={{ width: "100%", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.85rem" }}
            >
              <option value="">Select an approved/ranked candidate…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.title} — {c.company || "no company"} ({c.status})</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setProposalType("application")} style={{ flex: 1, padding: "0.5rem", borderRadius: 10, fontWeight: 800, fontSize: "0.8rem", cursor: "pointer", border: "1px solid rgba(212,175,55,0.35)", background: proposalType === "application" ? "linear-gradient(135deg, #d4af37, #f5d76e)" : "rgba(212,175,55,0.08)", color: proposalType === "application" ? "#0a0d13" : "#eef1f6" }}>Application</button>
              <button type="button" onClick={() => setProposalType("quotation")} style={{ flex: 1, padding: "0.5rem", borderRadius: 10, fontWeight: 800, fontSize: "0.8rem", cursor: "pointer", border: "1px solid rgba(212,175,55,0.35)", background: proposalType === "quotation" ? "linear-gradient(135deg, #d4af37, #f5d76e)" : "rgba(212,175,55,0.08)", color: proposalType === "quotation" ? "#0a0d13" : "#eef1f6" }}>Quotation</button>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Optional proposal summary (grounded in the source snapshot)."
              rows={3}
              style={{ width: "100%", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.85rem", resize: "vertical" }}
            />
            <input
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="Optional deliverables, comma separated"
              style={{ width: "100%", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.85rem" }}
            />
            <button
              type="button"
              disabled={busy || !selectedCandidate}
              onClick={draft}
              style={{ padding: "0.6rem", borderRadius: 10, fontWeight: 800, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #d4af37, #f5d76e)", color: "#0a0d13" }}
            >
              {busy ? "Drafting…" : "Draft grounded proposal"}
            </button>
          </div>
        </div>

        <div className="fd-card" style={{ marginBottom: 0 }}>
          <p className="fd-eyebrow" style={{ margin: 0 }}>DEAL REALITY</p>
          <h3 className="fd-heading" style={{ margin: "0.1rem 0 0.9rem", fontSize: "1rem" }}>Submission / response tracker</h3>
          {deals ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
              {[
                ["Submissions", deals.submissionCount],
                ["Reply rate", deals.replyRatePercent != null ? `${deals.replyRatePercent}%` : "—"],
                ["Win rate", deals.winRatePercent != null ? `${deals.winRatePercent}%` : "—"],
                ["Revenue collected", formatAmount(deals.revenueCollected, "INR")]
              ].map(([label, value]) => (
                <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                  <p style={{ margin: "0.2rem 0 0", fontWeight: 700, fontSize: "0.95rem" }}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: MUTED, fontSize: "0.85rem" }}>Awaiting empirical deal data.</p>
          )}
          <p style={{ margin: "0.85rem 0 0", fontSize: "0.74rem", color: MUTED, lineHeight: 1.5 }}>
            Deal tracker records real submissions and client responses only. No fabricated reply, interview, or win rates.
          </p>
        </div>
      </div>

      {result && (
        <div style={{ border: `1px solid ${result.ok ? "rgba(117,244,171,0.4)" : "rgba(248,113,113,0.4)"}`, background: result.ok ? "rgba(117,244,171,0.06)" : "rgba(248,113,113,0.08)", borderRadius: 14, padding: "0.9rem 1.1rem", marginBottom: "1.25rem", fontSize: "0.85rem", color: result.ok ? "#75f4ab" : "#fca5a5" }}>
          {result.message}
        </div>
      )}

      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
        {acquisitions.length === 0 ? (
          <div style={{ padding: "2rem 1.25rem", color: MUTED, fontSize: "0.9rem" }}>
            No acquisition proposal cases yet. Draft a grounded proposal above to begin.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: "left" }}>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>TITLE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>CAPABILITY</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {acquisitions.map((acq) => (
                  <tr key={acq.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700, maxWidth: 300 }}>
                      {acq.listing?.title || acq.proposal?.title || "Proposal"}
                      <div style={{ fontSize: "0.74rem", color: MUTED, fontWeight: 400 }}>{acq.listing?.company || acq.listing?.originalUrl || ""}</div>
                    </td>
                    <td style={{ padding: "0.7rem 1.2rem" }}>
                      <Badge label={titleCase(acq.status || "proposal_drafted").toUpperCase()} color={ACQ_TONE[acq.status] || BLUE} />
                    </td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{acq.proposal?.proposalType || "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{acq.capability?.name || "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{formatDate(acq.updatedAt || acq.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}