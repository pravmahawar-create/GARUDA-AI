import React, { useEffect, useState } from "react";
import {
  listExecutionMissions,
  listExecutionMissionDecisions,
  listExecutionTaskEvents,
  decideExecutionMission,
  listExternalActionRequests,
  listRevenueConnectors,
  getDeploymentReadiness,
  listPilotLedger,
  getProductionDelivery,
  resubmitExecutionMission
} from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, RED, BLUE, PURPLE, formatDate, titleCase, timeAgo } from "./format";
import Badge from "./Badge";

const MISSION_TONE = {
  awaiting_bounded_scope: BLUE,
  ready_for_founder_review: AMBER,
  founder_approved: GREEN,
  changes_required: RED,
  rejected: RED,
  blocked: RED
};

export default function ExecutionView() {
  const [state, setState] = useState({ loading: true, error: "", missions: [], connectors: [], readiness: null });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([listExecutionMissions(), listRevenueConnectors(), getDeploymentReadiness()])
      .then(([missions, connectors, readiness]) => {
        setState({ loading: false, error: "", missions: Array.isArray(missions) ? missions : [], connectors: Array.isArray(connectors) ? connectors : [], readiness });
      })
      .catch((error) => setState((prev) => ({ ...prev, loading: false, error: error.message || "Failed to load execution missions." })));
  };

  useEffect(() => { load(); }, []);

  const openMission = async (mission) => {
    setSelected(mission);
    setDetail({ loading: true });
    const [decisions, events, actionRequests, pilotLedger, productionDelivery] = await Promise.all([
      listExecutionMissionDecisions(mission.id).catch(() => []),
      listExecutionTaskEvents(mission.id).catch(() => []),
      listExternalActionRequests(mission.id).catch(() => []),
      listPilotLedger(mission.id).catch(() => []),
      getProductionDelivery(mission.id).catch(() => null)
    ]);
    setDetail({
      loading: false,
      decisions: Array.isArray(decisions) ? decisions : [],
      events: Array.isArray(events) ? events : [],
      actionRequests: Array.isArray(actionRequests) ? actionRequests : [],
      pilotLedger: Array.isArray(pilotLedger) ? pilotLedger : [],
      productionDelivery
    });
  };

  const submitDecision = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await decideExecutionMission(selected.id, { decision, notes: note });
      load();
      openMission(selected);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Failed to record decision." }));
    } finally {
      setBusy(false);
    }
  };

  const resubmit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await resubmitExecutionMission(selected.id, { responseToFounder: note });
      load();
      openMission(selected);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Failed to resubmit mission." }));
    } finally {
      setBusy(false);
    }
  };

  const { loading, error, missions, connectors, readiness } = state;
  const workPackages = Array.isArray(selected?.workPackages) ? selected.workPackages : [];
  const events = detail?.events || [];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>EXECUTION MISSIONS</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Governed execution workspace</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Opportunity → Verification → Execution Mission → Founder Approval → Authorized External Action → Evidence → Revenue Record → Settlement.
        </p>
      </div>

      {error && (
        <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1rem 1.25rem", color: "#fca5a5", fontSize: "0.88rem", marginBottom: "1rem" }}>{error}</div>
      )}

      {readiness && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            ["Deployment readiness", readiness.deploymentReady ? "READY" : "NOT READY", readiness.deploymentReady ? GREEN : RED],
            ["Missions", missions.length, GOLD],
            ["Connectors", connectors.length, BLUE]
          ].map(([label, value, color]) => (
            <div key={label} className="fd-stat" style={{ padding: "0.85rem 1rem" }}>
              <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.12em", fontWeight: 800 }}>{label.toUpperCase()}</p>
              <p style={{ margin: "0.25rem 0 0", fontWeight: 800, fontSize: "1.05rem", color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading execution missions…</div>
      ) : missions.length === 0 ? (
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "2rem 1.25rem", color: MUTED, fontSize: "0.9rem" }}>
          No execution missions yet. Missions are created from Founder-approved candidates only.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {missions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => openMission(mission)}
              style={{ border: "1px solid rgba(212,175,55,0.16)", borderRadius: 14, padding: "1rem 1.2rem", background: "linear-gradient(165deg, rgba(212,175,55,0.05), rgba(10,14,20,0.85))", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <Badge label={titleCase(mission.status || "awaiting_bounded_scope").toUpperCase()} color={MISSION_TONE[mission.status] || BLUE} />
                  <h3 className="fd-heading" style={{ margin: "0.5rem 0 0", fontSize: "1.05rem" }}>{mission.opportunity?.title || mission.title || "Execution mission"}</h3>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: MUTED }}>
                    {mission.opportunity?.company || mission.candidateId ? `Candidate ${String(mission.candidateId).slice(-6)}` : ""} · updated {timeAgo(mission.updatedAt || mission.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.78rem", color: MUTED }}>
                  <div>{mission.engine}</div>
                  <div>{mission.revisionNumber > 0 ? `Revision ${mission.revisionNumber}` : "v1"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
                {(mission.workPackages || []).slice(0, 4).map((wp) => (
                  <span key={`${wp.title}-${wp.status}`} style={{ fontSize: "0.7rem", padding: "0.25rem 0.55rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", color: MUTED }}>{wp.title}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.8)", zIndex: 50, display: "grid", placeItems: "center", padding: "1.25rem" }} onClick={() => setSelected(null)}>
          <div className="fd-card" style={{ maxWidth: 820, width: "100%", maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <Badge label={titleCase(selected.status || "").toUpperCase()} color={MISSION_TONE[selected.status] || BLUE} />
                <h3 className="fd-heading" style={{ margin: "0.5rem 0 0", fontSize: "1.15rem" }}>{selected.opportunity?.title || selected.title || "Execution mission"}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#eef1f6", borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
            </div>

            {detail?.loading ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: MUTED }}>Loading mission detail…</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem", marginTop: "1rem" }}>
                  {[
                    ["Status", titleCase(selected.status || "—")],
                    ["Engine", selected.engine || "—"],
                    ["Revision", selected.revisionNumber || 0],
                    ["Created", formatDate(selected.createdAt)]
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)" }}>
                      <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                      <p style={{ margin: "0.2rem 0 0", fontWeight: 700, fontSize: "0.9rem" }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1.1rem" }}>
                  <p className="fd-eyebrow" style={{ margin: 0 }}>WORK PACKAGES</p>
                  {workPackages.length === 0 ? (
                    <p style={{ margin: "0.4rem 0 0", color: MUTED, fontSize: "0.85rem" }}>No work packages prepared yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                      {workPackages.map((wp, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.84rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                          <span>{i + 1}. {wp.title}</span>
                          <span style={{ color: wp.status === "completed" ? GREEN : wp.status === "blocked" ? RED : AMBER }}>{titleCase(wp.status || "pending")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {events.length > 0 && (
                  <div style={{ marginTop: "1.1rem" }}>
                    <p className="fd-eyebrow" style={{ margin: 0 }}>TASK EVENTS / EVIDENCE</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.5rem", maxHeight: 220, overflowY: "auto" }}>
                      {events.slice(0, 20).map((ev, i) => (
                        <div key={i} style={{ fontSize: "0.8rem", color: MUTED, borderLeft: `2px solid ${GOLD}44`, paddingLeft: "0.7rem" }}>
                          {ev.taskName || ev.action || "Task"} · {ev.status || "event"} · {timeAgo(ev.at || ev.createdAt)}
                          {ev.hash && <span style={{ marginLeft: "0.4rem", fontFamily: "monospace", fontSize: "0.7rem" }}>#{String(ev.hash).slice(0, 12)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail?.actionRequests?.length > 0 && (
                  <div style={{ marginTop: "1.1rem" }}>
                    <p className="fd-eyebrow" style={{ margin: 0 }}>EXTERNAL-ACTION QUEUE</p>
                    {detail.actionRequests.map((req) => (
                      <div key={req.id} style={{ border: "1px solid rgba(125,211,252,0.22)", borderRadius: 10, padding: "0.7rem 0.9rem", marginTop: "0.5rem", background: "rgba(125,211,252,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                          <strong>{req.actionType || req.type || "External action"}</strong>
                          <Badge label={titleCase(req.status || "pending").toUpperCase()} color={req.status === "approved" ? GREEN : req.status === "completed" ? GREEN : AMBER} />
                        </div>
                        {req.connectorId && <div style={{ fontSize: "0.76rem", color: MUTED, marginTop: "0.3rem" }}>Connector: {req.connectorId}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {detail?.pilotLedger?.length > 0 && (
                  <div style={{ marginTop: "1.1rem" }}>
                    <p className="fd-eyebrow" style={{ margin: 0 }}>PILOT LEDGER</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.5rem" }}>
                      {detail.pilotLedger.map((entry) => (
                        <div key={entry.id} style={{ fontSize: "0.82rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.45rem" }}>
                          <span>{entry.label || entry.description || entry.action || "Ledger entry"}</span>
                          <span style={{ color: entry.verified ? GREEN : MUTED }}>{entry.verified ? "VERIFIED" : titleCase(entry.status || "pending")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "1.2rem", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: "0.9rem 1rem", background: "rgba(212,175,55,0.05)" }}>
                  <p className="fd-eyebrow" style={{ margin: 0 }}>FOUNDER DECISION CHECKPOINT</p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                    {["approved", "request_changes", "rejected"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDecision(d)}
                        style={{ padding: "0.45rem 0.9rem", borderRadius: 9, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", border: "1px solid rgba(212,175,55,0.35)", background: decision === d ? "linear-gradient(135deg, #d4af37, #f5d76e)" : "rgba(212,175,55,0.08)", color: decision === d ? "#0a0d13" : "#eef1f6", textTransform: "capitalize" }}
                      >
                        {d.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Decision note (optional)"
                    style={{ width: "100%", marginTop: "0.6rem", padding: "0.5rem 0.7rem", borderRadius: 9, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.83rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                    <button type="button" disabled={busy} onClick={submitDecision} style={{ padding: "0.55rem 1.1rem", borderRadius: 10, fontWeight: 800, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #d4af37, #f5d76e)", color: "#0a0d13" }}>
                      {busy ? "Recording…" : "Record decision"}
                    </button>
                    <button type="button" disabled={busy} onClick={resubmit} style={{ padding: "0.55rem 1.1rem", borderRadius: 10, fontWeight: 800, cursor: "pointer", border: "1px solid rgba(125,211,252,0.4)", background: "rgba(125,211,252,0.08)", color: "#7dd3fc" }}>
                      {busy ? "…" : "Resubmit corrected mission"}
                    </button>
                  </div>
                </div>

                {detail?.productionDelivery && (
                  <div style={{ marginTop: "1rem", border: "1px solid rgba(117,244,171,0.22)", borderRadius: 12, padding: "0.85rem 1rem", background: "rgba(117,244,171,0.05)" }}>
                    <p style={{ margin: 0, color: GREEN, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em" }}>PRODUCTION DELIVERY</p>
                    <pre style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: MUTED, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {JSON.stringify(detail.productionDelivery, null, 2).slice(0, 900)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}