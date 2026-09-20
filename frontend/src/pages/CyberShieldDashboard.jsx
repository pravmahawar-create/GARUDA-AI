import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "#0a0f18";
const PANEL_HOVER = "#0f172a";
const BORDER = "rgba(212, 175, 55, 0.2)";

export default function CyberShieldDashboard({ customer, onLogout }) {
  const navigate = useNavigate();

  // State
  const [telemetry, setTelemetry] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [activeIncident, setActiveIncident] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);

  // New Monitor Form
  const [showAddMonitor, setShowAddMonitor] = useState(false);
  const [newTarget, setNewTarget] = useState("");
  const [newPlatform, setNewPlatform] = useState("instagram");
  const [savingMonitor, setSavingMonitor] = useState(false);

  // Live Threat Test Console
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Notifications
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTelemetry() {
    try {
      const res = await fetch("/api/cybershield/health");
      const data = await res.json();
      if (data.success) {
        setTelemetry(data.telemetry);
      }
    } catch (_) {}
  }

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [healthRes, monitorsRes, incidentsRes] = await Promise.all([
        fetch("/api/cybershield/health").then((r) => r.json()).catch(() => ({})),
        fetch("/api/cybershield/monitors").then((r) => r.json()).catch(() => ({})),
        fetch("/api/cybershield/incidents").then((r) => r.json()).catch(() => ({}))
      ]);

      if (healthRes.success) setTelemetry(healthRes.telemetry);
      if (monitorsRes.success) setMonitors(monitorsRes.data || []);
      if (incidentsRes.success) setIncidents(incidentsRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMonitor(e) {
    e.preventDefault();
    if (!newTarget.trim()) return;
    setSavingMonitor(true);
    try {
      const res = await fetch("/api/cybershield/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIdentifier: newTarget.trim(),
          platform: newPlatform,
          targetType: "account"
        })
      });
      const data = await res.json();
      if (data.success) {
        setMonitors([data.data, ...monitors]);
        setNewTarget("");
        setShowAddMonitor(false);
        setNotice({ type: "success", text: `Active Shield enabled for ${newTarget} on ${newPlatform.toUpperCase()}!` });
      } else {
        setNotice({ type: "error", text: data.message || "Failed to add target" });
      }
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSavingMonitor(false);
    }
  }

  async function handleToggleStatus(monitor) {
    const nextStatus = monitor.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/cybershield/monitors/${monitor.monitorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setMonitors(monitors.map((m) => (m.monitorId === monitor.monitorId ? data.data : m)));
        setNotice({ type: "success", text: `Monitor status updated to ${nextStatus}` });
      }
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!testText.trim()) return;
    setTesting(true);
    try {
      const res = await fetch("/api/cybershield/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleApproveAction(incidentId, actionType) {
    try {
      const res = await fetch(`/api/cybershield/incidents/${incidentId}/approve-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, notes: "Approved by client via CyberShield cockpit" })
      });
      const data = await res.json();
      if (data.success) {
        setIncidents(incidents.map((inc) => (inc.incidentId === incidentId ? data.data : inc)));
        if (activeIncident && activeIncident.incidentId === incidentId) {
          setActiveIncident(data.data);
        }
        setApprovalModal(null);
        setNotice({ type: "success", text: "Action authorized and locked in Section 63 audit trail!" });
      }
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === "ALL") return true;
    return inc.intelligence?.severityLevel === Number(filterSeverity);
  });

  const isShieldActive = telemetry?.status === "HEALTHY" || telemetry?.status === "DEGRADED";

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <SEOHead
        title="GARUDA CyberShield™ — Sovereign Autonomous Defense Cockpit"
        description="Autonomous social media protection, forensic evidence preservation under BSA 2023 Section 63, and statutory legal notice generator."
        canonical="https://www.garudaos.in/cybershield"
      />

      {/* Top Cockpit Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(10, 15, 24, 0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }} onClick={() => navigate("/app")}>
            <BrandAssetImage
              asset="emblem"
              variant="gold"
              alt="GARUDA"
              style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${GOLD}` }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA CYBERSHIELD™</span>
                <span style={{ fontSize: "0.65rem", background: "rgba(212,175,55,0.15)", border: `1px solid ${BORDER}`, color: GOLD_LIGHT, padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 800 }}>
                  BSA 2023 SEC 63
                </span>
              </div>
              <div style={{ fontSize: "0.72rem", color: GOLD, letterSpacing: "0.05em" }}>
                AUTONOMOUS ANTI-TROLL DEFENSE & FORENSIC VAULT
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Operational Health Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", background: isShieldActive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)", border: `1px solid ${isShieldActive ? "#10b981" : "#ef4444"}`, borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, color: isShieldActive ? "#34d399" : "#f87171" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isShieldActive ? "#10b981" : "#ef4444", display: "inline-block", boxShadow: isShieldActive ? "0 0 8px #10b981" : "none" }}></span>
              {isShieldActive ? "POLLING DEFENSE WORKER ACTIVE" : "WORKER OFFLINE"}
            </div>

            <button
              onClick={() => navigate("/app")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#cbd5e1",
                padding: "0.4rem 0.85rem",
                borderRadius: 6,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ← Back to Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "1.75rem 1.5rem" }}>
        {/* Notice Banner */}
        {notice && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.85rem 1.25rem",
              borderRadius: 8,
              fontSize: "0.85rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: notice.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${notice.type === "success" ? "#10b981" : "#ef4444"}`,
              color: notice.type === "success" ? "#34d399" : "#f87171"
            }}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}>✕</button>
          </div>
        )}

        {/* Telemetry Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Active Protected Targets</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", marginTop: "0.4rem" }}>{monitors.length}</div>
            <div style={{ fontSize: "0.75rem", color: GOLD, marginTop: "0.25rem" }}>Instagram • YouTube • X</div>
          </div>

          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Forensically Locked Incidents</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ef4444", marginTop: "0.4rem" }}>{incidents.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>Verified SHA-256 Certificates</div>
          </div>

          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Cloud Daemon Ingestion</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#38bdf8", marginTop: "0.4rem" }}>{telemetry?.totalJobsProcessed || 0}</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>Events Scanned Autonomously</div>
          </div>

          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Legal Integrity Standard</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: GOLD_LIGHT, marginTop: "0.6rem" }}>BSA Sec 63 / 65B</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>Prepared for Evidentiary Use</div>
          </div>
        </div>

        {/* Action Header & Live Tester */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Target Protection Config */}
          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: 0 }}>🛡️ Protected Social Targets</h2>
              <button
                onClick={() => setShowAddMonitor(!showAddMonitor)}
                style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                  color: "#05070a",
                  border: "none",
                  borderRadius: 6,
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {showAddMonitor ? "Cancel" : "+ Add Social Account"}
              </button>
            </div>

            {showAddMonitor && (
              <form onSubmit={handleAddMonitor} style={{ marginBottom: "1.25rem", padding: "1rem", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.3rem", fontWeight: 700 }}>Social Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", background: "#030712", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#fff", fontSize: "0.85rem" }}
                  >
                    <option value="instagram">Instagram (@handle or Reel URL)</option>
                    <option value="youtube">YouTube (Channel / Video URL)</option>
                    <option value="x_twitter">X / Twitter (@handle)</option>
                    <option value="generic_social">Generic Public URL</option>
                  </select>
                </div>
                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.3rem", fontWeight: 700 }}>Handle or URL</label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="e.g. @my_brand or https://instagram.com/reel/xyz"
                    required
                    style={{ width: "100%", padding: "0.5rem", background: "#030712", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#fff", fontSize: "0.85rem" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingMonitor}
                  style={{
                    width: "100%",
                    background: GOLD,
                    color: "#000",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.55rem",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: savingMonitor ? "wait" : "pointer"
                  }}
                >
                  {savingMonitor ? "Deploying Autonomous Shield..." : "Deploy Active Protection ➔"}
                </button>
              </form>
            )}

            {monitors.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                No active targets configured. Click "+ Add Social Account" to lock 24/7 protection.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 300, overflowY: "auto" }}>
                {monitors.map((m) => (
                  <div key={m.monitorId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: PANEL_HOVER, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.9rem" }}>{m.targetIdentifier}</span>
                        <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.08)", padding: "0.15rem 0.4rem", borderRadius: 4, textTransform: "uppercase" }}>{m.platform}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                        Scanned: {m.stats?.totalEventsScanned || 0} • Threats: {m.stats?.totalIncidentsDetected || 0}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleToggleStatus(m)}
                        style={{
                          background: m.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(234,179,8,0.15)",
                          border: `1px solid ${m.status === "ACTIVE" ? "#10b981" : "#eab308"}`,
                          color: m.status === "ACTIVE" ? "#34d399" : "#fde047",
                          padding: "0.25rem 0.6rem",
                          borderRadius: 4,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {m.status === "ACTIVE" ? "🟢 ACTIVE" : "🟡 PAUSED"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Second Live NLP Threat Console */}
          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem" }}>⚡ Sub-Second Live Threat Tester</h2>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 0 1rem" }}>
              Test any toxic Hindi/English/Hinglish comment to verify phonetic normalization and Tier 1-5 severity detection.
            </p>

            <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type or paste suspicious text (e.g. 'Tu ch**tiya hai fraud blackmail karunga')..."
                rows={3}
                style={{ width: "100%", padding: "0.6rem", background: "#030712", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#fff", fontSize: "0.85rem", resize: "none" }}
              />
              <button
                type="submit"
                disabled={testing}
                style={{
                  alignSelf: "flex-start",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid #38bdf8",
                  color: "#38bdf8",
                  padding: "0.45rem 1rem",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: testing ? "wait" : "pointer"
                }}
              >
                {testing ? "Analyzing..." : "Classify Threat ➔"}
              </button>
            </form>

            {testResult && testResult.classification && (
              <div style={{ marginTop: "1rem", padding: "0.85rem", background: "rgba(0,0,0,0.4)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", color: testResult.classification.severityLevel >= 3 ? "#ef4444" : "#38bdf8" }}>
                    TIER {testResult.classification.severityLevel}: {testResult.classification.tierName}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: GOLD }}>{testResult.latencyMs} ms latency</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                  <strong>Action:</strong> {testResult.classification.recommendedAction}
                </div>
                {testResult.classification.legalSectionsTriggered?.length > 0 && (
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                    <strong>Statutory Flags:</strong> {testResult.classification.legalSectionsTriggered.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Incident Stream & Forensic Vault Table */}
        <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", margin: 0 }}>🚨 Incident Intelligence & Forensic Vault</h2>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                Every record cryptographically fingerprinted with SHA-256 digest under BSA 2023 Section 63.
              </div>
            </div>

            {/* Severity Filters */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["ALL", "5", "4", "3", "2"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterSeverity(lvl)}
                  style={{
                    background: filterSeverity === lvl ? GOLD : "rgba(255,255,255,0.06)",
                    color: filterSeverity === lvl ? "#000" : "#94a3b8",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {lvl === "ALL" ? "All Severities" : `Tier ${lvl}`}
                </button>
              ))}
            </div>
          </div>

          {filteredIncidents.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛡️</div>
              <div style={{ fontWeight: 700, color: "#cbd5e1" }}>Zero Active Threats Detected</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Your social perimeter is clean. High-severity incidents will populate here via polling intervals.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94a3b8" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Severity</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Perpetrator</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Offensive Content</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Platform</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>SHA-256 Digest</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.incidentId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          background: inc.intelligence?.severityLevel >= 4 ? "rgba(239,68,68,0.2)" : inc.intelligence?.severityLevel === 3 ? "rgba(245,158,11,0.2)" : "rgba(56,189,248,0.2)",
                          color: inc.intelligence?.severityLevel >= 4 ? "#f87171" : inc.intelligence?.severityLevel === 3 ? "#fbbf24" : "#38bdf8",
                          border: `1px solid ${inc.intelligence?.severityLevel >= 4 ? "#ef4444" : inc.intelligence?.severityLevel === 3 ? "#f59e0b" : "#38bdf8"}`
                        }}>
                          T{inc.intelligence?.severityLevel} {inc.intelligence?.tierName?.slice(0, 10)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#fff" }}>
                        @{inc.facts?.perpetratorHandle || "anon"}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#cbd5e1" }}>
                        "{inc.facts?.rawText}"
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textTransform: "uppercase", fontSize: "0.72rem", color: "#94a3b8" }}>
                        {inc.facts?.platform}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace", fontSize: "0.72rem", color: GOLD }}>
                        {inc.evidenceVault?.sha256Hash ? `${inc.evidenceVault.sha256Hash.slice(0, 10)}...` : "N/A"}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{ fontSize: "0.72rem", color: inc.humanApproval?.status === "APPROVED" ? "#34d399" : "#fbbf24" }}>
                          {inc.humanApproval?.status === "APPROVED" ? "✓ APPROVED" : "⏳ REVIEW DUE"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            onClick={() => setActiveIncident(inc)}
                            style={{ background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, padding: "0.25rem 0.55rem", borderRadius: 4, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            Inspect Dossier ➔
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Forensic Incident Modal / Drawer */}
        {activeIncident && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1.5rem" }}>
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(780px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "1.75rem", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff" }}>Incident Dossier #{activeIncident.incidentId}</span>
                    <span style={{ fontSize: "0.68rem", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid #ef4444", padding: "0.15rem 0.4rem", borderRadius: 4, fontWeight: 800 }}>
                      TIER {activeIncident.intelligence?.severityLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: GOLD, marginTop: "0.25rem" }}>
                    Captured at {new Date(activeIncident.facts?.captureTimestamp).toLocaleString()} via {activeIncident.facts?.acquisitionMethod}
                  </div>
                </div>
                <button onClick={() => setActiveIncident(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
              </div>

              {/* 3-Layer Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* LAYER 1: FACT */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                    LAYER 1: CAPTURED FACT (VERIFIED)
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                    <div><strong>Target Handle:</strong> @{activeIncident.facts?.targetHandle}</div>
                    <div><strong>Perpetrator:</strong> @{activeIncident.facts?.perpetratorHandle} (Platform ID: {activeIncident.facts?.perpetratorId})</div>
                    <div><strong>Platform:</strong> {activeIncident.facts?.platform?.toUpperCase()}</div>
                    <div style={{ marginTop: "0.4rem", padding: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 4, borderLeft: "3px solid #ef4444" }}>
                      <strong>Raw Text:</strong> "{activeIncident.facts?.rawText}"
                    </div>
                  </div>
                </div>

                {/* LAYER 2: INTELLIGENCE */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                    LAYER 2: AI & NLP INTELLIGENCE
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                    <div><strong>Category:</strong> {activeIncident.intelligence?.primaryCategory}</div>
                    <div><strong>Coordination Signal:</strong> {activeIncident.intelligence?.coordinationPattern}</div>
                    <div><strong>Actionable Threat:</strong> {activeIncident.intelligence?.isActionable ? "YES (Forensically Preserved)" : "NO"}</div>
                  </div>
                </div>

                {/* LAYER 3: LEGAL RELEVANCE & STATUTORY CERTIFICATE */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                    LAYER 3: STATUTORY RELEVANCE & BSA 2023 CERTIFICATE
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                    <div><strong>Statutory Provisions Triggered:</strong></div>
                    <div style={{ color: "#fca5a5", fontWeight: 600, marginTop: "0.2rem" }}>
                      {activeIncident.legalRelevance?.legalSectionsTriggered?.join(" • ") || "None"}
                    </div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <strong>Cryptographic SHA-256 Digest:</strong>
                      <div style={{ fontFamily: "monospace", fontSize: "0.75rem", background: "#030712", padding: "0.4rem", borderRadius: 4, color: GOLD, marginTop: "0.2rem", wordBreak: "break-all" }}>
                        {activeIncident.evidenceVault?.sha256Hash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Controls & Human Gateway */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <a
                    href={`/api/cybershield/incidents/${activeIncident.incidentId}/evidence?format=download`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    📥 Download BSA Sec 63 Evidence (.json)
                  </a>

                  {activeIncident.humanApproval?.status !== "APPROVED" ? (
                    <button
                      onClick={() => handleApproveAction(activeIncident.incidentId, "LEGAL_NOTICE")}
                      style={{
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "0.55rem 1.25rem",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      Authorize Legal Notice Draft ➔
                    </button>
                  ) : (
                    <div style={{ color: "#34d399", fontWeight: 800, fontSize: "0.85rem" }}>
                      ✓ Action Authorized by Client
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
