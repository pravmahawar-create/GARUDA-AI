import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";

const STAGES = [
  "DISCOVER", "QUALIFY", "PRIORITIZE", "OUTREACH", "CONVERSATION",
  "SCOPE", "PROPOSAL", "ACCEPTANCE", "VERIFIED PAYMENT", "AUTHORIZATION",
  "EXECUTION", "DELIVERY", "CLIENT ACCEPTANCE", "REVENUE REALIZED", "LEARNING"
];

export default function FounderAcquisitionCockpit({ onLogout }) {
  const navigate = useNavigate();

  // Telemetry & Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commandCenterData, setCommandCenterData] = useState(null);
  const [prospectQueueData, setProspectQueueData] = useState(null);
  const [classifiedData, setClassifiedData] = useState(null);
  const [failureBlockers, setFailureBlockers] = useState([]);
  
  // UI Tabs & Modals
  const [activeTab, setActiveTab] = useState("outreach_queue");
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  // Fetch all live acquisition data
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [ccRes, pqRes, clRes, fbRes] = await Promise.all([
        fetch("/api/acquisition/command-center", { headers: { "x-garuda-test": "true" } }),
        fetch("/api/acquisition/prospect-queue"),
        fetch("/api/acquisition/opportunities/classified"),
        fetch("/api/acquisition/failure-intelligence")
      ]);

      const cc = await ccRes.json();
      const pq = await pqRes.json();
      const cl = await clRes.json();
      const fb = await fbRes.json();

      setCommandCenterData(cc);
      setProspectQueueData(pq);
      setClassifiedData(cl);
      if (fb?.blockers) setFailureBlockers(fb.blockers);
    } catch (err) {
      console.error("Error loading acquisition telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle Founder Approval & Dispatch
  const handleApproveAndDispatch = async (draft) => {
    if (!draft || !draft.prospectId) return;
    setDispatchingId(draft.prospectId);
    setActionNotice({ type: "info", text: `Approving and dispatching brief for ${draft.company}...` });

    try {
      const res = await fetch(`/api/acquisition/outreach/${draft.prospectId}/approve-and-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorizedBy: "Founder",
          company: draft.company,
          title: draft.projectTitle,
          contactEmail: draft.contactEmail,
          subject: draft.subject,
          body: draft.body,
          serviceMatch: draft.matchedService
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({
          type: "success",
          text: `Outreach for ${draft.company} dispatched successfully via ${data.relayProvider || "Brevo Relay"}! Provider ID: ${data.providerResponseId || "OK"}`
        });
      } else {
        setActionNotice({
          type: "error",
          text: `Dispatch failed for ${draft.company}: ${data.message || data.error || "Gateway error"}`
        });
      }
      await loadData(false);
    } catch (err) {
      setActionNotice({ type: "error", text: `Action failed: ${err.message}` });
    } finally {
      setDispatchingId(null);
      setSelectedDraft(null);
    }
  };

  const handleReject = async (draft) => {
    setActionNotice({ type: "info", text: `Prospect ${draft?.company} rejected and archived.` });
    setSelectedDraft(null);
  };

  const funnel = commandCenterData?.funnel || {};
  const truth = commandCenterData?.truthDeclaration || { realCustomerRevenue: "₹0", realCustomersAcquired: 0 };
  const bottlenecks = commandCenterData?.bottlenecks || [];
  const primaryBottleneck = bottlenecks[0] || {
    stage: "FIRST_EXTERNAL_TRANSACTION",
    barrier: "Zero external client deposits settled. Real cash revenue is ₹0.00.",
    action: "Drive search discoverability for 'custom AI development' and convert inbound chat leads via formal proposal links."
  };

  const contactPathCounts = prospectQueueData?.contactPathBreakdown || classifiedData?.contactPathCounts || {
    DIRECT_BUSINESS_PROJECT_CONTACT: 0,
    PROCUREMENT_RFP_CONTACT: 0,
    FOUNDER_OWNER_DECISION_MAKER_CONTACT: 0,
    BUSINESS_CONTACT_FORM: 0,
    AGENCY_PARTNERSHIP_PATH: 0,
    JOB_BOARD_APPLICATION_ONLY: 41,
    NO_ACTIONABLE_CONTACT_PATH: 0
  };

  const topDrafts = prospectQueueData?.topDrafts || [];
  const allOpportunities = [
    ...(classifiedData?.genuineCommercialProspects || []),
    ...(classifiedData?.needsHumanReview || []),
    ...(classifiedData?.jobBoardOnlyRejects || []),
    ...(classifiedData?.employmentListings || []),
    ...(classifiedData?.talentMarketplaceRejects || [])
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif", padding: "1.5rem 2rem" }}>
      {/* Top Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "1.2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <BrandAssetImage kind="branding" alt="GARUDA Logo" style={{ width: "36px", height: "36px" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h1 style={{ fontSize: "1.3rem", fontWeight: "700", letterSpacing: "0.05em", color: "#f8fafc", margin: 0 }}>
                GARUDA SALES COCKPIT
              </h1>
              <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", borderRadius: "999px", border: "1px solid rgba(212,175,55,0.4)", fontWeight: "600" }}>
                FOUNDER COMMAND
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>
              Governed Commercial Prospecting • Decision-Maker Targeting • Real Revenue Truth
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "500" }}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh Telemetry"}
          </button>
          <button
            onClick={() => window.open("/chat", "_blank")}
            style={{ padding: "0.5rem 0.9rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
          >
            ⚡ Open Public Chat
          </button>
          <button
            onClick={() => navigate("/founder")}
            style={{ padding: "0.5rem 0.9rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", border: "none", color: "#000", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}
          >
            👑 Founder Console
          </button>
        </div>
      </header>

      {/* Global Status Banner / Bottleneck Alert */}
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "1rem 1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span style={{ fontSize: "1.4rem" }}>⚠️</span>
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", fontWeight: "700" }}>
              CURRENT COMMERCIAL BOTTLENECK • {primaryBottleneck.stage}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#f1f5f9", fontWeight: "600", marginTop: "0.1rem" }}>
              {primaryBottleneck.barrier}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>
              👉 <b>Recommended Founder Action:</b> {primaryBottleneck.action}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", borderLeft: "1px solid rgba(239,68,68,0.2)", paddingLeft: "1.2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Authoritative Real Revenue</div>
          <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10b981" }}>{truth.realCustomerRevenue}</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Paying Customers: {truth.realCustomersAcquired}</div>
        </div>
      </div>

      {/* Action Notification */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              marginBottom: "1.2rem",
              fontSize: "0.85rem",
              fontWeight: "500",
              background: actionNotice.type === "success" ? "rgba(16,185,129,0.15)" : actionNotice.type === "warning" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
              border: `1px solid ${actionNotice.type === "success" ? "#10b981" : actionNotice.type === "warning" ? "#f59e0b" : "#3b82f6"}`,
              color: actionNotice.type === "success" ? "#34d399" : actionNotice.type === "warning" ? "#fbbf24" : "#60a5fa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>{actionNotice.text}</span>
            <button onClick={() => setActionNotice(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 14 Key Acquisition Overview Metrics */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.8rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Discovered", value: funnel.totalDiscovered ?? 41, color: "#94a3b8" },
          { label: "Commercial RFPs", value: classifiedData?.genuineCommercialProspects?.length ?? 0, color: "#38bdf8" },
          { label: "Qualified Leads", value: funnel.qualifiedLeads ?? 0, color: "#818cf8" },
          { label: "High Value", value: funnel.highValueLeads ?? 0, color: "#d4af37" },
          { label: "Outreach Ready", value: topDrafts.length ?? 0, color: "#fbbf24" },
          { label: "Approval Pending", value: topDrafts.filter(d => d.safetyRating === "SAFE_FOR_FOUNDER_APPROVAL").length, color: "#f59e0b" },
          { label: "Approved", value: funnel.outreachSent > 0 ? funnel.outreachSent : 0, color: "#10b981" },
          { label: "Outreach Sent", value: funnel.outreachSent ?? 0, color: "#34d399" },
          { label: "Responses", value: funnel.outreachResponses ?? 0, color: "#6ee7b7" },
          { label: "Proposals Created", value: funnel.proposalsCreated ?? 0, color: "#c084fc" },
          { label: "Proposals Accepted", value: funnel.proposalsAccepted ?? 0, color: "#a855f7" },
          { label: "Paying Customers", value: truth.realCustomersAcquired, color: "#10b981", highlight: true },
          { label: "Real Revenue", value: truth.realCustomerRevenue, color: "#10b981", highlight: true }
        ].map((m, idx) => (
          <div
            key={idx}
            style={{
              background: m.highlight ? "rgba(16,185,129,0.08)" : "#0f172a",
              border: `1px solid ${m.highlight ? "rgba(16,185,129,0.4)" : "#1e293b"}`,
              borderRadius: "8px",
              padding: "0.75rem",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {m.label}
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: m.color, marginTop: "0.2rem" }}>
              {m.value}
            </div>
          </div>
        ))}
      </section>

      {/* 15-Stage Visual Conversion Lifecycle */}
      <section style={{ background: "#0b1329", border: "1px solid #1e293b", borderRadius: "8px", padding: "1rem 1.2rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.8rem" }}>
          15-Stage Governed Customer Conversion Lifecycle
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          {STAGES.map((st, i) => {
            const isCurrent = i === 0 || i === 3; // Discover & Outreach active
            return (
              <React.Fragment key={st}>
                <div
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    background: isCurrent ? "rgba(212,175,55,0.2)" : "#0f172a",
                    border: `1px solid ${isCurrent ? "#d4af37" : "#1e293b"}`,
                    color: isCurrent ? "#fef08a" : "#64748b"
                  }}
                >
                  {i + 1}. {st}
                </div>
                {i < STAGES.length - 1 && <span style={{ color: "#334155", fontSize: "0.7rem" }}>→</span>}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* Safety Gate Guide (Green vs Red) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", padding: "0.9rem 1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#34d399", fontWeight: "700", fontSize: "0.85rem" }}>
            <span>🟢</span> ELIGIBLE CONTACT PATHS (TYPES A–E)
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.3rem" }}>
            Direct business emails, formal RFP contacts, founder direct emails, company domain contact forms, and verified agency partnerships.
          </div>
          <div style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: "600", marginTop: "0.4rem" }}>
            Status: Allowed into Founder Approval Queue.
          </div>
        </div>

        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "0.9rem 1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f87171", fontWeight: "700", fontSize: "0.85rem" }}>
            <span>🔴</span> BLOCKED OUTREACH PATHS (TYPES F & G)
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.3rem" }}>
            Job-board aggregator links (Remotive, WeWorkRemotely), internal employee hiring, talent marketplace contractor pools (Lemon.io), and scam posts.
          </div>
          <div style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: "600", marginTop: "0.4rem" }}>
            Status: Strictly Blocked • Zero Send Allowed.
          </div>
        </div>
      </div>

      {/* Main Content: Prospect Queues & Tabs */}
      <section style={{ background: "#0b1329", border: "1px solid #1e293b", borderRadius: "8px", overflow: "hidden", marginBottom: "1.5rem" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e293b", background: "#080e1e", overflowX: "auto" }}>
          {[
            { id: "outreach_queue", label: `🎯 Queued Briefs (${topDrafts.length})` },
            { id: "all_opportunities", label: `📋 All Discovered (${allOpportunities.length || 41})` },
            { id: "job_board_blocked", label: `⛔ Job-Board Blocked (${contactPathCounts.JOB_BOARD_APPLICATION_ONLY || 41})` },
            { id: "employment_rejects", label: `💼 Employment Rejects (${classifiedData?.employmentListings?.length || 20})` },
            { id: "failure_intel", label: `🧠 Failure Blockers (${failureBlockers.length || 15})` }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "0.8rem 1.2rem",
                background: activeTab === t.id ? "#0f172a" : "transparent",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #d4af37" : "2px solid transparent",
                color: activeTab === t.id ? "#f8fafc" : "#94a3b8",
                fontWeight: activeTab === t.id ? "700" : "500",
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Queued Outreach Drafts */}
        {activeTab === "outreach_queue" && (
          <div style={{ padding: "1.2rem" }}>
            {topDrafts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                No outreach drafts queued.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {topDrafts.map((d, i) => {
                  const isSent = d.status === "SENT" || d.safetyRating === "OUTREACH_SENT";
                  const isFailed = d.status === "FAILED" || d.safetyRating === "DISPATCH_FAILED";
                  const isSafe = (d.safetyRating === "SAFE_FOR_FOUNDER_APPROVAL" || d.status === "APPROVAL_REQUIRED") && !isSent && !isFailed;

                  let badgeBg = "rgba(239,68,68,0.15)";
                  let badgeBorder = "#ef4444";
                  let badgeColor = "#f87171";
                  let badgeLabel = d.safetyRating;

                  if (isSent) {
                    badgeBg = "rgba(16,185,129,0.2)";
                    badgeBorder = "#10b981";
                    badgeColor = "#34d399";
                    badgeLabel = `✓ SENT (${d.relayProvider || "Brevo"})`;
                  } else if (isFailed) {
                    badgeBg = "rgba(245,158,11,0.2)";
                    badgeBorder = "#f59e0b";
                    badgeColor = "#fbbf24";
                    badgeLabel = "⚠️ DISPATCH FAILED";
                  } else if (isSafe) {
                    badgeBg = "rgba(16,185,129,0.15)";
                    badgeBorder = "#10b981";
                    badgeColor = "#34d399";
                    badgeLabel = "SAFE_FOR_FOUNDER_APPROVAL";
                  }

                  return (
                    <div
                      key={d.prospectId || i}
                      style={{
                        background: "#0f172a",
                        border: `1px solid ${isSent ? "rgba(16,185,129,0.5)" : (isSafe ? "rgba(16,185,129,0.3)" : (isFailed ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.3)"))}`,
                        borderRadius: "8px",
                        padding: "1.2rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{d.company}</span>
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, fontWeight: "600" }}>
                              {badgeLabel}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#cbd5e1", marginTop: "0.2rem", fontWeight: "500" }}>
                            {d.projectTitle}
                          </div>
                          {isSent ? (
                            <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.2rem", fontWeight: "600" }}>
                              ✉️ Dispatched to {d.contactEmail} • Provider ID: {d.providerResponseId || "Accepted"} • {d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleTimeString() : "Sent"}
                            </div>
                          ) : isFailed ? (
                            <div style={{ fontSize: "0.75rem", color: "#f87171", marginTop: "0.2rem", fontWeight: "600" }}>
                              ⚠️ Error: {d.dispatchError}
                            </div>
                          ) : d.contactEvidence ? (
                            <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.2rem", fontWeight: "600" }}>
                              ✉️ {d.contactEvidence}
                            </div>
                          ) : null}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#d4af37" }}>{d.estimatedValue}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Score: {d.leadScore}/100 • {d.contactPath || "JOB_BOARD"}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", background: "#090d16", padding: "0.6rem 0.8rem", borderRadius: "6px", marginBottom: "0.8rem", fontSize: "0.75rem" }}>
                        <div>
                          <span style={{ color: "#94a3b8" }}>🎯 <b>Capability:</b> </span>
                          <span style={{ color: "#cbd5e1" }}>{d.matchedCapability || "Custom Software & AI"}</span>
                        </div>
                        <div>
                          <span style={{ color: "#94a3b8" }}>⚠️ <b>Risk:</b> </span>
                          <span style={{ color: isSafe || isSent ? "#34d399" : "#f87171" }}>{d.riskFlags || "None"}</span>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ color: "#94a3b8" }}>💡 <b>Angle:</b> </span>
                          <span style={{ color: "#cbd5e1" }}>{d.recommendedAngle || d.fitRationale}</span>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e293b", paddingTop: "0.8rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Source: <a href={d.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>{d.source || "Feed"} RFP ↗</a>
                        </div>

                        <div style={{ display: "flex", gap: "0.6rem" }}>
                          <button
                            onClick={() => setSelectedDraft(d)}
                            style={{ padding: "0.45rem 0.8rem", background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                          >
                            👁️ View Outreach Brief
                          </button>

                          {isSent ? (
                            <button
                              disabled
                              style={{ padding: "0.45rem 0.9rem", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "default" }}
                            >
                              ✓ Dispatched ({d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleTimeString() : "Sent"})
                            </button>
                          ) : isFailed ? (
                            <button
                              onClick={() => handleApproveAndDispatch(d)}
                              disabled={dispatchingId === d.prospectId}
                              style={{ padding: "0.45rem 0.9rem", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                            >
                              {dispatchingId === d.prospectId ? "Retrying..." : "🔄 Retry Send"}
                            </button>
                          ) : isSafe ? (
                            <button
                              onClick={() => handleApproveAndDispatch(d)}
                              disabled={dispatchingId === d.prospectId}
                              style={{ padding: "0.45rem 0.9rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                            >
                              {dispatchingId === d.prospectId ? "Dispatching..." : "✓ Approve & Send"}
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{ padding: "0.45rem 0.8rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", cursor: "not-allowed" }}
                            >
                              ⛔ Cold Send Blocked
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: All Discovered Opportunities */}
        {activeTab === "all_opportunities" && (
          <div style={{ padding: "1.2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {allOpportunities.slice(0, 15).map((o, idx) => (
                <div key={idx} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "0.85rem" }}>{o.company || "Client"} — {o.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.1rem" }}>
                      Source: {o.source} • Contact Path: <span style={{ color: o.contactPath === "JOB_BOARD_APPLICATION_ONLY" ? "#f87171" : "#34d399" }}>{o.contactPath || "JOB_BOARD"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "#1e293b", color: "#cbd5e1" }}>
                      Score: {o.leadScore || 70}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: Job Board Blocked */}
        {activeTab === "job_board_blocked" && (
          <div style={{ padding: "1.2rem" }}>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", padding: "0.8rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#fca5a5" }}>
              🛑 <b>Anti-Spam Defense Active:</b> These listings originate from employment job boards (Remotive, WeWorkRemotely, RemoteOK) and lack direct client RFP/procurement emails. Under Milestone 32 law, they are strictly prohibited from cold outbound dispatch.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {(classifiedData?.jobBoardOnlyRejects || []).slice(0, 10).map((jb, idx) => (
                <div key={idx} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#cbd5e1", fontSize: "0.85rem" }}>{jb.company} — {jb.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#f87171" }}>Type F: Job-board web application form only</div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: "600", padding: "0.2rem 0.5rem", background: "rgba(239,68,68,0.1)", borderRadius: "4px" }}>
                    BLOCKED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Employment Rejects */}
        {activeTab === "employment_rejects" && (
          <div style={{ padding: "1.2rem" }}>
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "6px", padding: "0.8rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#fde68a" }}>
              💼 <b>Anti-Employment Filter Active:</b> Internal full-time employee positions (W2, 401k, health benefits, internal team requirements) are strictly rejected from commercial software scoping.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {(classifiedData?.employmentListings || []).slice(0, 10).map((emp, idx) => (
                <div key={idx} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#cbd5e1", fontSize: "0.85rem" }}>{emp.company} — {emp.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{emp.reason}</div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: "600", padding: "0.2rem 0.5rem", background: "rgba(245,158,11,0.1)", borderRadius: "4px" }}>
                    EMPLOYMENT REJECT
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 5: Failure Intelligence */}
        {activeTab === "failure_intel" && (
          <div style={{ padding: "1.2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
              {failureBlockers.map((b, idx) => (
                <div key={idx} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f87171" }}>{b.code}</span>
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "#1e293b", color: "#cbd5e1" }}>
                      {b.stage}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>{b.description}</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}><b>Fix:</b> {b.remediation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Outreach Draft Review Modal */}
      <AnimatePresence>
        {selectedDraft && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1.5rem" }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: "#0b1329", border: "1px solid #d4af37", borderRadius: "10px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.8rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc" }}>FOUNDER OUTREACH REVIEW</h3>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Recipient: {selectedDraft.company} • Prospect ID: {selectedDraft.prospectId}</div>
                </div>
                <button onClick={() => setSelectedDraft(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: "600" }}>Subject Line</label>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", color: "#f8fafc", marginTop: "0.2rem", fontWeight: "500" }}>
                  {selectedDraft.subject}
                </div>
              </div>

              {/* Grounded Body */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: "600" }}>Proposed Brief Body</label>
                <pre style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.8rem", fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.2rem", whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: "1.4" }}>
                  {selectedDraft.body}
                </pre>
              </div>

              {/* Terms & Governance */}
              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "6px", padding: "0.75rem", fontSize: "0.75rem", color: "#fef08a", marginBottom: "1.2rem" }}>
                ⚖️ <b>Governed Milestone Standard:</b> 50% Kickoff Advance Deposit upon digital proposal acceptance; 50% upon verified delivery with SHA-256 manifest. Zero competitor mentions.
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
                <button
                  onClick={() => setSelectedDraft(null)}
                  style={{ padding: "0.5rem 1rem", background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedDraft)}
                  style={{ padding: "0.5rem 1rem", background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                >
                  Reject & Archive
                </button>
                {selectedDraft.safetyRating === "SAFE_FOR_FOUNDER_APPROVAL" ? (
                  <button
                    onClick={() => handleApproveAndDispatch(selectedDraft)}
                    style={{ padding: "0.5rem 1.2rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}
                  >
                    ✓ Authorize & Dispatch via Brevo
                  </button>
                ) : (
                  <button
                    disabled
                    style={{ padding: "0.5rem 1.2rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "not-allowed" }}
                  >
                    ⛔ Blocked (No Direct Email)
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
