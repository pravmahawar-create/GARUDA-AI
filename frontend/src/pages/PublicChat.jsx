import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

const GREETING = { role: "model", text: "Hello! I am GARUDA Public AI. How can I help you today?" };

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

async function loadConversationMessages(conversationId) {
  const res = await fetch(`/api/customer/messages?conversation_id=${encodeURIComponent(conversationId)}`, { credentials: "same-origin" });
  const data = await res.json();
  return data.success
    ? data.messages.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.content, created_at: m.created_at }))
    : [];
}

export default function PublicChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([GREETING]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const refreshConversations = useCallback(async () => {
    setConversations(await loadConversations());
  }, []);

  const openConversation = useCallback(async (conversationId) => {
    const loaded = await loadConversationMessages(conversationId);
    setActiveConversationId(conversationId);
    setMessages(loaded.length ? loaded : [GREETING]);
    setError(null);
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
        if (target) {
          const loaded = await loadConversationMessages(target);
          if (cancelled) return;
          setActiveConversationId(target);
          setMessages(loaded.length ? loaded : [GREETING]);
        }
      })
      .catch(() => {
        if (!cancelled) setCustomer(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const newConversation = () => {
    setActiveConversationId(null);
    setMessages([GREETING]);
    setError(null);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend || loading) return;

    setError(null);
    setInputMessage("");

    const updatedHistory = [...messages, { role: "user", text: textToSend }];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const historyPayload = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        text: msg.text
      }));

      const res = await fetch("/api/public-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          conversationId: activeConversationId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
        refreshConversations();
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.reply || "No response text received."
        }
      ]);
    } catch (err) {
      console.error("Public Chat request error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      if (activeConversationId) refreshConversations();
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I experienced an error processing your request. Please try again in a moment.",
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestionChips = [
    "What is GARUDA OS?",
    "Explain AI workflow automation",
    "How does fixed-price AI engineering work?",
    "Write a JavaScript helper function"
  ];

  const handleChipClick = (chipText) => {
    setInputMessage(chipText);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#030712",
        color: "#f9fafb",
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(17, 24, 39, 0.7)",
          backdropFilter: "blur(12px)",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#9ca3af",
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
            ← Home
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, letterSpacing: "0.08em", color: "#ffffff" }}>
              GARUDA
            </h1>
            <span style={{ fontSize: "0.75rem", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
              AI OS
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "9999px",
            background: customer
              ? "rgba(251, 191, 36, 0.12)"
              : "rgba(16, 185, 129, 0.12)",
            border: customer
              ? "1px solid rgba(251, 191, 36, 0.3)"
              : "1px solid rgba(16, 185, 129, 0.3)",
            color: customer ? "#fbbf24" : "#10b981",
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "0.03em"
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: customer ? "#fbbf24" : "#10b981",
              boxShadow: customer ? "0 0 8px #fbbf24" : "0 0 8px #10b981"
            }}
          />
          {customer === true ? "Signed in • Memory on" : "Public AI • Unlimited"}
        </div>
      </header>

      {/* Body: Sidebar + Chat */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {customer === true && (
          <aside
            style={{
              width: "260px",
              flexShrink: 0,
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(17, 24, 39, 0.4)",
              display: "flex",
              flexDirection: "column",
              minHeight: 0
            }}
          >
            <div style={{ padding: "1rem 1rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", letterSpacing: "0.12em", color: "#9ca3af", fontWeight: 700 }}>CONVERSATIONS</span>
              <button
                type="button"
                onClick={newConversation}
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
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
                    onClick={() => openConversation(item.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.7rem 0.75rem",
                      marginBottom: "0.35rem",
                      borderRadius: "8px",
                      border: active
                        ? "1px solid rgba(251, 191, 36, 0.35)"
                        : "1px solid rgba(255, 255, 255, 0.06)",
                      background: active
                        ? "rgba(251, 191, 36, 0.08)"
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

        {/* Main Chat Container */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={`${msg.role}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    width: "100%"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      maxWidth: "85%",
                      flexDirection: isUser ? "row-reverse" : "row"
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isUser ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)" : "rgba(31, 41, 55, 0.8)",
                        border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
                        color: isUser ? "#000" : "#fbbf24",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        flexShrink: 0
                      }}
                    >
                      {isUser ? "You" : "G"}
                    </div>

                    {/* Message Content */}
                    <div
                      style={{
                        background: isUser
                          ? "rgba(251, 191, 36, 0.12)"
                          : msg.isError
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(31, 41, 55, 0.5)",
                        border: isUser
                          ? "1px solid rgba(251, 191, 36, 0.3)"
                          : msg.isError
                          ? "1px solid rgba(239, 68, 68, 0.3)"
                          : "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "14px",
                        padding: "0.85rem 1.15rem",
                        color: msg.isError ? "#f87171" : "#f3f4f6",
                        fontSize: "0.95rem",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}
              >
                <div style={{ display: "flex", gap: "0.75rem", maxWidth: "85%" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(31, 41, 55, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#fbbf24",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      flexShrink: 0
                    }}
                  >
                    G
                  </div>
                  <div
                    style={{
                      background: "rgba(31, 41, 55, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "0.85rem 1.15rem",
                      color: "#9ca3af",
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <span style={{ display: "inline-block", animation: "pulse 1.5s infinite" }}>GARUDA AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        </main>
      </div>

      {/* Suggestion Chips & Input Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(17, 24, 39, 0.6)",
          backdropFilter: "blur(12px)",
          padding: "1rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Starter Chips */}
          {messages.length <= 2 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {suggestionChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(chip)}
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "9999px",
                    color: "#d1d5db",
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(251, 191, 36, 0.4)";
                    e.currentTarget.style.color = "#fbbf24";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.color = "#d1d5db";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Form Input */}
          <form
            onSubmit={handleSend}
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask GARUDA Public AI anything..."
              disabled={loading}
              style={{
                flex: 1,
                background: "rgba(31, 41, 55, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "0.85rem 1.15rem",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              style={{
                background: loading || !inputMessage.trim() ? "rgba(251, 191, 36, 0.3)" : "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                color: "#000000",
                border: "none",
                borderRadius: "10px",
                padding: "0.85rem 1.5rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: loading || !inputMessage.trim() ? "not-allowed" : "pointer",
                transition: "opacity 0.2s ease"
              }}
            >
              Send
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#6b7280" }}>
            {customer === true
              ? "Conversations are saved to your account."
              : "GARUDA Public AI • Powered by Gemini 2.5 Flash"}
          </div>
        </div>
      </footer>
    </div>
  );
}