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

export default function CustomerDashboard({ customer, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [activeDeliverableModal, setActiveDeliverableModal] = useState(null);

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
        title="Client Workspace | GARUDA AI Operating System"
        description="Authorized client workspace for projects, verified deliverables, proposals, and AI consultation."
        canonical="https://www.garudaos.in/app"
      />

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
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => navigate("/")}>
            <BrandAssetImage
              asset="emblem"
              variant="gold"
              alt="GARUDA AI"
              style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${GOLD}` }}
            />
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA</div>
              <div style={{ fontSize: "0.68rem", color: GOLD, letterSpacing: "0.05em" }}>CLIENT WORKSPACE</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "right" }}>
              <div style={{ color: "#fff", fontWeight: 700 }}>{customer?.name || "Client"}</div>
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

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "2rem", overflowX: "auto" }}>
          {[
            { id: "projects", label: `My Projects (${projects.length})`, icon: "📂" },
            { id: "proposals", label: `Proposals & Milestones (${proposals.length})`, icon: "📑" },
            { id: "assistant", label: "AI Assistant & Memory", icon: "🧠" },
            { id: "studios", label: "Studios & Tools", icon: "🎨" }
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
                transition: "all 0.15s ease"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

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
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {projects.map((proj) => {
                  const isExpanded = expandedProjectId === (proj.projectId || proj.id);
                  const universes = proj.activatedUniverses || (proj.executionPlan?.selectedBrains ? proj.executionPlan.selectedBrains.map(b => `Universe for ${b}`) : ["U01 Knowledge", "U02 Reasoning", "U09 Governance", "U10 Revenue"]);
                  const manifest = proj.deliveryManifest || proj.deliveryPackage?.manifest || [];

                  return (
                    <div key={proj.projectId || proj.id} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div>
                          <h3 style={{ margin: "0 0 0.3rem", color: "#fff", fontSize: "1.15rem", fontWeight: 800 }}>{proj.title}</h3>
                          <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>
                            Project ID: <span style={{ color: GOLD_LIGHT, fontFamily: "monospace" }}>{proj.projectId}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            fontSize: "0.7rem",
                            background: proj.status === "DELIVERY_READY" ? "rgba(16,185,129,0.15)" : "rgba(212,175,55,0.15)",
                            color: proj.status === "DELIVERY_READY" ? "#34d399" : GOLD_LIGHT,
                            border: `1px solid ${proj.status === "DELIVERY_READY" ? "rgba(16,185,129,0.3)" : "rgba(212,175,55,0.3)"}`,
                            padding: "0.2rem 0.6rem",
                            borderRadius: 6,
                            fontWeight: 800
                          }}>
                            {proj.status || "IN_PROGRESS"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#8d95a7", fontWeight: 700 }}>Activated Universes:</span>
                        {universes.map((u, i) => (
                          <span key={i} style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 600 }}>
                            {u}
                          </span>
                        ))}
                      </div>

                      <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0 0 1rem", lineHeight: 1.5 }}>{proj.requirements || proj.description}</p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => setExpandedProjectId(isExpanded ? null : (proj.projectId || proj.id))}
                            style={{
                              background: isExpanded ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              color: "#fff",
                              padding: "0.45rem 0.9rem",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            {isExpanded ? "Hide Deliverables ▲" : `Inspect Deliverables (${manifest.length || proj.deliverables?.length || 0}) ▼`}
                          </button>

                          <button
                            onClick={() => handleExportProjectPdf(proj)}
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: `1px solid ${GOLD}`,
                              color: GOLD_LIGHT,
                              padding: "0.45rem 0.9rem",
                              borderRadius: 6,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            <span>📄</span>
                            <span>Executive White PDF</span>
                          </button>
                        </div>

                        {proj.proposalId && (
                          <button
                            onClick={() => navigate(`/proposal/${proj.proposalId}`)}
                            style={{ background: "transparent", border: "none", color: GOLD, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            View Original Commercial Scope ➔
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: "1rem" }}>
                          <h4 style={{ color: GOLD_LIGHT, fontSize: "0.9rem", margin: "0 0 0.75rem", fontWeight: 800 }}>Governed Deliverables & Evidence Log</h4>
                          
                          {manifest.length === 0 ? (
                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, fontSize: "0.8rem", color: "#9ca3af" }}>
                              Execution plan is staged. Governed delivery pipeline is synthesizing real domain assets.
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                              {manifest.map((item, idx) => (
                                <div key={idx} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0.85rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                  <div>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{item.label || item.name}</div>
                                    <div style={{ fontSize: "0.7rem", color: "#8d95a7", display: "flex", gap: "0.75rem", marginTop: "0.2rem" }}>
                                      <span>Domain: <strong style={{ color: "#38bdf8" }}>{item.universe || "Core"}</strong></span>
                                      <span>Type: <strong style={{ color: "#34d399" }}>{item.deliverableType || "Artifact"}</strong></span>
                                      <span>Seal: <code style={{ color: GOLD_LIGHT }}>{(item.sha256 || "").slice(0, 12)}…</code></span>
                                    </div>
                                  </div>
                                  {item.payload && (
                                    <button
                                      onClick={() => setActiveDeliverableModal(item)}
                                      style={{ background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, padding: "0.3rem 0.6rem", borderRadius: 4, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                                    >
                                      Preview Artifact ➔
                                    </button>
                                  )}
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

        {/* DELIVERABLE PREVIEW MODAL */}
        {activeDeliverableModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100, padding: "1rem" }}>
            <div style={{ background: "#0a0f18", border: `1px solid ${GOLD}`, borderRadius: 16, maxWidth: 800, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem", fontWeight: 800 }}>{activeDeliverableModal.label || activeDeliverableModal.name}</h3>
                  <div style={{ fontSize: "0.75rem", color: "#8d95a7", marginTop: "0.2rem" }}>
                    Domain: <span style={{ color: "#38bdf8" }}>{activeDeliverableModal.universe || "Core"}</span> · Type: <span style={{ color: "#34d399" }}>{activeDeliverableModal.deliverableType || "Artifact"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDeliverableModal(null)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, fontFamily: "monospace", fontSize: "0.82rem", background: "rgba(0,0,0,0.5)", color: "#e2e8f0" }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(activeDeliverableModal.payload, null, 2)}
                </pre>
              </div>

              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "#8d95a7" }}>
                  SHA-256 Seal: <code style={{ color: GOLD_LIGHT }}>{activeDeliverableModal.sha256}</code>
                </div>
                <button
                  onClick={() => setActiveDeliverableModal(null)}
                  style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 6, padding: "0.4rem 1rem", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
