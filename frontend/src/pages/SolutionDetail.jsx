import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { SOLUTIONS_DATA } from "../config/solutionsData";
import { trackEvent } from "../utils/telemetry";

export default function SolutionDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [contactInput, setContactInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const solution = SOLUTIONS_DATA[slug] || SOLUTIONS_DATA["website-losing-leads-after-hours"];

  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent("solution_page_view", {
      slug: solution.slug,
      title: solution.title,
      referrer: typeof document !== "undefined" ? document.referrer : ""
    });
  }, [slug]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!contactInput.trim()) return;

    setSubmitting(true);
    trackEvent("quick_inquiry_submitted", { slug: solution.slug, contact: contactInput });

    try {
      await fetch("/api/inbound/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: "Direct Web Visitor",
          email: contactInput.includes("@") ? contactInput : "web-lead@garudaos.in",
          phone: contactInput.replace(/[^0-9+]/g, ""),
          projectType: solution.category,
          timeline: "48 Hours",
          description: `[URGENT LEAD FROM ${solution.title}]: ${descInput || "Needs immediate 48-hour resolution."}`,
          source: `solution_${solution.slug}`
        })
      });
      setSubmitted(true);
    } catch (_) {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const solutionSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        "name": solution.title,
        "description": solution.seoDescription,
        "totalTime": "P2D",
        "step": solution.deliverables.map((item, idx) => ({
          "@type": "HowToStep",
          "position": idx + 1,
          "name": `Step ${idx + 1}: ${item}`,
          "text": item
        }))
      },
      {
        "@type": "FAQPage",
        "mainEntity": solution.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }
    ]
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f3f4f6", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <SEOHead
        title={solution.seoTitle}
        description={solution.seoDescription}
        canonical={`https://www.garudaos.in/solutions/${solution.slug}`}
        schema={solutionSchema}
      />

      {/* Top Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/solutions" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              ← Solutions Directory
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/audit" style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", textDecoration: "none", fontWeight: 600 }}>
              ⚡ Free Audit
            </Link>
            <Link to="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", textDecoration: "none", fontWeight: 500 }}>
              Talk to Architect
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1.5rem" }}>
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Home</Link> /{" "}
          <Link to="/solutions" style={{ color: "#64748b", textDecoration: "none" }}>Solutions</Link> /{" "}
          <span style={{ color: "#94a3b8" }}>{solution.category}</span>
        </div>

        {/* Urgency Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.85rem", borderRadius: "9999px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#f87171", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
          {solution.urgencyLevel}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 2.75rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em", margin: "0 0 1.25rem", color: "#fff" }}>
          {solution.title}
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: 1.6, margin: "0 0 2rem" }}>
          {solution.symptom}
        </p>

        {/* Stat Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "1.5rem", marginBottom: "3rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Estimated Revenue Loss
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f87171" }}>
              {solution.stats.lossRate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Hemorrhage Window
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f3f4f6" }}>
              {solution.stats.timeframe}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              GARUDA Turnaround
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#38bdf8" }}>
              {solution.stats.resolutionTime} Flat
            </div>
          </div>
        </div>

        {/* Root Cause Forensic Section */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1rem", color: "#fff" }}>
            The Forensic Root Cause
          </h2>
          <div style={{ background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "12px", padding: "1.5rem", color: "#cbd5e1", lineHeight: 1.7, fontSize: "1rem" }}>
            {solution.rootCause}
          </div>
        </section>

        {/* The GARUDA Solution Blueprint */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1rem", color: "#fff" }}>
            The GARUDA 48-Hour Engineering Blueprint
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            {solution.garudaSolution}
          </p>

          <div style={{ background: "rgba(2, 6, 23, 0.6)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: "14px", padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8", margin: "0 0 1.25rem" }}>
              What We Deploy in 48 Hours Flat:
            </h3>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", color: "#f3f4f6", fontSize: "0.95rem" }}>
              {solution.deliverables.map((item, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  <strong>{item}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Free Audit Interstitial */}
        <div style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "14px", padding: "1.5rem", marginBottom: "3rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", color: "#fff" }}>
              Want to see if your site is currently bleeding leads?
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
              Run our free Lead-Leak & Speed Scanner in 5 seconds.
            </p>
          </div>
          <Link
            to="/audit"
            style={{ background: "#ef4444", color: "#fff", padding: "0.6rem 1.25rem", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}
          >
            Run Free Audit →
          </Link>
        </div>

        {/* FAQs */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1.5rem", color: "#fff" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {solution.faqs.map((faq, i) => (
              <div
                key={i}
                style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "10px", overflow: "hidden" }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "1.25rem", color: "#fff", fontSize: "1rem", fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", font: "inherit" }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: "#38bdf8", fontSize: "1.25rem", fontWeight: 300, marginLeft: "1rem" }}>
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 1.25rem 1.25rem", color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: "0.75rem" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Direct 1-Step Contact & Action Box */}
        <div style={{ background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: "0.75rem", padding: "0.2rem 0.65rem", borderRadius: "999px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontWeight: 700, marginBottom: "0.75rem" }}>
            ZERO-FRICTION 48-HOUR SPRINT
          </div>

          <h3 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#fff" }}>
            Ready to Fix This in 48 Hours?
          </h3>
          <p style={{ maxWidth: 550, margin: "0 auto 1.5rem", color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
            No complicated questionnaires or phone tag. Leave your contact below or start an instant scoping chat with a Lead Systems Architect.
          </p>

          {/* 1-Step Direct Form */}
          {submitted ? (
            <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.4)", borderRadius: "10px", padding: "1.25rem", color: "#4ade80", maxWidth: 500, margin: "0 auto 1.5rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>✔ Inquiry Received!</div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Founder Praveen & Engineering Lead have been alerted. We will reach out within 30 minutes.</div>
            </div>
          ) : (
            <form onSubmit={handleQuickSubmit} style={{ maxWidth: 520, margin: "0 auto 1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Your Email, WhatsApp, or Phone Number *"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                required
                style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "0.8rem 1rem", color: "#fff", fontSize: "0.95rem", outline: "none" }}
              />
              <input
                type="text"
                placeholder="Website URL or brief description of the issue (optional)"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "0.8rem 1rem", color: "#fff", fontSize: "0.95rem", outline: "none" }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{ background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)", color: "#fff", border: "none", borderRadius: "8px", padding: "0.85rem 1.5rem", fontSize: "1rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 8px 20px rgba(2, 132, 199, 0.35)" }}
              >
                {submitting ? "Transmitting..." : "Get 48-Hour Resolution Plan →"}
              </button>
            </form>
          )}

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "1rem", alignItems: "center", fontSize: "0.9rem" }}>
            <button
              type="button"
              onClick={() => navigate(`/chat?ref=SOL_${solution.slug}`)}
              style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#fff", borderRadius: "8px", padding: "0.6rem 1.25rem", cursor: "pointer", fontWeight: 600 }}
            >
              💬 Or Talk to AI Scoping Architect
            </button>

            <a
              href={`mailto:praveen@garudaos.in?subject=Priority Resolution: ${encodeURIComponent(solution.title)}&body=Hello Praveen, we need the 48-hour fix for ${encodeURIComponent(solution.title)}.`}
              style={{ color: "#94a3b8", textDecoration: "underline" }}
            >
              ✉ praveen@garudaos.in
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
