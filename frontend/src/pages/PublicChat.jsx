import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatConsole from "../components/ChatConsole";
import SEOHead from "../components/SEOHead";
import FintechQualificationFlow from "../components/FintechQualificationFlow";

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 60000) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

async function loadConversations() {
  const res = await fetch("/api/customer/conversations", { credentials: "same-origin" });
  const data = await res.json();
  return data.success ? data.conversations || [] : [];
}

export default function PublicChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");
  const tier = searchParams.get("tier");
  const isFintechTopic = topic === "fintech-gateway" || Boolean(tier && ["cloud-starter", "cross-border-growth", "sovereign-enterprise"].includes(tier));
  const [showFintechFlow, setShowFintechFlow] = useState(isFintechTopic);

  const [customer, setCustomer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isFintechTopic) {
      setShowFintechFlow(true);
    }
  }, [isFintechTopic, tier]);

  const refreshConversations = useCallback(async () => {
    setConversations(await loadConversations());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/customer/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then(async (data) => {
        if (cancelled) return;
        if (!data.authenticated) {
          setCustomer(false);
          return;
        }
        setCustomer(true);
        const list = await loadConversations();
        if (cancelled) return;
        setConversations(list);
        const fromUrl = searchParams.get("c");
        const target = fromUrl && list.some((c) => c.id === fromUrl) ? fromUrl : list.length ? list[0].id : null;
        if (target) setActiveConversationId(target);
      })
      .catch(() => {
        if (!cancelled) setCustomer(false);
      });

    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("garuda:insertPrompt", { detail: urlPrompt }));
      }, 350);
    }

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const newConversation = () => {
    setActiveConversationId(null);
    setSidebarOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "#030712",
        color: "#f9fafb",
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <SEOHead
        title="GARUDA AI | Sovereign Super-Intelligence (Free & Open Access)"
        description="Interact directly with GARUDA AI, India's Sovereign AI Operating System. Ask anything across code, reasoning, technology, strategy, and life."
        canonical="https://www.garudaos.in/chat"
      />
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.8rem 1.25rem",
          borderBottom: "1px solid rgba(179, 130, 53, 0.22)",
          background: "rgba(11, 14, 20, 0.95)",
          backdropFilter: "blur(14px)",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#cbd5e1",
              borderRadius: "6px",
              padding: "0.4rem 0.8rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <img src="/images/garuda_eagle_sigil.png" alt="GARUDA" style={{ width: 18, height: 15, objectFit: "contain" }} />
            <span>← Home</span>
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "0.04em", color: "#ffffff" }}>
                {isFintechTopic ? "GARUDA FINTECH ARCHITECT" : "GARUDA AI SOLUTION ARCHITECT"}
              </h1>
              <span style={{ fontSize: "0.68rem", background: "rgba(179, 130, 53, 0.2)", border: "1px solid rgba(179, 130, 53, 0.4)", color: "#F5D76E", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                {isFintechTopic ? "GATEWAY QUALIFICATION" : "EXECUTIVE SCOPING"}
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "1px" }}>
              {isFintechTopic
                ? "Zero-Custody Multi-Rail Commercial Scoping · Governed by "
                : "Enterprise Project Scoping & System Architecture · Governed by "}
              <strong style={{ color: "#C48B28" }}>Founder Praveen Mahawar</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {customer === true && (
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#9ca3af",
                borderRadius: "6px",
                padding: "0.35rem 0.7rem",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              {sidebarOpen ? "Hide" : "Chats"}
            </button>
          )}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0.8rem",
              borderRadius: "9999px",
              background: customer ? "rgba(212,175,55,0.12)" : "rgba(16, 185, 129, 0.12)",
              border: customer ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
              color: customer ? "#d4af37" : "#10b981",
              fontSize: "0.78rem",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: customer ? "#d4af37" : "#10b981",
                boxShadow: customer ? "0 0 8px #d4af37" : "0 0 8px #10b981"
              }}
            />
            {customer === true ? "Signed in" : "Public"}
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* Sidebar - overlay on mobile, fixed on desktop */}
        {customer === true && sidebarOpen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(3,7,18,0.7)",
              zIndex: 20,
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {customer === true && (
          <aside
            style={{
              width: "min(280px, 82vw)",
              flexShrink: 0,
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(17, 24, 39, 0.4)",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 30,
              transform: sidebarOpen ? "none" : "translateX(-100%)",
              transition: "transform 0.25s ease"
            }}
          >
            <div style={{ padding: "0.9rem 1rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.12em", color: "#9ca3af", fontWeight: 700 }}>CONVERSATIONS</span>
              <button
                type="button"
                onClick={newConversation}
                style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
                  color: "#000",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.35rem 0.7rem",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                + New
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 0.5rem 1rem" }}>
              {conversations.length === 0 && (
                <p style={{ color: "#6b7280", fontSize: "0.8rem", padding: "0.75rem 0.5rem", margin: 0 }}>
                  No saved conversations yet.
                </p>
              )}
              {conversations.map((item) => {
                const active = item.id === activeConversationId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveConversationId(item.id);
                      setSidebarOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.7rem 0.75rem",
                      marginBottom: "0.35rem",
                      borderRadius: "8px",
                      border: active
                        ? "1px solid rgba(212,175,55,0.35)"
                        : "1px solid rgba(255, 255, 255, 0.06)",
                      background: active
                        ? "rgba(212,175,55,0.08)"
                        : "rgba(31, 41, 55, 0.35)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#6b7280", flexShrink: 0 }}>{timeAgo(item.updated_at)}</span>
                    </div>
                    {item.last_message && (
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.last_message}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Chat Content Column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {/* Executive Project Scoping Quick Actions */}
          {/* Executive Project Scoping Quick Actions */}
          {!activeConversationId && !showFintechFlow && (
            <div style={{ padding: "0.6rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,15,22,0.6)", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", flexShrink: 0 }}>
              {isFintechTopic ? (
                [
                  "🏛️ Return to Fintech Qualification Wizard →",
                  "💳 What is GARUDA's Zero-Custody Invariant? →",
                  "🌐 How does multi-rail routing work across Wio & ICICI? →",
                  "🔒 How does HMAC webhook signature defense prevent tampering? →",
                  "⚡ What are the 3 stages of controlled pilot deployment? →"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      if (chip.includes("Return to Fintech Qualification Wizard")) {
                        setShowFintechFlow(true);
                      } else {
                        const evt = new CustomEvent("garuda:insertPrompt", { detail: chip.replace(" →", "") });
                        window.dispatchEvent(evt);
                      }
                    }}
                    style={{
                      background: "rgba(212,175,55,0.12)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      color: "#fef08a",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                  >
                    {chip}
                  </button>
                ))
              ) : (
                [
                  "🏛️ Plan an Electoral Campaign & Political War Room →",
                  "🏢 Architect Heavy Industry B2B System & Leads →",
                  "🏗️ Deploy Luxury Real Estate HNI Funnel →",
                  "🚀 Build Custom SaaS MVP & 1,000-Agent Fleet →",
                  "📞 Schedule Consultation with Founder Praveen Mahawar →"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      const evt = new CustomEvent("garuda:insertPrompt", { detail: chip.replace(" →", "") });
                      window.dispatchEvent(evt);
                    }}
                    style={{
                      background: "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.25)",
                      color: "#fef08a",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                  >
                    {chip}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Main Chat / Qualification Container */}
          <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {showFintechFlow ? (
              <div style={{ width: "100%", maxWidth: "800px", paddingBottom: "2rem" }}>
                <FintechQualificationFlow
                  initialTier={tier}
                  onSwitchToChat={() => setShowFintechFlow(false)}
                />
              </div>
            ) : (
              <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, minHeight: 0 }}>
                {isFintechTopic && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245,215,110,0.08)", border: "1px solid rgba(245,215,110,0.25)", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", color: "#fef08a", flexShrink: 0 }}>
                    <span>🏛️ Active Scoping: <strong>Fintech Gateway ({tier ? tier.replace(/-/g, " ").toUpperCase() : "QUALIFICATION"})</strong></span>
                    <button
                      onClick={() => setShowFintechFlow(true)}
                      style={{ background: "#f5d76e", color: "#000", border: "none", borderRadius: "4px", padding: "0.25rem 0.65rem", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem" }}
                    >
                      Open Qualification Wizard →
                    </button>
                  </div>
                )}
                <ChatConsole
                  conversationId={activeConversationId}
                  onConversationId={(id) => {
                    setActiveConversationId(id);
                    refreshConversations();
                  }}
                  placeholder="Describe your payment requirements, corridors, or treasury challenges to the AI Architect..."
                  minHeight={0}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
