import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

export default function EntertainmentStudio() {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("National Celebrity Gala & Awards Spectacle");
  const [venue, setVenue] = useState("Radisson Blu Grand Ballroom, New Delhi");
  const [targetAudience, setTargetAudience] = useState("VVIPs, Pageant Winners, Film Celebrities, HNI Investors");
  const [isPlanning, setIsPlanning] = useState(false);
  const [warRoomOutput, setWarRoomOutput] = useState(null);

  const handlePlanWarRoom = () => {
    setIsPlanning(true);
    setTimeout(() => {
      setWarRoomOutput({
        eventName,
        venue,
        targetAudience,
        phases: [
          { phase: "Phase 1 (Days 1–3)", title: "Celebrity Hype & Private Line Drop", focus: "Curated teaser drops with celebrity brand ambassadors, locked RSVP hotline, and VIP invite distribution." },
          { phase: "Phase 2 (Days 4–7)", title: "Media Blitz & Pageant Momentum", focus: "Full press release distribution, digital billboards, multi-angle influencer hooks, and early-bird ticket releases." },
          { phase: "Phase 3 (Days 8–11)", title: "Sponsor War Room & Table Sellout", focus: "Direct corporate sponsor closing, VIP lounge activations, table lockouts, and luxury gift hamper partnerships." },
          { phase: "Phase 4 (Days 12–13)", title: "Live Show Run-of-Show & Broadcast", focus: "Minute-by-minute stage timing, red carpet live-stream feed, dynamic stage lighting, and post-event recap reels." }
        ],
        caseStudyLink: "/kudos",
        warRoomHash: "sha256_ent_" + Math.random().toString(16).slice(2, 10) + "771e"
      });
      setIsPlanning(false);
    }, 600);
  };

  const handlePrintPdf = () => {
    if (!warRoomOutput) return;
    openPristineWhitePdf({
      title: `GARUDA Entertainment Universe (U23) — Event Campaign War Room: ${warRoomOutput.eventName}`,
      subtitle: `Venue: ${warRoomOutput.venue} | Audience: ${warRoomOutput.targetAudience}`,
      sections: warRoomOutput.phases.map(p => ({
        heading: `${p.phase}: ${p.title}`,
        content: p.focus
      }))
    });
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title="Entertainment Universe (U23) — GARUDA Event War Room & Experience Engine"
        description="Interactive media, celebrity hype blueprints, and live event campaign war room engines of GARUDA OS."
        canonical="https://www.garudaos.in/entertainment"
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}`, paddingBottom: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem", color: GOLD }}>◈</span>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", color: GOLD, fontWeight: "bold" }}>
                GARUDA UNIVERSE 23 · RING 3
              </span>
              <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                STUDIO EXECUTABLE
              </span>
            </div>
            <h1 style={{ fontSize: "1.8rem", margin: "0.3rem 0 0", color: "#fff" }}>
              Entertainment & Event Experience Studio
            </h1>
            <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              Interactive media architectures, celebrity hype orchestration, and 13-day live event war rooms.
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

        {/* Flagship Case Study Banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(15,23,42,0.8))", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ color: "#38bdf8", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase" }}>FLAGSHIP CASE STUDY & EVENT IMPLEMENTATION</span>
            <h4 style={{ margin: "0.2rem 0", color: "#fff", fontSize: "1rem" }}>Kudos Face of India 2026 — 360° Omnipresence War Room</h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>Live case study featuring Celina Jaitly, Radisson Blu Grand Ballroom, and 7-slide strategic sponsor pitch.</p>
          </div>
          <Link
            to="/kudos"
            style={{ background: GOLD, color: "#000", padding: "0.5rem 1rem", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem", textDecoration: "none" }}
          >
            Explore Kudos Case Study ➔
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", color: GOLD, fontSize: "1.1rem" }}>1. Event Experience Parameters</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Event / Spectacle Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Venue / Arena</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Target VIPs & Attendees</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <button
              type="button"
              onClick={handlePlanWarRoom}
              disabled={isPlanning}
              style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #d4af37, #b8860b)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold", fontSize: "0.95rem", cursor: "pointer" }}
            >
              {isPlanning ? "Orchestrating War Room..." : "⚡ Activate 13-Day Event War Room"}
            </button>
          </div>

          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: GOLD, fontSize: "1.1rem" }}>2. 13-Day Campaign War Room Output</h3>
              {warRoomOutput && (
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{ background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📄 Print War Room PDF
                </button>
              )}
            </div>

            {!warRoomOutput ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🎪</span>
                Configure event details and click <strong>Activate 13-Day Event War Room</strong> to synthesize celebrity hype blueprints, VIP invitations, and sponsor pitch frameworks.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {warRoomOutput.phases.map((p, idx) => (
                  <div key={idx} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.8rem" }}>
                    <div style={{ color: GOLD, fontWeight: "bold", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                      {p.phase} — {p.title}
                    </div>
                    <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.8rem", lineHeight: "1.5" }}>{p.focus}</p>
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
