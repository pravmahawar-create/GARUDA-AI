import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import "../styles/growth-command.css";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";

const CAMPAIGN_GOALS = [
  { value: "LEAD_GENERATION", label: "Lead Generation" },
  { value: "BRAND_AWARENESS", label: "Brand Awareness" },
  { value: "LAUNCH", label: "Launch" },
  { value: "SALES_CONVERSION", label: "Sales Conversion" },
  { value: "SEO_AUTHORITY", label: "SEO Authority" }
];

const CHANNELS = ["INSTAGRAM", "LINKEDIN", "FACEBOOK", "GOOGLE_SEARCH", "EMAIL", "WHATSAPP", "TELEGRAM", "SEO_WEB"];

const UNIVERSE_MAP = [
  { id: "U19", name: "Creative", role: "Campaign assets, creative briefs, storyboards", icon: "✦" },
  { id: "U20", name: "Content", role: "Editorial calendars, multi-format publishing", icon: "✎" },
  { id: "U21", name: "Brand", role: "IdentityLock, tone, voice guardrails", icon: "◈" },
  { id: "U22", name: "Digital Presence", role: "Landing pages, SEO clusters, web surfaces", icon: "☰" },
  { id: "U07", name: "Communication", role: "Email, Telegram, outreach channels", icon: "✉" },
  { id: "U10", name: "Revenue", role: "Proposals, payment, revenue attribution", icon: "⟡" }
];

const LIFECYCLE_STEPS = ["STRATEGIZED", "READY_FOR_APPROVAL", "APPROVED", "EXECUTION_PENDING"];

