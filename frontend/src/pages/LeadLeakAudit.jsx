import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { PALETTE } from "../theme/palette";
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
    <div style={{ minHeight: "100vh", background: PALETTE.canvas, color: PALETTE.text, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <SEOHead
        title="Free Website Lead-Leak & Speed Scanner | Forensic Conversion Audit | GARUDA OS"
        description="Audit your website for after-hours lead drops, slow mobile latency, and conversion hemorrhages. Free instant forensic diagnostic report with 48-hour fix by GARUDA OS."
        canonical="https://www.garudaos.in/audit"
        schema={auditSchema}
      />

      {/* Top Fixed Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247, 244, 238, 0.94)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${PALETTE.border}`, padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
              GARUDA <span style={{ color: PALETTE.goldDeep }}>AUDIT</span>
            </span>
            <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: "9999px", background: PALETTE.goldHalo, color: PALETTE.goldDeep, border: `1px solid ${PALETTE.borderGold}`, fontWeight: 700 }}>
              FORENSIC v2.0
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/solutions" style={{ fontSize: "0.85rem", color: PALETTE.muted, textDecoration: "none", fontWeight: 600 }}>
              Problem Directory
            </Link>
            <Link to="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 0.95rem", borderRadius: "8px", background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.text, textDecoration: "none", fontWeight: 600, boxShadow: PALETTE.shadowSm }}>
              Talk to Architect
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "9999px", background: PALETTE.redBg, border: "1px solid rgba(220, 38, 38, 0.22)", color: PALETTE.red, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: PALETTE.red }} />
            Zero-Bullshit Diagnostic Engine
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.03em", margin: "0 0 1.25rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Find Exactly Where Your Website Is Hemorrhaging Leads
          </h1>

          <p style={{ maxWidth: 680, margin: "0 auto 2.25rem", color: PALETTE.muted, fontSize: "1.05rem", lineHeight: 1.6 }}>
            Most businesses lose <strong style={{ color: PALETTE.red }}>60% to 75%</strong> of their prospective clients after 7:00 PM due to static contact forms, slow mobile loading, and zero 24/7 conversational response. Enter your URL to run a forensic audit.
          </p>

          {/* Audit Input Form */}
          <div style={{ maxWidth: 650, margin: "0 auto", position: "relative" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAudit();
              }}
              style={{ display: "flex", gap: "0.5rem", background: PALETTE.card, border: `1px solid ${PALETTE.borderGold}`, borderRadius: "12px", padding: "0.45rem", boxShadow: PALETTE.shadowMd }}
            >
              <input
                type="text"
                placeholder="Enter website (e.g. yourcompany.com)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={loading}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: PALETTE.text, fontSize: "1rem", padding: "0.75rem 1rem", fontFamily: "inherit" }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ background: PALETTE.goldGradient, color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "0.85rem 1.6rem", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: PALETTE.shadowGold, transition: "opacity 0.2s", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {loading ? "Scanning..." : "Scan Website →"}
              </button>
            </form>

            {/* Quick Sample Links */}
            <div style={{ marginTop: "0.95rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem", color: PALETTE.muted }}>
              <span>Or test live sample:</span>
              <button
                type="button"
                onClick={() => {
                  setUrlInput("dentistryonmain.ca");
                  runAudit("dentistryonmain.ca");
                }}
                style={{ background: "none", border: "none", color: PALETTE.goldDeep, cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit", fontWeight: 600 }}
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
                style={{ background: "none", border: "none", color: PALETTE.goldDeep, cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit", fontWeight: 600 }}
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
                style={{ background: "none", border: "none", color: PALETTE.goldDeep, cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit", fontWeight: 600 }}
              >
                Agency
              </button>
            </div>

            {errorMsg && (
              <div style={{ marginTop: "1rem", padding: "0.85rem", borderRadius: "8px", background: PALETTE.redBg, border: "1px solid rgba(220, 38, 38, 0.25)", color: PALETTE.red, fontSize: "0.88rem", fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Loading Radar */}
        {loading && (
          <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.borderGold}`, borderRadius: "16px", padding: "2.5rem 1.5rem", textAlign: "center", maxWidth: 650, margin: "2rem auto", boxShadow: PALETTE.shadowMd }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${PALETTE.goldHalo}`, borderTopColor: PALETTE.goldPrimary, margin: "0 auto 1.5rem", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>Running Forensic Audit</h3>
            <p style={{ color: PALETTE.goldDeep, fontSize: "0.92rem", margin: 0, fontFamily: "monospace", fontWeight: 600 }}>
              {steps[scanStep]}
            </p>
          </div>
        )}

        {/* Audit Results View */}
        {auditResult && !loading && (
          <div style={{ marginTop: "2rem", animation: "fadeIn 0.3s ease-out" }}>
            {/* Header Summary Banner */}
            <div style={{ background: PALETTE.card, border: `1px solid ${auditResult.scores?.grade === "A" ? "rgba(5, 150, 105, 0.35)" : (auditResult.scores?.grade === "B" ? "rgba(196, 139, 40, 0.35)" : "rgba(220, 38, 38, 0.35)")}`, borderRadius: "16px", padding: "2rem", marginBottom: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", boxShadow: PALETTE.shadowLg }}>
              <div>
                <div style={{ fontSize: "0.78rem", color: PALETTE.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem", fontWeight: 600 }}>
                  Diagnostic Report For
                </div>
                <h2 style={{ fontSize: "1.7rem", fontWeight: 800, margin: "0 0 0.35rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {auditResult.target?.domain}
                </h2>
                <div style={{ fontSize: "0.85rem", color: PALETTE.muted }}>
                  Scanned on {new Date(auditResult.target?.scannedAt).toLocaleTimeString()} • Latency: {auditResult.metrics?.latencyMs}ms
                </div>
              </div>

              {/* Health Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                    Conversion Health
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: auditResult.scores?.overall >= 75 ? PALETTE.green : (auditResult.scores?.overall >= 60 ? PALETTE.amber : PALETTE.red) }}>
                    {auditResult.hemorrhageAnalysis?.riskLevel} RISK
                  </div>
                </div>

                <div style={{ width: 72, height: 72, borderRadius: "14px", display: "grid", placeItems: "center", fontSize: "2.1rem", fontWeight: 900, fontFamily: "'Playfair Display', Georgia, serif", background: auditResult.scores?.overall >= 75 ? PALETTE.greenBg : (auditResult.scores?.overall >= 60 ? PALETTE.amberBg : PALETTE.redBg), border: `2px solid ${auditResult.scores?.overall >= 75 ? PALETTE.green : (auditResult.scores?.overall >= 60 ? PALETTE.amber : PALETTE.red)}`, color: auditResult.scores?.overall >= 75 ? PALETTE.green : (auditResult.scores?.overall >= 60 ? PALETTE.amber : PALETTE.red) }}>
                  {auditResult.scores?.grade}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "12px", padding: "1.35rem", boxShadow: PALETTE.shadowSm }}>
                <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", marginBottom: "0.35rem", fontWeight: 600 }}>
                  After-Hours Capture
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: auditResult.metrics?.hasWhatsApp || auditResult.metrics?.hasLiveChat ? PALETTE.green : PALETTE.red, margin: "0 0 0.35rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {auditResult.metrics?.hasWhatsApp || auditResult.metrics?.hasLiveChat ? "Active" : "HEMORRHAGING"}
                </div>
                <div style={{ fontSize: "0.82rem", color: PALETTE.muted }}>
                  {auditResult.metrics?.hasWhatsApp ? "Instant WhatsApp active" : "Zero 24/7 conversational capture"}
                </div>
              </div>

              <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "12px", padding: "1.35rem", boxShadow: PALETTE.shadowSm }}>
                <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", marginBottom: "0.35rem", fontWeight: 600 }}>
                  Edge Latency & TTFB
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: auditResult.metrics?.latencyMs < 900 ? PALETTE.green : (auditResult.metrics?.latencyMs < 1600 ? PALETTE.amber : PALETTE.red), margin: "0 0 0.35rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {auditResult.metrics?.latencyMs}ms
                </div>
                <div style={{ fontSize: "0.82rem", color: PALETTE.muted }}>
                  {auditResult.metrics?.latencyMs < 900 ? "Sub-second speed" : "Mobile bounce risk"}
                </div>
              </div>

              <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "12px", padding: "1.35rem", boxShadow: PALETTE.shadowSm }}>
                <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", marginBottom: "0.35rem", fontWeight: 600 }}>
                  Estimated Traffic Loss
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: PALETTE.red, margin: "0 0 0.35rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {auditResult.hemorrhageAnalysis?.estimatedDropRate}
                </div>
                <div style={{ fontSize: "0.82rem", color: PALETTE.muted }}>
                  After-hours traffic drop rate
                </div>
              </div>

              <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "12px", padding: "1.35rem", boxShadow: PALETTE.shadowSm }}>
                <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", marginBottom: "0.35rem", fontWeight: 600 }}>
                  Google AI Overview (AEO)
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: auditResult.metrics?.hasSchema ? PALETTE.green : PALETTE.amber, margin: "0 0 0.35rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {auditResult.metrics?.hasSchema ? "Structured" : "Unindexed"}
                </div>
                <div style={{ fontSize: "0.82rem", color: PALETTE.muted }}>
                  {auditResult.metrics?.hasSchema ? "Schema.org detected" : "Missing JSON-LD Schema"}
                </div>
              </div>
            </div>

            {/* Forensic Vulnerabilities List */}
            {auditResult.vulnerabilities?.length > 0 && (
              <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "16px", padding: "2rem", marginBottom: "2rem", boxShadow: PALETTE.shadowMd }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 1.25rem", color: PALETTE.text, display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  <span style={{ color: PALETTE.red }}>⚠</span> Identified Forensic Hemorrhages
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {auditResult.vulnerabilities.map((v, i) => (
                    <div key={i} style={{ background: PALETTE.canvasIvory, border: `1px solid ${PALETTE.borderSubtle}`, borderRadius: "10px", padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                        <span style={{ fontSize: "0.98rem", fontWeight: 700, color: PALETTE.text }}>
                          {v.title}
                        </span>
                        <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.55rem", borderRadius: "4px", background: v.severity === "CRITICAL" ? PALETTE.redBg : PALETTE.amberBg, color: v.severity === "CRITICAL" ? PALETTE.red : PALETTE.amber, fontWeight: 700 }}>
                          {v.severity}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: PALETTE.muted, lineHeight: 1.55 }}>
                        {v.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GARUDA 48-Hour Resolution Card */}
            <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.borderGold}`, borderRadius: "16px", padding: "2.25rem", textAlign: "left", boxShadow: PALETTE.shadowLg }}>
              <div style={{ display: "inline-block", fontSize: "0.75rem", padding: "0.3rem 0.85rem", borderRadius: "9999px", background: PALETTE.goldHalo, color: PALETTE.goldDeep, border: `1px solid ${PALETTE.borderGold}`, fontWeight: 700, marginBottom: "0.85rem" }}>
                GUARANTEED RESOLUTION
              </div>

              <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.5rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {auditResult.prescription?.title}
              </h3>

              <p style={{ color: PALETTE.muted, fontSize: "0.95rem", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Eliminate these bottlenecks permanently with zero tech debt. GARUDA engineers deliver verified, production-ready code in 48 hours.
              </p>

              <ul style={{ margin: "0 0 1.75rem", paddingLeft: "1.25rem", color: PALETTE.textBody, fontSize: "0.92rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
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
                  style={{ background: PALETTE.goldGradient, color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "0.9rem 1.8rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: PALETTE.shadowGold, transition: "opacity 0.2s" }}
                >
                  Deploy 48-Hour Resolution With GARUDA →
                </button>

                <a
                  href={`mailto:praveen@garudaos.in?subject=Audit Inquiry for ${encodeURIComponent(auditResult.target?.domain || "")}&body=Hello Praveen, I ran an audit on ${encodeURIComponent(auditResult.target?.url || "")} and would like to fix our conversion leaks.`}
                  style={{ color: PALETTE.goldDeep, fontSize: "0.88rem", textDecoration: "underline", marginLeft: "0.5rem", fontWeight: 600 }}
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
