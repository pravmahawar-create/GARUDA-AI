import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

export default function ContentStudio() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("Enterprise AI Operating Systems & Autonomous Engineering");
  const [targetAudience, setTargetAudience] = useState("Founders, CXOs & Enterprise Leaders");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentOutput, setContentOutput] = useState(null);

  const handleGenerateContent = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setContentOutput({
        topic,
        targetAudience,
        weeks: [
          {
            week: 1,
            theme: "Authority & Paradigm Shift",
            posts: [
              { day: "Mon", format: "LinkedIn Thought Leadership", hook: "Why 90% of AI wrappers fail while AI Operating Systems compound.", cta: "Read the architectural breakdown." },
              { day: "Wed", format: "Shorts / Reels Script", hook: "The 3 critical flaws in traditional custom software agencies.", cta: "Follow for enterprise systems." },
              { day: "Fri", format: "Case Study Breakdown", hook: "How autonomous engineering replaces 10-person dev shops.", cta: "Explore GARUDA delivery." }
            ]
          },
          {
            week: 2,
            theme: "Proof & Operational Reality",
            posts: [
              { day: "Mon", format: "Technical Deep Dive", hook: "Inside the 27 Universes: Specialization without isolation.", cta: "See the architecture." },
              { day: "Wed", format: "Shorts / Reels Script", hook: "Stop building AI prototypes. Build production-grade backends.", cta: "DM for blueprint." },
              { day: "Fri", format: "Client Milestone Proof", hook: "Milestone-verified payments and SHA-256 deliverable seals.", cta: "View escrow workflow." }
            ]
          },
          {
            week: 3,
            theme: "Commercial Conversion & Urgency",
            posts: [
              { day: "Mon", format: "Direct Response Framework", hook: "Quarterly allocation for custom enterprise software is closing.", cta: "Book discovery session." },
              { day: "Wed", format: "Shorts / Reels Script", hook: "How to ship your full-stack SaaS MVP in 14 days.", cta: "Start interactive scoping." },
              { day: "Fri", format: "ROI & Impact Matrix", hook: "Real business automation: 80% reduction in manual intake time.", cta: "Claim priority slot." }
            ]
          },
          {
            week: 4,
            theme: "Quarterly Close & Retargeting",
            posts: [
              { day: "Mon", format: "Founder Letter", hook: "The next decade of autonomous software execution.", cta: "Join our partner network." },
              { day: "Wed", format: "Shorts / Reels Script", hook: "One command. Infinite intelligence. This is GARUDA.", cta: "Visit garudaos.in." },
              { day: "Fri", format: "Executive Summary", hook: "Month in review: 100% verified delivery across all active projects.", cta: "Request project proposal." }
            ]
          }
        ]
      });
      setIsGenerating(false);
    }, 700);
  };

  const handlePrintPdf = () => {
    if (!contentOutput) return;
    openPristineWhitePdf({
      title: `GARUDA Content Universe (U20) — 4-Week Editorial Calendar`,
      subtitle: `Topic: ${contentOutput.topic} | Audience: ${contentOutput.targetAudience}`,
      sections: contentOutput.weeks.map(w => ({
        heading: `WEEK ${w.week}: ${w.theme}`,
        content: w.posts.map(p => `• [${p.day} — ${p.format}]\nHook: ${p.hook}\nCTA: ${p.cta}\n`).join("\n")
      }))
    });
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title="Content Universe (U20) — GARUDA Content Factory"
        description="High-velocity editorial planning, social media calendars, and multi-platform content production of GARUDA OS."
        canonical="https://www.garudaos.in/content"
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}`, paddingBottom: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem", color: GOLD }}>✎</span>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", color: GOLD, fontWeight: "bold" }}>
                GARUDA UNIVERSE 20 · RING 3
              </span>
              <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                STUDIO EXECUTABLE
              </span>
            </div>
            <h1 style={{ fontSize: "1.8rem", margin: "0.3rem 0 0", color: "#fff" }}>
              Content Factory Studio
            </h1>
            <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              High-velocity editorial calendars, multi-angle copy hooks, and omnichannel repurposing engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => navigate("/founder/access")}
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,134,11,0.4))", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
            >
              👑 Access GARUDA Kingdom
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {/* Intake Controls */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", color: GOLD, fontSize: "1.1rem" }}>Content Strategy Parameters</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Core Topic / Campaign Angle</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={isGenerating}
              style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #d4af37, #b8860b)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold", fontSize: "0.95rem", cursor: "pointer" }}
            >
              {isGenerating ? "Synthesizing Calendar..." : "⚡ Generate 4-Week Editorial Calendar"}
            </button>
          </div>

          {/* Results View */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: GOLD, fontSize: "1.1rem" }}>Editorial Calendar Output</h3>
              {contentOutput && (
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{ background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📄 Print Calendar PDF
                </button>
              )}
            </div>

            {!contentOutput ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>📅</span>
                Click <strong>Generate 4-Week Editorial Calendar</strong> to synthesize multi-platform content schedules, copy hooks, and CTAs.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "480px", overflowY: "auto" }}>
                {contentOutput.weeks.map((w) => (
                  <div key={w.week} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.8rem" }}>
                    <div style={{ color: GOLD, fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
                      WEEK {w.week}: {w.theme}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {w.posts.map((p, idx) => (
                        <div key={idx} style={{ background: "rgba(255,255,255,0.02)", padding: "0.5rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                          <span style={{ color: "#38bdf8", fontWeight: "bold" }}>[{p.day} · {p.format}]</span> {p.hook}
                          <div style={{ color: "#75f4ab", fontSize: "0.75rem", marginTop: "0.2rem" }}>🎯 CTA: {p.cta}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
