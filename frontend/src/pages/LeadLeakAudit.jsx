import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { trackEvent } from "../utils/telemetry";

export default function LeadLeakAudit() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [auditResult, setAuditResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const steps = [
    "Pinging edge servers & measuring TTFB latency...",
    "Inspecting mobile viewport & render performance...",
    "Scanning after-hours lead capture (WhatsApp / AI Receptionist)...",
    "Auditing Schema.org & Google AI Overview readiness...",
    "Synthesizing forensic diagnostic report..."
  ];

  const runAudit = async (urlToScan) => {
    const target = (urlToScan || urlInput).trim();
    if (!target) {
      setErrorMsg("Please enter a valid website URL (e.g. company.com)");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setAuditResult(null);
    setScanStep(0);

    // Step animation interval
    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      trackEvent("audit_run_initiated", { url: target });
      const res = await fetch("/api/site-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target })
      });

      const data = await res.json();
      clearInterval(stepInterval);
      setScanStep(steps.length - 1);

      if (data.success) {
        setAuditResult(data);
        trackEvent("audit_completed_success", { domain: data.target?.domain, grade: data.scores?.grade });
      } else {
        setErrorMsg(data.message || "Unable to complete audit. Please verify the URL.");
      }
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg("Network error running audit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const auditSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GARUDA Sovereign Lead-Leak & Speed Scanner",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Free forensic website audit tool that identifies after-hours lead loss, mobile latency bottlenecks, and conversion leaks with 48-hour resolution blueprints."
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f3f4f6", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <SEOHead
        title="Free Website Lead-Leak & Speed Scanner | Forensic Conversion Audit | GARUDA OS"
        description="Audit your website for after-hours lead drops, slow mobile latency, and conversion hemorrhages. Free instant forensic diagnostic report with 48-hour fix by GARUDA OS."
        canonical="https://www.garudaos.in/audit"
        schema={auditSchema}
      />

      {/* Top Fixed Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>
              GARUDA <span style={{ color: "#38bdf8" }}>AUDIT</span>
            </span>
            <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: 600 }}>
              FORENSIC v2.0
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/solutions" style={{ fontSize: "0.85rem", color: "#9ca3af", textDecoration: "none", transition: "color 0.2s" }}>
              Problem Directory
            </Link>
            <Link to="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", textDecoration: "none", fontWeight: 500 }}>
              Talk to Architect
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.85rem", borderRadius: "9999px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#f87171", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
            Zero-Bullshit Diagnostic Engine
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 1rem", background: "linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Find Exactly Where Your Website Is Hemorrhaging Leads
          </h1>

          <p style={{ maxWidth: 680, margin: "0 auto 2.25rem", color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Most businesses lose <strong style={{ color: "#f87171" }}>60% to 75%</strong> of their prospective clients after 7:00 PM due to static contact forms, slow mobile loading, and zero 24/7 conversational response. Enter your URL to run a forensic audit.
          </p>

          {/* Audit Input Form */}
          <div style={{ maxWidth: 650, margin: "0 auto", position: "relative" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAudit();
              }}
              style={{ display: "flex", gap: "0.5rem", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "12px", padding: "0.4rem", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.15)" }}
            >
              <input
                type="text"
                placeholder="Enter website (e.g. yourcompany.com)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={loading}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "1rem", padding: "0.75rem 1rem", fontFamily: "inherit" }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem 1.5rem", fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {loading ? "Scanning..." : "Scan Website →"}
              </button>
            </form>

            {/* Quick Sample Links */}
            <div style={{ marginTop: "0.85rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>
              <span>Or test live sample:</span>
              <button
                type="button"
                onClick={() => {
                  setUrlInput("dentistryonmain.ca");
                  runAudit("dentistryonmain.ca");
                }}
                style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}
              >
                Dental Clinic
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setUrlInput("apexlawgroup.com");
                  runAudit("apexlawgroup.com");
                }}
                style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}
              >
                Law Firm
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setUrlInput("velocitydigital.co.uk");
                  runAudit("velocitydigital.co.uk");
                }}
                style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}
              >
                Agency
              </button>
            </div>

            {errorMsg && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "0.85rem" }}>
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Loading Radar */}
        {loading && (
          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "16px", padding: "2.5rem 1.5rem", textAlign: "center", maxWidth: 650, margin: "2rem auto" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(56, 189, 248, 0.2)", borderTopColor: "#38bdf8", margin: "0 auto 1.5rem", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem", color: "#f3f4f6" }}>Running Forensic Audit</h3>
            <p style={{ color: "#38bdf8", fontSize: "0.9rem", margin: 0, fontFamily: "monospace" }}>
              {steps[scanStep]}
            </p>
          </div>
        )}

        {/* Audit Results View */}
        {auditResult && !loading && (
          <div style={{ marginTop: "2rem", animation: "fadeIn 0.3s ease-out" }}>
            {/* Header Summary Banner */}
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: `1px solid ${auditResult.scores?.grade === "A" ? "rgba(34, 197, 94, 0.4)" : (auditResult.scores?.grade === "B" ? "rgba(56, 189, 248, 0.4)" : "rgba(239, 68, 68, 0.4)")}`, borderRadius: "16px", padding: "2rem", marginBottom: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  Diagnostic Report For
                </div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0 0 0.35rem", color: "#fff" }}>
                  {auditResult.target?.domain}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Scanned on {new Date(auditResult.target?.scannedAt).toLocaleTimeString()} • Latency: {auditResult.metrics?.latencyMs}ms
                </div>
              </div>

              {/* Health Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Conversion Health
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: auditResult.scores?.overall >= 75 ? "#4ade80" : (auditResult.scores?.overall >= 60 ? "#fbbf24" : "#f87171") }}>
                    {auditResult.hemorrhageAnalysis?.riskLevel} RISK
                  </div>
                </div>

                <div style={{ width: 72, height: 72, borderRadius: "14px", display: "grid", placeItems: "center", fontSize: "2rem", fontWeight: 900, background: auditResult.scores?.overall >= 75 ? "rgba(34, 197, 94, 0.15)" : (auditResult.scores?.overall >= 60 ? "rgba(251, 191, 36, 0.15)" : "rgba(239, 68, 68, 0.15)"), border: `2px solid ${auditResult.scores?.overall >= 75 ? "#22c55e" : (auditResult.scores?.overall >= 60 ? "#f59e0b" : "#ef4444")}`, color: auditResult.scores?.overall >= 75 ? "#4ade80" : (auditResult.scores?.overall >= 60 ? "#fbbf24" : "#f87171") }}>
                  {auditResult.scores?.grade}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  After-Hours Capture
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: auditResult.metrics?.hasWhatsApp || auditResult.metrics?.hasLiveChat ? "#4ade80" : "#f87171", margin: "0 0 0.35rem" }}>
                  {auditResult.metrics?.hasWhatsApp || auditResult.metrics?.hasLiveChat ? "Active" : "HEMORRHAGING"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {auditResult.metrics?.hasWhatsApp ? "Instant WhatsApp active" : "Zero 24/7 conversational capture"}
                </div>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Edge Latency & TTFB
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: auditResult.metrics?.latencyMs < 900 ? "#4ade80" : (auditResult.metrics?.latencyMs < 1600 ? "#fbbf24" : "#f87171"), margin: "0 0 0.35rem" }}>
                  {auditResult.metrics?.latencyMs}ms
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {auditResult.metrics?.latencyMs < 900 ? "Sub-second speed" : "Mobile bounce risk"}
                </div>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Estimated Traffic Loss
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f87171", margin: "0 0 0.35rem" }}>
                  {auditResult.hemorrhageAnalysis?.estimatedDropRate}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  After-hours traffic drop rate
                </div>
              </div>

              <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Google AI Overview (AEO)
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: auditResult.metrics?.hasSchema ? "#4ade80" : "#fbbf24", margin: "0 0 0.35rem" }}>
                  {auditResult.metrics?.hasSchema ? "Structured" : "Unindexed"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {auditResult.metrics?.hasSchema ? "Schema.org detected" : "Missing JSON-LD Schema"}
                </div>
              </div>
            </div>

            {/* Forensic Vulnerabilities List */}
            {auditResult.vulnerabilities?.length > 0 && (
              <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "1.75rem", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#ef4444" }}>⚠</span> Identified Forensic Hemorrhages
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {auditResult.vulnerabilities.map((v, i) => (
                    <div key={i} style={{ background: "rgba(2, 6, 23, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "10px", padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f3f4f6" }}>
                          {v.title}
                        </span>
                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: v.severity === "CRITICAL" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)", color: v.severity === "CRITICAL" ? "#fca5a5" : "#fcd34d", fontWeight: 700 }}>
                          {v.severity}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
                        {v.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GARUDA 48-Hour Resolution Card */}
            <div style={{ background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(37, 99, 235, 0.12) 100%)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "16px", padding: "2rem", textAlign: "left" }}>
              <div style={{ display: "inline-block", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontWeight: 700, marginBottom: "0.75rem" }}>
                GUARANTEED RESOLUTION
              </div>

              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#fff" }}>
                {auditResult.prescription?.title}
              </h3>

              <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 1.25rem" }}>
                Eliminate these bottlenecks permanently with zero tech debt. GARUDA engineers deliver verified, production-ready code in 48 hours.
              </p>

              <ul style={{ margin: "0 0 1.75rem", paddingLeft: "1.25rem", color: "#cbd5e1", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {auditResult.prescription?.blueprint?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/chat?ref=AUDIT_${encodeURIComponent(auditResult.target?.domain || "DIRECT")}`);
                  }}
                  style={{ background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)", color: "#fff", border: "none", borderRadius: "8px", padding: "0.85rem 1.75rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 25px rgba(2, 132, 199, 0.3)" }}
                >
                  Deploy 48-Hour Resolution With GARUDA →
                </button>

                <a
                  href={`mailto:praveen@garudaos.in?subject=Audit Inquiry for ${encodeURIComponent(auditResult.target?.domain || "")}&body=Hello Praveen, I ran an audit on ${encodeURIComponent(auditResult.target?.url || "")} and would like to fix our conversion leaks.`}
                  style={{ color: "#94a3b8", fontSize: "0.85rem", textDecoration: "underline", marginLeft: "0.5rem" }}
                >
                  Or email directly (praveen@garudaos.in)
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
