import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import ChatConsole from "../components/ChatConsole";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "#0a0f18";
const BORDER = "rgba(212, 175, 55, 0.2)";

export default function CustomerDashboard({ customer, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatConversationId, setChatConversationId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/customer?path=projects", { credentials: "same-origin" }).then(r => r.json()).catch(() => ({ projects: [] })),
      fetch("/api/customer?path=proposals", { credentials: "same-origin" }).then(r => r.json()).catch(() => ({ proposals: [] })),
      fetch("/api/customer?path=conversations", { credentials: "same-origin" }).then(r => r.json()).catch(() => ({ conversations: [] }))
    ]).then(([projData, propData, convData]) => {
      if (!active) return;
      setProjects(projData.projects || []);
      setProposals(propData.proposals || []);
      setConversations(convData.conversations || []);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      <SEOHead
        title="Client Workspace | GARUDA AI Operating System"
        description="Authorized client workspace for projects, verified deliverables, proposals, and AI consultation."
        canonical="https://www.garudaos.in/app"
      />

      {/* TOP NAVIGATION BAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(3, 7, 18, 0.94)",
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: "blur(16px)",
          padding: "0.85rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}
          >
            <span style={{ width: 28, height: 28, display: "grid", placeItems: "center" }}>
              <BrandAssetImage kind="branding" alt="GARUDA" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
            <div>
              <span style={{ fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA</span>
              <span style={{ fontSize: "0.65rem", background: "rgba(212,175,55,0.2)", color: GOLD_LIGHT, padding: "0.15rem 0.4rem", borderRadius: 4, fontWeight: 800, marginLeft: "0.4rem" }}>
                CLIENT WORKSPACE
              </span>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { id: "projects", label: "📁 My Projects" },
              { id: "proposals", label: "📑 Proposals & Payments" },
              { id: "assistant", label: "💬 AI Assistant" },
              { id: "studios", label: "✨ Studios & Tools" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "rgba(212,175,55,0.16)" : "transparent",
                  border: activeTab === tab.id ? `1px solid ${GOLD}` : "1px solid transparent",
                  color: activeTab === tab.id ? GOLD_LIGHT : "#94a3b8",
                  padding: "0.4rem 0.85rem",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: activeTab === tab.id ? 800 : 500,
                  cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Identity & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ fontSize: "0.78rem", color: "#8d95a7", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ color: "#cbd5e1" }}>{customer?.email || "Authenticated Client"}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#94a3b8",
                padding: "0.35rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.78rem",
                cursor: "pointer"
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem 5rem" }}>
        
        {/* HERO WELCOME */}
        <div
          style={{
            background: "linear-gradient(145deg, rgba(212,175,55,0.06) 0%, rgba(10,15,24,0.95) 100%)",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "1.75rem 1.5rem",
            marginBottom: "2rem"
          }}
        >
          <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Sovereign Client Workspace
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", fontWeight: 900, color: "#fff", margin: "0.3rem 0 0.4rem" }}>
            Welcome back, {customer?.email?.split("@")[0] || "Client"}
          </h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.88rem", maxWidth: 680 }}>
            Track active project deliverables, review milestone proposals, download executive white PDFs, and collaborate securely with GARUDA AI.
          </p>
        </div>

        {/* TAB 1: MY PROJECTS */}
        {activeTab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", margin: 0 }}>Active Projects & Workspaces</h2>
              <button
                onClick={() => navigate("/chat")}
                style={{ background: "rgba(212,175,55,0.12)", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              >
                + Scope New Project
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading your projects...</p>
            ) : projects.length === 0 ? (
              <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <span style={{ fontSize: "2rem" }}>📂</span>
                <h3 style={{ color: "#fff", margin: "0.75rem 0 0.3rem", fontSize: "1.1rem" }}>No Active Projects Yet</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", maxWidth: 450, margin: "0 auto 1.25rem" }}>
                  Submit your business requirements or talk with our AI Solution Architect to generate a verified project scope and proposal.
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 8, padding: "0.55rem 1.25rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Start Project Scoping ➔
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {projects.map((proj) => (
                  <div key={proj.projectId || proj.id} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "1.05rem", fontWeight: 800 }}>{proj.title}</h3>
                      <span style={{ fontSize: "0.68rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 700 }}>
                        {proj.status || "IN_PROGRESS"}
                      </span>
                    </div>
                    <p style={{ color: "#9ca3af", fontSize: "0.82rem", margin: "0 0 0.85rem" }}>{proj.requirements || proj.description}</p>
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                      {proj.workspaceUrl && (
                        <button
                          onClick={() => navigate(proj.workspaceUrl)}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Open Workspace ➔
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROPOSALS & PAYMENTS */}
        {activeTab === "proposals" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>Authorized Proposals & Milestones</h2>
            {loading ? (
              <p style={{ color: "#94a3b8" }}>Loading proposals...</p>
            ) : proposals.length === 0 ? (
              <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <span style={{ fontSize: "2rem" }}>📑</span>
                <h3 style={{ color: "#fff", margin: "0.75rem 0 0.3rem", fontSize: "1.1rem" }}>No Active Proposals</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Approved commercial agreements and milestone payment links will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {proposals.map((prop) => (
                  <div key={prop.proposalId} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <h3 style={{ margin: "0 0 0.25rem", color: "#fff", fontSize: "1.05rem", fontWeight: 800 }}>{prop.project?.title || prop.proposalId}</h3>
                        <div style={{ fontSize: "0.78rem", color: "#8d95a7" }}>Reference: {prop.proposalId}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: GOLD }}>₹{prop.pricing?.totalINR?.toLocaleString() || "65,000"}</div>
                        <span style={{ fontSize: "0.68rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 700 }}>
                          {prop.status || "APPROVED"}
                        </span>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", display: "flex", gap: "0.6rem" }}>
                      <button
                        onClick={() => navigate(`/proposal/${prop.proposalId}`)}
                        style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 6, padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
                      >
                        View Proposal & Sign Off ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI ASSISTANT & MEMORY */}
        {activeTab === "assistant" && (
          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>GARUDA Client Assistant & Chat Memory</h2>
            <ChatConsole
              compact
              conversationId={chatConversationId}
              onConversationId={setChatConversationId}
              placeholder="Ask GARUDA regarding your projects, deliverables, or technical questions..."
              minHeight={400}
            />
          </div>
        )}

        {/* TAB 4: STUDIOS & TOOLS */}
        {activeTab === "studios" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>Verified GARUDA Studios</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>🎨</div>
                <h3 style={{ color: "#fff", fontSize: "1rem", fontWeight: 800, margin: "0 0 0.3rem" }}>Creative & Marketing Studio</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.4, margin: "0 0 1rem" }}>
                  Generate 360° multi-phase campaigns, Meta/Google ad copy hooks, short-form reels blueprints, and luxury presentation decks.
                </p>
                <button
                  onClick={() => navigate("/studio")}
                  style={{ background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Launch Studio ➔
                </button>
              </div>

              <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>📚</div>
                <h3 style={{ color: "#fff", fontSize: "1rem", fontWeight: 800, margin: "0 0 0.3rem" }}>Vidya Scholar Studio</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.4, margin: "0 0 1rem" }}>
                  8,192-token academic research papers, thesis structuring, step-by-step mathematical derivations, and Turnitin-safe integrity checks.
                </p>
                <button
                  onClick={() => navigate("/scholar")}
                  style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Launch Vidya ➔
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
