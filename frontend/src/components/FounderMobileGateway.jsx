import React, { useState, useEffect, useRef } from "react";

// Canonical GARUDA Brand Palette (Strictly Locked — Zero Deviation)
const BG = "#F7F4EE";         // Warm Ivory
const PANEL = "#FFFFFF";      // Pure White Card
const BORDER = "rgba(23, 24, 27, 0.08)";
const TEXT = "#17181B";       // Executive Charcoal
const MUTED = "#525866";      // Muted Slate
const GOLD = "#8B6118";       // Deep Imperial Gold
const GOLD_LIGHT = "#C48B28"; // Radiant Amber
const EMERALD = "#059669";    // Live Status Green

export default function FounderMobileGateway() {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'leads' | 'sync'
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("garuda_founder_mobile_chat");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "init",
        role: "assistant",
        text: "Pranam Praveen ji! 🦅 Main Antigravity hoon — aapka 24/7 Sovereign Mobile Gateway live hai. Chahe laptop band ho, saari leads, memory synapses aur outreach operations yahan se 1-tap control ho sakti hain. Boliye, aaj kya hukum hai?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [gatewayState, setGatewayState] = useState(null);
  const [stateLoading, setStateLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState(null);
  const [keyHealthData, setKeyHealthData] = useState(null);
  const [keyProviderInput, setKeyProviderInput] = useState("groq");
  const [keySecretInput, setKeySecretInput] = useState("");
  const [keyAddMsg, setKeyAddMsg] = useState(null);
  const chatBottomRef = useRef(null);

  // Fetch Gateway State from cloud backend
  const fetchState = async () => {
    try {
      setStateLoading(true);
      const res = await fetch("/api/founder/gateway/state");
      const data = await res.json();
      if (data.success) {
        setGatewayState(data);
      }
    } catch (err) {
      console.warn("Failed to fetch gateway state:", err);
    } finally {
      setStateLoading(false);
    }
  };

  // Fetch AI Key Health Report
  const fetchKeyHealth = async () => {
    try {
      const res = await fetch("/api/founder/gateway/keys");
      const data = await res.json();
      if (data.success) {
        setKeyHealthData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch key health:", err);
    }
  };

  useEffect(() => {
    fetchState();
    fetchKeyHealth();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("garuda_founder_mobile_chat", JSON.stringify(messages.slice(-20)));
    } catch {}
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (overrideText) => {
    const textToSend = (overrideText || inputMsg).trim();
    if (!textToSend || loading) return;

    const userTurn = {
      id: "u_" + Date.now(),
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const nextHistory = [...messages, userTurn];
    setMessages(nextHistory);
    setInputMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/founder/gateway/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: nextHistory.slice(-8)
        })
      });

      const data = await res.json();
      if (!res.ok && !data.reply) {
        throw new Error(data.error?.message || data.error || `Server responded with ${res.status}`);
      }
      const botReply = {
        id: "bot_" + Date.now(),
        role: "assistant",
        text: data.reply || "Praveen ji, Antigravity AI response ready nahi ho paya. Please try again.",
        actions: data.actions || [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages([...nextHistory, botReply]);
    } catch (err) {
      setMessages([
        ...nextHistory,
        {
          id: "err_" + Date.now(),
          role: "assistant",
          text: `Praveen ji, cloud network reconnecting: ${err.message}. Local leads cache safe hai.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handle1TapDispatch = async (leadId) => {
    try {
      setDispatchingId(leadId);
      const res = await fetch("/api/founder/gateway/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchSuccessMsg(`Lead #${leadId} successfully dispatched! SHA-256 seal: ${data.sha256?.slice(0, 12)}`);
        fetchState();
      } else {
        alert("Dispatch error: " + (data.error || "Failed"));
      }
    } catch (err) {
      alert("Dispatch error: " + err.message);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!keySecretInput.trim()) return;
    try {
      const res = await fetch("/api/founder/gateway/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: keyProviderInput,
          key: keySecretInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setKeyAddMsg(`✓ ${keyProviderInput.toUpperCase()} key added to failover lineup! Total keys: ${data.totalKeys}`);
        setKeySecretInput("");
        fetchKeyHealth();
      } else {
        alert("Failed to add key: " + data.error);
      }
    } catch (err) {
      alert("Error adding key: " + err.message);
    }
  };

  const quickPrompts = [
    "Leads summary batao",
    "PULP email status kya hai?",
    "Appinventiv Trojan update",
    "Render Cloud Health"
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "78vh",
        background: PANEL,
        borderRadius: "16px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        overflow: "hidden"
      }}
    >
      {/* ── TOP HEADER ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          background: "linear-gradient(180deg, #FFFFFF, #FAF9F6)",
          borderBottom: `1px solid ${BORDER}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
              display: "grid",
              placeItems: "center",
              color: "#FFF",
              fontWeight: "bold",
              fontSize: "1.1rem",
              boxShadow: "0 2px 8px rgba(139, 97, 24, 0.3)"
            }}
          >
            🦅
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontFamily: "'Playfair Display', Georgia, serif",
                color: TEXT,
                letterSpacing: "0.02em"
              }}
            >
              Antigravity 24/7 Mobile
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: MUTED }}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: EMERALD,
                  display: "inline-block",
                  boxShadow: `0 0 6px ${EMERALD}`
                }}
              />
              <span>Cloud Synced & Live</span>
              {gatewayState?.stats?.lastSyncedAt && (
                <span style={{ opacity: 0.8 }}>
                  • {new Date(gatewayState.stats.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", background: BG, padding: "3px", borderRadius: "8px", border: `1px solid ${BORDER}`, flexWrap: "wrap", gap: "2px" }}>
          {[
            { id: "chat", label: "💬 Chat" },
            { id: "leads", label: `🎯 Leads (${gatewayState?.stats?.totalLeads || 0})` },
            { id: "keys", label: "🔑 Keys" },
            { id: "sync", label: "⚡ State" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "none",
                background: activeTab === tab.id ? PANEL : "transparent",
                color: activeTab === tab.id ? GOLD : MUTED,
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: activeTab === tab.id ? "600" : "500",
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── TAB 1: 24/7 ANTIGRAVITY CHAT ── */}
      {activeTab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Quick Prompts */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "0.6rem 1rem",
              background: "#FAF9F6",
              borderBottom: `1px solid ${BORDER}`,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none"
            }}
          >
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                style={{
                  flexShrink: 0,
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "0.74rem",
                  color: TEXT,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
              background: BG,
              WebkitOverflowScrolling: "touch"
            }}
          >
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    alignSelf: isUser ? "flex-end" : "flex-start"
                  }}
                >
                  <div
                    style={{
                      background: isUser ? `linear-gradient(135deg, ${GOLD}, #734F12)` : PANEL,
                      color: isUser ? "#FFFFFF" : TEXT,
                      padding: "0.75rem 1rem",
                      borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      border: isUser ? "none" : `1px solid ${BORDER}`,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                      fontSize: "0.86rem",
                      lineHeight: "1.45",
                      whiteSpace: "pre-wrap",
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Context Actions if provided */}
                  {m.actions && m.actions.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (act.action === "view_leads") setActiveTab("leads");
                            else handleSend(act.label);
                          }}
                          style={{
                            background: PANEL,
                            border: `1px solid ${GOLD}`,
                            color: GOLD,
                            borderRadius: "14px",
                            padding: "3px 10px",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          → {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: MUTED,
                      marginTop: "3px",
                      padding: "0 4px"
                    }}
                  >
                    {m.time}
                  </span>
                </div>
              );
            })}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: PANEL,
                  padding: "0.6rem 1rem",
                  borderRadius: "16px 16px 16px 2px",
                  border: `1px solid ${BORDER}`,
                  fontSize: "0.8rem",
                  color: MUTED,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>⚡ Antigravity cloud thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "0.75rem 1rem",
              background: PANEL,
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Antigravity ko command dein (Roman Hindi)..."
              style={{
                flex: 1,
                padding: "0.7rem 1rem",
                borderRadius: "12px",
                border: `1px solid ${BORDER}`,
                background: BG,
                fontSize: "0.88rem",
                color: TEXT,
                outline: "none",
                fontFamily: "'Inter', sans-serif"
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputMsg.trim()}
              style={{
                background: inputMsg.trim() ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` : "#E5E7EB",
                color: inputMsg.trim() ? "#FFF" : "#9CA3AF",
                border: "none",
                padding: "0.7rem 1.1rem",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: inputMsg.trim() ? "pointer" : "default",
                transition: "all 0.15s ease"
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLOUD LEADS & APPROVALS ── */}
      {activeTab === "leads" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", background: BG }}>
          {dispatchSuccessMsg && (
            <div
              style={{
                background: "#ECFDF5",
                border: "1px solid #10B981",
                color: "#065F46",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                fontSize: "0.82rem",
                marginBottom: "1rem"
              }}
            >
              ✓ {dispatchSuccessMsg}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem" }}>
                Active Cloud Leads Queue
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: MUTED }}>
                Synced directly from your laptop to Supabase database.
              </p>
            </div>
            <button
              onClick={fetchState}
              disabled={stateLoading}
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "0.74rem",
                cursor: "pointer"
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {stateLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: MUTED }}>Loading cloud leads...</div>
          ) : (gatewayState?.leads || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: MUTED }}>
              No leads currently in queue. Sync from laptop or ask Antigravity to scout.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {gatewayState.leads.map((l) => {
                let parsedMsg = null;
                try {
                  parsedMsg = JSON.parse(l.message);
                } catch {}

                const isPending = l.status === "pending_approval" || l.status === "new" || l.status === "scouted_ready";

                return (
                  <div
                    key={l.id}
                    style={{
                      background: PANEL,
                      border: `1px solid ${isPending ? GOLD_LIGHT : BORDER}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.68rem",
                            fontWeight: "bold",
                            letterSpacing: "0.04em",
                            background: isPending ? "#FEF3C7" : "#E0E7FF",
                            color: isPending ? "#92400E" : "#3730A3",
                            marginBottom: "4px"
                          }}
                        >
                          {l.status?.toUpperCase() || "NEW"}
                        </span>
                        <h4 style={{ margin: "2px 0 4px 0", fontSize: "0.95rem", color: TEXT }}>
                          {l.first_name || "Prospect Lead"}
                        </h4>
                        <div style={{ fontSize: "0.76rem", color: MUTED }}>{l.email}</div>
                      </div>

                      {/* 1-Tap Action */}
                      {isPending && (
                        <button
                          onClick={() => handle1TapDispatch(l.id)}
                          disabled={dispatchingId === l.id}
                          style={{
                            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                            color: "#FFF",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(139, 97, 24, 0.25)"
                          }}
                        >
                          {dispatchingId === l.id ? "Sending..." : "✓ 1-Tap Approve"}
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: MUTED, background: BG, padding: "8px 10px", borderRadius: "8px" }}>
                      <div><strong>Source:</strong> {l.source}</div>
                      {parsedMsg?.deliverables && (
                        <div style={{ marginTop: "3px" }}>
                          <strong>Deliverables:</strong> {parsedMsg.deliverables}
                        </div>
                      )}
                      {parsedMsg?.starterMilestone?.price && (
                        <div style={{ marginTop: "3px", color: GOLD, fontWeight: "600" }}>
                          Milestone: {parsedMsg.starterMilestone.price}
                        </div>
                      )}
                      {l.reply_snippet && (
                        <div style={{ marginTop: "4px", fontSize: "0.7rem", fontFamily: "monospace" }}>
                          Proof: {l.reply_snippet}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: AI KEYS LINE-UP & AUTO-FAILOVER ── */}
      {activeTab === "keys" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", background: BG }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem" }}>
                AI Keys Line-Up & Cascade
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: MUTED }}>
                Automatic 0ms failover: Groq ➔ NVIDIA NIM ➔ Gemini ➔ Deterministic Core.
              </p>
            </div>
            <button
              onClick={fetchKeyHealth}
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "0.74rem",
                cursor: "pointer"
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {keyAddMsg && (
            <div
              style={{
                background: "#ECFDF5",
                border: "1px solid #10B981",
                color: "#065F46",
                padding: "0.6rem 0.9rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                marginBottom: "1rem"
              }}
            >
              {keyAddMsg}
            </div>
          )}

          {/* Cascade Line-up Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
            {/* 1. Groq Keys */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1rem" }}>⚡</span>
                  <strong style={{ fontSize: "0.9rem", color: TEXT }}>1. Groq High-Speed (Primary)</strong>
                </div>
                <span style={{ fontSize: "0.68rem", color: MUTED }}>Sub-350ms Latency</span>
              </div>
              {(keyHealthData?.lineup?.groq || []).map((k) => (
                <div
                  key={k.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: BG,
                    padding: "6px 10px",
                    borderRadius: "8px",
                    marginTop: "5px",
                    fontSize: "0.76rem"
                  }}
                >
                  <span style={{ fontFamily: "monospace", color: TEXT }}>{k.masked}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      background: k.status === "ACTIVE_ONLINE" ? "#D1FAE5" : "#FEF3C7",
                      color: k.status === "ACTIVE_ONLINE" ? "#065F46" : "#92400E"
                    }}
                  >
                    {k.status === "ACTIVE_ONLINE" ? "● ACTIVE" : `COOLDOWN (${k.cooldownRemainingSeconds}s)`}
                  </span>
                </div>
              ))}
            </div>

            {/* 2. NVIDIA NIM Keys */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1rem" }}>🟢</span>
                  <strong style={{ fontSize: "0.9rem", color: TEXT }}>2. NVIDIA NIM GPU Cloud (Secondary)</strong>
                </div>
                <span style={{ fontSize: "0.68rem", color: MUTED }}>Nemotron 70B & Mistral</span>
              </div>
              {(keyHealthData?.lineup?.nvidia || []).map((k) => (
                <div
                  key={k.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: BG,
                    padding: "6px 10px",
                    borderRadius: "8px",
                    marginTop: "5px",
                    fontSize: "0.76rem"
                  }}
                >
                  <span style={{ fontFamily: "monospace", color: TEXT }}>{k.masked}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      background: k.status === "ACTIVE_ONLINE" ? "#D1FAE5" : "#FEF3C7",
                      color: k.status === "ACTIVE_ONLINE" ? "#065F46" : "#92400E"
                    }}
                  >
                    {k.status === "ACTIVE_ONLINE" ? "● ACTIVE" : `COOLDOWN (${k.cooldownRemainingSeconds}s)`}
                  </span>
                </div>
              ))}
            </div>

            {/* 3. Gemini Keys */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1rem" }}>✨</span>
                  <strong style={{ fontSize: "0.9rem", color: TEXT }}>3. Google Gemini (Tertiary)</strong>
                </div>
                <span style={{ fontSize: "0.68rem", color: MUTED }}>Flash & Pro Latest</span>
              </div>
              {(keyHealthData?.lineup?.gemini || []).map((k) => (
                <div
                  key={k.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: BG,
                    padding: "6px 10px",
                    borderRadius: "8px",
                    marginTop: "5px",
                    fontSize: "0.76rem"
                  }}
                >
                  <span style={{ fontFamily: "monospace", color: TEXT }}>{k.masked}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      background: k.status === "ACTIVE_ONLINE" ? "#D1FAE5" : "#FEF3C7",
                      color: k.status === "ACTIVE_ONLINE" ? "#065F46" : "#92400E"
                    }}
                  >
                    {k.status === "ACTIVE_ONLINE" ? "● ACTIVE" : `COOLDOWN (${k.cooldownRemainingSeconds}s)`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Runtime Key Injector Form */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.88rem", color: GOLD }}>
              + Add / Update API Key (Runtime Line-Up)
            </h4>
            <p style={{ margin: "0 0 0.8rem 0", fontSize: "0.74rem", color: MUTED }}>
              Paste any new API key here from your phone. It joins the failover rotation immediately without restarting the server.
            </p>
            <form onSubmit={handleAddKey} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={keyProviderInput}
                  onChange={(e) => setKeyProviderInput(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: `1px solid ${BORDER}`,
                    background: BG,
                    fontSize: "0.8rem",
                    color: TEXT
                  }}
                >
                  <option value="groq">Groq</option>
                  <option value="nvidia">NVIDIA NIM</option>
                  <option value="gemini">Gemini</option>
                </select>
                <input
                  type="password"
                  value={keySecretInput}
                  onChange={(e) => setKeySecretInput(e.target.value)}
                  placeholder="Paste API Key (gsk_... / nvapi-... / AQ....)"
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    border: `1px solid ${BORDER}`,
                    background: BG,
                    fontSize: "0.8rem",
                    color: TEXT
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                  color: "#FFF",
                  border: "none",
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Line Up Key in Cascade
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: CLOUD SYNC & TELEMETRY ── */}
      {activeTab === "sync" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", background: BG }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem" }}>
            Sovereign Cloud Brain State
          </h3>
          <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.8rem", color: MUTED }}>
            This architecture guarantees your laptop's intelligence is accessible from your phone 24/7 without needing the laptop to stay on.
          </p>

          <div
            style={{
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1rem"
            }}
          >
            <h4 style={{ margin: "0 0 0.8rem 0", fontSize: "0.88rem", color: GOLD }}>
              Sync Telemetry
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem" }}>
              <div style={{ background: BG, padding: "8px", borderRadius: "8px" }}>
                <span style={{ color: MUTED, fontSize: "0.72rem" }}>Total Leads Synced</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: TEXT }}>
                  {gatewayState?.stats?.totalLeads || 0}
                </div>
              </div>
              <div style={{ background: BG, padding: "8px", borderRadius: "8px" }}>
                <span style={{ color: MUTED, fontSize: "0.72rem" }}>Pending Approvals</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: GOLD }}>
                  {gatewayState?.stats?.pendingApprovals || 0}
                </div>
              </div>
              <div style={{ background: BG, padding: "8px", borderRadius: "8px" }}>
                <span style={{ color: MUTED, fontSize: "0.72rem" }}>Contacted Prospects</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: EMERALD }}>
                  {gatewayState?.stats?.contactedCount || 0}
                </div>
              </div>
              <div style={{ background: BG, padding: "8px", borderRadius: "8px" }}>
                <span style={{ color: MUTED, fontSize: "0.72rem" }}>Primary Host</span>
                <div style={{ fontSize: "0.88rem", fontWeight: "bold", color: TEXT }}>
                  {gatewayState?.syncMetadata?.host || "laptop_primary"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: "8px" }}>
              Last Synced: <strong>{gatewayState?.stats?.lastSyncedAt || "Recently"}</strong>
            </div>
          </div>

          {/* Synced Lessons */}
          <div
            style={{
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "1.25rem"
            }}
          >
            <h4 style={{ margin: "0 0 0.8rem 0", fontSize: "0.88rem", color: TEXT }}>
              Active Synced Lessons ({gatewayState?.syncMetadata?.totalLessonsCount || 29})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {(gatewayState?.syncMetadata?.recentLessons || []).slice(-5).map((les, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "0.76rem",
                    color: MUTED,
                    padding: "6px 8px",
                    background: BG,
                    borderRadius: "6px"
                  }}
                >
                  <strong style={{ color: TEXT }}>[{les.type || "core"}]</strong> {les.lesson}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
