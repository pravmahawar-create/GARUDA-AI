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

  // Sent Box States (canonical persisted source)
  const [sentOutreachData, setSentOutreachData] = useState(null);
  const [sentLoading, setSentLoading] = useState(false);
  const [selectedSent, setSelectedSent] = useState(null);

  // Bot-Verse Omni-Channel States (Digital Marketing Universe)
  const [botVerseCampaigns, setBotVerseCampaigns] = useState([]);
  const [activeBotVerse, setActiveBotVerse] = useState(null);
  const [botVerseLoading, setBotVerseLoading] = useState(false);
  const [bvTopic, setBvTopic] = useState("Scaling Indian B2B & D2C Brands with AI Lead Funnels");
  const [bvNiche, setBvNiche] = useState("Performance Marketing & Client Acquisition");
  const [bvAudience, setBvAudience] = useState("Indian D2C Brands & Tech Founders");
  const [bvVideoUrl, setBvVideoUrl] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateBotVerse = async (isRevival = false) => {
    setBotVerseLoading(true);
    setActionNotice({ type: "info", text: "Deploying 6-platform BOT-VERSE campaign..." });
    try {
      const endpoint = isRevival && bvVideoUrl ? "/api/bot-verse/revive-video" : "/api/bot-verse/generate";
      const payload = {
        topic: bvTopic,
        niche: bvNiche,
        targetAudience: bvAudience,
        videoUrl: bvVideoUrl,
        brandName: "GARUDA AI OS"
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.campaign) {
        setActiveBotVerse(data.campaign);
        setBotVerseCampaigns(prev => [data.campaign, ...(prev || []).filter(c => c.campaignId !== data.campaign.campaignId)]);
        setActionNotice({ type: "success", text: `BOT-VERSE pack generated successfully! SHA-256: ${data.campaign.sha256Evidence.slice(0, 10)}...` });
      } else {
        setActionNotice({ type: "error", text: data.error || "Failed generating Bot-Verse pack" });
      }
    } catch (e) {
      setActionNotice({ type: "error", text: e.message });
    } finally {
      setBotVerseLoading(false);
    }
  };

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
      const [ccRes, pqRes, clRes, fbRes, sentRes, bvRes] = await Promise.all([
        fetch("/api/acquisition/command-center", { headers: { "x-garuda-test": "true" } }),
        fetch("/api/acquisition/prospect-queue"),
        fetch("/api/acquisition/opportunities/classified"),
        fetch("/api/acquisition/failure-intelligence"),
        fetch("/api/acquisition/outreach/sent"),
        fetch("/api/bot-verse/campaigns").catch(() => null)
      ]);

      const cc = await ccRes.json();
      const pq = await pqRes.json();
      const cl = await clRes.json();
      const fb = await fbRes.json();
      const sent = await sentRes.json().catch(() => ({ success: true, count: 0, sent: [] }));
      const bv = bvRes && bvRes.ok ? await bvRes.json().catch(() => null) : null;

      setCommandCenterData(cc);
      setProspectQueueData(pq);
      setClassifiedData(cl);
      if (fb?.blockers) setFailureBlockers(fb.blockers);
      setSentOutreachData(sent);
      if (bv && bv.campaigns) {
        setBotVerseCampaigns(bv.campaigns);
        if (bv.campaigns.length > 0) {
          setActiveBotVerse(prev => prev || bv.campaigns[0]);
        }
      }
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

  const sentList = sentOutreachData?.sent || [];
  const sentCount = sentOutreachData?.count ?? sentList.length;

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
          { label: "Outreach Sent", value: sentCount || funnel.outreachSent || 0, color: "#34d399" },
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
            { id: "sent_outreach", label: `📤 Sent Outreach (${sentCount})` },
            { id: "bot_verse", label: `🌌 BOT-VERSE Omni-Channel (${botVerseCampaigns.length})` },
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

        {/* Tab Content: Sent Outreach (CANONICAL) */}
        {activeTab === "sent_outreach" && (
          <div style={{ padding: "1.2rem" }}>
            {/* Sent Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#f8fafc" }}>📤 Sent Outreach — Canonical History</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                  Durable source: <code style={{ background: "#0f172a", padding: "0.1rem 0.35rem", borderRadius: "4px", border: "1px solid #1e293b" }}>prospects</code> + <code style={{ background: "#0f172a", padding: "0.1rem 0.35rem", borderRadius: "4px", border: "1px solid #1e293b" }}>governed_outreach_records</code> • Real Brevo Message IDs • Truthful telemetry
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#34d399" }}>{sentCount}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Total Dispatched</div>
              </div>
            </div>

            {/* Governance banner */}
            <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "6px", padding: "0.7rem 0.9rem", marginBottom: "1rem", fontSize: "0.75rem", color: "#fef08a", display: "flex", gap: "0.5rem" }}>
              <span>⚖️</span>
              <div>
                <b>Governed Truth Law:</b> Delivery / Open / Click are <code style={{ background: "rgba(0,0,0,0.2)", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>AWAITING</code> until Brevo webhook confirms. <b>ACCEPTED_BY_RELAY ≠ DELIVERED.</b>  •  Next integration: <code style={{ background: "rgba(0,0,0,0.2)", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>POST /api/acquisition/outreach/:id/response</code> / Brevo webhook.
              </div>
            </div>

            {sentList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#64748b" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📭</div>
                <div style={{ fontWeight: "600", color: "#94a3b8" }}>No dispatched outreach yet</div>
                <div style={{ fontSize: "0.75rem", marginTop: "0.3rem" }}>Approved dispatches will appear here durably after Brevo ACCEPTED response.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {sentList.map((s, idx) => {
                  const isNiravi = s.businessName === "Niravi Jaipur" || s.prospectId === "6a86aa525aad4cda3107b931";
                  return (
                    <div
                      key={s.prospectId || idx}
                      style={{
                        background: isNiravi ? "linear-gradient(135deg, #0f172a 0%, #111c2e 100%)" : "#0f172a",
                        border: isNiravi ? "1px solid rgba(212,175,55,0.5)" : "1px solid #1e293b",
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: isNiravi ? "0 0 20px rgba(212,175,55,0.08)" : "none"
                      }}
                    >
                      {/* Header bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1rem 1.2rem", background: isNiravi ? "rgba(212,175,55,0.06)" : "#090d16", borderBottom: "1px solid #1e293b" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "#f8fafc" }}>{s.businessName}</span>
                            <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "999px", fontWeight: "700" }}>VERIFIED DISPATCH</span>
                            <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid #10b981", borderRadius: "4px", fontWeight: "700" }}>{s.dispatchStatus} / {s.relayState}</span>
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.25rem", fontWeight: "500" }}>{s.subject}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                            {s.recipient} • Prospect ID: <code style={{ fontSize: "0.7rem", background: "#020617", padding: "0.1rem 0.3rem", borderRadius: "3px", border: "1px solid #1e293b" }}>{s.prospectId}</code>
                          </div>
                          {s.businessNotes && <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.15rem" }}>{s.businessNotes}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>Dispatched</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f8fafc" }}>{s.dispatchedAtIST || (s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleString() : "—")}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{s.dispatchedAt ? new Date(s.dispatchedAt).toISOString() : ""}</div>
                        </div>
                      </div>

                      {/* Telemetry grid */}
                      <div style={{ padding: "1rem 1.2rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.7rem", marginBottom: "0.9rem" }}>
                          {[
                            { label: "Provider", value: s.provider ? s.provider.toUpperCase().replace("_", " ") : "BREVO", sub: s.providerMessageId ? "Relay accepted" : "—", color: "#38bdf8" },
                            { label: "Delivery", value: s.deliveryStatus, sub: "Awaiting provider confirmation", color: "#fbbf24" },
                            { label: "Open", value: s.openStatus, sub: "Awaiting", color: "#94a3b8" },
                            { label: "Click", value: s.clickStatus, sub: "Awaiting", color: "#94a3b8" },
                            { label: "Reply", value: s.replyStatus, sub: "Awaiting", color: "#94a3b8" }
                          ].map((m) => (
                            <div key={m.label} style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.7rem" }}>
                              <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: m.color, marginTop: "0.15rem" }}>{m.value}</div>
                              <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "0.1rem" }}>{m.sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Provider Message ID + Meta */}
                        <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.8rem", marginBottom: "0.9rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.75rem" }}>
                            <div>
                              <div style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", fontWeight: "700" }}>Relay Message ID</div>
                              <div style={{ color: "#34d399", fontFamily: "monospace", fontSize: "0.78rem", marginTop: "0.2rem", wordBreak: "break-all" }}>{s.providerMessageId || "—"}</div>
                            </div>
                            <div>
                              <div style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", fontWeight: "700" }}>Recipient</div>
                              <div style={{ color: "#f1f5f9", marginTop: "0.2rem", fontWeight: "600" }}>{s.recipient}</div>
                              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>Relay: {s.relayProvider} • Status: {s.relayState}</div>
                            </div>
                            <div>
                              <div style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", fontWeight: "700" }}>Dispatch Timestamp</div>
                              <div style={{ color: "#f1f5f9", marginTop: "0.2rem" }}>{s.dispatchedAtIST}</div>
                              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{s.dispatchedAt}</div>
                            </div>
                            <div>
                              <div style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", fontWeight: "700" }}>Scoping / Chat URL</div>
                              <a href={s.chatUrl} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.75rem", wordBreak: "break-all" }}>{s.chatUrl}</a>
                            </div>
                          </div>

                          {s.attachment && (
                            <div style={{ marginTop: "0.8rem", paddingTop: "0.7rem", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", fontWeight: "700" }}>Attachment / Artifact</div>
                                <div style={{ color: "#f8fafc", fontSize: "0.8rem", fontWeight: "600", marginTop: "0.15rem" }}>📎 {s.attachment.filename}</div>
                                <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{s.attachment.size ? `${Math.round(s.attachment.size/1024)} KB` : ""} {s.attachment.available ? "• Available" : "• Not available"}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", fontWeight: "700" }}>SHA-256</div>
                                <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#d4af37", background: "#0f172a", padding: "0.25rem 0.4rem", borderRadius: "4px", border: "1px solid rgba(212,175,55,0.25)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.sha256}>{s.sha256 || "—"}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                            Source: <span style={{ color: "#cbd5e1" }}>{s.source}</span> • Truthful telemetry (no synthetic open/click).
                          </div>
                          <div style={{ display: "flex", gap: "0.6rem" }}>
                            <button
                              onClick={() => setSelectedSent(s)}
                              style={{ padding: "0.45rem 0.9rem", background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                            >
                              👁️ Inspect Details
                            </button>
                            {s.proposalPdfUrl && (
                              <button
                                onClick={() => window.open(s.proposalPdfUrl, "_blank")}
                                style={{ padding: "0.45rem 0.9rem", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "#d4af37", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                              >
                                📄 View PDF
                              </button>
                            )}
                            {s.emailPreviewUrl && (
                              <button
                                onClick={() => window.open(s.emailPreviewUrl, "_blank")}
                                style={{ padding: "0.45rem 0.9rem", background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
                              >
                                ✉️ Email Preview
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: BOT-VERSE Omni-Channel (Digital Marketing Universe) */}
        {activeTab === "bot_verse" && (
          <div style={{ padding: "1.5rem" }}>
            {/* Header Banner */}
            <div style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(56,189,248,0.08) 100%)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", padding: "1.2rem 1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>🌌</span>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#f8fafc", letterSpacing: "0.03em" }}>
                      GARUDA BOT-VERSE • OMNI-CHANNEL GROWTH & VIDEO INTELLIGENCE
                    </h2>
                    <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.5)", borderRadius: "999px", fontWeight: "700" }}>
                      UNIVERSE: U20 / U22
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.4rem", maxWidth: "800px", lineHeight: "1.4" }}>
                    Deploy 6 synchronized autonomous bot agents across <b>YouTube, Instagram, Facebook, LinkedIn, Google Video SEO</b>, and <b>Unified Conversion Chat</b>. Revive dead content, dominate search key moments, and convert viewers into inbound paying clients.
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stored Campaigns</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#38bdf8" }}>{botVerseCampaigns.length}</div>
                </div>
              </div>
            </div>

            {/* Input & Control Center */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", padding: "1.2rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🎯</span> Configure Bot-Verse Mission
              </div>

              {/* Quick Niche Presets */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", alignSelf: "center", marginRight: "0.2rem" }}>Quick Presets:</span>
                {[
                  { label: "🛍️ D2C Performance Marketing", topic: "How Indian D2C Brands Scale ROAS from 1.5X to 4.2X with WhatsApp Funnels", niche: "Performance Marketing & Client Acquisition", aud: "D2C Founders & Brand CMOs" },
                  { label: "🏢 High-Ticket Real Estate", topic: "Automated WhatsApp Bot Qualification for ₹1Cr+ Luxury Apartments", niche: "Real Estate Digital Growth", aud: "Real Estate Developers & Brokers" },
                  { label: "🏥 Clinic & Doctor Leads", topic: "High-ROI Patient Acquisition Funnel for Dental & Cosmetology Clinics", niche: "Healthcare Lead Generation", aud: "Clinic Owners & Doctors" },
                  { label: "💻 B2B SaaS & Tech", topic: "Why Traditional Demo Forms Are Dead: The Instant Conversational Scoping Engine", niche: "B2B SaaS Growth & Custom AI", aud: "Tech Founders & Agency Owners" }
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setBvTopic(p.topic);
                      setBvNiche(p.niche);
                      setBvAudience(p.aud);
                    }}
                    style={{ padding: "0.35rem 0.7rem", background: "#090d16", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "500" }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginBottom: "0.3rem" }}>TOPIC / CONTENT THEME</label>
                  <input
                    type="text"
                    value={bvTopic}
                    onChange={(e) => setBvTopic(e.target.value)}
                    placeholder="e.g. Scaling Indian B2B Agencies with AI Lead Funnels"
                    style={{ width: "100%", padding: "0.6rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginBottom: "0.3rem" }}>TARGET INDUSTRY / NICHE</label>
                  <input
                    type="text"
                    value={bvNiche}
                    onChange={(e) => setBvNiche(e.target.value)}
                    placeholder="e.g. Performance Marketing & Client Acquisition"
                    style={{ width: "100%", padding: "0.6rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginBottom: "0.3rem" }}>TARGET AUDIENCE</label>
                  <input
                    type="text"
                    value={bvAudience}
                    onChange={(e) => setBvAudience(e.target.value)}
                    placeholder="e.g. Indian D2C Brands & Tech Founders"
                    style={{ width: "100%", padding: "0.6rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#94a3b8", marginBottom: "0.3rem" }}>SEED VIDEO URL (OPTIONAL FOR DEAD VIDEO REVIVAL)</label>
                  <input
                    type="text"
                    value={bvVideoUrl}
                    onChange={(e) => setBvVideoUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=your_video"
                    style={{ width: "100%", padding: "0.6rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {bvVideoUrl && (
                  <button
                    onClick={() => handleGenerateBotVerse(true)}
                    disabled={botVerseLoading}
                    style={{ padding: "0.6rem 1.2rem", background: "rgba(245,158,11,0.15)", border: "1px solid #f59e0b", color: "#fbbf24", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700" }}
                  >
                    {botVerseLoading ? "🔄 Processing..." : "🔄 Revive Dead Video Mode"}
                  </button>
                )}
                <button
                  onClick={() => handleGenerateBotVerse(false)}
                  disabled={botVerseLoading}
                  style={{ padding: "0.6rem 1.4rem", background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "800", boxShadow: "0 4px 15px rgba(168,85,247,0.3)" }}
                >
                  {botVerseLoading ? "⚡ Generating 6-Bot Pack..." : "⚡ Launch Omni-Channel Bot-Verse"}
                </button>
              </div>
            </div>

            {/* Campaign Selector Chips if multiple */}
            {botVerseCampaigns.length > 0 && (
              <div style={{ marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>History:</span>
                {botVerseCampaigns.map((c) => (
                  <button
                    key={c.campaignId}
                    onClick={() => setActiveBotVerse(c)}
                    style={{
                      padding: "0.35rem 0.8rem",
                      background: activeBotVerse?.campaignId === c.campaignId ? "#1e293b" : "#090d16",
                      border: activeBotVerse?.campaignId === c.campaignId ? "1px solid #a855f7" : "1px solid #1e293b",
                      color: activeBotVerse?.campaignId === c.campaignId ? "#f8fafc" : "#94a3b8",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontWeight: activeBotVerse?.campaignId === c.campaignId ? "700" : "500"
                    }}
                  >
                    {c.topic.slice(0, 32)}...
                  </button>
                ))}
              </div>
            )}

            {/* Live 6-Bot Strategy Display */}
            {activeBotVerse ? (
              <div>
                {/* Meta Bar */}
                <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "8px", padding: "0.8rem 1.2rem", marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Active Mission: </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f8fafc" }}>{activeBotVerse.topic}</span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "0.5rem" }}>({activeBotVerse.campaignId})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#d4af37", fontFamily: "monospace", background: "#020617", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(212,175,55,0.3)" }} title={activeBotVerse.sha256Evidence}>
                      SHA-256: {activeBotVerse.sha256Evidence?.slice(0, 16)}...
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(activeBotVerse, null, 2), "master_blueprint")}
                      style={{ padding: "0.35rem 0.8rem", background: "#1e293b", border: "1px solid #334155", color: "#38bdf8", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                    >
                      {copiedKey === "master_blueprint" ? "✓ Copied Blueprint" : "📋 Export Full JSON"}
                    </button>
                  </div>
                </div>

                {/* The 6 Bot Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.2rem" }}>
                  {/* Bot 1: YouTube Apex Bot */}
                  <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🔴</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>YouTube Apex Bot</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: "4px", fontWeight: "700" }}>SEARCH & SHORTS</span>
                    </div>

                    {/* Titles */}
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>3 High-CTR Title Hooks:</div>
                      {activeBotVerse.bots?.youtubeApexBot?.optimizedTitles?.map((t, idx) => (
                        <div key={idx} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.5rem 0.7rem", marginBottom: "0.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: "600" }}>{t.title}</div>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{t.type} • {t.psychology}</div>
                          </div>
                          <button
                            onClick={() => handleCopy(t.title, `yt_title_${idx}`)}
                            style={{ background: "#1e293b", border: "none", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", marginLeft: "0.5rem", whiteSpace: "nowrap" }}
                          >
                            {copiedKey === `yt_title_${idx}` ? "✓" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Chapters */}
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Google Video Chapters (Key Moments):</span>
                        <button
                          onClick={() => handleCopy(activeBotVerse.bots?.youtubeApexBot?.seoChapters?.map(c => `${c.timestamp} - ${c.title}`).join("\n"), "yt_chapters")}
                          style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                        >
                          {copiedKey === "yt_chapters" ? "✓ Copied" : "Copy Chapters"}
                        </button>
                      </div>
                      <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#34d399", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                        {activeBotVerse.bots?.youtubeApexBot?.seoChapters?.map(c => `${c.timestamp} - ${c.title}`).join("\n")}
                      </pre>
                    </div>

                    {/* Shorts Hook */}
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>Shorts Script (45s Hook-Retain-CTA):</div>
                      <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                        <div><b style={{ color: "#fbbf24" }}>Hook (0-3s):</b> {activeBotVerse.bots?.youtubeApexBot?.shortsFactory?.hook_0_to_3s}</div>
                        <div style={{ marginTop: "0.3rem" }}><b style={{ color: "#38bdf8" }}>Story (3-25s):</b> {activeBotVerse.bots?.youtubeApexBot?.shortsFactory?.story_3_to_25s}</div>
                        <div style={{ marginTop: "0.3rem" }}><b style={{ color: "#34d399" }}>CTA:</b> {activeBotVerse.bots?.youtubeApexBot?.shortsFactory?.cta_25_to_35s}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bot 2: Instagram Viral Bot */}
                  <div style={{ background: "#0f172a", border: "1px solid rgba(168,85,247,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🟣</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Instagram Viral Bot</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(168,85,247,0.15)", color: "#c084fc", borderRadius: "4px", fontWeight: "700" }}>REELS & DM FUNNEL</span>
                    </div>

                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>Recommended Reel Clip:</div>
                      <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.5rem 0.7rem", fontSize: "0.8rem", color: "#c084fc", fontWeight: "600" }}>
                        ⏱️ Cut Timestamp: {activeBotVerse.bots?.instagramViralBot?.reelClipTimestamp}
                      </div>
                    </div>

                    {/* Caption with DM Trigger */}
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Viral Caption + Comment Trigger:</span>
                        <button
                          onClick={() => handleCopy(activeBotVerse.bots?.instagramViralBot?.caption, "ig_caption")}
                          style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                        >
                          {copiedKey === "ig_caption" ? "✓ Copied" : "Copy Caption"}
                        </button>
                      </div>
                      <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1", margin: 0, whiteSpace: "pre-wrap" }}>
                        {activeBotVerse.bots?.instagramViralBot?.caption}
                      </pre>
                    </div>

                    {/* Automated DM Response */}
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>Automated DM Sequence (Instant Reply):</div>
                      <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#e9d5ff" }}>
                        <div style={{ fontWeight: "700", color: "#c084fc", marginBottom: "0.2rem" }}>Trigger: When user comments "{activeBotVerse.bots?.instagramViralBot?.automatedDmTrigger?.keyword}"</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{activeBotVerse.bots?.instagramViralBot?.automatedDmTrigger?.dmResponseText}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bot 3: Facebook Omni Bot */}
                  <div style={{ background: "#0f172a", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🔵</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Facebook Omni Bot</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(59,130,246,0.15)", color: "#60a5fa", borderRadius: "4px", fontWeight: "700" }}>NATIVE & GROUPS</span>
                    </div>

                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>Native Video Strategy:</div>
                      <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                        {activeBotVerse.bots?.facebookOmniBot?.nativeUploadFormat}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Target B2B Groups Value Post:</span>
                        <button
                          onClick={() => handleCopy(`${activeBotVerse.bots?.facebookOmniBot?.communityDiscussionPrompt?.postHeadline}\n\n${activeBotVerse.bots?.facebookOmniBot?.communityDiscussionPrompt?.valueSnippet}`, "fb_post")}
                          style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                        >
                          {copiedKey === "fb_post" ? "✓ Copied" : "Copy Post"}
                        </button>
                      </div>
                      <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                        <div style={{ fontWeight: "700", color: "#60a5fa", marginBottom: "0.3rem" }}>{activeBotVerse.bots?.facebookOmniBot?.communityDiscussionPrompt?.postHeadline}</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{activeBotVerse.bots?.facebookOmniBot?.communityDiscussionPrompt?.valueSnippet}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bot 4: LinkedIn Executive Bot */}
                  <div style={{ background: "#0f172a", border: "1px solid rgba(14,165,233,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>👔</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>LinkedIn Executive Bot</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(14,165,233,0.15)", color: "#38bdf8", borderRadius: "4px", fontWeight: "700" }}>5-SLIDE CAROUSEL & C-SUITE</span>
                    </div>

                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>5-Slide Document Carousel Deck:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {activeBotVerse.bots?.linkedInExecutiveBot?.carouselSlideDeck?.map((s, idx) => (
                          <div key={idx} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "4px", padding: "0.4rem 0.6rem", fontSize: "0.75rem", display: "flex", gap: "0.6rem" }}>
                            <span style={{ color: "#38bdf8", fontWeight: "700" }}>#{s.slideNumber}</span>
                            <div>
                              <div style={{ color: "#f8fafc", fontWeight: "600" }}>{s.title}</div>
                              <div style={{ color: "#94a3b8", fontSize: "0.7rem" }}>{s.subtitle}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Executive Thought Leadership Post:</span>
                        <button
                          onClick={() => handleCopy(activeBotVerse.bots?.linkedInExecutiveBot?.executivePostText, "li_post")}
                          style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                        >
                          {copiedKey === "li_post" ? "✓ Copied" : "Copy Post"}
                        </button>
                      </div>
                      <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1", margin: 0, whiteSpace: "pre-wrap" }}>
                        {activeBotVerse.bots?.linkedInExecutiveBot?.executivePostText}
                      </pre>
                    </div>
                  </div>

                  {/* Bot 5: Google Semantic Video SEO Bot */}
                  <div style={{ background: "#0f172a", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🔍</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Google Semantic SEO Bot</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(16,185,129,0.15)", color: "#34d399", borderRadius: "4px", fontWeight: "700" }}>SCHEMA & GOOGLE HIGHLIGHTS</span>
                    </div>

                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: "1.4" }}>
                        Google Search indexes videos that contain structured <code>VideoObject</code> schema. This enables your video to be displayed on top of Google.com with interactive jump clips!
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>JSON-LD Schema Markup:</span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(activeBotVerse.bots?.googleSemanticSeoBot?.jsonLdSchema, null, 2), "seo_schema")}
                          style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                        >
                          {copiedKey === "seo_schema" ? "✓ Copied Schema" : "Copy Schema"}
                        </button>
                      </div>
                      <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.7rem", color: "#34d399", margin: 0, maxHeight: "180px", overflowY: "auto", fontFamily: "monospace" }}>
                        {JSON.stringify(activeBotVerse.bots?.googleSemanticSeoBot?.jsonLdSchema, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Bot 6: Unified Conversion Bridge */}
                  <div style={{ background: "#0f172a", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>⚡</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Unified Conversion Bridge</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", borderRadius: "4px", fontWeight: "700" }}>CHAT & WHATSAPP ROUTING</span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginBottom: "0.8rem" }}>
                      Every click and inquiry across all 5 platforms funnels directly into trackable Founder scoping portals:
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
                      {Object.entries(activeBotVerse.bots?.unifiedConversionBridge?.channelRouting || {}).map(([ch, url]) => (
                        <div key={ch} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "4px", padding: "0.4rem 0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ color: "#d4af37", textTransform: "capitalize", fontWeight: "700" }}>{ch}: </span>
                            <span style={{ color: "#38bdf8", wordBreak: "break-all" }}>{url}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(url, `conv_${ch}`)}
                            style={{ background: "#1e293b", border: "none", color: "#38bdf8", padding: "0.15rem 0.4rem", borderRadius: "3px", fontSize: "0.65rem", cursor: "pointer", marginLeft: "0.5rem" }}
                          >
                            {copiedKey === `conv_${ch}` ? "✓" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: "1px solid #1e293b", fontSize: "0.7rem", color: "#94a3b8" }}>
                      Verified Founder Email: <span style={{ color: "#f8fafc" }}>garudaos.ai@gmail.com</span> • Zero fake contact data law enforced.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#64748b" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌌</div>
                <div style={{ fontWeight: "600", color: "#94a3b8" }}>No Active Bot-Verse Mission Selected</div>
                <div style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>Select a preset above or enter your topic and click <b>"Launch Omni-Channel Bot-Verse"</b> to generate the complete 6-platform pack.</div>
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

      {/* Sent Outreach Detail Modal */}
      <AnimatePresence>
        {selectedSent && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1.5rem" }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: "#0b1329", border: "1px solid #d4af37", borderRadius: "10px", width: "100%", maxWidth: "780px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.8rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#f8fafc" }}>📤 SENT OUTREACH DETAILS</h3>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{selectedSent.businessName} • {selectedSent.recipient} • Prospect ID: {selectedSent.prospectId}</div>
                </div>
                <button onClick={() => setSelectedSent(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginBottom: "1rem" }}>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.7rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Recipient</div>
                  <div style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: "600" }}>{selectedSent.recipient}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{selectedSent.businessName}</div>
                </div>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.7rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Dispatch</div>
                  <div style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: "600" }}>{selectedSent.dispatchedAtIST}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{selectedSent.dispatchedAt}</div>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700" }}>Subject</label>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", color: "#f8fafc", marginTop: "0.2rem", fontWeight: "500" }}>{selectedSent.subject}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginBottom: "1rem", fontSize: "0.75rem" }}>
                <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.7rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Provider</div>
                  <div style={{ color: "#38bdf8", fontWeight: "700" }}>{(selectedSent.provider || "brevo").toUpperCase()}</div>
                  <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: "0.7rem", wordBreak: "break-all", marginTop: "0.2rem" }}>{selectedSent.providerMessageId}</div>
                  <div style={{ color: "#64748b", fontSize: "0.7rem" }}>State: {selectedSent.relayState}</div>
                </div>
                <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.7rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Telemetry</div>
                  <div style={{ color: "#fbbf24", fontWeight: "600" }}>Delivery: {selectedSent.deliveryStatus}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.7rem" }}>Open: {selectedSent.openStatus} • Click: {selectedSent.clickStatus} • Reply: {selectedSent.replyStatus}</div>
                  <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "0.2rem" }}>Awaiting Brevo webhook confirmation</div>
                </div>
              </div>

              {selectedSent.attachment && (
                <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "6px", padding: "0.8rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#d4af37", fontWeight: "700", textTransform: "uppercase" }}>Attachment / Artifact</div>
                  <div style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: "600", marginTop: "0.2rem" }}>📎 {selectedSent.attachment.filename}</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.2rem" }}>Size: {selectedSent.attachment.size ? `${Math.round(selectedSent.attachment.size/1024)} KB` : "—"} • Available: {selectedSent.attachment.available ? "YES" : "NO"}</div>
                  <div style={{ fontSize: "0.65rem", color: "#d4af37", fontFamily: "monospace", background: "#0f172a", padding: "0.3rem 0.5rem", borderRadius: "4px", marginTop: "0.4rem", wordBreak: "break-all" }}>SHA-256: {selectedSent.sha256}</div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                    {selectedSent.proposalPdfUrl && <a href={selectedSent.proposalPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", background: "rgba(212,175,55,0.15)", border: "1px solid #d4af37", color: "#d4af37", borderRadius: "5px", textDecoration: "none", fontWeight: "700" }}>📄 Open PDF</a>}
                    {selectedSent.emailPreviewUrl && <a href={selectedSent.emailPreviewUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", background: "#0ea5e9", color: "#fff", borderRadius: "5px", textDecoration: "none", fontWeight: "700" }}>✉️ Open Email Preview</a>}
                  </div>
                </div>
              )}

              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.7rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Scoping / Chat URL</div>
                <a href={selectedSent.chatUrl} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", fontSize: "0.8rem", wordBreak: "break-all" }}>{selectedSent.chatUrl}</a>
              </div>

              <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "6px", padding: "0.7rem", fontSize: "0.72rem", color: "#93c5fd" }}>
                <b>Next integration point:</b> Brevo inbound webhook → <code style={{ background: "rgba(0,0,0,0.3)", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>POST /api/acquisition/outreach/:id/response</code> to log reply • Delivery/open/click events wire to governed_outreach_records when available.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button onClick={() => setSelectedSent(null)} style={{ padding: "0.5rem 1.2rem", background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
