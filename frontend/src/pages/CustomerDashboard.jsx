import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import ChatConsole from "../components/ChatConsole";
import BrandAssetImage from "../components/BrandAssetImage";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "#0a0f18";
const BORDER = "rgba(212, 175, 55, 0.2)";

const SOVEREIGN_UNIVERSES = [
  {
    id: "war_room",
    icon: "🏛️",
    badge: "SOVEREIGN DEFENSE-GRADE",
    name: "Electoral Campaign & Political War Room",
    metrics: "260+ Booth GIS • 90-Min Counter Narrative • Real-Time Voter Sentiment",
    desc: "Autonomous campaign war room eliminating ground voter bleeding. Features booth-level GIS telemetry, AI speech/reel generation within 90 minutes of opposition maneuvers, and zero-markup statutory ad spend directly on candidate cards.",
    capabilities: [
      "Booth-Level GIS Voter Sentiment Telemetry",
      "Algorithmic Narrative Counter-Strike Generator",
      "Statutory Meta/Google Ad Routing (0% markup)",
      "Strict ECI Compliance & SHA-256 Audit Trails"
    ],
    prompt: "Architect an Electoral Campaign War Room for my constituency. Outline the 260-booth GIS telemetry grid, 90-minute narrative counter-attack engine, and 3-stage milestone escrow.",
    actionLabel: "Launch War Room Scoping ➔",
    exploreRoute: "/enterprise"
  },
  {
    id: "b2b_industry",
    icon: "🏢",
    badge: "HEAVY INDUSTRY & B2B",
    name: "Industrial Manufacturing & GeM Procurement Engine",
    metrics: "24/7 GeM Tender Scraping • LinkedIn Trojan Swarms • Plant Tech Showcases",
    desc: "Replaces slow manual business development with automated GeM & state tender scraping, C-suite LinkedIn mapping, high-impact plant reels, and defense-grade milestone escrow with zero discount policy.",
    capabilities: [
      "Automated State & Central RFP Scraping",
      "Autonomous C-Suite Decision-Maker Mapping",
      "Plant Engineering 4K Showcase Generation",
      "Milestone Escrow Contract Governance"
    ],
    prompt: "Architect a Heavy Industry B2B procurement and tender pipeline. Outline automated GeM scraping, C-suite LinkedIn Trojan engagement, and milestone escrow terms.",
    actionLabel: "Architect B2B System ➔",
    exploreRoute: "/enterprise"
  },
  {
    id: "luxury_re",
    icon: "🏗️",
    badge: "HIGH-NET-WORTH CAPTURE",
    name: "Luxury Real Estate & HNI Capital Funnel",
    metrics: "Private Airport Geofencing • Gulf NRI Capital Routes • 3D Virtual Staging",
    desc: "Engineered for luxury residential towers, penthouses, and prime commercial plots. Directly captures HNIs at private lounges and routes high-trust investment capital from Gulf, US, and UK NRI buyers with zero broker wastage.",
    capabilities: [
      "Hyper-Targeted Private Airport & Golf Club Geofencing",
      "Gulf/US/UK High-Trust NRI Capital Deployment",
      "3D Interactive Walkthroughs to Social Ad Ingestion",
      "Direct Transparent Media Saturation"
    ],
    prompt: "Deploy Luxury Real Estate HNI Funnel for our project inventory. Show how HNI geofencing and Gulf NRI capital routing will saturate qualified buyers.",
    actionLabel: "Deploy HNI Funnel ➔",
    exploreRoute: "/enterprise"
  },
  {
    id: "saas_fleet",
    icon: "🚀",
    badge: "RAPID 14-DAY MVP",
    name: "Custom SaaS MVP & 1,000-Agent Fleet",
    metrics: "14-Day Delivery • Full-Stack Microservices • SHA-256 QA Seal",
    desc: "Turn product concepts into production-grade multi-tenant software with React dashboards, Node/Postgres backends, Stripe/Razorpay global billing, and autonomous worker swarms backed by 100% verified release manifests.",
    capabilities: [
      "Multi-Tenant User Auth & RBAC Isolation",
      "Global Recurring Stripe/Razorpay Subscription Engine",
      "Autonomous Supervisor-Worker Agent Swarms",
      "Cryptographic SHA-256 Release Manifests"
    ],
    prompt: "Scope a custom full-stack SaaS MVP and 1,000-agent worker fleet. Give me the technical architecture, database schema outline, and 2-week delivery timeline.",
    actionLabel: "Scope Custom SaaS MVP ➔",
    exploreRoute: "/services/saas-mvp-development"
  },
  {
    id: "scholar_rag",
    icon: "📚",
    badge: "ZERO-HALLUCINATION RAG",
    name: "Scholar AI & Enterprise Knowledge Studio",
    metrics: "Multi-PDF Ingestion • Dense-Sparse Hybrid Index • Grounded Citations",
    desc: "Enterprise retrieval-augmented generation engine that turns company documents, regulatory PDFs, and complex codebases into verified, citation-grounded intelligence with 0% hallucinations.",
    capabilities: [
      "Dense-Sparse Hybrid Vector Search (BM25 + Embeddings)",
      "Multi-Format Document Chunking & Ingestion",
      "Strict Page/Paragraph Source Grounding",
      "Autonomous Research Dossier Synthesis"
    ],
    prompt: "How can GARUDA Scholar and Enterprise RAG ingest our company documents, policy manuals, and technical PDFs without hallucinating?",
    actionLabel: "Explore Scholar RAG ➔",
    exploreRoute: "/scholar"
  },
  {
    id: "garuda_dost",
    icon: "💼",
    badge: "BHARAT SOVEREIGN ROZGAR",
    name: "GARUDA Dost Rozgar Platform",
    metrics: "Local Business Digitization • AI WhatsApp Billing • T+3 Escrow Payout",
    desc: "Democratizes AI across towns and cities. Yuva and professionals digitize local dukans, clinics, and businesses with AI WhatsApp billing, earning ₹15,000 to ₹50,000 monthly with zero upfront fee and verified Razorpay payouts.",
    capabilities: [
      "Local Vyapari AI Billing & GST Generation",
      "24/7 Clinic Receptionist & Patient Triage Bot",
      "₹2,500 - ₹15,000 Per-Client Referrals",
      "Direct T+3 Escrow Bank Settlement"
    ],
    prompt: "Explain how GARUDA Dost works for local business digitization, what AI tools are provided to dukans, and how the T+3 payout settlement operates.",
    actionLabel: "Enter GARUDA Dost ➔",
    exploreRoute: "/dost"
  }
];

