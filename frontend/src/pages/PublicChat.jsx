import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatConsole from "../components/ChatConsole";

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
  const [customer, setCustomer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.8rem 1.25rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(17, 24, 39, 0.7)",
          backdropFilter: "blur(12px)",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
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
              fontWeight: 500
            }}
          >
            ← Home
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.08em", color: "#ffffff" }}>
              GARUDA
            </h1>
            <span style={{ fontSize: "0.72rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
              AI OS
            </span>
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

        {/* Main Chat */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
            <ChatConsole
              conversationId={activeConversationId}
              onConversationId={(id) => {
                setActiveConversationId(id);
                refreshConversations();
              }}
              placeholder="Ask GARUDA anything..."
              minHeight={0}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
