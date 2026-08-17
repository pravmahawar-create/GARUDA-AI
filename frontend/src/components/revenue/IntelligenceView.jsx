import React, { useEffect, useState } from "react";
import {
  listDiscoveryCandidates,
  decideDiscoveryCandidate,
  listIncomeGoals,
  getAffiliateStatus,
  listAffiliateCases
} from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, RED, BLUE, PURPLE, formatAmount, formatDate, titleCase } from "./format";
import Badge from "./Badge";

const CAND_TONE = {
  ranked: BLUE,
  approved: GREEN,
  rejected: RED,
  dismissed: MUTED
};

const GOAL_TONE = {
  draft: MUTED,
  active: GREEN,
  paused: AMBER,
  completed: GREEN,
  cancelled: RED
};

function Section({ eyebrow, title, note, children }) {
  return (
    <section className="fd-card" style={{ marginBottom: "1.25rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>{eyebrow}</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.05rem" }}>{title}</h2>
        {note && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: MUTED }}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function IntelligenceView() {
  const [state, setState] = useState({ loading: true, error: "", candidates: [], goals: [], affiliate: null, cases: [] });
  const [decisionBusy, setDecisionBusy] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([listDiscoveryCandidates(), listIncomeGoals(), getAffiliateStatus(), listAffiliateCases()])
      .then(([candidates, goals, affiliate, cases]) => {
        if (!active) return;
        setState({ loading: false, error: "", candidates: Array.isArray(candidates) ? candidates : [], goals: Array.isArray(goals) ? goals : [], affiliate, cases: Array.isArray(cases) ? cases : [] });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: error.message || "Failed to load intelligence." }));
      });
    return () => { active = false; };
  }, []);

  const decide = async (candidate, decision) => {
    setDecisionBusy(candidate.id);
    try {
      await decideDiscoveryCandidate(candidate.id, { status: decision, note: `Founder ${decision} from Revenue Universe console` });
      const refreshed = await listDiscoveryCandidates();
      setState((prev) => ({ ...prev, candidates: Array.isArray(refreshed) ? refreshed : prev.candidates }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Failed to record candidate decision." }));
    } finally {
      setDecisionBusy(null);
    }
  };

  const { loading, error, candidates, goals, affiliate, cases } = state;

  const isGarudaEligible = (c) =>
    ["garuda_deliverable", "founder_garuda", "autonomous_garuda"].includes(c.opportunityChannel) &&
    c.verification &&
    c.verification.garudaExecutionEligible === true;

  const candidateActionBlockedReason = (c) => {
    if (c.status !== "ranked") return "";
    if (!isGarudaEligible(c)) {
      return c.opportunityChannel === "human_opportunity_only" || c.opportunityChannel === "human_only"
        ? "Human-only job listing — GARUDA cannot execute this. Reject it."
        : "Not verified as GARUDA-executable deliverable.";
    }
    const vm = c.valueModel || {};
    if (!(vm.estimatedINR > 0)) return "Unverified/UNMEASURED value — reject.";
    if (vm.estimatedINR < 3000) return "Below INR 3000 minimum task value — reject.";
    return "";
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading intelligence…</div>;
  if (error) return (
    <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1.25rem", color: "#fca5a5", fontSize: "0.9rem" }}>
      <strong>Intelligence engine unavailable:</strong> {error}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>REVENUE INTELLIGENCE</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Intelligence</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Discovery candidates, income goals/missions, and affiliate pilot — each lifecycle kept distinct. Potential and targets are <strong>not</strong> revenue.
        </p>
      </div>

      <Section eyebrow="DISCOVERY CANDIDATES" title="Verified opportunity candidates" note="Scores and potential are intelligence estimates, never received revenue.">
        {candidates.length === 0 ? (
          <p style={{ margin: 0, color: MUTED, fontSize: "0.88rem" }}>No discovery candidates yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: "left" }}>
                  <th style={{ padding: "0.65rem 1rem", fontWeight: 700 }}>TITLE</th>
                  <th style={{ padding: "0.65rem 1rem", fontWeight: 700 }}>COMPANY</th>
                  <th style={{ padding: "0.65rem 1rem", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "0.65rem 1rem", fontWeight: 700 }}>SCORE</th>
                  <th style={{ padding: "0.65rem 1rem", fontWeight: 700 }}>CHANNEL</th>
                  <th style={{ padding: "0.65rem 1rem", fontWeight: 700 }}>FOUNDER ACTION</th>
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 40).map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.65rem 1rem", fontWeight: 700, maxWidth: 260 }}>
                      {c.title}
                      <div style={{ fontSize: "0.72rem", color: MUTED, fontWeight: 400 }}>{c.source || ""} · {formatDate(c.discoveredAt)}</div>
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: MUTED }}>{c.company || "—"}</td>
                    <td style={{ padding: "0.65rem 1rem" }}><Badge label={titleCase(c.status || "ranked").toUpperCase()} color={CAND_TONE[c.status] || BLUE} /></td>
                    <td style={{ padding: "0.65rem 1rem", fontWeight: 700, color: GOLD }}>{c.score != null ? c.score : "—"}</td>
                    <td style={{ padding: "0.65rem 1rem", color: MUTED, fontSize: "0.76rem" }}>
                      {titleCase(c.opportunityChannel || c.marketSourceType || "")}
                      {(c.opportunityChannel === "human_opportunity_only" || c.opportunityChannel === "human_only") && (
                        <div style={{ marginTop: "0.2rem" }}>
                          <Badge label="JOB LISTING — NOT GARUDA WORK" color={RED} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.65rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {["approved", "dismissed"].map((d) => (
                          <button
                            key={d}
                            type="button"
                            disabled={decisionBusy === c.id || c.status === d || (d === "approved" && candidateActionBlockedReason(c))}
                            onClick={() => decide(c, d)}
                            title={d === "approved" ? candidateActionBlockedReason(c) : undefined}
                            style={{ fontSize: "0.64rem", fontWeight: 800, padding: "0.25rem 0.5rem", borderRadius: 7, border: "1px solid rgba(255,255,255,0.16)", background: "transparent", color: c.status === d ? GREEN : (d === "approved" && candidateActionBlockedReason(c) ? "rgba(248,113,113,0.5)" : "#c7ccd8"), cursor: (d === "approved" && candidateActionBlockedReason(c)) ? "not-allowed" : "pointer", textTransform: "capitalize" }}
                          >
                            {decisionBusy === c.id ? "…" : d}
                          </button>
                        ))}
                      </div>
                      {candidateActionBlockedReason(c) && (
                        <div style={{ fontSize: "0.68rem", color: RED, marginTop: "0.3rem", maxWidth: 220 }}>{candidateActionBlockedReason(c)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section eyebrow="INCOME GOALS / MISSIONS" title="Income mission targets" note="Targets are optimization goals — no income is guaranteed and none is shown as received unless verified.">
        {goals.length === 0 ? (
          <p style={{ margin: 0, color: MUTED, fontSize: "0.88rem" }}>No income missions yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {goals.map((goal) => {
              const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
              const achieved = milestones.reduce((sum, m) => sum + (Number(m.achievedAmount) || 0), 0);
              const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((achieved / goal.targetAmount) * 100)) : 0;
              return (
                <div key={goal.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.9rem 1rem", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <strong style={{ fontSize: "0.86rem" }}>{goal.title || "Income mission"}</strong>
                    <Badge label={titleCase(goal.status || "active").toUpperCase()} color={GOAL_TONE[goal.status] || GREEN} />
                  </div>
                  <p style={{ margin: "0.5rem 0 0.3rem", fontSize: "0.8rem", color: MUTED }}>
                    Target {formatAmount(goal.targetAmount, goal.currency)} · Achieved {formatAmount(achieved, goal.currency)}
                  </p>
                  <div style={{ height: 7, borderRadius: 999, background: "rgba(212,175,55,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #b8860b, #f5d76e)", borderRadius: 999 }} />
                  </div>
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: MUTED }}>{pct}% of target · {goal.missionPolicy?.targetIsMinimum ? "minimum target" : "target"}</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section eyebrow="AFFILIATE PILOT" title="Affiliate conversion pilot" note="Affiliate commission/payment lifecycle is separate from RevenueRecords — never merged.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem", marginBottom: "0.9rem" }}>
          {affiliate ? (
            [
              ["Status", String(affiliate.status || "unknown").toUpperCase(), affiliate.status === "active" || affiliate.status === "healthy" ? GREEN : AMBER],
              ["Cases", affiliate.totalCases ?? cases.length, GOLD],
              ["Verified payments", affiliate.verifiedPayments ?? "—", GREEN]
            ].map(([label, value, color]) => (
              <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.02)" }}>
                <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                <p style={{ margin: "0.2rem 0 0", fontWeight: 800, color }}>{value}</p>
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: MUTED, fontSize: "0.85rem" }}>Affiliate pilot status unavailable.</p>
          )}
        </div>
        {cases.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {cases.slice(0, 10).map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.82rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.45rem" }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.provider || c.externalOfferId || c.id}</span>
                <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Badge label={titleCase(c.status || "offer_verified").toUpperCase()} color={BLUE} />
                  <span style={{ color: MUTED }}>{formatDate(c.updatedAt)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}