export default function GrowthCommandCenter({ onLogout }) {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [strategies, setStrategies] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Strategy form
  const [stratForm, setStratForm] = useState({
    businessName: "",
    industry: "",
    productOrService: "",
    targetAudience: "",
    campaignGoal: "LEAD_GENERATION",
    geography: "",
    channels: ["INSTAGRAM", "GOOGLE_SEARCH", "EMAIL"],
    brandContext: ""
  });
  const [creatingStrategy, setCreatingStrategy] = useState(false);

  // Campaign form
  const [campForm, setCampForm] = useState({ strategyId: "" });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Pack loading states
  const [packLoading, setPackLoading] = useState({});
  const [packData, setPackData] = useState({});

  // Approval
  const [approvalToken, setApprovalToken] = useState("");

  // Show toast
  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, error: isError });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch strategies and campaigns
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stratRes, campRes] = await Promise.all([
        fetch("/api/growth/strategies?limit=20", { credentials: "same-origin" }),
        fetch("/api/growth/campaigns?limit=20", { credentials: "same-origin" })
      ]);
      const stratJson = await stratRes.json();
      const campJson = await campRes.json();
      if (stratJson.success) setStrategies(stratJson.data || []);
      if (campJson.success) setCampaigns(campJson.data || []);
    } catch (e) {
      setError(e.message || "Failed to load Growth Intelligence data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Create strategy
  const handleCreateStrategy = async () => {
    if (!stratForm.businessName || !stratForm.productOrService || !stratForm.targetAudience) {
      showToast("Business name, product/service, and target audience are required", true);
      return;
    }
    setCreatingStrategy(true);
    try {
      const res = await fetch("/api/growth/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(stratForm)
      });
      const json = await res.json();
      if (json.success) {
        setSelectedStrategy(json.data);
        setStrategies((prev) => [json.data, ...prev]);
        showToast("Strategy created successfully");
      } else {
        showToast(json.error || "Failed to create strategy", true);
      }
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setCreatingStrategy(false);
    }
  };

  // Create campaign
  const handleCreateCampaign = async (strategyId) => {
    setCreatingCampaign(true);
    try {
      const body = strategyId ? { strategyId } : { briefInput: stratForm };
      const res = await fetch("/api/growth/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setSelectedCampaign(json.data);
        setCampaigns((prev) => [json.data, ...prev]);
        showToast("Campaign created — status: STRATEGIZED");
      } else {
        showToast(json.error || "Failed to create campaign", true);
      }
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setCreatingCampaign(false);
    }
  };

  // Campaign lifecycle transitions
  const campaignAction = async (campaignId, action, body = {}) => {
    try {
      const res = await fetch(`/api/growth/campaign/${campaignId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setSelectedCampaign(json.data);
        setCampaigns((prev) => prev.map((c) => c.campaignId === campaignId ? json.data : c));
        showToast(`Campaign moved to ${json.data.status}`);
      } else {
        showToast(json.error || "Action failed", true);
      }
    } catch (e) {
      showToast(e.message, true);
    }
  };

  // Generate universe pack
  const generatePack = async (packType, input) => {
    setPackLoading((prev) => ({ ...prev, [packType]: true }));
    try {
      const res = await fetch(`/api/growth/packs/${packType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input)
      });
      const json = await res.json();
      if (json.success) {
        setPackData((prev) => ({ ...prev, [packType]: json.data }));
        showToast(`${packType} pack generated`);
      } else {
        showToast(json.error || "Pack generation failed", true);
      }
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setPackLoading((prev) => ({ ...prev, [packType]: false }));
    }
  };

  // Get lifecycle step index
  const getLifecycleIndex = (status) => {
    const idx = LIFECYCLE_STEPS.indexOf(status);
    return idx >= 0 ? idx : -1;
  };

  // Auto-set strategy ID in campaign form when strategy is selected
  useEffect(() => {
    if (selectedStrategy) {
      setCampForm((prev) => ({ ...prev, strategyId: selectedStrategy.strategyId }));
    }
  }, [selectedStrategy]);

  const currentCampaign = selectedCampaign || campaigns[0] || null;
  const currentStrategy = selectedStrategy || strategies[0] || null;

  return (
    <div className="growth-container">
      <SEOHead
        title="Growth Command Center — Cross-Universe Intelligence"
        description="Command interface for GARUDA Growth Intelligence: cross-universe campaign orchestration with founder approval gates."
        canonical="https://www.garudaos.in/growth"
        robots="noindex, nofollow"
      />

      <div className="growth-wrapper">
        {/* Header */}
        <header className="growth-header">
          <div>
            <div className="growth-brand">
              <span className="growth-brand-icon">🦅</span>
              <span className="growth-brand-tag">Cross-Universe Execution Layer</span>
              <span className={`gc-status-pill ${error ? "unavailable" : "live"}`}>
                <span>{error ? "OFFLINE" : "OPERATIONAL"}</span>
              </span>
            </div>
            <h1 className="growth-brand-title">Growth Intelligence</h1>
            <p className="growth-brand-subtitle">
              Strategy → Campaign → Universe Packs → Approval → Communication → Revenue
            </p>
          </div>
          <div className="growth-header-actions">
            <button
              type="button"
              onClick={() => navigate("/command-center")}
              className="gc-btn-sm"
            >
              ◉ High Command
            </button>
            <button
              type="button"
              onClick={() => fetchData()}
              className="gc-btn-sm"
              disabled={loading}
            >
              ↻ Sync
            </button>
          </div>
        </header>

        {/* Architecture Flow */}
        <div className="gc-arch-flow">
          <span className="gc-arch-node">Founder</span>
          <span className="gc-arch-arrow">→</span>
          <span className="gc-arch-node">Strategy</span>
          <span className="gc-arch-arrow">→</span>
          <span className="gc-arch-node">Campaign</span>
          <span className="gc-arch-arrow">→</span>
          <span className="gc-arch-node">U19 Creative</span>
          <span className="gc-arch-node">U20 Content</span>
          <span className="gc-arch-node">U21 Brand</span>
          <span className="gc-arch-node">U22 Presence</span>
          <span className="gc-arch-arrow">→</span>
          <span className="gc-arch-node">Approval Gate</span>
          <span className="gc-arch-arrow">→</span>
          <span className="gc-arch-node">U07 Comms</span>
          <span className="gc-arch-arrow">→</span>
          <span className="gc-arch-node">U10 Revenue</span>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "overview", label: "Overview" },
            { id: "strategy", label: "Strategy" },
            { id: "campaign", label: "Campaign" },
            { id: "universes", label: "Universe Packs" },
            { id: "timeline", label: "Timeline" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--gc-radius-sm)",
                border: activeTab === tab.id ? `1px solid ${GOLD}` : "1px solid transparent",
                background: activeTab === tab.id ? "rgba(212,175,55,0.12)" : "transparent",
                color: activeTab === tab.id ? GOLD_LIGHT : "#94a3b8",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.85rem"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="gc-empty">
            <span className="gc-empty-icon">⏳</span>
            <p className="gc-empty-title">Loading Growth Intelligence...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="gc-full-panel" style={{ borderColor: "rgba(244, 63, 94, 0.4)", background: "rgba(20, 8, 12, 0.85)" }}>
            <p style={{ color: "var(--gc-rose)", margin: 0 }}>{error}</p>
            <button onClick={fetchData} className="gc-btn-sm" style={{ marginTop: "0.75rem" }}>Reconnect</button>
          </div>
        )}

        {/* ==================== OVERVIEW TAB ==================== */}
        {!loading && !error && activeTab === "overview" && (
          <div>
            {/* KPI Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div className="gc-panel" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: GOLD }}>{strategies.length}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--gc-text-muted)" }}>Strategies</div>
              </div>
              <div className="gc-panel" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: GOLD }}>{campaigns.length}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--gc-text-muted)" }}>Campaigns</div>
              </div>
              <div className="gc-panel" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gc-emerald)" }}>
                  {campaigns.filter((c) => c.status === "APPROVED" || c.status === "EXECUTION_PENDING").length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--gc-text-muted)" }}>Active</div>
              </div>
              <div className="gc-panel" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gc-amber)" }}>
                  {campaigns.filter((c) => c.status === "READY_FOR_APPROVAL").length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--gc-text-muted)" }}>Awaiting Approval</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="gc-full-panel">
              <h3 className="gc-panel-title">Quick Actions</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                <button type="button" onClick={() => setActiveTab("strategy")} className="gc-btn-secondary">
                  + New Strategy
                </button>
                <button type="button" onClick={() => setActiveTab("campaign")} className="gc-btn-secondary">
                  + New Campaign
                </button>
                <button type="button" onClick={() => setActiveTab("universes")} className="gc-btn-secondary">
                  Generate Packs
                </button>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="gc-full-panel">
              <h3 className="gc-panel-title">Recent Campaigns</h3>
              {campaigns.length === 0 ? (
                <div className="gc-empty" style={{ padding: "2rem 1rem" }}>
                  <span className="gc-empty-icon">📋</span>
                  <p className="gc-empty-title">No campaigns created</p>
                  <p className="gc-empty-desc">Create a strategy first, then launch a campaign to orchestrate cross-universe execution.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                  {campaigns.slice(0, 5).map((camp) => (
                    <div
                      key={camp.campaignId}
                      onClick={() => { setSelectedCampaign(camp); setActiveTab("campaign"); }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.7rem 0.85rem",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--gc-border-subtle)",
                        borderRadius: "var(--gc-radius-sm)",
                        cursor: "pointer",
                        transition: "border-color 0.15s"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600 }}>
                          {camp.businessBrief?.businessName || camp.campaignId}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>
                          {camp.campaignId} • {camp.growthStrategyRef?.engine || "DETERMINISTIC"}
                        </div>
                      </div>
                      <span className={`gc-status-pill ${camp.status === "APPROVED" || camp.status === "EXECUTION_PENDING" ? "live" : camp.status === "READY_FOR_APPROVAL" ? "limited" : "unavailable"}`}>
                        {camp.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== STRATEGY TAB ==================== */}
        {!loading && !error && activeTab === "strategy" && (
          <div className="gc-main-grid">
            {/* Strategy Form */}
            <div className="gc-panel">
              <h3 className="gc-panel-title">Create Growth Strategy</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--gc-text-dim)", margin: "0.5rem 0 1rem" }}>
                Engine: DETERMINISTIC_TEMPLATE_V1 • No fabricated metrics
              </p>

              <div className="gc-input-group">
                <label className="gc-input-label">Business / Project Name *</label>
                <input
                  className="gc-input"
                  value={stratForm.businessName}
                  onChange={(e) => setStratForm({ ...stratForm, businessName: e.target.value })}
                  placeholder="e.g. Aurum Estates"
                />
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Industry</label>
                <input
                  className="gc-input"
                  value={stratForm.industry}
                  onChange={(e) => setStratForm({ ...stratForm, industry: e.target.value })}
                  placeholder="e.g. Real Estate"
                />
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Product / Service *</label>
                <input
                  className="gc-input"
                  value={stratForm.productOrService}
                  onChange={(e) => setStratForm({ ...stratForm, productOrService: e.target.value })}
                  placeholder="e.g. Luxury 3 BHK residences"
                />
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Target Audience *</label>
                <input
                  className="gc-input"
                  value={stratForm.targetAudience}
                  onChange={(e) => setStratForm({ ...stratForm, targetAudience: e.target.value })}
                  placeholder="e.g. Affluent families and investors"
                />
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Campaign Goal</label>
                <select
                  className="gc-select"
                  value={stratForm.campaignGoal}
                  onChange={(e) => setStratForm({ ...stratForm, campaignGoal: e.target.value })}
                >
                  {CAMPAIGN_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Geography</label>
                <input
                  className="gc-input"
                  value={stratForm.geography}
                  onChange={(e) => setStratForm({ ...stratForm, geography: e.target.value })}
                  placeholder="e.g. Jaipur, Rajasthan"
                />
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Channels</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        const channels = stratForm.channels.includes(ch)
                          ? stratForm.channels.filter((c) => c !== ch)
                          : [...stratForm.channels, ch];
                        setStratForm({ ...stratForm, channels });
                      }}
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        border: `1px solid ${stratForm.channels.includes(ch) ? GOLD : "rgba(255,255,255,0.1)"}`,
                        background: stratForm.channels.includes(ch) ? "rgba(212,175,55,0.12)" : "transparent",
                        color: stratForm.channels.includes(ch) ? GOLD_LIGHT : "#64748b",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gc-input-group">
                <label className="gc-input-label">Brand Context</label>
                <textarea
                  className="gc-textarea"
                  rows={2}
                  value={stratForm.brandContext}
                  onChange={(e) => setStratForm({ ...stratForm, brandContext: e.target.value })}
                  placeholder="e.g. RERA-first luxury developer"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateStrategy}
                disabled={creatingStrategy}
                className="gc-btn gc-btn-primary"
              >
                {creatingStrategy ? "Synthesizing Strategy..." : "⚡ Generate Strategy"}
              </button>
            </div>

            {/* Strategy Results */}
            <div className="gc-panel">
              <div className="gc-panel-header">
                <h3 className="gc-panel-title">Strategy Output</h3>
                {selectedStrategy && (
                  <button
                    type="button"
                    onClick={() => handleCreateCampaign(selectedStrategy.strategyId)}
                    disabled={creatingCampaign}
                    className="gc-btn-secondary"
                  >
                    {creatingCampaign ? "Creating..." : "→ Launch Campaign"}
                  </button>
                )}
              </div>

              {!selectedStrategy ? (
                <div className="gc-empty">
                  <span className="gc-empty-icon">📋</span>
                  <p className="gc-empty-title">No strategy generated</p>
                  <p className="gc-empty-desc">Fill in the business brief and generate a Growth Strategy to see cross-universe requirements.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.7rem", borderRadius: "6px", border: "1px solid var(--gc-border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>Strategy ID</div>
                    <div style={{ fontSize: "0.85rem", color: GOLD, fontFamily: "monospace" }}>{selectedStrategy.strategyId}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.7rem", borderRadius: "6px", border: "1px solid var(--gc-border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>Engine</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gc-emerald)" }}>{selectedStrategy.engine}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.7rem", borderRadius: "6px", border: "1px solid var(--gc-border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>Objective</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gc-text)" }}>{selectedStrategy.campaignObjective}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.7rem", borderRadius: "6px", border: "1px solid var(--gc-border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>Positioning</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gc-text)" }}>{selectedStrategy.positioning}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.7rem", borderRadius: "6px", border: "1px solid var(--gc-border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>Channels</div>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                      {(selectedStrategy.channelStrategy || []).map((ch) => (
                        <span key={ch.channel} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "rgba(212,175,55,0.08)", border: "1px solid var(--gc-gold-border)", borderRadius: "4px", color: GOLD_LIGHT }}>
                          {ch.channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.7rem", borderRadius: "6px", border: "1px solid var(--gc-border-subtle)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)" }}>Funnel Stages</div>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                      {(selectedStrategy.funnelStages || []).map((fs) => (
                        <span key={fs.stage} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "4px", color: "#38bdf8" }}>
                          {fs.stage}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Existing strategies list */}
              {strategies.length > 0 && (
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--gc-border-subtle)", paddingTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--gc-text-dim)", marginBottom: "0.5rem" }}>Recent Strategies ({strategies.length})</div>
                  {strategies.slice(0, 5).map((s) => (
                    <div
                      key={s.strategyId}
                      onClick={() => setSelectedStrategy(s)}
                      style={{
                        padding: "0.5rem 0.65rem",
                        borderRadius: "6px",
                        border: `1px solid ${selectedStrategy?.strategyId === s.strategyId ? GOLD : "var(--gc-border-subtle)"}`,
                        background: selectedStrategy?.strategyId === s.strategyId ? "rgba(212,175,55,0.06)" : "transparent",
                        cursor: "pointer",
                        marginBottom: "0.3rem",
                        fontSize: "0.78rem"
                      }}
                    >
                      <span style={{ color: "#fff" }}>{s.businessBrief?.businessName}</span>
                      <span style={{ color: "var(--gc-text-dim)", marginLeft: "0.5rem" }}>{s.strategyId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== CAMPAIGN TAB ==================== */}
        {!loading && !error && activeTab === "campaign" && (
          <div>
            {/* Create campaign from selected strategy */}
            {!currentCampaign && (
              <div className="gc-full-panel">
                <h3 className="gc-panel-title">Create Campaign</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--gc-text-dim)", margin: "0.5rem 0 1rem" }}>
                  Select a strategy and launch a campaign to coordinate cross-universe execution.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {strategies.slice(0, 3).map((s) => (
                    <button
                      key={s.strategyId}
                      type="button"
                      onClick={() => handleCreateCampaign(s.strategyId)}
                      disabled={creatingCampaign}
                      style={{
                        padding: "0.6rem 1rem",
                        background: "rgba(212,175,55,0.08)",
                        border: "1px solid var(--gc-gold-border)",
                        borderRadius: "var(--gc-radius-sm)",
                        color: GOLD_LIGHT,
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600
                      }}
                    >
                      Campaign: {s.businessBrief?.businessName || s.strategyId}
                    </button>
                  ))}
                  {strategies.length === 0 && (
                    <p style={{ color: "var(--gc-text-dim)", fontSize: "0.85rem" }}>
                      Create a strategy first in the Strategy tab.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Campaign detail */}
            {currentCampaign && (
              <div>
                {/* Campaign header */}
                <div className="gc-full-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h3 className="gc-panel-title" style={{ fontSize: "1.1rem" }}>
                        {currentCampaign.businessBrief?.businessName || currentCampaign.campaignId}
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--gc-text-dim)", margin: "0.25rem 0 0" }}>
                        {currentCampaign.campaignId} • {currentCampaign.growthStrategyRef?.engine || "DETERMINISTIC"}
                      </p>
                    </div>
                    <span className={`gc-status-pill ${currentCampaign.status === "APPROVED" || currentCampaign.status === "EXECUTION_PENDING" ? "live" : currentCampaign.status === "READY_FOR_APPROVAL" ? "limited" : "unavailable"}`}>
                      {currentCampaign.status}
                    </span>
                  </div>

                  {/* Lifecycle */}
                  <div className="gc-lifecycle">
                    {LIFECYCLE_STEPS.map((step, idx) => {
                      const currentIdx = getLifecycleIndex(currentCampaign.status);
                      const stepClass = idx < currentIdx ? "done" : idx === currentIdx ? "current" : "pending";
                      return (
                        <React.Fragment key={step}>
                          {idx > 0 && <span className="gc-lifecycle-arrow">→</span>}
                          <span className={`gc-lifecycle-step ${stepClass}`}>
                            {idx < currentIdx ? "✔" : idx === currentIdx ? "●" : "○"} {step}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Campaign actions */}
                <div className="gc-full-panel">
                  <h3 className="gc-panel-title">Campaign Actions</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    {currentCampaign.status === "STRATEGIZED" && (
                      <button
                        type="button"
                        onClick={() => campaignAction(currentCampaign.campaignId, "ready-for-approval")}
                        className="gc-btn-secondary"
                      >
                        → Mark Ready for Approval
                      </button>
                    )}
                    {currentCampaign.status === "READY_FOR_APPROVAL" && (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          className="gc-input"
                          style={{ width: "auto", minWidth: "200px" }}
                          placeholder="Founder approval token"
                          value={approvalToken}
                          onChange={(e) => setApprovalToken(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!approvalToken) { showToast("Approval token required", true); return; }
                            campaignAction(currentCampaign.campaignId, "approve", { approvalToken, approvedBy: "founder" });
                            setApprovalToken("");
                          }}
                          className="gc-btn-secondary"
                          style={{ borderColor: "var(--gc-emerald)", color: "var(--gc-emerald)" }}
                        >
                          ✔ Approve Campaign
                        </button>
                      </div>
                    )}
                    {currentCampaign.status === "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => campaignAction(currentCampaign.campaignId, "execution-pending", { requestedBy: "founder" })}
                        className="gc-btn-secondary"
                      >
                        → Stage for Execution
                      </button>
                    )}
                    {currentCampaign.status === "EXECUTION_PENDING" && (
                      <span style={{ color: "var(--gc-emerald)", fontSize: "0.85rem" }}>
                        ✔ Campaign is staged for per-universe execution. Each universe executes under its own governance.
                      </span>
                    )}
                  </div>
                </div>

                {/* Universe plan slices */}
                <div className="gc-full-panel">
                  <h3 className="gc-panel-title">Per-Universe Plans</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.75rem", marginTop: "0.75rem" }}>
                    {UNIVERSE_MAP.map((u) => {
                      const planKey = u.id === "U21" ? "brandContext" : u.id === "U20" ? "contentPlan" : u.id === "U19" ? "creativeBriefs" : u.id === "U22" ? "presencePlan" : u.id === "U07" ? "communicationPlan" : "revenueHandoff";
                      const plan = currentCampaign[planKey];
                      return (
                        <div key={u.id} className="gc-universe-card">
                          <div className="gc-universe-header">
                            <span className="gc-universe-id">{u.icon} {u.id} {u.name}</span>
                            <span className={`gc-universe-status ${plan ? "ready" : "idle"}`}>
                              {plan ? "PLAN READY" : "NO PLAN"}
                            </span>
                          </div>
                          <p className="gc-universe-role">{u.role}</p>
                          {plan ? (
                            <div className="gc-universe-output has-data">
                              {typeof plan === "object" ? (
                                <div>
                                  {plan.universe && <div><strong>Universe:</strong> {plan.universe}</div>}
                                  {plan.deliverables && <div><strong>Deliverables:</strong> {plan.deliverables.join(", ")}</div>}
                                  {plan.governanceNotice && <div style={{ marginTop: "0.3rem", fontStyle: "italic" }}>{plan.governanceNotice}</div>}
                                  {plan.engineBinding && <div style={{ marginTop: "0.2rem" }}>Engine: {plan.engineBinding}</div>}
                                  {plan.revenuePath && <div><strong>Path:</strong> {plan.revenuePath}</div>}
                                  {plan.sequence && (
                                    <div>
                                      <strong>Sequence:</strong> {plan.sequence.length} step(s)
                                      {plan.governanceNotice && <div style={{ marginTop: "0.2rem", fontStyle: "italic" }}>{plan.governanceNotice}</div>}
                                    </div>
                                  )}
                                </div>
                              ) : String(plan)}
                            </div>
                          ) : (
                            <div className="gc-universe-output">No plan data available</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== UNIVERSE PACKS TAB ==================== */}
        {!loading && !error && activeTab === "universes" && (
          <div>
            <div className="gc-full-panel">
              <h3 className="gc-panel-title">Generate Universe Packs</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--gc-text-dim)", margin: "0.5rem 0 1rem" }}>
                Invoke live deterministic engines for each universe. Packs are structured outputs — not AI-generated content.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.75rem" }}>
                {[
                  { type: "brand", label: "Brand Pack (U21)", inputs: { brandName: stratForm.businessName || "GARUDA AI", industry: stratForm.industry, positioning: stratForm.brandContext } },
                  { type: "content", label: "Content Pack (U20)", inputs: { brandName: stratForm.businessName || "GARUDA AI", campaignTheme: stratForm.productOrService } },
                  { type: "creative", label: "Creative Pack (U19)", inputs: { brandName: stratForm.businessName || "GARUDA AI", objective: stratForm.productOrService || "Brand campaign", targetAudience: stratForm.targetAudience } },
                  { type: "presence", label: "Presence Pack (U22)", inputs: { brandName: stratForm.businessName || "GARUDA AI", geography: stratForm.geography, primaryKeyword: `${stratForm.industry || ""} ${stratForm.geography || ""}`.trim() } }
                ].map((pack) => (
                  <div key={pack.type} className="gc-panel">
                    <div className="gc-panel-header">
                      <h3 className="gc-panel-title" style={{ fontSize: "0.9rem" }}>{pack.label}</h3>
                      <span className={`gc-status-pill ${packData[pack.type] ? "live" : "idle"}`}>
                        {packData[pack.type] ? "GENERATED" : "IDLE"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => generatePack(pack.type, pack.inputs)}
                      disabled={packLoading[pack.type]}
                      className="gc-btn gc-btn-primary"
                      style={{ fontSize: "0.85rem", padding: "0.6rem" }}
                    >
                      {packLoading[pack.type] ? "Generating..." : `Generate ${pack.label}`}
                    </button>
                    {packData[pack.type] && (
                      <div style={{ marginTop: "0.75rem", background: "rgba(0,0,0,0.3)", padding: "0.6rem", borderRadius: "6px", border: "1px solid rgba(117,244,171,0.2)" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--gc-emerald)", marginBottom: "0.3rem" }}>
                          ✔ {packData[pack.type].packType || pack.type} • {packData[pack.type].engine || "deterministic"}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--gc-text-dim)", fontFamily: "monospace" }}>
                          Universe: {packData[pack.type].universe} • Classification: {packData[pack.type].classification || "LIVE_ENGINE_OUTPUT"}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TIMELINE TAB ==================== */}
        {!loading && !error && activeTab === "timeline" && (
          <div className="gc-full-panel">
            <h3 className="gc-panel-title">Execution Timeline</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--gc-text-dim)", margin: "0.5rem 0 1rem" }}>
              Truthful lifecycle events from Growth Intelligence.
            </p>

            {campaigns.length === 0 && strategies.length === 0 ? (
              <div className="gc-empty">
                <span className="gc-empty-icon">📜</span>
                <p className="gc-empty-title">No events yet</p>
                <p className="gc-empty-desc">Create a strategy and campaign to begin tracking lifecycle events.</p>
              </div>
            ) : (
              <div className="gc-timeline">
                {strategies.map((s) => (
                  <div key={s.strategyId} className="gc-timeline-item">
                    <div className="gc-timeline-dot done"></div>
                    <div className="gc-timeline-content">
                      <p className="gc-timeline-title">Strategy Created: {s.businessBrief?.businessName}</p>
                      <p className="gc-timeline-meta">{s.strategyId} • {s.engine} • {new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {campaigns.map((c) => (
                  <React.Fragment key={c.campaignId}>
                    <div className="gc-timeline-item">
                      <div className="gc-timeline-dot done"></div>
                      <div className="gc-timeline-content">
                        <p className="gc-timeline-title">Campaign Created: {c.businessBrief?.businessName || c.campaignId}</p>
                        <p className="gc-timeline-meta">{c.campaignId} • Status: {c.status}</p>
                      </div>
                    </div>
                    {(c.lifecycleLog || []).slice(1).map((log, idx) => (
                      <div key={idx} className="gc-timeline-item">
                        <div className={`gc-timeline-dot ${log.status === "APPROVED" ? "done" : "pending"}`}></div>
                        <div className="gc-timeline-content">
                          <p className="gc-timeline-title">{log.status} — {log.note}</p>
                          <p className="gc-timeline-meta">{log.actor} • {new Date(log.at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`gc-toast ${toast.error ? "error" : ""}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