export default function CustomerDashboard({ customer, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("universes");
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKeyData, setCreatedKeyData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyActionLoading, setKeyActionLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("tenant_member");
  const [teamActionLoading, setTeamActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [activeDeliverableModal, setActiveDeliverableModal] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/customer?path=projects", { credentials: "same-origin" }).then(r => r.json()).catch(() => ({ projects: [] })),
      fetch("/api/customer?path=proposals", { credentials: "same-origin" }).then(r => r.json()).catch(() => ({ proposals: [] })),
      fetch("/api/billing/api-keys").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/tenants/current").then(r => r.json()).catch(() => ({ data: null })),
      fetch("/api/tenants/members").then(r => r.json()).catch(() => ({ data: [] }))
    ]).then(([projData, propData, keysData, tenantData, membersData]) => {
      if (!active) return;
      setProjects(projData.projects || []);
      setProposals(propData.proposals || []);
      setApiKeys(keysData?.data || []);
      if (tenantData?.data) setTenantInfo(tenantData.data);
      setTeamMembers(membersData?.data || []);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const handleLaunchUniverseScoping = (universe) => {
    setActiveTab("architect");
    setTimeout(() => {
      const evt = new CustomEvent("garuda:insertPrompt", {
        detail: { text: universe.prompt, autoSend: true }
      });
      window.dispatchEvent(evt);
    }, 150);
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      setKeyActionLoading(true);
      setActionError("");
      const res = await fetch("/api/billing/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to generate API key");
      setCreatedKeyData(json.data);
      setApiKeys(prev => [json.data, ...prev]);
      setNewKeyName("");
      setActionSuccess("API key generated successfully! Copy it now.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setKeyActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    if (!window.confirm("Are you sure you want to revoke this API key?")) return;
    try {
      setKeyActionLoading(true);
      const res = await fetch(`/api/billing/api-keys/${encodeURIComponent(keyId)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to revoke key");
      setApiKeys(prev => prev.map(k => k.keyId === keyId ? { ...k, status: "revoked" } : k));
      setActionSuccess("API key revoked successfully.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setKeyActionLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setTeamActionLoading(true);
      setActionError("");
      const res = await fetch("/api/tenants/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to invite team member");
      setTeamMembers(prev => [...prev, json.data]);
      setInviteEmail("");
      setActionSuccess(`Invitation sent to ${json.data.email}!`);
      if (tenantInfo) setTenantInfo({ ...tenantInfo, currentSeats: (tenantInfo.currentSeats || 0) + 1 });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleRevokeMember = async (membershipId) => {
    if (!window.confirm("Remove this member from your workspace?")) return;
    try {
      setTeamActionLoading(true);
      setActionError("");
      const res = await fetch(`/api/tenants/members/${encodeURIComponent(membershipId)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to remove member");
      setTeamMembers(prev => prev.filter(m => m.membershipId !== membershipId));
      setActionSuccess("Member removed from workspace.");
      if (tenantInfo && tenantInfo.currentSeats > 1) {
        setTenantInfo({ ...tenantInfo, currentSeats: tenantInfo.currentSeats - 1 });
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleExportProjectPdf = (proj) => {
    const universes = (proj.activatedUniverses || []).join(", ") || "Core Governed Systems";
    const manifestItems = (proj.deliveryManifest || proj.deliveryPackage?.manifest || []).map((m, i) => (
      `### ${i + 1}. ${m.label || m.name}\n- **Universe Domain:** ${m.universe || "Core"}\n- **Deliverable Type:** ${m.deliverableType || "Artifact"}\n- **SHA-256 Seal:** \`${m.sha256 || "Verified"}\`\n\n`
    )).join("\n");

    const mdContent = `# GARUDA Executive Project Deliverable Package\n\n` +
      `**Project Title:** ${proj.title}\n\n` +
      `**Project ID:** \`${proj.projectId}\`\n\n` +
      `**Status:** ${proj.status}\n\n` +
      `**Activated Universes:** ${universes}\n\n` +
      `**Client:** ${proj.client?.name || "Client"}\n\n` +
      `**Requirements & Scope:**\n${proj.requirements || "Custom Software Implementation"}\n\n` +
      `---\n\n` +
      `## Governed Deliverables Manifest\n\n` +
      (manifestItems || `*Deliverable synthesis in progress. Governed plan is active.*`);

    openPristineWhitePdf(mdContent, 0, `${proj.title} — Executive Delivery Package`);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      <SEOHead
        title="Client Workspace & Sovereign Cockpit | GARUDA AI Operating System"
        description="Authorized client workspace for active universes, custom software, verified deliverables, proposals, and AI architect consultation."
        canonical="https://www.garudaos.in/app"
      />

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(10, 15, 24, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => navigate("/")}>
            <BrandAssetImage
              asset="emblem"
              variant="gold"
              alt="GARUDA AI"
              style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${GOLD}` }}
            />
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA</div>
              <div style={{ fontSize: "0.68rem", color: GOLD, letterSpacing: "0.05em" }}>SOVEREIGN WORKSPACE</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
              <div style={{ color: "#fff", fontWeight: 700 }}>{customer?.name || "Garudian Client"}</div>
              <div style={{ fontSize: "0.72rem" }}>{customer?.email}</div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "1.5rem" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "1.75rem", overflowX: "auto" }}>
          {[
            { id: "universes", label: "🪐 Sovereign Universes", icon: "🌌" },
            { id: "architect", label: "⚡ Talk to Architect", icon: "💬" },
            { id: "projects", label: `My Projects (${projects.length})`, icon: "📂" },
            { id: "proposals", label: `Proposals & Milestones (${proposals.length})`, icon: "📑" },
            { id: "api_keys", label: `Developer API (${apiKeys.length})`, icon: "🔑" },
            { id: "team", label: `Team Workspace (${teamMembers.length})`, icon: "👥" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "rgba(212, 175, 55, 0.15)" : "transparent",
                border: activeTab === tab.id ? `1px solid ${GOLD}` : "1px solid transparent",
                color: activeTab === tab.id ? GOLD_LIGHT : "#9ca3af",
                padding: "0.55rem 1.1rem",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Global Notifications */}
        {actionError && (
          <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "rgba(239,68,68,0.15)", border: "1px solid #f87171", borderRadius: 8, color: "#f87171", fontSize: "0.85rem" }}>
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "rgba(117,244,171,0.15)", border: "1px solid #75f4ab", borderRadius: 8, color: "#75f4ab", fontSize: "0.85rem" }}>
            {actionSuccess}
          </div>
        )}

        {/* TAB 0: SOVEREIGN UNIVERSES & CAPABILITIES */}
        {activeTab === "universes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", borderRadius: 999, background: "rgba(212,175,55,0.1)", border: `1px solid ${BORDER}`, color: GOLD_LIGHT, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                  <span>⚡</span> ACTIVE SOVEREIGN FLEET & CAPABILITIES
                </div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: "0.2rem 0" }}>
                  GARUDA Sovereign Universes
                </h1>
                <p style={{ color: "#9ca3af", fontSize: "0.88rem", maxWidth: 750, margin: 0 }}>
                  Explore active autonomous capabilities governed by <strong style={{ color: GOLD }}>Founder Praveen Mahawar</strong>. Launch instant scoping or review technical architecture directly with the AI Solution Architect.
                </p>
              </div>
              <button
                onClick={() => navigate("/enterprise")}
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: `1px solid ${GOLD}`,
                  color: GOLD_LIGHT,
                  padding: "0.5rem 1.1rem",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                View 7-Sector Boardroom Pitch ➔
              </button>
            </div>

            {/* Universe Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {SOVEREIGN_UNIVERSES.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: PANEL,
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    transition: "border-color 0.2s ease, transform 0.2s ease",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                      <span style={{ fontSize: "1.8rem" }}>{u.icon}</span>
                      <span style={{ fontSize: "0.65rem", background: "rgba(212,175,55,0.15)", border: `1px solid ${BORDER}`, color: GOLD_LIGHT, padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: 800 }}>
                        {u.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: "0 0 0.35rem" }}>
                      {u.name}
                    </h3>

                    <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 700, marginBottom: "0.75rem" }}>
                      {u.metrics}
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.55, margin: "0 0 1rem" }}>
                      {u.desc}
                    </p>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.85rem", marginBottom: "1.25rem" }}>
                      <div style={{ fontSize: "0.72rem", color: "#cbd5e1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                        Active Capabilities:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.78rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {u.capabilities.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleLaunchUniverseScoping(u)}
                      style={{
                        flex: 1,
                        background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                        color: "#05070a",
                        border: "none",
                        borderRadius: 8,
                        padding: "0.6rem 1rem",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {u.actionLabel}
                    </button>
                    {u.exploreRoute && (
                      <button
                        onClick={() => navigate(u.exploreRoute)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#cbd5e1",
                          borderRadius: 8,
                          padding: "0.6rem 0.85rem",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer"
                        }}
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: TALK TO ARCHITECT CONSOLE */}
        {activeTab === "architect" && (
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", margin: 0 }}>
                    ⚡ AI Solution Architect Console
                  </h2>
                  <span style={{ fontSize: "0.68rem", background: "rgba(212,175,55,0.2)", border: `1px solid ${BORDER}`, color: GOLD_LIGHT, padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 800 }}>
                    EXECUTIVE SCOPING
                  </span>
                </div>
                <p style={{ color: "#9ca3af", fontSize: "0.82rem", margin: "0.3rem 0 0" }}>
                  Enterprise Project Scoping & System Architecture · Governed by <strong style={{ color: GOLD }}>Founder Praveen Mahawar</strong>
                </p>
              </div>
              <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8d95a7", padding: "0.3rem 0.7rem", borderRadius: 6, fontWeight: 700 }}>
                Direct Console · 100% Anti-Fabrication
              </span>
            </div>
            <ChatConsole
              compact
              conversationId={chatConversationId}
              onConversationId={setChatConversationId}
              placeholder="Describe your system requirements, operational bottlenecks, or tech stack to the Architect..."
              minHeight={520}
            />
          </div>
        )}

        {/* TAB 2: MY PROJECTS */}
        {activeTab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", margin: 0 }}>Active Projects & Governed Deliverables</h2>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Strict Tenancy Isolation Enforced</span>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading your projects...</p>
            ) : projects.length === 0 ? (
              <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <span style={{ fontSize: "2rem" }}>📂</span>
                <h3 style={{ color: "#fff", margin: "0.75rem 0 0.3rem", fontSize: "1.1rem" }}>No Active Custom Projects Yet</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", maxWidth: 480, margin: "0 auto 1.25rem" }}>
                  Submit your business requirements or talk with our AI Solution Architect to generate a verified project scope, milestone escrow, and delivery package.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button
                    onClick={() => setActiveTab("architect")}
                    style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 8, padding: "0.55rem 1.25rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Talk to Solution Architect ➔
                  </button>
                  <button
                    onClick={() => setActiveTab("universes")}
                    style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.55rem 1.25rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Explore Sovereign Universes
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {projects.map((proj) => {
                  const isExpanded = expandedProjectId === proj.projectId;
                  const manifest = proj.deliveryManifest || proj.deliveryPackage?.manifest || [];
                  return (
                    <div key={proj.projectId} style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <h3 style={{ color: "#fff", margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>{proj.title}</h3>
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 4, background: proj.status === "completed" ? "rgba(16,185,129,0.2)" : "rgba(212,175,55,0.2)", color: proj.status === "completed" ? "#34d399" : GOLD_LIGHT, fontWeight: 700 }}>
                              {proj.status?.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "0.25rem" }}>
                            Project ID: <code style={{ color: GOLD_LIGHT }}>{proj.projectId}</code> · Target: {proj.targetDate || "Continuous"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleExportProjectPdf(proj)}
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            Export PDF SOW
                          </button>
                          <button
                            onClick={() => setExpandedProjectId(isExpanded ? null : proj.projectId)}
                            style={{ background: "rgba(212,175,55,0.12)", border: `1px solid ${BORDER}`, color: GOLD_LIGHT, padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            {isExpanded ? "Hide Details" : "View Package"}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginBottom: "0.75rem" }}>
                            <strong>Activated Universes:</strong> {(proj.activatedUniverses || []).join(", ") || "Core Multi-Agent"}
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "#9ca3af", marginBottom: "1rem" }}>
                            <strong>Scope Summary:</strong> {proj.requirements || "Custom enterprise software execution governed by SHA-256 evidence."}
                          </div>

                          <h4 style={{ color: "#fff", fontSize: "0.88rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Governed Deliverables Manifest ({manifest.length})</h4>
                          {manifest.length === 0 ? (
                            <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: 0 }}>Deliverable verification underway.</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.6rem" }}>
                              {manifest.map((item, idx) => (
                                <div key={idx} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.75rem" }}>
                                  <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>{item.label || item.name}</div>
                                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                                    Domain: <span style={{ color: GOLD }}>{item.universe || "Core"}</span> · SHA-256: <code>{item.sha256?.slice(0, 8)}...</code>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROPOSALS & MILESTONES */}
        {activeTab === "proposals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", margin: 0 }}>Executive Proposals & Escrow Milestones</h2>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>100% Anti-Fabrication Guarantee</span>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading proposals...</p>
            ) : proposals.length === 0 ? (
              <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <span style={{ fontSize: "2rem" }}>📑</span>
                <h3 style={{ color: "#fff", margin: "0.75rem 0 0.3rem", fontSize: "1.1rem" }}>No Active Commercial Proposals</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", maxWidth: 450, margin: "0 auto 1.25rem" }}>
                  When you finalize requirements with the AI Solution Architect or Founder Praveen, your formal proposal and milestone contracts will appear here.
                </p>
                <button
                  onClick={() => setActiveTab("architect")}
                  style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 8, padding: "0.55rem 1.25rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Initiate Architectural Scope ➔
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {proposals.map((prop) => (
                  <div key={prop.proposalId} style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <h3 style={{ color: "#fff", margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>{prop.title}</h3>
                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 4, background: "rgba(212,175,55,0.2)", color: GOLD_LIGHT, fontWeight: 700 }}>
                          {prop.status?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "0.25rem" }}>
                        Proposal ID: <code style={{ color: GOLD_LIGHT }}>{prop.proposalId}</code> · Total Value: <strong style={{ color: "#fff" }}>{prop.pricing?.total || prop.amount}</strong>
                      </div>
                    </div>
                    <a
                      href={`/proposal/${prop.proposalId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", padding: "0.5rem 1.1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 800, textDecoration: "none" }}
                    >
                      Review & Sign SOW ➔
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DEVELOPER API KEYS */}
        {activeTab === "api_keys" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>Programmatic Developer API Keys</h2>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                  All keys use the standardized GARUDA API format: <code style={{ color: GOLD }}>grd_live_&lt;secret&gt;</code>.
                </div>
              </div>
            </div>

            {createdKeyData && (
              <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "rgba(212,175,55,0.08)", border: `1px solid ${GOLD}`, borderRadius: 12 }}>
                <div style={{ color: GOLD_LIGHT, fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                  ⚡ Your New API Key (Save it now - shown only once!):
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <code style={{ background: "#000", border: "1px solid rgba(255,255,255,0.2)", padding: "0.6rem 1rem", borderRadius: 8, color: "#fff", fontSize: "0.88rem", flex: 1, wordBreak: "break-all" }}>
                    {createdKeyData.apiKey}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdKeyData.apiKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    style={{ background: copiedKey ? "#10b981" : "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 8, padding: "0.6rem 1.2rem", fontWeight: 800, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    {copiedKey ? "✓ Copied!" : "Copy Key"}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateApiKey} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Key Name (e.g. Production Webhook Engine)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                style={{ flex: "1 1 280px", background: PANEL, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.88rem" }}
              />
              <button
                type="submit"
                disabled={keyActionLoading || !newKeyName.trim()}
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: "#000", border: "none", borderRadius: 8, padding: "0.65rem 1.4rem", fontWeight: 800, cursor: "pointer" }}
              >
                {keyActionLoading ? "Generating…" : "+ Generate Key"}
              </button>
            </form>

            <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
              {apiKeys.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.9rem" }}>
                  No active developer keys found. Generate a key above to access the GARUDA API programmatically.
                </div>
              ) : (
                apiKeys.map((k) => (
                  <div key={k.keyId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>{k.name}</div>
                      <div style={{ fontFamily: "monospace", color: "#9ca3af", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                        Prefix: <code style={{ color: GOLD_LIGHT }}>{k.keyPrefix}</code> • Status: <span style={{ color: k.status === "active" ? "#75f4ab" : "#f87171" }}>{k.status}</span>
                      </div>
                    </div>
                    {k.status === "active" && (
                      <button
                        onClick={() => handleRevokeApiKey(k.keyId)}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TEAM WORKSPACE & SEATS */}
        {activeTab === "team" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>Team Workspace & Seats</h2>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                  Seats Used: <span style={{ color: GOLD, fontWeight: 700 }}>{teamMembers.length}</span> / {tenantInfo?.maxSeats || 5} available in your workspace.
                </div>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                style={{ background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
              >
                Upgrade Seat Quota ➔
              </button>
            </div>

            <form onSubmit={handleInviteMember} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ flex: "1 1 240px", background: PANEL, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.88rem" }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.65rem 1rem", color: "#fff", fontSize: "0.88rem" }}
              >
                <option value="tenant_member">Member (Standard)</option>
                <option value="tenant_admin">Admin (Full Control)</option>
                <option value="tenant_viewer">Viewer (Read-Only)</option>
              </select>
              <button
                type="submit"
                disabled={teamActionLoading || !inviteEmail.trim()}
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: "#000", border: "none", borderRadius: 8, padding: "0.65rem 1.4rem", fontWeight: 800, cursor: "pointer" }}
              >
                {teamActionLoading ? "Inviting…" : "+ Send Invite"}
              </button>
            </form>

            <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
              {teamMembers.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.9rem" }}>
                  No additional members invited yet. Add team members above to collaborate on sovereign projects.
                </div>
              ) : (
                teamMembers.map((m) => (
                  <div key={m.membershipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>{m.email || m.userId}</div>
                      <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                        Role: <span style={{ color: GOLD_LIGHT, textTransform: "capitalize" }}>{m.role?.replace("tenant_", "")}</span> • Status: <span style={{ color: m.status === "active" ? "#75f4ab" : "#fef08a" }}>{m.status}</span>
                      </div>
                    </div>
                    {m.role !== "platform_founder" && (
                      <button
                        onClick={() => handleRevokeMember(m.membershipId)}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
