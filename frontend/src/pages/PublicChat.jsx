import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PublicChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I am GARUDA Public AI. How can I help you today?"
    }
  ]);
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

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend || loading) return;

    setError(null);
    setInputMessage("");

    // Maintain conversation history in React state
    const updatedHistory = [...messages, { role: "user", text: textToSend }];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      // Send previous messages (excluding the first greeting if desired, or send full history) to /api/public-chat
      const historyPayload = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        text: msg.text
      }));

      const res = await fetch("/api/public-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
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
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
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
              background: "#10b981",
              boxShadow: "0 0 8px #10b981"
            }}
          />
          Public AI • Unlimited
        </div>
      </header>

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
                key={idx}
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
            GARUDA Public AI • Powered by Gemini 2.5 Flash
          </div>
        </div>
      </footer>
    </div>
  );
}
