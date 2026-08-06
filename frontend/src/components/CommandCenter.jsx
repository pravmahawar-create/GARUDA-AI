import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function CommandCenter({
  messages = [],
  question = "",
  loading = false,
  activityState = "Ready",
  activeMission = null,
  threads = [],
  activeThreadId = null,
  onSelectThread,
  onNewThread,
  onQuestionChange,
  onSend,
  onApproval
}) {
  const messagesContainerRef = useRef(null);
  const [expandedEvidenceIndex, setExpandedEvidenceIndex] = useState(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading, activityState, activeMission]);

  const toggleEvidence = (index) => {
    setExpandedEvidenceIndex((prev) => (prev === index ? null : index));
  };

  return (
    <motion.section
      className="command-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "rgba(18, 18, 22, 0.95)",
        border: "1px solid rgba(212, 175, 55, 0.2)",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
      }}
    >
      {/* Header & Controls */}
      <div className="command-center__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
        <div>
          <p className="eyebrow" style={{ color: "#d4af37", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Founder Agent Console</p>
          <h3 style={{ margin: 0, color: "#fff", fontSize: "1.25rem" }}>GARUDA Autonomous Control Workspace</h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {threads.length > 0 && (
            <select
              value={activeThreadId || ""}
              onChange={(e) => onSelectThread && onSelectThread(e.target.value)}
              style={{
                background: "#18181f",
                color: "#e0e0e0",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              {threads.map((t) => (
                <option key={t.threadId} value={t.threadId}>
                  {t.title} ({t.messageCount})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onNewThread}
            style={{
              background: "rgba(212, 175, 55, 0.15)",
              color: "#d4af37",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            + New Thread
          </button>

          <span
            className="status-pill"
            style={{
              background: loading ? "rgba(255, 152, 0, 0.15)" : "rgba(76, 175, 80, 0.15)",
              color: loading ? "#ff9800" : "#4caf50",
              border: `1px solid ${loading ? "rgba(255, 152, 0, 0.4)" : "rgba(76, 175, 80, 0.4)"}`,
              padding: "0.35rem 0.75rem",
              borderRadius: "12px",
              fontSize: "0.78rem",
              fontWeight: 600
            }}
          >
            {loading ? `● ${activityState}` : `● ${activeMission?.status || "Ready"}`}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className="command-center__messages"
        style={{
          minHeight: "320px",
          maxHeight: "520px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          paddingRight: "0.5rem"
        }}
      >
        {messages.map((message, index) => {
          const isAgent = message.mode === "agent";
          const isUser = message.role === "user";

          return (
            <div
              key={`${message.role}-${index}`}
              className={`bubble ${message.role}`}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: isUser ? "78%" : "88%",
                background: isUser ? "rgba(212, 175, 55, 0.12)" : "rgba(26, 26, 34, 0.95)",
                border: `1px solid ${isUser ? "rgba(212, 175, 55, 0.3)" : isAgent ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "0.85rem 1.1rem",
                color: "#e2e8f0",
                fontSize: "0.92rem",
                lineHeight: "1.5"
              }}
            >
              {message.mode && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    color: isAgent ? "#4caf50" : "#d4af37",
                    marginBottom: "6px",
                    fontWeight: "bold",
                    letterSpacing: "0.05em"
                  }}
                >
                  [{message.mode} MODE{message.missionStatus ? ` • ${message.missionStatus}` : ""}]
                </div>
              )}

              <div style={{ whitespace: "pre-wrap" }}>{message.text}</div>

              {/* Evidence Inspector dropdown for agent responses */}
              {isAgent && message.evidence && (
                <div style={{ marginTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "8px" }}>
                  <button
                    onClick={() => toggleEvidence(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4caf50",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 600
                    }}
                  >
                    {expandedEvidenceIndex === index ? "▼ Hide Inspection Evidence" : "▶ View Inspection Evidence"}
                  </button>

                  {expandedEvidenceIndex === index && (
                    <div style={{ marginTop: "8px", background: "rgba(0, 0, 0, 0.4)", padding: "10px", borderRadius: "6px", fontSize: "0.8rem", color: "#cbd5e1" }}>
                      <p style={{ margin: "2px 0" }}><strong>Intent:</strong> {message.evidence.goal?.intent || "read_only_audit"}</p>
                      <p style={{ margin: "2px 0" }}><strong>Validation Passed:</strong> {message.evidence.validationPassed ? "YES (PASSED)" : "NO"}</p>
                      <p style={{ margin: "2px 0" }}><strong>Files Modified:</strong> {message.evidence.filesModified?.length || 0} (Zero writes)</p>
                      {Array.isArray(message.evidence.filesInspected) && message.evidence.filesInspected.length > 0 && (
                        <div style={{ marginTop: "6px" }}>
                          <strong>Inspected Files ({message.evidence.filesInspected.length}):</strong>
                          <ul style={{ margin: "4px 0 0 16px", padding: 0, maxHeight: "120px", overflowY: "auto" }}>
                            {message.evidence.filesInspected.map((file, fIdx) => (
                              <li key={fIdx}>{file}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeMission && (
          <div className="bubble garuda" style={{ border: "1px solid #d4af37", background: "#111", padding: "12px", borderRadius: "8px", marginTop: "10px" }}>
            <h4 style={{ color: "#d4af37", marginBottom: "6px" }}>🦅 GARUDA Autonomous Mission Console</h4>
            <p><strong>Task ID:</strong> {activeMission.taskId}</p>
            <p><strong>Goal:</strong> {activeMission.goal}</p>
            <p><strong>Status:</strong> <span style={{ color: activeMission.status === "completed" ? "#4caf50" : "#ff9800", fontWeight: "bold" }}>{activeMission.status?.toUpperCase()}</span></p>
            <p><strong>Current Action:</strong> {activeMission.currentAction}</p>
            {activeMission.selectedWorker && <p><strong>Selected Worker:</strong> {activeMission.selectedWorker}</p>}
            {activeMission.reviewVerdict && <p><strong>Review Verdict:</strong> {activeMission.reviewVerdict}</p>}
            {activeMission.testResults && <p><strong>Unit Test Result:</strong> {activeMission.testResults.status}</p>}
            {activeMission.createdFiles?.length > 0 && (
              <div>
                <strong>Verified Created Files:</strong>
                <ul>
                  {activeMission.createdFiles.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {activeMission.founderApprovalRequired && activeMission.status === "waiting_for_approval" && (
              <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button onClick={() => onApproval && onApproval(activeMission.taskId, "APPROVE")} style={{ background: "#4caf50", color: "#fff", padding: "6px 14px", border: "none", borderRadius: "4px", cursor: "pointer" }}>APPROVE</button>
                <button onClick={() => onApproval && onApproval(activeMission.taskId, "REJECT")} style={{ background: "#f44336", color: "#fff", padding: "6px 14px", border: "none", borderRadius: "4px", cursor: "pointer" }}>REJECT</button>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input */}
      <div className="composer" style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSend()}
          placeholder="Submit directive or command to GARUDA (e.g. Inspect the repository...)"
          style={{
            flex: 1,
            background: "#16161c",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            color: "#fff",
            fontSize: "0.95rem",
            outline: "none"
          }}
        />
        <button
          onClick={onSend}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.4rem",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Processing..." : "Submit Mission"}
        </button>
      </div>
    </motion.section>
  );
}
