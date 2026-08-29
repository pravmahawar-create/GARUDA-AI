import React, { useState } from "react";
import { getAttributionPayload } from "../utils/attribution";
import { trackEvent } from "../utils/telemetry";

const SERVICES_OPTIONS = [
  { id: "custom-ai-development", label: "Custom AI & Multi-Agent Architecture (from ₹45,000 / $550)" },
  { id: "custom-software-saas-mvp", label: "Full-Stack Custom Software & SaaS MVP (from ₹50,000 / $600)" },
  { id: "business-workflow-ai-automation", label: "Enterprise Workflow & Process Automation (from ₹25,000 / $300)" },
  { id: "whatsapp-telegram-ai-bots", label: "Custom WhatsApp & Telegram AI Commercial Bots (from ₹20,000 / $250)" },
  { id: "custom-enterprise-system", label: "Bespoke Enterprise Intelligence & Architecture" }
];

const BUDGET_OPTIONS = [
  "₹25,000 – ₹50,000 (~$300 – $600)",
  "₹50,000 – ₹1,50,000 (~$600 – $1,800)",
  "₹1,50,000 – ₹5,00,000 (~$1,800 – $6,000)",
  "₹5,00,000+ ($6,000+) / Enterprise Scope"
];

export default function ProjectScopeForm({
  defaultService = "custom-ai-development",
  title = "Request a Fixed-Price Project Scope",
  subtitle = "Tell us what problem you want solved. Receive an architectural scope blueprint, milestone breakdown, and verified quote within 24 hours.",
  onSuccess
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [service, setService] = useState(defaultService);
  const [budget, setBudget] = useState(BUDGET_OPTIONS[0]);
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleFocus = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      trackEvent("project_scope_started", {
        service,
        landingPath: window.location.pathname
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanReqs = requirements.trim();
    if (cleanReqs.length < 10) {
      setError("Please provide at least 10 characters describing your project requirements.");
      return;
    }

    setLoading(true);
    const attribution = getAttributionPayload();

    try {
      const payload = {
        name: name.trim(),
        email: contact.includes("@") ? contact.trim() : null,
        phone: !contact.includes("@") ? contact.trim() : null,
        contact: contact.trim(),
        service,
        requirements: cleanReqs,
        budget,
        attribution
      };

      const res = await fetch("/api/inbound/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit project scope request.");
      }

      setResult(data);
      trackEvent("project_scope_submitted", {
        scopeId: data.proposal?.scopeId || data.leadId,
        service,
        budget,
        channel: attribution.channel || "Direct"
      });

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || "Network error. Please try again or reach out via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const scopeId = result.proposal?.scopeId || result.leadId || "GARUDA-SCOPE";
    return (
      <div
        id="project-scope"
        style={{
          background: "linear-gradient(160deg, rgba(212,175,55,0.08) 0%, rgba(11,15,22,0.95) 100%)",
          border: "1px solid rgba(212,175,55,0.4)",
          borderRadius: "20px",
          padding: "3rem 2rem",
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)"
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid #10b981", color: "#10b981", display: "grid", placeItems: "center", fontSize: "2rem", margin: "0 auto 1.5rem" }}>
          ✓
        </div>
        <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>
          Project Scope Request Received
        </h3>
        <p style={{ color: "#d4af37", fontWeight: 700, fontSize: "0.95rem", margin: "0 0 1.25rem", letterSpacing: "0.08em" }}>
          SCOPE REFERENCE: #{scopeId}
        </p>
        <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 2rem" }}>
          Thank you, <strong>{name}</strong>. GARUDA's Principal Architect has received your project brief. We will formulate your fixed-price milestone quote and reach out within 24 hours.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href={`/proposal/${scopeId}`}
            style={{
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              color: "#05070a",
              padding: "0.85rem 1.8rem",
              borderRadius: "999px",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "0.92rem",
              boxShadow: "0 6px 20px rgba(245,215,110,0.25)"
            }}
          >
            View Formal Digital Scope & Proposal →
          </a>
          <a
            href={`/chat?topic=${encodeURIComponent(service)}`}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(245,215,110,0.3)",
              color: "#f5d76e",
              padding: "0.85rem 1.8rem",
              borderRadius: "999px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "0.92rem"
            }}
          >
            Live AI Architect Chat →
          </a>
          {import.meta.env.VITE_WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Praveen, I just submitted a project scope on garudaos.in.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.5)",
                color: "#34d399",
                padding: "0.85rem 1.8rem",
                borderRadius: "999px",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.92rem"
              }}
            >
              💬 Fast-Track on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  const fieldStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    padding: "0.85rem 1rem",
    color: "#ffffff",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  };

  const labelStyle = {
    display: "block",
    color: "#d1d5db",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "0.4rem",
    textAlign: "left"
  };

  return (
    <div
      id="project-scope"
      style={{
        background: "linear-gradient(160deg, rgba(212,175,55,0.06) 0%, rgba(11,15,22,0.9) 100%)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: "20px",
        padding: "clamp(2rem, 5vw, 3rem)",
        maxWidth: 720,
        margin: "0 auto",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span style={{ display: "inline-block", background: "rgba(212,175,55,0.12)", color: "#d4af37", padding: "0.25rem 0.8rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Deterministic Scoping
        </span>
        <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 800, color: "#ffffff", margin: "0 0 0.6rem" }}>
          {title}
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "0.98rem", lineHeight: 1.6, maxWidth: 580, margin: "0 auto" }}>
          {subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} onFocus={handleFocus} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
          <div>
            <label style={labelStyle}>Your Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma / Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Work Email or WhatsApp Phone *</label>
            <input
              type="text"
              required
              placeholder="name@company.com or +91 98765 43210"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
          <div>
            <label style={labelStyle}>Service Required</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              {SERVICES_OPTIONS.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "#111827", color: "#fff" }}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Target Investment Tier</label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              {BUDGET_OPTIONS.map((b) => (
                <option key={b} value={b} style={{ background: "#111827", color: "#fff" }}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Project Requirements & Deliverables Brief *</label>
          <textarea
            required
            rows={4}
            placeholder="Describe what system you need built, existing tools/APIs to connect with, and your target timeline..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            style={{ ...fieldStyle, resize: "vertical", minHeight: "100px" }}
          />
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.88rem", textAlign: "left" }}>
            ✕ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
            color: "#05070a",
            border: "none",
            padding: "1rem 2rem",
            borderRadius: "10px",
            fontWeight: 800,
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 8px 24px rgba(245,215,110,0.25)",
            marginTop: "0.5rem"
          }}
        >
          {loading ? "Processing Architecture Scope…" : "◈ Submit for Fixed-Price Project Scope →"}
        </button>

        <p style={{ color: "#6b7280", fontSize: "0.8rem", textAlign: "center", margin: 0 }}>
          🔒 Governed by GARUDA 100% Truth Law. No spam, no obligation. 50% advance kickoff milestone terms.
        </p>
      </form>
    </div>
  );
}
