import React, { useEffect, useState } from "react";
import {
  listExecutionMissions,
  listExecutionTaskEvents,
  listExternalActionRequests,
  listSettlements,
  getRevenueRecords
} from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, RED, BLUE, PURPLE, titleCase, timeAgo } from "./format";
import Badge from "./Badge";

const EVENT_TONE = {
  completed: GREEN,
  started: BLUE,
  pending: AMBER,
  failed: RED,
  approved: GREEN,
  rejected: RED,
  recorded: PURPLE
};

export default function ActivityView() {
  const [state, setState] = useState({ loading: true, error: "", events: [] });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const missions = await listExecutionMissions();
        const missionList = Array.isArray(missions) ? missions : [];
        const [taskEvents, actionRequests, settlements, revenueRecords] = await Promise.all([
          Promise.all(missionList.map((m) => listExecutionTaskEvents(m.id).catch(() => []))),
          Promise.all(missionList.map((m) => listExternalActionRequests(m.id).catch(() => []))),
          listSettlements().catch(() => []),
          getRevenueRecords().catch(() => [])
        ]);

        const events = [];
        const flatTasks = taskEvents.flat().filter(Boolean);
        flatTasks.forEach((ev, i) => events.push({
          id: `task-${i}-${ev.hash || ev.createdAt || i}`,
          kind: "Task event",
          label: ev.taskName || ev.action || "Task",
          detail: ev.status || "event",
          at: ev.at || ev.createdAt,
          hash: ev.hash,
          tone: EVENT_TONE[ev.status] || MUTED
        }));

        const flatActions = actionRequests.flat().filter(Boolean);
        flatActions.forEach((req, i) => events.push({
          id: `action-${i}-${req.id}`,
          kind: "External action",
          label: req.actionType || req.type || "External action request",
          detail: req.status || "pending",
          at: req.createdAt || req.updatedAt,
          tone: EVENT_TONE[req.status] || AMBER
        }));

        const settlementList = Array.isArray(settlements) ? settlements : [];
        settlementList.forEach((s, i) => events.push({
          id: `settlement-${i}-${s.id}`,
          kind: "Settlement",
          label: `Settlement ${s.revenueRecordId ? String(s.revenueRecordId).slice(-6) : "record"}`,
          detail: s.status || "pending",
          at: s.createdAt,
          tone: EVENT_TONE[s.status] || AMBER
        }));

        const revenueList = Array.isArray(revenueRecords) ? revenueRecords : [];
        revenueList.forEach((r, i) => events.push({
          id: `revenue-${i}-${r.id}`,
          kind: "Revenue record",
          label: r.client || "Revenue record",
          detail: r.status || "pending",
          at: r.recordedAt || r.createdAt,
          tone: EVENT_TONE[r.status] || AMBER
        }));

        events.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
        if (!active) return;
        setState({ loading: false, error: "", events: events.slice(0, 120) });
      } catch (error) {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: error.message || "Failed to load activity." }));
      }
    })();
    return () => { active = false; };
  }, []);

  const { loading, error, events } = state;

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading operational activity…</div>;
  if (error) return (
    <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1.25rem", color: "#fca5a5", fontSize: "0.9rem" }}>
      <strong>Activity feed unavailable:</strong> {error}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>OPERATIONAL ACTIVITY</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Activity timeline</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Derived only from real mission task events, external-action decisions, settlement events, and revenue records. No fabricated activity.
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "2rem 1.25rem", color: MUTED, fontSize: "0.9rem" }}>
          No operational activity yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {events.map((ev) => (
            <div key={ev.id} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, marginTop: "0.4rem", background: ev.tone, boxShadow: `0 0 8px ${ev.tone}66` }} />
              <div style={{ flex: 1, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.55rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{ev.label}</span>
                  <span style={{ fontSize: "0.75rem", color: MUTED }}>{timeAgo(ev.at)}</span>
                </div>
                <div style={{ marginTop: "0.3rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <Badge label={ev.kind.toUpperCase()} color={BLUE} />
                  <Badge label={titleCase(ev.detail).toUpperCase()} color={ev.tone} />
                  {ev.hash && <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: MUTED }}>#{String(ev.hash).slice(0, 14)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}