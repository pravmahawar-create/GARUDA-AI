import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { UNIVERSES, RINGS, STATUS } from "../config/universes";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

const CLIENT_PROJECTS = [
  {
    id: "proj_auraluxe_01",
    name: "Aura Luxe — Luxury Interior Architecture & Living",
    clientEmail: "founder@auraluxe.com",
    scope: "Brand Identity, 4-Week Editorial Calendar, 5-Angle Ad Copy, Landing Page Blueprint",
    status: "DELIVERED & PERSISTED",
    seal: "sha256_e4c89290a1",
    accessRoute: "/app"
  },
  {
    id: "proj_absli_enterprise",
    name: "ABSLI Life Insurance Knowledge RAG Core",
    clientEmail: "corp@absli.in",
    scope: "Enterprise Insurance RAG, 8,192 Token Policy Derivations, Advisor Intelligence",
    status: "PRODUCTION ACTIVE",
    seal: "sha256_b71029c4e2",
    accessRoute: "/chat"
  },
  {
    id: "proj_client_workspace_portal",
    name: "GARUDA Tenancy-Isolated Client Workspace",
    clientEmail: "Any Authorized Customer",
    scope: "Tenancy Gate, Milestone Payments, Deliverables Inspector, PDF Verification",
    status: "LIVE PRODUCTION",
    seal: "sha256_auth_gate_100",
    accessRoute: "/app"
  }
];

const DEMOS_AND_CASE_STUDIES = [
  {
    id: "demo_kudos_2026",
    title: "Kudos Face of India 2026 — 360° Omnipresence Strategy",
    type: "Flagship Event Case Study",
    domain: "Entertainment & Event Domain (U23)",
    description: "7-slide interactive strategic pitch deck, Celina Jaitly brand ambassador alignment, Radisson Blu venue war room, and ticketing hotline integration.",
    route: "/kudos",
    badge: "INTERACTIVE CASE STUDY"
  },
  {
    id: "demo_sandbox_portal",
    title: "1-Click Client Sandbox & Deliverables Demo",
    type: "Interactive Customer Sandbox",
    domain: "Client Delivery Portal (U10 / U11)",
    description: "Instantaneous zero-friction customer session provisioning with pre-seeded deliverables, SHA-256 seal inspector, and pristine white PDF export.",
    route: "/demo",
    badge: "1-CLICK DEMO"
  },
  {
    id: "demo_solution_architect",
    title: "Interactive Solution Architect Scoping Chat",
    type: "Public Commercial Ingestion",
    domain: "Knowledge & Communication (U01 / U07)",
    description: "Grounded RAG commercial solution architect that ingests technical requirements, estimates timelines, and drafts project scopes in real-time.",
    route: "/chat",
    badge: "PUBLIC RAG AGENT"
  },
  {
    id: "demo_proposal_portal",
    title: "Commercial Milestone Proposal & Escrow Checkout",
    type: "Commercial Agreement Portal",
    domain: "Revenue & Governance (U10 / U09)",
    description: "Milestone-based project agreement with client acceptance signature, Razorpay advance checkout, and automated execution plan triggering.",
    route: "/proposal/prop_kudos_2026",
    badge: "ESCROW CHECKOUT"
  }
];

const FOUNDER_SYSTEM_TOOLS = [
  { name: "High Command Center", route: "/command-center", icon: "⚡", description: "Sovereign aggregate telemetry, active project execution triggers, and workforce controls." },
  { name: "Founder Workspace", route: "/founder", icon: "👑", description: "Durable memory threads, system health monitoring, and direct RAG assistant." },
  { name: "Revenue Operations", route: "/revenue", icon: "⟡", description: "Commercial pipeline, proposal generator, payment reconciliation, and settlement ledger." },
  { name: "Acquisition Cockpit", route: "/founder/acquisition", icon: "🎯", description: "Inbound client decisioning, outreach dispatch, and prospect queue intelligence." }
];

