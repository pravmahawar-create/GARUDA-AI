import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

export default function ContentStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  const [topic, setTopic] = useState("Enterprise AI Operating Systems & Autonomous Engineering");
  const [targetAudience, setTargetAudience] = useState("Founders, CXOs & Enterprise Leaders");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentOutput, setContentOutput] = useState(null);
  const [campaignContext, setCampaignContext] = useState(null);
  const [loadingCampaign, setLoadingCampaign] = useState(false);

  // Load campaign context if campaignId is present
  useEffect(() => {
    if (!campaignId) return;
    setLoadingCampaign(true);
    fetch(`/api/growth/campaign/${campaignId}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCampaignContext(json.data);
          const brief = json.data.businessBrief || {};
          if (brief.businessName) setTopic(brief.productOrService || brief.businessName);
          if (brief.targetAudience) setTargetAudience(brief.targetAudience);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCampaign(false));
  }, [campaignId]);

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    try {
      // Try live API first
      const res = await fetch("/api/growth/packs/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ brandName: topic, campaignTheme: topic, weeksCount: durationWeeks })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const pack = json.data;
        const calendar = pack.calendar || {};
        const pillars = pack.pillars || {};
        setContentOutput({
          topic,
          targetAudience,
          engine: pack.engine || "digitalMarketingOsService",
          classification: pack.classification || "LIVE_ENGINE_OUTPUT",
          truthNotice: pack.truthNotice || "Structured deterministic output — not AI-generated copy.",
          pillars: pillars.pillars || [],
          weeks: calendar.weeks || calendar.editorialWeeks || []
        });
      } else {
        // Fallback to local deterministic template
        setContentOutput({
          topic,
          targetAudience,
          engine: "DETERMINISTIC_TEMPLATE_V1",
          classification: "LOCAL_TEMPLATE",
          truthNotice: "Local deterministic template — structured planning output, not AI-generated.",
          pillars: [
            `Authority: engineering standards behind ${topic}`,
            "Proof: outcomes, demonstrations and verifiable evidence",
            `Education: buying guidance for ${targetAudience}`,
            "Offer: transparent value-first positioning"
          ],
          weeks: [
            { week: 1, theme: "Authority & Paradigm Shift", posts: [
              { day: "Mon", format: "LinkedIn Thought Leadership", hook: `Why 90% of AI wrappers fail while ${topic} compound.`, cta: "Read the architectural breakdown." },
              { day: "Wed", format: "Shorts / Reels Script", hook: "The 3 critical flaws in traditional custom software agencies.", cta: "Follow for enterprise systems." },
              { day: "Fri", format: "Case Study Breakdown", hook: "How autonomous engineering replaces 10-person dev shops.", cta: "Explore GARUDA delivery." }
            ]},
            { week: 2, theme: "Proof & Operational Reality", posts: [
              { day: "Mon", format: "Technical Deep Dive", hook: "Inside the 27 Universes: Specialization without isolation.", cta: "See the architecture." },
              { day: "Wed", format: "Shorts / Reels Script", hook: "Stop building AI prototypes. Build production-grade backends.", cta: "DM for blueprint." },
              { day: "Fri", format: "Client Milestone Proof", hook: "Milestone-verified payments and SHA-256 deliverable seals.", cta: "View escrow workflow." }
            ]}
          ]
        });
      }
    } catch {
      setContentOutput({
        topic,
        targetAudience,
        engine: "DETERMINISTIC_TEMPLATE_V1",
        classification: "LOCAL_TEMPLATE",
        truthNotice: "API unavailable — local template used.",
        pillars: [`Authority: ${topic}`, "Proof: outcomes", `Education: ${targetAudience}`, "Offer: positioning"],
        weeks: [{ week: 1, theme: "Launch", posts: [{ day: "Mon", format: "Post", hook: topic, cta: "Learn more" }] }]
      });
    } finally {
      setIsGenerating(false);
    }
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
              {campaignContext && (
                <span style={{ background: "rgba(117, 244, 171, 0.15)", color: "#75f4ab", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                  CAMPAIGN MODE
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "1.8rem", margin: "0.3rem 0 0", color: "#fff" }}>
              Content Factory Studio
            </h1>
            <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              High-velocity editorial calendars, multi-angle copy hooks, and omnichannel repurposing engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {campaignContext && (
              <button
                type="button"
                onClick={() => navigate("/growth")}
                style={{ background: "rgba(117,244,171,0.12)", color: "#75f4ab", border: "1px solid rgba(117,244,171,0.3)", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
              >
                ← Growth Command
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/founder/access")}
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,134,11,0.4))", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
            >
              👑 Access GARUDA Kingdom
            </button>
          </div>
        </div>

        {/* Campaign context banner */}
        {campaignContext && (
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(117,244,171,0.2)", borderRadius: "8px", padding: "0.7rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem" }}>
            <span style={{ color: "#75f4ab", fontWeight: "bold" }}>Campaign:</span>{" "}
            <span style={{ color: "#fff" }}>{campaignContext.businessBrief?.businessName || campaignContext.campaignId}</span>
            <span style={{ color: "#64748b", marginLeft: "0.5rem" }}>• {campaignContext.campaignId} • {campaignContext.status}</span>
          </div>
        )}

        {loadingCampaign && (
          <div style={{ textAlign: "center", padding: "1rem", color: "#64748b", fontSize: "0.85rem" }}>Loading campaign context...</div>
        )}

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
                {contentOutput.engine && (
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "#94a3b8" }}>Engine: <strong style={{ color: contentOutput.engine === "DETERMINISTIC_TEMPLATE_V1" ? "#84cc16" : "#75f4ab" }}>{contentOutput.engine}</strong></span>
                    <span style={{ color: "#94a3b8" }}>{contentOutput.classification}</span>
                  </div>
                )}
                {contentOutput.pillars && contentOutput.pillars.length > 0 && (
                  <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "6px", padding: "0.6rem 0.8rem" }}>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b", marginBottom: "0.3rem" }}>Content Pillars</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {contentOutput.pillars.map((p, i) => (
                        <span key={i} style={{ background: "rgba(212,175,55,0.12)", color: GOLD_LIGHT, fontSize: "0.7rem", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
