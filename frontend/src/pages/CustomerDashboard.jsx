import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UniversesGrid from "../components/UniversesGrid";
import UniverseDetail from "../components/UniverseDetail";
import ChatConsole from "../components/ChatConsole";

const PAYMENT_URL = (import.meta.env.VITE_PAYMENT_URL || "https://razorpay.me/@garudaosincompany").trim();

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

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#d4af37",
  goldStrong: "#aa820a",
  green: "#7be8b4"
};

export default function CustomerDashboard({ customer, onLogout }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/customer/conversations", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setConversations(data.success ? data.conversations || [] : []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setConversations([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const buttonStyle = {
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.4)",
    color: palette.gold,
    borderRadius: 999,
    padding: "0.5rem 1.1rem",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer"
  };
  const primaryButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
    color: "#000"
  };

  return (
    <main className="garuda-shell" style={{ minHeight: "100vh", padding: "clamp(1rem, 3vw, 2rem)", background: palette.bg, color: palette.text }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.3rem" }}>CUSTOMER PORTAL</p>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Welcome to GARUDA</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>{customer?.email}</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => window.open(PAYMENT_URL, "_blank", "noopener,noreferrer")}
            style={primaryButtonStyle}
          >
            Make a Payment
          </button>
          <button type="button" onClick={onLogout} style={buttonStyle}>
            Sign out
          </button>
        </div>
      </header>

      {selected && <UniverseDetail universe={selected} onClose={() => setSelected(null)} />}

      {/* Chat Console - directly on dashboard */}
      <section style={{ marginBottom: "2rem" }} aria-label="Chat with GARUDA">
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>ASK GARUDA</p>
        <ChatConsole
          compact
          conversationId={chatConversationId}
          onConversationId={setChatConversationId}
          placeholder="Ask GARUDA anything — no account needed for public questions"
          minHeight={360}
        />
      </section>

      {/* Universes - collapsed on mobile via View all */}
      <section aria-label="GARUDA universes">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: "0.3rem" }}>UNIVERSES</p>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>The GARUDA world</h2>
          </div>
          <button type="button" onClick={() => setShowAll((v) => !v)} style={buttonStyle}>
            {showAll ? "Show less" : "View all"}
          </button>
        </div>
        <div style={{ maxHeight: showAll ? "none" : 560, overflow: "hidden", position: "relative" }}>
          <UniversesGrid onSelect={setSelected} />
          {!showAll && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(transparent, #04070a)", display: "grid", placeItems: "end", padding: "1.5rem" }}>
              <button type="button" onClick={() => setShowAll(true)} style={{ ...buttonStyle, background: "rgba(212,175,55,0.16)" }}>
                View all universes →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Conversations */}
      <section className="metric-card" style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: "2rem" }} aria-label="AI conversations">
        <p className="eyebrow">YOUR CHAT MEMORY</p>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Saved conversations</h2>
        {loading ? (
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>No saved conversations yet. Start one above.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {conversations.slice(0, 5).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/chat?c=${encodeURIComponent(item.id)}`)}
                  style={{ width: "100%", textAlign: "left", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.7rem 1rem", cursor: "pointer", color: "inherit", font: "inherit" }}
                >
                  <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.title}</span>
                    <span style={{ color: "#9ca3af", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{timeAgo(item.updated_at)}</span>
                  </span>
                  {item.last_message && (
                    <span style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.last_message}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
