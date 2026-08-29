import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import ProjectScopeForm from "../components/ProjectScopeForm";
import WhatsAppQuickCTA from "../components/WhatsAppQuickCTA";
import { GUIDES_DATA } from "../config/guidesData";
import { trackEvent } from "../utils/telemetry";

export default function GuideArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeHeading, setActiveHeading] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const guide = GUIDES_DATA[slug] || GUIDES_DATA["ai-agent-vs-chatbot"];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [guide]);

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `https://www.garudaos.in/guides/${guide.slug}#article`,
        "headline": guide.title,
        "description": guide.seoDescription,
        "datePublished": guide.publishedAt,
        "dateModified": guide.publishedAt,
        "author": {
          "@type": "Organization",
          "name": "GARUDA AI Engineering Architecture",
          "url": "https://www.garudaos.in"
        },
        "publisher": {
          "@type": "Organization",
          "name": "GARUDA AI",
          "url": "https://www.garudaos.in",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.garudaos.in/favicon-512x512.png"
          }
        },
        "mainEntityOfPage": `https://www.garudaos.in/guides/${guide.slug}`,
        "articleSection": guide.category
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.garudaos.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Engineering Guides",
            "item": "https://www.garudaos.in/guides"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": guide.title,
            "item": `https://www.garudaos.in/guides/${guide.slug}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `https://www.garudaos.in/guides/${guide.slug}#faq`,
        "mainEntity": (guide.faqs || []).map((faq) => ({
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
    <div style={{ background: "#05070b", color: "#f7f2dc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <SEOHead
        title={guide.seoTitle}
        description={guide.seoDescription}
        canonical={`https://www.garudaos.in/guides/${guide.slug}`}
        ogType="article"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Navigation Bar */}
      <header style={{ borderBottom: "1px solid rgba(245, 215, 110, 0.15)", background: "rgba(5, 7, 11, 0.95)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.9rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img src="/favicon-48x48.png" alt="GARUDA Logo" style={{ width: "32px", height: "32px", borderRadius: "6px" }} />
            <span style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.12em", color: "#fff" }}>GARUDA</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link to="/guides" style={{ color: "#f5d76e", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600 }}>All Guides</Link>
            <Link to="/#services" style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>Services</Link>
            <Link to="/what-is-garuda-ai" style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>Entity Architecture</Link>
            <Link to="/chat" style={{ padding: "0.45rem 1rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", color: "#000", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              Talk to Architect
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div style={{ background: "rgba(11, 15, 22, 0.6)", borderBottom: "1px solid rgba(245, 215, 110, 0.08)", padding: "0.6rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", fontSize: "0.8rem", color: "#8d95a7", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link to="/" style={{ color: "#8d95a7", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link to="/guides" style={{ color: "#8d95a7", textDecoration: "none" }}>Guides</Link>
          <span>/</span>
          <span style={{ color: "#f5d76e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guide.title}</span>
        </div>
      </div>

      {/* Hero Header */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>
        <div style={{ display: "inline-block", padding: "0.3rem 0.8rem", borderRadius: "20px", background: "rgba(245, 215, 110, 0.12)", border: "1px solid rgba(245, 215, 110, 0.3)", color: "#f5d76e", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
          {guide.category} • {guide.readingTime}
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 1.2rem", color: "#fff" }}>
          {guide.title}
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#cbd5e1", lineHeight: 1.6, maxWidth: "900px", margin: "0 0 1.5rem" }}>
          {guide.summary}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.85rem", color: "#8d95a7", borderTop: "1px solid rgba(245, 215, 110, 0.1)", paddingTop: "1rem" }}>
          <span>Author: <strong>GARUDA Engineering Team</strong></span>
          <span>Published: <strong>{guide.publishedAt}</strong></span>
          <span>Target Intent: <em style={{ color: "#f5d76e" }}>{guide.targetKeyword}</em></span>
        </div>
      </section>

      {/* Main Grid: Content + TOC Sidebar */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem 4rem", display: "grid", gridTemplateColumns: "1fr 300px", gap: "3rem", alignItems: "start" }}>
        
        {/* Main Article Body */}
        <article style={{ minWidth: 0 }}>
          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} style={{ marginBottom: "2.8rem" }}>
              <h2 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#f5d76e", borderBottom: "1px solid rgba(245, 215, 110, 0.2)", paddingBottom: "0.5rem", margin: "0 0 1rem" }}>
                {section.heading}
              </h2>
              <div style={{ color: "#cbd5e1", lineHeight: 1.75, fontSize: "1.02rem", whiteSpace: "pre-line" }}>
                {section.content}
              </div>
            </section>
          ))}

          {/* Contextual Service Callout Banner */}
          <div style={{ margin: "3rem 0", padding: "2rem", borderRadius: "14px", background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)", border: "1px solid rgba(245, 215, 110, 0.35)", position: "relative" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f5d76e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              COMMERCIAL IMPLEMENTATION
            </div>
            <h3 style={{ margin: "0 0 0.8rem", fontSize: "1.4rem", color: "#fff" }}>
              Need Production {guide.relatedServiceTitle}?
            </h3>
            <p style={{ margin: "0 0 1.2rem", color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5 }}>
              GARUDA engineers bespoke, milestone-governed solutions with 100% test verification and full intellectual property handover.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                to={`/services/${guide.relatedServiceSlug}`}
                style={{ padding: "0.65rem 1.4rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", color: "#000", borderRadius: "8px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700 }}
              >
                View {guide.relatedServiceTitle} Deliverables →
              </Link>
              <a
                href="#scope-form"
                style={{ padding: "0.65rem 1.4rem", background: "rgba(255,255,255,0.06)", color: "#f5d76e", border: "1px solid rgba(245, 215, 110, 0.3)", borderRadius: "8px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}
              >
                Get Fixed-Price Project Scope ↓
              </a>
            </div>
          </div>

          {/* Expandable FAQs */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section style={{ marginTop: "3rem" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f5d76e", marginBottom: "1.2rem" }}>
                Frequently Asked Architectural Questions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {guide.faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      style={{ borderRadius: "10px", border: "1px solid rgba(245, 215, 110, 0.18)", background: "rgba(11, 15, 22, 0.7)", overflow: "hidden" }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        style={{ width: "100%", padding: "1rem 1.2rem", background: "none", border: "none", color: "#f7f2dc", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", fontSize: "1rem", fontWeight: 600 }}
                      >
                        <span>{faq.q}</span>
                        <span style={{ color: "#f5d76e", fontSize: "1.2rem" }}>{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 1.2rem 1.2rem", color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.6, borderTop: "1px solid rgba(245, 215, 110, 0.08)" }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Embedded Project Scope Form */}
          <div id="scope-form" style={{ marginTop: "4rem" }}>
            <ProjectScopeForm defaultService={guide.relatedServiceSlug} />
          </div>
        </article>

        {/* Sidebar Table of Contents */}
        <aside style={{ position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ padding: "1.4rem", borderRadius: "12px", background: "rgba(11, 15, 22, 0.85)", border: "1px solid rgba(245, 215, 110, 0.16)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f5d76e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>
              TABLE OF CONTENTS
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {guide.tableOfContents.map((toc) => (
                <a
                  key={toc.id}
                  href={`#${toc.id}`}
                  style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.85rem", lineHeight: 1.4, transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f5d76e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  {toc.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Related Guides List */}
          <div style={{ padding: "1.4rem", borderRadius: "12px", background: "rgba(11, 15, 22, 0.85)", border: "1px solid rgba(245, 215, 110, 0.16)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f5d76e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>
              MORE ENGINEERING GUIDES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {Object.values(GUIDES_DATA)
                .filter((g) => g.slug !== guide.slug)
                .slice(0, 4)
                .map((g) => (
                  <Link
                    key={g.slug}
                    to={`/guides/${g.slug}`}
                    style={{ color: "#cbd5e1", textDecoration: "none", fontSize: "0.82rem", lineHeight: 1.35 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f5d76e")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                  >
                    • {g.title}
                  </Link>
                ))}
            </div>
          </div>
        </aside>

      </div>

      <WhatsAppQuickCTA topic={guide.relatedServiceSlug} />
    </div>
  );
}
