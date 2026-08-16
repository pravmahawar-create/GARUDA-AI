import React, { useEffect, useState } from "react";
import { listOpportunities, updateOpportunity } from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, BLUE, RED, PURPLE, formatAmount, formatDate, titleCase } from "./format";
import Badge from "./Badge";

const OPP_STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_TONE = {
  prospect: BLUE,
  qualified: PURPLE,
  proposal: AMBER,
  negotiation: "#fb923c",
  won: GREEN,
  lost: RED
};

export default function OpportunitiesView() {
  const [state, setState] = useState({ loading: true, error: "", opportunities: [] });
  const [view, setView] = useState("kanban");
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    listOpportunities()
      .then((data) => setState({ loading: false, error: "", opportunities: Array.isArray(data) ? data : [] }))
      .catch((error) => setState((prev) => ({ ...prev, loading: false, error: error.message || "Failed to load opportunities." })));
  };

  useEffect(() => { load(); }, []);

  const transition = async (opp, stage) => {
    if (opp.stage === stage) return;
    setBusyId(opp.id);
    try {
      await updateOpportunity(opp.id, { stage });
      load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Failed to update opportunity stage." }));
    } finally {
      setBusyId(null);
    }
  };

  const { loading, error, opportunities } = state;
  const groups = OPP_STAGES.map((stage) => ({ stage, items: opportunities.filter((o) => o.stage === stage) }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p className="fd-eyebrow" style={{ margin: 0 }}>OPPORTUNITY PIPELINE</p>
          <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Opportunities</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
            Potential pipeline — values are <strong>potential</strong>, never received revenue.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            onClick={() => setView("kanban")}
            style={{ padding: "0.5rem 1rem", borderRadius: 10, fontSize: "0.82rem", fontWeight: 800, cursor: "pointer", border: "1px solid rgba(212,175,55,0.35)", background: view === "kanban" ? "linear-gradient(135deg, #d4af37, #f5d76e)" : "rgba(212,175,55,0.08)", color: view === "kanban" ? "#0a0d13" : "#eef1f6" }}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            style={{ padding: "0.5rem 1rem", borderRadius: 10, fontSize: "0.82rem", fontWeight: 800, cursor: "pointer", border: "1px solid rgba(212,175,55,0.35)", background: view === "list" ? "linear-gradient(135deg, #d4af37, #f5d76e)" : "rgba(212,175,55,0.08)", color: view === "list" ? "#0a0d13" : "#eef1f6" }}
          >
            List
          </button>
        </div>
      </div>

      {error && (
        <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1rem 1.25rem", color: "#fca5a5", fontSize: "0.88rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading opportunities…</div>
      ) : (
        <>
          {view === "kanban" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.9rem", alignItems: "start" }}>
              {groups.map((group) => (
                <div key={group.stage} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", padding: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem", color: STAGE_TONE[group.stage] || GOLD, textTransform: "capitalize" }}>{titleCase(group.stage)}</span>
                    <Badge label={String(group.items.length)} color={STAGE_TONE[group.stage] || GOLD} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {group.items.length === 0 && (
                      <p style={{ margin: 0, fontSize: "0.75rem", color: MUTED }}>No opportunities</p>
                    )}
                    {group.items.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => setSelected(opp)}
                        style={{ border: "1px solid rgba(212,175,55,0.16)", borderRadius: 10, padding: "0.6rem 0.75rem", background: "linear-gradient(165deg, rgba(212,175,55,0.06), rgba(10,14,20,0.85))", cursor: "pointer" }}
                      >
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.25 }}>{opp.title}</p>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.74rem", color: MUTED }}>{opp.client}</p>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", fontWeight: 700, color: GOLD }}>
                          {formatAmount(opp.potentialValue, opp.currency)}
                          <span style={{ fontWeight: 500, color: MUTED, marginLeft: "0.35rem" }}>{opp.probability != null ? `${opp.probability}%` : ""}</span>
                        </p>
                        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {OPP_STAGES.filter((s) => s !== opp.stage).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={busyId === opp.id}
                              onClick={(e) => { e.stopPropagation(); transition(opp, s); }}
                              style={{ fontSize: "0.62rem", fontWeight: 800, padding: "0.2rem 0.45rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#c7ccd8", cursor: "pointer", textTransform: "capitalize" }}
                            >
                              {busyId === opp.id ? "…" : s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ color: MUTED, textAlign: "left" }}>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>TITLE</th>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>CLIENT</th>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>STAGE</th>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>POTENTIAL</th>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>PROB</th>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>SOURCE</th>
                      <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>CREATED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opp) => (
                      <tr key={opp.id} onClick={() => setSelected(opp)} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                        <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>{opp.title}</td>
                        <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{opp.client}</td>
                        <td style={{ padding: "0.7rem 1.2rem" }}>
                          <Badge label={titleCase(opp.stage || "prospect").toUpperCase()} color={STAGE_TONE[opp.stage] || GOLD} />
                        </td>
                        <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700, color: GOLD }}>{formatAmount(opp.potentialValue, opp.currency)}</td>
                        <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{opp.probability != null ? `${opp.probability}%` : "—"}</td>
                        <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{opp.source || "direct"}</td>
                        <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{formatDate(opp.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.72)", zIndex: 50, display: "grid", placeItems: "center", padding: "1.25rem" }} onClick={() => setSelected(null)}>
          <div className="fd-card" style={{ maxWidth: 640, width: "100%", maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <Badge label={titleCase(selected.stage || "prospect").toUpperCase()} color={STAGE_TONE[selected.stage] || GOLD} />
                <h3 className="fd-heading" style={{ margin: "0.5rem 0 0", fontSize: "1.2rem" }}>{selected.title}</h3>
                <p style={{ margin: "0.25rem 0 0", color: MUTED, fontSize: "0.85rem" }}>{selected.client}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#eef1f6", borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem", marginTop: "1rem" }}>
              {[
                ["Potential value", `${formatAmount(selected.potentialValue, selected.currency)}`],
                ["Probability", selected.probability != null ? `${selected.probability}%` : "—"],
                ["Expected close", formatDate(selected.expectedCloseDate)],
                ["Source", selected.source || "direct"],
                ["Currency", selected.currency || "INR"],
                ["Created", formatDate(selected.createdAt)]
              ].map(([label, value]) => (
                <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                  <p style={{ margin: "0.2rem 0 0", fontWeight: 700, fontSize: "0.9rem" }}>{value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <p style={{ margin: "1rem 0 0", fontSize: "0.85rem", color: MUTED, lineHeight: 1.5 }}>{selected.notes}</p>
            )}
            {selected.tags && selected.tags.length > 0 && (
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {selected.tags.map((tag) => <Badge key={tag} label={tag} color={BLUE} />)}
              </div>
            )}

            <div style={{ marginTop: "1.1rem", display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: MUTED, fontWeight: 700 }}>Move to:</span>
              {OPP_STAGES.filter((s) => s !== selected.stage).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => { transition(selected, s); setSelected(null); }}
                  style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.35rem 0.7rem", borderRadius: 8, border: `1px solid ${STAGE_TONE[s]}55`, background: `${STAGE_TONE[s]}12`, color: STAGE_TONE[s], cursor: "pointer", textTransform: "capitalize" }}
                >
                  {busyId === selected.id ? "…" : titleCase(s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}