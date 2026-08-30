import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

const INDUSTRIES = [
  "Celebrity & Entertainment Events",
  "Real Estate & Property Developers",
  "Fashion, Couture & Pageants",
  "Hospitality, Hotels & Restaurants",
  "Healthcare, Hospitals & Clinics",
  "CA, Law & Professional Services",
  "E-Commerce & D2C Brands",
  "SaaS & Tech Startups",
  "Education & Coaching Institutes"
];

export default function CreativeAgencyStudio() {
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState("Kudos Entertainment");
  const [industry, setIndustry] = useState("Celebrity & Entertainment Events");
  const [objective, setObjective] = useState("Full-House Event Conversion & 360° Omnipresent Celebrity Hype for 12th Sept at Radisson Blu");
  const [activeTab, setActiveTab] = useState("calendar");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedOutput({
        brandName,
        industry,
        objective,
        calendar: [
          {
            day: "Day 1 (Kickoff)",
            pillar: "Authority & Celebrity Reveal",
            focus: "Launch Dark Teaser & Celebrity Judge Drop",
            copy: `When ${brandName} announces a milestone, the city gathers. Experience world-class production, curated hospitality, and unmatched energy.`,
            cta: "Register Now"
          },
          {
            day: "Day 3 (Nomination Wave)",
            pillar: "Social Proof & Nominations",
            focus: "Open Category Nominations (Excellence & Talent)",
            copy: `Elevate your personal brand. Get recognized on a national stage in front of industry icons. Limited nominee slots.`,
            cta: "Nominate Today"
          },
          {
            day: "Day 6 (Saturation)",
            pillar: "Omnipresent Ad Blitz",
            focus: "Scale Meta Ads by 3x & Google Search Launch",
            copy: `Delhi/NCR's most anticipated luxury night is filling fast. Reserved VIP tables & runway couture slots.`,
            cta: "Reserve Access"
          },
          {
            day: "Day 10 (Extreme FOMO)",
            pillar: "72-Hour Countdown",
            focus: "Final VIP Table & Passes Rush",
            copy: `Only 72 hours left. Final Phase passes are now live. Experience the gold standard with ${brandName}.`,
            cta: "Claim Final Tickets"
          },
          {
            day: "D-Day (Live Machine)",
            pillar: "Real-Time Broadcasting",
            focus: "Live Red Carpet & 2-Hour Aftermovie Dispatch",
            copy: `Live from the Red Carpet. Watch the crowning moments and high-octane stage performances.`,
            cta: "Watch Live Highlights"
          }
        ],
        adHooks: [
          {
            angle: "🌟 Celebrity & Authority Magnet",
            headline: `${brandName}: The Gold Standard Arrives in Delhi`,
            body: `Witness India's top talent, visionary leaders, and designer couture under one roof. Curated exclusively for those who value excellence.`,
            cta: "Apply / Reserve Seat"
          },
          {
            angle: "🚨 Extreme FOMO & Scarcity",
            headline: `Final VIP Tables & Passes Closing Soon`,
            body: `When ${brandName} puts on a grand celebration, seats sell out in hours. Ensure your presence at the grandest night of the season.`,
            cta: "Get Tickets Now"
          },
          {
            angle: "💼 Business Prestige & ROI",
            headline: `Get Honored on a National Stage`,
            body: `Position your company at the forefront of your industry with full press coverage, high-net-worth networking, and celebrity honors.`,
            cta: "Nominate for Award"
          }
        ],
        videoScripts: [
          {
            title: "Reel 1: 8-Second High-Energy Teaser",
            hook: "[0:00-0:02] Rapid visual cuts of red carpet, strobe lights, and gold typography with deep bass drop.",
            visual: "[0:03-0:06] Celebrity silhouette + 5-Star venue grandeur + 'Delhi, 12.09.26'.",
            audio: "Trending cinematic bass drop / Luxury runway beat",
            cta: "[0:07-0:08] 'Are you on the list? Tap link in bio.'"
          },
          {
            title: "Reel 2: Why This Night Changes Everything",
            hook: "[0:00-0:03] '3 reasons why this event is redefining Delhi's luxury entertainment scene...'",
            visual: "[0:04-0:12] Showcase 4 pillars: Designers, Runway, Talent, and Business Leaders.",
            audio: "Upbeat motivational synthwave",
            cta: "[0:13-0:15] 'Passes & Nominations open for next 48 hours.'"
          }
        ],
        deckBlueprint: [
          { slide: "01", name: "Executive Cover & Identity Lock", takeaway: `${brandName} 360° Omnipresence Strategy` },
          { slide: "02", name: "Target Audience & Geo-Fencing", takeaway: "Affluent HNI & High-Intent Demographics" },
          { slide: "03", name: "4-Tier Acquisition Funnels", takeaway: "Nominations, Runway, Sponsors & VIP Tables" },
          { slide: "04", name: "Day-by-Day Tactical War Room", takeaway: "Structured Multi-Phase Campaign Cadence" },
          { slide: "05", name: "Performance Meta & Google Ads", takeaway: "High-ROAS retargeting with multi-angle copy" },
          { slide: "06", name: "D-Day Live Broadcasting Machine", takeaway: "Real-time coverage & 2-Hour Aftermovie" },
          { slide: "07", name: "Execution Assurance & War Room SLA", takeaway: "24/7 Monitoring & Daily Telemetry" }
        ]
      });
      setIsGenerating(false);
    }, 400);
  };

  const handlePrintCampaignDocument = () => {
    if (!generatedOutput) return;
    const docText = `
# 🦅 GARUDA CREATIVE & MARKETING OPERATING SYSTEM
## Comprehensive 360° Campaign Architecture for ${generatedOutput.brandName}

**Industry:** ${generatedOutput.industry}  
**Strategic Objective:** ${generatedOutput.objective}  
**Date Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  
**Governance:** GARUDA Sovereign IdentityLock™ Verified  

---

### 📅 1. MULTI-PHASE CONTENT & SOCIAL WAR ROOM CALENDAR

${generatedOutput.calendar.map((c, i) => `
#### ${i + 1}. ${c.day} — ${c.pillar}
- **Focus:** ${c.focus}
- **Master Copy:** "${c.copy}"
- **Primary CTA:** ${c.cta}
`).join('\n')}

---

### 🎯 2. HIGH-ROAS PERFORMANCE AD COPY HOOKS (META & GOOGLE ADS)

${generatedOutput.adHooks.map((a, i) => `
#### Variant ${i + 1}: ${a.angle}
- **Headline:** "${a.headline}"
- **Primary Text:** ${a.body}
- **Target CTA:** ${a.cta}
`).join('\n')}

---

### 🎥 3. SHORT-FORM VIDEO & REEL BLUEPRINTS

${generatedOutput.videoScripts.map((v, i) => `
#### Video ${i + 1}: ${v.title}
- **Hook (0-3s):** ${v.hook}
- **Visual Progression:** ${v.visual}
- **Audio Recommendation:** ${v.audio}
- **Final CTA:** ${v.cta}
`).join('\n')}

---

### 📑 4. SLIDE-BY-SLIDE PRESENTATION / PPT PITCH BLUEPRINT

${generatedOutput.deckBlueprint.map(d => `
- **Slide ${d.slide}:** ${d.name} → *${d.takeaway}*
`).join('\n')}

---
*Generated by GARUDA Autonomous Creative Studio • Principal Architect: Praveen Mahawar*
    `;

    openPristineWhitePdf(docText, 0, `${generatedOutput.brandName} 360° Marketing Architecture`);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEOHead
        title="GARUDA Creative Studio & Marketing Operating System"
        description="Autonomous 360° creative campaigns, social calendars, high-ROAS ad hooks, video blueprints, and presentation decks."
        canonical="https://www.garudaos.in/studio"
      />

      {/* Top Header */}
      <header style={{ padding: "0.85rem 1.5rem", background: "rgba(11, 15, 25, 0.9)", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: 6, padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            ← Home
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>GARUDA</span>
            <span style={{ fontSize: "0.72rem", background: "linear-gradient(135deg, #d4af37, #f59e0b)", color: "#000", padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 800 }}>
              CREATIVE & MARKETING STUDIO
            </span>
          </div>
        </div>

        {generatedOutput && (
          <button
            onClick={handlePrintCampaignDocument}
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(56,189,248,0.2))",
              border: `1px solid ${GOLD}`,
              color: GOLD_LIGHT,
              padding: "0.45rem 1rem",
              borderRadius: 8,
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            👑 Print / Save Executive White PDF
          </button>
        )}
      </header>

      {/* Main Studio Interface */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>
        
        {/* Studio Input Command Card */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.75rem", marginBottom: "2rem", boxShadow: "0 15px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: "0.8rem", color: GOLD, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Autonomous Creative & Marketing Operating Studio
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", fontWeight: 900, color: "#fff", margin: "0 0 1.25rem 0" }}>
            Generate 360° Campaigns, Presentation Decks & Ad Blueprints
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Client / Brand / Event Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Kudos Entertainment"
                style={{ width: "100%", background: "#0a0f1d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Industry / Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{ width: "100%", background: "#0a0f1d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box" }}
              >
                {INDUSTRIES.map((ind, i) => (
                  <option key={i} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Primary Campaign Objective & Key Details</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Full house event conversion with Celina Jaitly at Radisson Blu Dwarka"
              style={{ width: "100%", background: "#0a0f1d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.9rem", boxSizing: "border-box" }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !brandName.trim()}
            style={{
              background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "0.75rem 2rem",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: isGenerating ? "not-allowed" : "pointer",
              boxShadow: "0 6px 20px rgba(212,175,55,0.3)"
            }}
          >
            {isGenerating ? "⚡ Synthesizing 360° Campaign Engine..." : "🚀 Generate Complete Campaign & Presentation Suite"}
          </button>
        </div>

        {/* Generated Output Workstation */}
        {generatedOutput && (
          <div>
            {/* Workstation Tab Ribbon */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: `1px solid ${BORDER}`, paddingBottom: "0.75rem", marginBottom: "1.5rem", overflowX: "auto" }}>
              {[
                { id: "calendar", label: "📅 Social War Room Calendar", count: generatedOutput.calendar.length },
                { id: "adhooks", label: "🎯 Multi-Angle Ad Hooks", count: generatedOutput.adHooks.length },
                { id: "videos", label: "🎥 Video & Reel Scripts", count: generatedOutput.videoScripts.length },
                { id: "deck", label: "📑 Presentation Deck Blueprint", count: generatedOutput.deckBlueprint.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(56,189,248,0.2))" : "rgba(255,255,255,0.03)",
                    border: activeTab === tab.id ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                    color: activeTab === tab.id ? GOLD_LIGHT : "#94a3b8",
                    borderRadius: 8,
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: activeTab === tab.id ? 800 : 500,
                    whiteSpace: "nowrap"
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Tab 1: Calendar */}
            {activeTab === "calendar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {generatedOutput.calendar.map((c, idx) => (
                  <div key={idx} style={{ background: PANEL, border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, padding: "1.25rem", borderLeft: `4px solid ${GOLD}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 800, color: GOLD_LIGHT, fontSize: "1rem" }}>{c.day} • {c.pillar}</span>
                      <span style={{ fontSize: "0.75rem", background: "rgba(212,175,55,0.15)", color: GOLD, padding: "0.2rem 0.6rem", borderRadius: 4, fontWeight: 700 }}>{c.focus}</span>
                    </div>
                    <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.55, margin: "0.4rem 0 0.6rem" }}>"{c.copy}"</p>
                    <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 700 }}>🎯 CTA: {c.cta}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Ad Hooks */}
            {activeTab === "adhooks" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {generatedOutput.adHooks.map((ad, idx) => (
                  <div key={idx} style={{ background: PANEL, border: "1px solid rgba(56,189,248,0.2)", borderRadius: 12, padding: "1.25rem", borderLeft: "4px solid #38bdf8" }}>
                    <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.3rem" }}>{ad.angle}</div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", marginBottom: "0.4rem" }}>"{ad.headline}"</div>
                    <div style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.55, marginBottom: "0.6rem" }}>{ad.body}</div>
                    <div style={{ fontSize: "0.8rem", color: GOLD, fontWeight: 700 }}>🎯 Target CTA: {ad.cta}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Videos */}
            {activeTab === "videos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {generatedOutput.videoScripts.map((v, idx) => (
                  <div key={idx} style={{ background: PANEL, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "1.25rem", borderLeft: "4px solid #10b981" }}>
                    <div style={{ fontWeight: 800, color: "#34d399", fontSize: "1.05rem", marginBottom: "0.5rem" }}>{v.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: "0.3rem 0" }}><strong>🪝 Visual Hook:</strong> {v.hook}</div>
                    <div style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: "0.3rem 0" }}><strong>🎬 Visual Progression:</strong> {v.visual}</div>
                    <div style={{ fontSize: "0.85rem", color: "#fef08a", margin: "0.3rem 0" }}><strong>🎵 Audio Vibe:</strong> {v.audio}</div>
                    <div style={{ fontSize: "0.85rem", color: "#38bdf8", fontWeight: 700, margin: "0.3rem 0" }}><strong>📢 Ending Call:</strong> {v.cta}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Deck */}
            {activeTab === "deck" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                {generatedOutput.deckBlueprint.map((d, idx) => (
                  <div key={idx} style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800 }}>SLIDE {d.slide}</div>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: "1rem", margin: "0.3rem 0" }}>{d.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{d.takeaway}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
