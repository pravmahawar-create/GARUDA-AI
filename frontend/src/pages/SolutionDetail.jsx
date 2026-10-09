import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { SOLUTIONS_DATA } from "../config/solutionsData";
import { PALETTE } from "../theme/palette";
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
    <div style={{ minHeight: "100vh", background: PALETTE.canvas, color: PALETTE.text, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <SEOHead
        title={solution.seoTitle}
        description={solution.seoDescription}
        canonical={`https://www.garudaos.in/solutions/${solution.slug}`}
        schema={solutionSchema}
      />

      {/* Top Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247, 244, 238, 0.94)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${PALETTE.border}`, padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/solutions" style={{ color: PALETTE.muted, textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}>
              ← Solutions Directory
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/audit" style={{ fontSize: "0.85rem", padding: "0.45rem 0.95rem", borderRadius: "8px", background: PALETTE.redBg, border: "1px solid rgba(220, 38, 38, 0.25)", color: PALETTE.red, textDecoration: "none", fontWeight: 700 }}>
              ⚡ Free Audit
            </Link>
            <Link to="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 0.95rem", borderRadius: "8px", background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.text, textDecoration: "none", fontWeight: 600, boxShadow: PALETTE.shadowSm }}>
              Talk to Architect
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "0.82rem", color: PALETTE.muted, marginBottom: "1.5rem" }}>
          <Link to="/" style={{ color: PALETTE.muted, textDecoration: "none" }}>Home</Link> /{" "}
          <Link to="/solutions" style={{ color: PALETTE.muted, textDecoration: "none" }}>Solutions</Link> /{" "}
          <span style={{ color: PALETTE.goldDeep, fontWeight: 600 }}>{solution.category}</span>
        </div>

        {/* Urgency Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.95rem", borderRadius: "9999px", background: PALETTE.redBg, border: "1px solid rgba(220, 38, 38, 0.22)", color: PALETTE.red, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
          {solution.urgencyLevel}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 2.75rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em", margin: "0 0 1.25rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
          {solution.title}
        </h1>

        <p style={{ color: PALETTE.muted, fontSize: "1.1rem", lineHeight: 1.65, margin: "0 0 2rem" }}>
          {solution.symptom}
        </p>

        {/* Stat Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "14px", padding: "1.75rem", marginBottom: "3rem", boxShadow: PALETTE.shadowMd }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem", fontWeight: 600 }}>
              Estimated Revenue Loss
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: PALETTE.red, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {solution.stats.lossRate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem", fontWeight: 600 }}>
              Hemorrhage Window
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {solution.stats.timeframe}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: PALETTE.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem", fontWeight: 600 }}>
              GARUDA Turnaround
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: PALETTE.goldDeep, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {solution.stats.resolutionTime} Flat
            </div>
          </div>
        </div>

        {/* Root Cause Forensic Section */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
            The Forensic Root Cause
          </h2>
          <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "12px", padding: "1.5rem", color: PALETTE.textBody, lineHeight: 1.7, fontSize: "1rem", boxShadow: PALETTE.shadowSm }}>
            {solution.rootCause}
          </div>
        </section>

        {/* The GARUDA Solution Blueprint */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
            The GARUDA 48-Hour Engineering Blueprint
          </h2>
          <p style={{ color: PALETTE.muted, fontSize: "1.02rem", lineHeight: 1.65, margin: "0 0 1.5rem" }}>
            {solution.garudaSolution}
          </p>

          <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.borderGold}`, borderRadius: "14px", padding: "1.75rem", boxShadow: PALETTE.shadowMd }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: PALETTE.goldDeep, margin: "0 0 1.25rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
              What We Deploy in 48 Hours Flat:
            </h3>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem", color: PALETTE.textBody, fontSize: "0.95rem" }}>
              {solution.deliverables.map((item, idx) => (
                <li key={idx} style={{ lineHeight: 1.55 }}>
                  <strong style={{ color: PALETTE.text }}>{item}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Free Audit Interstitial */}
        <div style={{ background: PALETTE.card, border: "1px solid rgba(220, 38, 38, 0.22)", borderRadius: "14px", padding: "1.5rem 1.75rem", marginBottom: "3rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", boxShadow: PALETTE.shadowSm }}>
          <div>
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.15rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
              Want to see if your site is currently bleeding leads?
            </h4>
            <p style={{ margin: 0, fontSize: "0.88rem", color: PALETTE.muted }}>
              Run our free Lead-Leak & Speed Scanner in 5 seconds.
            </p>
          </div>
          <Link
            to="/audit"
            style={{ background: PALETTE.red, color: "#FFFFFF", padding: "0.65rem 1.35rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)" }}
          >
            Run Free Audit →
          </Link>
        </div>

        {/* FAQs */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1.5rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {solution.faqs.map((faq, i) => (
              <div
                key={i}
                style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "10px", overflow: "hidden", boxShadow: PALETTE.shadowSm }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "1.25rem", color: PALETTE.text, fontSize: "1rem", fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", font: "inherit" }}
                >
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem" }}>{faq.q}</span>
                  <span style={{ color: PALETTE.goldDeep, fontSize: "1.25rem", fontWeight: 700, marginLeft: "1rem" }}>
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 1.25rem 1.25rem", color: PALETTE.muted, fontSize: "0.95rem", lineHeight: 1.6, borderTop: `1px solid ${PALETTE.borderSubtle}`, paddingTop: "0.75rem" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Direct 1-Step Contact & Action Box */}
        <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.borderGold}`, borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center", boxShadow: PALETTE.shadowLg }}>
          <div style={{ display: "inline-block", fontSize: "0.75rem", padding: "0.3rem 0.85rem", borderRadius: "999px", background: PALETTE.goldHalo, color: PALETTE.goldDeep, border: `1px solid ${PALETTE.borderGold}`, fontWeight: 700, marginBottom: "0.85rem" }}>
            ZERO-FRICTION 48-HOUR SPRINT
          </div>

          <h3 style={{ fontSize: "1.65rem", fontWeight: 800, margin: "0 0 0.5rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Ready to Fix This in 48 Hours?
          </h3>
          <p style={{ maxWidth: 550, margin: "0 auto 1.5rem", color: PALETTE.muted, fontSize: "0.95rem", lineHeight: 1.6 }}>
            No complicated questionnaires or phone tag. Leave your contact below or start an instant scoping chat with a Lead Systems Architect.
          </p>

          {/* 1-Step Direct Form */}
          {submitted ? (
            <div style={{ background: PALETTE.greenBg, border: "1px solid rgba(5, 150, 105, 0.3)", borderRadius: "10px", padding: "1.25rem", color: PALETTE.green, maxWidth: 500, margin: "0 auto 1.5rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>✔ Inquiry Received!</div>
              <div style={{ fontSize: "0.85rem", color: PALETTE.muted }}>Founder Praveen & Engineering Lead have been alerted. We will reach out within 30 minutes.</div>
            </div>
          ) : (
            <form onSubmit={handleQuickSubmit} style={{ maxWidth: 520, margin: "0 auto 1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Your Email, WhatsApp, or Phone Number *"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                required
                style={{ background: PALETTE.canvasIvory, border: `1px solid ${PALETTE.border}`, borderRadius: "8px", padding: "0.85rem 1rem", color: PALETTE.text, fontSize: "0.95rem", outline: "none", boxShadow: PALETTE.shadowSm }}
              />
              <input
                type="text"
                placeholder="Website URL or brief description of the issue (optional)"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                style={{ background: PALETTE.canvasIvory, border: `1px solid ${PALETTE.border}`, borderRadius: "8px", padding: "0.85rem 1rem", color: PALETTE.text, fontSize: "0.95rem", outline: "none", boxShadow: PALETTE.shadowSm }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{ background: PALETTE.goldGradient, color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "0.9rem 1.5rem", fontSize: "1rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: PALETTE.shadowGold, transition: "opacity 0.2s" }}
              >
                {submitting ? "Transmitting..." : "Get 48-Hour Resolution Plan →"}
              </button>
            </form>
          )}

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "1rem", alignItems: "center", fontSize: "0.9rem" }}>
            <button
              type="button"
              onClick={() => navigate(`/chat?ref=SOL_${solution.slug}`)}
              style={{ background: PALETTE.canvasSubtle, border: `1px solid ${PALETTE.border}`, color: PALETTE.text, borderRadius: "8px", padding: "0.65rem 1.25rem", cursor: "pointer", fontWeight: 600, boxShadow: PALETTE.shadowSm }}
            >
              💬 Or Talk to AI Scoping Architect
            </button>

            <a
              href={`mailto:praveen@garudaos.in?subject=Priority Resolution: ${encodeURIComponent(solution.title)}&body=Hello Praveen, we need the 48-hour fix for ${encodeURIComponent(solution.title)}.`}
              style={{ color: PALETTE.goldDeep, textDecoration: "underline", fontWeight: 600 }}
            >
              ✉ praveen@garudaos.in
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
