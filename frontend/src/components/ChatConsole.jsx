import React, { useState, useRef, useEffect, useCallback } from "react";

const GREETING = { role: "model", text: "Hello! I am GARUDA. How can I help you today?" };

const REQUEST_TIMEOUT_MS = 45000;

async function sendMessage(message, history, conversationId, signal) {
  const res = await fetch("/api/public-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    signal,
    body: JSON.stringify({
      message,
      history: (history || []).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text
      })),
      conversationId: conversationId || null
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get AI response");
  return data;
}

export default function ChatConsole({
  conversationId,
  onConversationId,
  compact = false,
  placeholder = "Ask GARUDA anything...",
  minHeight = 320
}) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  const endRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, error, scrollToBottom]);

  const handleSend = async (overrideText) => {
    const textToSend = String(overrideText || input).trim();
    if (!textToSend || loading) return;

    setError(null);
    setTimedOut(false);
    setInput("");

    const history = messages.filter((m) => m.text);
    const updated = [...history, { role: "user", text: textToSend }];
    setMessages(updated);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const data = await sendMessage(textToSend, history, conversationId, controller.signal);
      clearTimeout(timeoutId);
      if (data.conversationId && onConversationId) onConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.reply || "No response text received.",
          proposalUrl: data.proposalUrl || null,
          proposalId: data.proposalId || null,
          qualification: data.qualification || null
        }
      ]);
    } catch (err) {
      clearTimeout(timeoutId);
      const aborted = err && (err.name === "AbortError" || /abort/i.test(String(err.message)));
      setTimedOut(aborted);
      const message = aborted
        ? "GARUDA took too long to respond. Please try again."
        : String(err.message || "An unexpected error occurred. Please try again.");
      setError(message);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: message, isError: true }
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

  const bubbleStyle = (isUser, isError) => ({
    maxWidth: "85%",
    padding: "0.75rem 1rem",
    borderRadius: 14,
    background: isUser
      ? "rgba(212,175,55,0.15)"
      : isError
      ? "rgba(239,68,68,0.12)"
      : "rgba(31,41,55,0.55)",
    border: isUser
      ? "1px solid rgba(212,175,55,0.35)"
      : isError
      ? "1px solid rgba(239,68,68,0.35)"
      : "1px solid rgba(255,255,255,0.08)",
    color: isError ? "#f87171" : "#f3f4f6",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight,
        maxHeight: compact ? 420 : undefined,
        flex: compact ? undefined : 1,
        border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: 16,
        background: "rgba(11,15,22,0.75)",
        overflow: "hidden"
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={`${msg.role}-${idx}`} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
              <div style={bubbleStyle(isUser, msg.isError)}>{msg.text}</div>
              {msg.proposalUrl && (
                <div style={{ marginTop: "0.5rem" }}>
                  <a
                    href={msg.proposalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                      color: "#05070a",
                      padding: "0.55rem 1.1rem",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      boxShadow: "0 4px 15px rgba(245,215,110,0.25)"
                    }}
                  >
                    <span>◈</span> View & Accept Formal Proposal →
                  </a>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ ...bubbleStyle(false, false), color: "#9ca3af" }}>
              <span style={{ animation: "pulse 1.4s infinite", display: "inline-block" }}>GARUDA is responding...</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === "user");
                setMessages((prev) => prev.filter((m) => !m.isError));
                setError(null);
                if (lastUser) handleSend(lastUser.text);
              }}
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.4)",
                color: "#d4af37",
                borderRadius: 999,
                padding: "0.45rem 1.1rem",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer"
              }}
            >
              {timedOut ? "Try again" : "Retry"}
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "0.75rem", display: "flex", gap: "0.6rem", background: "rgba(17,24,39,0.6)" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          style={{
            flex: 1,
            background: "rgba(31,41,55,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "0.7rem 1rem",
            color: "#ffffff",
            fontSize: "0.92rem",
            outline: "none",
            minWidth: 0
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "rgba(212,175,55,0.3)" : "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
            color: "#000",
            border: "none",
            borderRadius: 10,
            padding: "0.7rem 1.3rem",
            fontWeight: 700,
            fontSize: "0.92rem",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            flexShrink: 0
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