export default function FounderKingdomAccess() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // 'ALL' | 'RING1' | 'RING2' | 'RING3' | 'RING4' | 'PROJECTS' | 'DEMOS' | 'MATRIX'

  const filteredUniverses = UNIVERSES.filter((u) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "RING1") return u.ring === 1;
    if (selectedFilter === "RING2") return u.ring === 2;
    if (selectedFilter === "RING3") return u.ring === 3;
    if (selectedFilter === "RING4") return u.ring === 4;
    return true;
  });

  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title="Founder Kingdom Access — GARUDA 27 Universes Sovereign Map"
        description="Central founder command surface providing a complete visual map of all 27 Canonical Universes, projects, demos, and system operations."
        canonical="https://www.garudaos.in/founder/access"
      />

      <div style={{ maxWidth: "1380px", margin: "0 auto" }}>
        {/* Sovereign Header */}
        <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "1.8rem", color: GOLD }}>👑</span>
                <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.2em", color: GOLD, fontWeight: "bold" }}>
                  SOVEREIGN FOUNDER ACCESS SURFACE
                </span>
                <span style={{ background: "rgba(117, 244, 171, 0.15)", color: "#75f4ab", fontSize: "0.75rem", padding: "0.2rem 0.7rem", borderRadius: "999px", fontWeight: "bold", border: "1px solid rgba(117,244,171,0.3)" }}>
                  27 UNIVERSES GOVERNED
                </span>
              </div>
              <h1 style={{ fontSize: "2.2rem", margin: "0 0 0.4rem", color: "#fff", letterSpacing: "-0.02em" }}>
                GARUDA Kingdom Central Access
              </h1>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem", maxWidth: "880px", lineHeight: "1.5" }}>
                One central access surface for Founder Praveen Mahawar. Every canonical Universe, client project workspace, live demonstration, and system tool mapped truthfully without architectural contamination.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigate("/command-center")}
                style={{ background: "linear-gradient(135deg, #d4af37, #b8860b)", color: "#000", border: "none", borderRadius: "8px", padding: "0.6rem 1.2rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer" }}
              >
                ⚡ High Command Center
              </button>
              <button
                type="button"
                onClick={() => navigate("/founder")}
                style={{ background: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "0.6rem 1.1rem", fontSize: "0.9rem", cursor: "pointer" }}
              >
                Founder Workspace
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All 27 Universes" },
              { id: "RING1", label: "Ring 1: Core Intelligence (9)" },
              { id: "RING2", label: "Ring 2: Human Empowerment (9)" },
              { id: "RING3", label: "Ring 3: Creative & Digital (5)" },
              { id: "RING4", label: "Ring 4: Civilization & Future (4)" },
              { id: "PROJECTS", label: "Projects & Workspaces (3)" },
              { id: "DEMOS", label: "Demos & Case Studies (4)" },
              { id: "MATRIX", label: "Architectural Truth Matrix" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: selectedFilter === tab.id ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.1)",
                  background: selectedFilter === tab.id ? "rgba(212,175,55,0.18)" : "rgba(15,23,42,0.6)",
                  color: selectedFilter === tab.id ? GOLD_LIGHT : "#94a3b8",
                  fontWeight: selectedFilter === tab.id ? "bold" : "normal",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: FOUNDER SYSTEM TOOLS QUICK ACCESS                              */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Founder Sovereign Command Surfaces
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {FOUNDER_SYSTEM_TOOLS.map((tool) => (
              <div
                key={tool.route}
                onClick={() => navigate(tool.route)}
                style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1.2rem", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{tool.icon}</span>
                  <span style={{ color: GOLD, fontSize: "0.8rem", fontWeight: "bold" }}>LAUNCH ➔</span>
                </div>
                <h3 style={{ margin: "0 0 0.3rem", color: "#fff", fontSize: "1.05rem" }}>{tool.name}</h3>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem", lineHeight: "1.4" }}>{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: ALL 27 CANONICAL UNIVERSES                                     */}
        {/* ========================================================================= */}
        {(selectedFilter === "ALL" || selectedFilter.startsWith("RING")) && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.2rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Canonical Universes Inventory ({filteredUniverses.length} Universes)
              </h2>
              <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Truth Law: Honest Implementation Statuses</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {filteredUniverses.map((u) => {
                const statusMeta = STATUS[u.status] || STATUS.ROADMAP;
                return (
                  <div
                    key={u.id}
                    style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.2rem", color: GOLD }}>{u.icon}</span>
                          <span style={{ color: GOLD, fontWeight: "bold", fontSize: "0.85rem", letterSpacing: "0.05em" }}>{u.id}</span>
                          <span style={{ color: "#64748b", fontSize: "0.75rem" }}>· Ring {u.ring}</span>
                        </div>
                        <span style={{ background: statusMeta.bg, color: statusMeta.color, fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold", border: `1px solid ${statusMeta.color}40` }}>
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* Universe Title & Purpose */}
                      <h3 style={{ margin: "0 0 0.4rem", color: "#fff", fontSize: "1.15rem" }}>{u.name}</h3>
                      <p style={{ margin: "0 0 0.8rem", color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.4" }}>{u.tagline}</p>

                      {/* Flagship Feature */}
                      {u.flagship && (
                        <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.5rem 0.75rem", borderRadius: "6px", marginBottom: "0.8rem", fontSize: "0.75rem", color: GOLD_LIGHT, border: "1px solid rgba(212,175,55,0.15)" }}>
                          <strong>Flagship:</strong> {u.flagship}
                        </div>
                      )}

                      {/* Capabilities / Modules */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                        {u.modules.map((m) => (
                          <span key={m} style={{ background: "rgba(255,255,255,0.04)", color: "#cbd5e1", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem" }}>
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Connected Engines */}
                      {u.connectedEngines && u.connectedEngines.length > 0 && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "1rem" }}>
                          <strong>Engines:</strong> {u.connectedEngines.join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {u.route ? (
                        <button
                          type="button"
                          onClick={() => navigate(u.route)}
                          style={{ width: "100%", padding: "0.6rem", background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}`, borderRadius: "6px", color: GOLD_LIGHT, fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}
                        >
                          ⚡ Enter {u.name} ({u.route})
                        </button>
                      ) : (
                        <div style={{ width: "100%", padding: "0.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", color: "#64748b", textAlign: "center", fontSize: "0.75rem" }}>
                          Canonical Blueprint Verified (Roadmap Build)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: PROJECTS & CLIENT WORKSPACES (ISOLATED)                        */}
        {/* ========================================================================= */}
        {(selectedFilter === "ALL" || selectedFilter === "PROJECTS") && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.2rem" }}>
                  Projects & Client Workspaces
                </h2>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
                  Strictly partitioned client implementations. (A Project ≠ A Universe).
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {CLIENT_PROJECTS.map((proj) => (
                <div key={proj.id} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <span style={{ color: GOLD, fontWeight: "bold", fontSize: "0.8rem" }}>{proj.id}</span>
                      <span style={{ background: "rgba(117,244,171,0.15)", color: "#75f4ab", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                        {proj.status}
                      </span>
                    </div>
                    <h3 style={{ margin: "0 0 0.4rem", color: "#fff", fontSize: "1.05rem" }}>{proj.name}</h3>
                    <p style={{ margin: "0 0 0.6rem", color: "#38bdf8", fontSize: "0.8rem" }}>Client: {proj.clientEmail}</p>
                    <p style={{ margin: "0 0 0.8rem", color: "#94a3b8", fontSize: "0.8rem", lineHeight: "1.4" }}>{proj.scope}</p>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "1rem" }}>Seal: {proj.seal}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(proj.accessRoute)}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(56,189,248,0.15)", border: "1px solid #38bdf8", borderRadius: "6px", color: "#38bdf8", fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    🔍 Inspect Client Workspace ({proj.accessRoute})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: DEMONSTRATIONS & CASE STUDIES (ISOLATED)                       */}
        {/* ========================================================================= */}
        {(selectedFilter === "ALL" || selectedFilter === "DEMOS") && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.2rem" }}>
                  Demonstrations & Case Studies
                </h2>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
                  Live case studies and proof-of-execution portals (e.g. KUDOS is a Case Study, NOT a Universe).
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {DEMOS_AND_CASE_STUDIES.map((demo) => (
                <div key={demo.id} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <span style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "0.75rem" }}>{demo.type}</span>
                      <span style={{ background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                        {demo.badge}
                      </span>
                    </div>
                    <h3 style={{ margin: "0 0 0.3rem", color: "#fff", fontSize: "1.05rem" }}>{demo.title}</h3>
                    <div style={{ color: GOLD, fontSize: "0.75rem", marginBottom: "0.6rem" }}>{demo.domain}</div>
                    <p style={{ margin: "0 0 1rem", color: "#94a3b8", fontSize: "0.8rem", lineHeight: "1.4" }}>{demo.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(demo.route)}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD}`, borderRadius: "6px", color: GOLD_LIGHT, fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    🚀 Launch Demonstration ({demo.route})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: ARCHITECTURAL TRUTH MATRIX                                     */}
        {/* ========================================================================= */}
        {(selectedFilter === "ALL" || selectedFilter === "MATRIX") && (
          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.2rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              27 Universes Architectural Truth Matrix
            </h2>
            <div style={{ overflowX: "auto", background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, color: GOLD }}>
                    <th style={{ padding: "0.75rem" }}>ID</th>
                    <th style={{ padding: "0.75rem" }}>Canonical Name</th>
                    <th style={{ padding: "0.75rem" }}>Ring</th>
                    <th style={{ padding: "0.75rem" }}>Blueprint Source</th>
                    <th style={{ padding: "0.75rem" }}>Connected Engine</th>
                    <th style={{ padding: "0.75rem" }}>UI Route</th>
                    <th style={{ padding: "0.75rem" }}>Architectural Status</th>
                  </tr>
                </thead>
                <tbody>
                  {UNIVERSES.map((u) => {
                    const statusMeta = STATUS[u.status] || STATUS.ROADMAP;
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "0.75rem", fontWeight: "bold", color: GOLD }}>{u.id}</td>
                        <td style={{ padding: "0.75rem", color: "#fff", fontWeight: "bold" }}>{u.name}</td>
                        <td style={{ padding: "0.75rem", color: "#94a3b8" }}>Ring {u.ring}</td>
                        <td style={{ padding: "0.75rem", color: "#a78bfa" }}>universes.md</td>
                        <td style={{ padding: "0.75rem", color: "#cbd5e1" }}>{u.connectedEngines[0] || "Architecture Blueprint"}</td>
                        <td style={{ padding: "0.75rem" }}>
                          {u.route ? (
                            <Link to={u.route} style={{ color: "#38bdf8", textDecoration: "none" }}>{u.route}</Link>
                          ) : (
                            <span style={{ color: "#64748b" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ background: statusMeta.bg, color: statusMeta.color, fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: "bold" }}>
                            {statusMeta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
