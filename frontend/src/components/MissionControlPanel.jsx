import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createMissionApi, listMissionsApi, getMissionApi, actionMissionApi } from "../services/api";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  panelSoft: "rgba(11, 15, 22, 0.85)",
  line: "rgba(245, 215, 110, 0.2)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#d4af37",
  goldStrong: "#aa820a",
  green: "#75f4ab",
  red: "#f87171",
  blue: "#7dd3fc"
};

export default function MissionControlPanel() {
  const [goal, setGoal] = useState("");
  const [founderApproved, setFounderApproved] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [missions, setMissions] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollTimerRef = useRef(null);

  // Load mission list on mount
  const refreshMissions = async () => {
    try {
      const list = await listMissionsApi();
      setMissions(list || []);
      if (list && list.length && !activeMission) {
        setActiveMission(list[0]);
      }
    } catch (e) {
      console.error("Failed to list missions:", e);
      setError("Failed to load persistent missions list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMissions();
  }, []);

  // Real-time polling for active mission
  useEffect(() => {
    if (!activeMission || !activeMission.missionId) return;

    const shouldPoll = ["RUNNING", "PLANNING", "WAITING_APPROVAL", "VERIFYING"].includes(activeMission.status);
    if (!shouldPoll) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const updated = await getMissionApi(activeMission.missionId);
        if (updated) {
          setActiveMission(updated);
          setMissions((prev) => prev.map((m) => (m.missionId === updated.missionId ? updated : m)));
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeMission?.missionId, activeMission?.status]);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!goal.trim() || launching) return;

    setError(null);
    setLaunching(true);
    try {
      const res = await createMissionApi(goal, founderApproved);
      if (res && res.success && res.data) {
        setGoal("");
        setActiveMission(res.data);
        await refreshMissions();
      } else {
        const errMsg = (res && (res.message || res.error)) ? `${res.message}${res.error ? `: ${res.error}` : ""}` : "Failed to launch autonomous mission";
        setError(errMsg);
      }
    } catch (err) {
      console.error("Launch error:", err);
      setError(err.message || "Network error while launching mission");
    } finally {
      setLaunching(false);
    }
  };

  const handleAction = async (actionType) => {
    if (!activeMission || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await actionMissionApi(activeMission.missionId, actionType);
      if (updated) {
        setActiveMission(updated);
        await refreshMissions();
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadgeColor = (status) => {
    switch (status) {
      case "COMPLETED": case "VERIFIED_SUCCESS": return palette.green;
      case "RUNNING": case "PLANNING": return palette.blue;
      case "WAITING_APPROVAL": case "BLOCKED": return palette.gold;
      case "FAILED": case "VERIFIED_FAILURE": return palette.red;
      default: return palette.muted;
    }
  };

  return (
    <div style={{ color: palette.text, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.15em", color: palette.gold, fontWeight: 700, textTransform: "uppercase" }}>
            GARUDA COCKPIT
          </span>
          <h2 style={{ margin: "0.2rem 0 0", fontSize: "1.6rem", fontWeight: 800 }}>Mission Control</h2>
          <p style={{ margin: "0.2rem 0 0", color: palette.muted, fontSize: "0.9rem" }}>
            Governed autonomous multi-task mission orchestration engine.
          </p>
        </div>
        <button
          onClick={refreshMissions}
          style={{ background: "rgba(245,215,110,0.1)", border: "1px solid rgba(245,215,110,0.3)", color: palette.gold, padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
        >
          ↻ Refresh Cockpit
        </button>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div style={{ background: "rgba(248, 113, 113, 0.15)", border: `1px solid ${palette.red}`, color: palette.red, padding: "0.8rem 1rem", borderRadius: 10, marginBottom: "1.5rem", fontSize: "0.88rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", color: palette.red, cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* Goal Launch Console */}
      <form onSubmit={handleLaunch} style={{ background: palette.panelSoft, border: `1px solid ${palette.line}`, borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: palette.gold, marginBottom: "0.5rem" }}>
          ENTER FOUNDER MISSION GOAL
        </label>
        <textarea
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Inspect repository architecture, check capability readiness, and verify governance constraints..."
          style={{ width: "100%", background: "#04070a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "0.8rem", color: "#fff", fontSize: "0.95rem", resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: palette.muted, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={founderApproved}
              onChange={(e) => setFounderApproved(e.target.checked)}
              style={{ accentColor: palette.gold }}
            />
            Grant Founder Pre-Approval Token
          </label>
          <button
            type="submit"
            disabled={launching || !goal.trim()}
            style={{
              background: launching || !goal.trim() ? "rgba(245,215,110,0.3)" : "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              color: "#000",
              border: "none",
              padding: "0.7rem 1.8rem",
              borderRadius: 999,
              fontWeight: 800,
              cursor: launching || !goal.trim() ? "not-allowed" : "pointer",
              fontSize: "0.9rem"
            }}
          >
            {launching ? "Launching Autonomous Mission..." : "⚡ Launch Mission"}
          </button>
        </div>
      </form>

      {/* Main Cockpit Split View */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "1.5rem" }}>
        {/* Left Column: Mission History */}
        <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 16, padding: "1.2rem", height: "fit-content" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.05rem", fontWeight: 700, color: palette.gold }}>Persistent Missions</h3>
          {loading ? (
            <p style={{ color: palette.muted, fontSize: "0.85rem" }}>Loading cockpit state...</p>
          ) : missions.length === 0 ? (
            <p style={{ color: palette.muted, fontSize: "0.85rem" }}>No active missions found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {missions.map((m) => {
                const isActive = activeMission?.missionId === m.missionId;
                return (
                  <div
                    key={m.missionId}
                    onClick={() => setActiveMission(m)}
                    style={{
                      padding: "0.8rem",
                      borderRadius: 10,
                      background: isActive ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.03)",
                      border: isActive ? `1px solid ${palette.gold}` : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: palette.muted }}>{m.missionId}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: statusBadgeColor(m.status), padding: "0.15rem 0.5rem", borderRadius: 4, background: "rgba(0,0,0,0.4)" }}>
                        {m.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: palette.text, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {m.goal}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Mission Inspector & Task Graph */}
        <div>
          {activeMission ? (
            <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 16, padding: "1.5rem" }}>
              {/* Active Mission Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: palette.gold }}>ID: {activeMission.missionId}</span>
                  <h3 style={{ margin: "0.3rem 0 0.5rem", fontSize: "1.3rem", fontWeight: 800 }}>{activeMission.goal}</h3>
                  <p style={{ margin: 0, color: palette.muted, fontSize: "0.85rem" }}>{activeMission.summary}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "inline-block", fontSize: "0.8rem", fontWeight: 800, color: statusBadgeColor(activeMission.status), padding: "0.3rem 0.8rem", borderRadius: 6, background: "rgba(0,0,0,0.5)", border: `1px solid ${statusBadgeColor(activeMission.status)}` }}>
                    STATUS: {activeMission.status}
                  </span>
                </div>
              </div>

              {/* Governance Gate Alert Box */}
              {(activeMission.status === "WAITING_APPROVAL" || activeMission.status === "BLOCKED") && (
                <div style={{ background: "rgba(245,215,110,0.12)", border: `2px solid ${palette.gold}`, borderRadius: 12, padding: "1.2rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: palette.gold, fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                    <span>🛡 GOVERNANCE ALERT — ACTION REQUIRES FOUNDER APPROVAL</span>
                  </div>
                  <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: palette.text, lineHeight: 1.5 }}>
                    This mission triggered a governed write or security boundary policy. Execution is paused awaiting Founder authorization.
                  </p>
                  <div style={{ display: "flex", gap: "0.8rem" }}>
                    <button
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading}
                      style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#000", border: "none", padding: "0.55rem 1.3rem", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      {actionLoading ? "Processing..." : "✓ Approve & Execute"}
                    </button>
                    <button
                      onClick={() => handleAction("reject")}
                      disabled={actionLoading}
                      style={{ background: "rgba(248,113,113,0.15)", border: "1px solid #f87171", color: "#f87171", padding: "0.55rem 1.3rem", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      ✗ Reject Mission
                    </button>
                  </div>
                </div>
              )}

              {/* Task Status Graph */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: palette.gold }}>Task Execution Graph</h4>
                {activeMission.tasks && activeMission.tasks.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {activeMission.tasks.map((task, idx) => (
                      <div key={task.id || idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: palette.text }}>
                            {idx + 1}. Task: {task.id} <span style={{ color: palette.muted, fontSize: "0.75rem" }}>({task.taskType})</span>
                          </span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: statusBadgeColor(task.status) }}>
                            ● {task.status}
                          </span>
                        </div>
                        {task.targetPath && <p style={{ margin: "0.2rem 0", fontSize: "0.8rem", color: palette.muted }}>Target: <code>{task.targetPath}</code></p>}
                        {task.command && <p style={{ margin: "0.2rem 0", fontSize: "0.8rem", color: palette.muted }}>Command: <code>{task.command}</code></p>}
                        <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: palette.muted, marginTop: "0.5rem" }}>
                          <span>Worker: {task.worker || "local_brain_worker"}</span>
                          {task.retryCount > 0 && <span>Retries: {task.retryCount}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: palette.muted, fontSize: "0.85rem" }}>No tasks registered.</p>
                )}
              </div>

              {/* Evidence & RAG Context */}
              {activeMission.evidence && (
                <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem" }}>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: 700, color: palette.gold }}>Verified Evidence & RAG Context</h4>
                  <pre style={{ margin: 0, fontSize: "0.75rem", color: palette.muted, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                    {JSON.stringify(activeMission.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 16, padding: "3rem", textAlign: "center", color: palette.muted }}>
              Select a mission from the left or launch a new mission above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
