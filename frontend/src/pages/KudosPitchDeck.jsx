import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

export default function KudosPitchDeck() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: "slide-1",
      number: "01",
      title: "Executive Cover",
      tagline: "The 360° Omnipresence & Celebrity Hype Blueprint",
      content: {
        heading: "KUDOS FACE OF INDIA & AWARD SHOW 2026",
        sub: "13-Day High-Impact Digital Domination, Celebrity Hype & Full-House Conversion Strategy",
        meta: [
          { label: "Presented To", value: "Kajal Sharma (Founder & Show Organizer, Kudos Entertainment)" },
          { label: "Celebrity Judge", value: "Celina Jaitly (Bollywood Actress & Miss India Universe)" },
          { label: "Date & Venue", value: "12 September 2026 • Radisson Blu Hotel, Dwarka, New Delhi" },
          { label: "Architected By", value: "GARUDA AI Operating System • Principal Architect: Praveen Mahawar" }
        ],
        highlight: "A high-octane 13-day war room engineered to make Kudos Face of India 2026 the undisputed cultural, fashion, and business landmark of Delhi/NCR."
      }
    },
    {
      id: "slide-2",
      number: "02",
      title: "Power Assets & Market Moat",
      tagline: "Unrivaled Glamour, 5-Star Authority & National Media",
      content: {
        heading: "Why Kudos Face of India 2026 Has Immediate Market Dominance",
        items: [
          { title: "🌟 The Celebrity Magnet", desc: "Bollywood Star & Miss India Celina Jaitly guarantees instant viral curiosity, high PR trust, and massive photo-op value for attendees." },
          { title: "🏨 5-Star Prestige", desc: "Radisson Blu Dwarka elevates the event into Delhi's luxury elite tier — commanding higher ticket prices and premium corporate sponsorships." },
          { title: "🏆 4 Commercial Pillars", desc: "Fashion Show (Designers & Runway), Talent Recognition, Pageant (Face of India Title), and Business Excellence Awards." },
          { title: "🎥 6 Grand Highlights", desc: "Red Carpet Entry, Live Performances, Media Coverage, Designer Showcases, Celebrity Jury Panel, and Networking Gala." }
        ]
      }
    },
    {
      id: "slide-3",
      number: "03",
      title: "4-Tier Acquisition Funnels",
      tagline: "Maximizing Participants, Nominees, Sponsors & VIP Tables",
      content: {
        heading: "Multi-Stream Lead & Revenue Capture Engine",
        funnels: [
          {
            name: "Stream 1: Business Excellence Nominees",
            target: "Delhi/NCR Founders, CXOs, Doctors, CAs, Builders, Entrepreneurs",
            pitch: "Get recognized on a national stage by Celina Jaitly with full media coverage. Lifetime authority asset.",
            badge: "HIGH CONVERSION"
          },
          {
            name: "Stream 2: Pageant & Runway Designers",
            target: "Aspiring Pageant Models & Couture Fashion Designers",
            pitch: "Walk the grand 40-ft runway at Radisson Blu. Compete for the crown in front of Bollywood jury.",
            badge: "HIGH VIRALITY"
          },
          {
            name: "Stream 3: Brand Partners & Sponsors",
            target: "Luxury Jewellery, Beauty, Real Estate, Auto, FMCG",
            pitch: "Prime logo placement on Red Carpet, Media Backdrop, and Celebrity Stage presentation.",
            badge: "HIGH TICKET"
          },
          {
            name: "Stream 4: VIP Tables & Gala Passes",
            target: "Delhi HNI, Socialites, Corporate Delegations",
            pitch: "Reserved 5-star banquet dining, red carpet VIP lounge, and premier celebrity networking.",
            badge: "FULL HOUSE"
          }
        ]
      }
    },
    {
      id: "slide-4",
      number: "04",
      title: "13-Day War Room Sprint",
      tagline: "Day-by-Day Precision: Aug 31 to Sept 12",
      content: {
        heading: "The 3-Phase Omnipresent Blitz",
        phases: [
          {
            name: "Phase 1: Curated Mystery & Celebrity Reveal (Aug 31 – Sep 3)",
            desc: "Celina Jaitly announcement drop, nomination call for Business Excellence, Pageant registrations open, WhatsApp hotlines live."
          },
          {
            name: "Phase 2: Omnipresent Saturation (Sep 4 – Sep 8)",
            desc: "Scale Meta & Google ads by 3x. 20-Creator coordinated story drop. YouTube 6s non-skippable bumpers across Delhi NCR."
          },
          {
            name: "Phase 3: Extreme FOMO & D-Day Execution (Sep 9 – Sep 12)",
            desc: "72-Hour countdown rush, digital QR gate pass delivery, live red carpet coverage machine, and 2-hour rapid aftermovie."
          }
        ]
      }
    },
    {
      id: "slide-5",
      number: "05",
      title: "Performance Ad Suite",
      tagline: "Hyper-Targeting the Top 1% Spenders in Delhi NCR",
      content: {
        heading: "High-ROAS Meta & Google Ad Architectures",
        adCopy: [
          {
            angle: "Celebrity Glamour Angle",
            headline: "Celina Jaitly Presents Kudos Face of India 2026 (Radisson Blu, Delhi)",
            copy: "Delhi's grandest evening of glamour, fashion, and business excellence arrives on 12th September. Witness Bollywood icon Celina Jaitly honor India's top talent and leaders.",
            cta: "Nominate / Book Passes"
          },
          {
            angle: "Urgent FOMO Angle",
            headline: "12th September 2026: Delhi's Most Prestigious Red Carpet Gala",
            copy: "When Kudos Entertainment puts on a show, Delhi gathers. Grand Red Carpet, Designer Fashion Runways, Live Acts & Awards. Limited VIP seats remaining.",
            cta: "Reserve Your Seat"
          },
          {
            angle: "Business Prestige Angle",
            headline: "Get Recognized on a National Stage by Celina Jaitly",
            copy: "Take your business and personal brand to new heights. Receive your prestigious award from Celina Jaitly with full press coverage at Radisson Blu Dwarka.",
            cta: "Apply for Award"
          }
        ]
      }
    },
    {
      id: "slide-6",
      number: "06",
      title: "D-Day Live Coverage Machine",
      tagline: "Real-Time Broadcasting & Rapid 2-Hour Aftermovie",
      content: {
        heading: "Turning the Event into an Evergreen PR Asset",
        features: [
          { title: "⏱️ Every 20 Minutes Live Dispatch", desc: "Dedicated on-ground social media team posting live stories from Red Carpet arrivals, celebrity lounge, and award presentations." },
          { title: "📱 20 Creator Co-Streaming", desc: "Attending Delhi fashion and lifestyle influencers streaming live directly to their 500k+ collective followers." },
          { title: "⚡ 2-Hour Cinematic Aftermovie", desc: "A 60-second high-energy, 4K edited aftermovie delivered within 2 hours of event conclusion for instant viral distribution and national PR." },
          { title: "📰 National Press Releases", desc: "Post-event media coverage in top digital lifestyle, entertainment, and business news portals." }
        ]
      }
    },
    {
      id: "slide-7",
      number: "07",
      title: "Execution Partnership",
      tagline: "Dedicated 24/7 Digital War Room Team",
      content: {
        heading: "Why Kudos Entertainment × GARUDA AI",
        points: [
          "Hourly Telemetry: Continuous monitoring of ad spend, lead conversions, and ticket registrations.",
          "Direct Hotline Integration: Automated routing to official booking numbers (84481 33592 | 8587953151 | 9999738502 | 9622472822).",
          "Zero Generic Templates: 100% bespoke ultra-luxury design and copywriting tailored to Kajal Sharma's brand vision.",
          "Guaranteed Delivery: Zero downtime, transparent reporting, and founder-level accountability."
        ]
      }
    }
  ];

  const handlePrintExecutiveWhiteDeck = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate the print-ready presentation deck.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kudos Face of India 2026 — 360° Omnipresence Blueprint</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff !important;
      margin: 0;
      padding: 20px;
    }
    .slide-page {
      page-break-after: always;
      min-height: 180mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px 30px;
      box-sizing: border-box;
      margin-bottom: 20px;
      background: #fff;
    }
    .slide-header {
      border-bottom: 2px solid #d4af37;
      padding-bottom: 10px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f172a;
    }
    .brand-gold { color: #b8860b; }
    .slide-num {
      font-size: 14pt;
      font-weight: 900;
      color: #b8860b;
      font-family: monospace;
    }
    h1 {
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .tagline {
      font-size: 11pt;
      color: #b8860b;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 14px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #d4af37;
      padding: 12px 16px;
      border-radius: 6px;
    }
    .card-title {
      font-weight: 800;
      font-size: 11pt;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 9.5pt;
      color: #475569;
    }
    .meta-box {
      background: #fdfbf7;
      border: 1px solid #fef08a;
      border-left: 4px solid #b8860b;
      padding: 14px 18px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 9.5pt;
    }
    .meta-label { font-weight: 700; color: #64748b; }
    .meta-val { font-weight: 800; color: #0f172a; }
    .slide-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 16px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0 !important; }
      .slide-page { border: none; margin-bottom: 0; min-height: 100vh; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; background: #0f172a; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border-bottom: 2px solid #d4af37; margin: -20px -20px 20px -20px;">
    <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 11pt; color: #d4af37;">
      <span>👑</span>
      <span>GARUDA Executive White Pitch Deck PDF</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 800; font-size: 9.5pt; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 9pt; cursor: pointer;">
        ✕ Close
      </button>
    </div>
  </div>

  ${slides.map((s, idx) => `
    <div class="slide-page">
      <div>
        <div class="slide-header">
          <div>
            <span class="brand-title">KUDOS ENTERTAINMENT <span class="brand-gold">×</span> GARUDA AI</span>
          </div>
          <div class="slide-num">SLIDE ${s.number} / 07</div>
        </div>

        <h1>${s.content.heading}</h1>
        <div class="tagline">${s.tagline}</div>

        ${s.content.sub ? `<p style="font-size: 11pt; color: #334155; margin: 0 0 14px 0;">${s.content.sub}</p>` : ''}

        ${s.content.meta ? `
          <div class="meta-box">
            ${s.content.meta.map(m => `
              <div class="meta-row">
                <span class="meta-label">${m.label}:</span>
                <span class="meta-val">${m.value}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.content.items ? `
          <div class="card-grid">
            ${s.content.items.map(it => `
              <div class="card">
                <div class="card-title">${it.title}</div>
                <div class="card-desc">${it.desc}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.content.funnels ? `
          <div class="card-grid">
            ${s.content.funnels.map(f => `
              <div class="card">
                <div class="card-title">${f.name} <span style="font-size: 7.5pt; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${f.badge}</span></div>
                <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 4px;"><strong>Target:</strong> ${f.target}</div>
                <div class="card-desc"><strong>Hook:</strong> ${f.pitch}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.content.phases ? `
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
            ${s.content.phases.map(p => `
              <div class="card" style="border-left-color: #0284c7;">
                <div class="card-title">${p.name}</div>
                <div class="card-desc">${p.desc}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.content.adCopy ? `
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
            ${s.content.adCopy.map(ad => `
              <div class="card" style="border-left-color: #b8860b;">
                <div class="card-title">${ad.angle}: "${ad.headline}"</div>
                <div class="card-desc">${ad.copy}</div>
                <div style="font-size: 8.5pt; color: #b8860b; font-weight: 800; margin-top: 4px;">CTA: ${ad.cta}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.content.features ? `
          <div class="card-grid">
            ${s.content.features.map(ft => `
              <div class="card">
                <div class="card-title">${ft.title}</div>
                <div class="card-desc">${ft.desc}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.content.points ? `
          <ul style="padding-left: 20px; line-height: 1.7; font-size: 10pt; color: #1e293b; margin-top: 14px;">
            ${s.content.points.map(pt => `<li>${pt}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <div class="slide-footer">
        <span>Kudos Face of India 2026 • Kajal Sharma & Celina Jaitly • Radisson Blu Dwarka</span>
        <span>GARUDA AI Operating System • Confidential Presentation</span>
      </div>
    </div>
  `).join('')}

  <script>
    (function() {
      function triggerPrint() {
        setTimeout(function() {
          try { window.print(); } catch(e) {}
        }, 350);
      }
      if (document.readyState === 'complete') {
        triggerPrint();
      } else {
        window.addEventListener('DOMContentLoaded', triggerPrint);
        window.addEventListener('load', triggerPrint);
        setTimeout(triggerPrint, 500);
      }
    })();
  <\/script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const cur = slides[activeSlide];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEOHead
        title="Kudos Face of India 2026 | 360° Digital Omnipresence Blueprint"
        description="Comprehensive 13-day celebrity event digital marketing strategy for Kudos Entertainment, Kajal Sharma, and Celina Jaitly at Radisson Blu Dwarka."
        canonical="https://www.garudaos.in/kudos"
      />

      {/* Top Navigation */}
      <header style={{ padding: "0.85rem 1.5rem", background: "rgba(11, 15, 25, 0.9)", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: 6, padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            ← Home
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>KUDOS</span>
            <span style={{ fontSize: "0.72rem", background: "linear-gradient(135deg, #d4af37, #f59e0b)", color: "#000", padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 800 }}>
              FACE OF INDIA 2026
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={handlePrintExecutiveWhiteDeck}
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
              gap: "0.4rem",
              boxShadow: "0 4px 20px rgba(212,175,55,0.25)"
            }}
          >
            👑 Print / Save Executive White Pitch Deck (PDF)
          </button>
        </div>
      </header>

      {/* Main Pitch Deck Container */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>
        
        {/* Event Quick Intel Badge */}
        <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(15,23,42,0.9))", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Verified Event Dossier</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Kudos Face of India & Award Show 2026</div>
            <div style={{ fontSize: "0.88rem", color: "#94a3b8", marginTop: "0.2rem" }}>
              👑 Celebrity Judge: <strong style={{ color: "#fff" }}>Celina Jaitly</strong> • 🏢 Organizer: <strong style={{ color: "#fff" }}>Kajal Sharma</strong>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", color: GOLD_LIGHT, fontWeight: 700 }}>📅 12th September 2026</div>
            <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>🏨 Radisson Blu, Dwarka, New Delhi</div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace", marginTop: "0.2rem" }}>Hotlines: 84481 33592 | 8587953151</div>
          </div>
        </div>

        {/* Slide Selector Carousel */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSlide(idx)}
              style={{
                flex: "0 0 auto",
                background: activeSlide === idx ? "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(56,189,248,0.25))" : "rgba(255,255,255,0.03)",
                border: activeSlide === idx ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                color: activeSlide === idx ? GOLD_LIGHT : "#94a3b8",
                padding: "0.6rem 1rem",
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: activeSlide === idx ? GOLD : "#64748b" }}>SLIDE {s.number}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{s.title}</div>
            </button>
          ))}
        </div>

        {/* Current Active Slide Card */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2.5rem 2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", minHeight: 480, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: GOLD, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {cur.tagline}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>
                Slide {cur.number} of 07
              </span>
            </div>

            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", fontWeight: 900, color: "#fff", margin: "0 0 1rem 0", lineHeight: 1.25 }}>
              {cur.content.heading}
            </h2>

            {cur.content.sub && (
              <p style={{ color: "#cbd5e1", fontSize: "1.05rem", lineHeight: 1.6, margin: "0 0 1.5rem 0", maxWidth: 800 }}>
                {cur.content.sub}
              </p>
            )}

            {/* Slide 1 Meta */}
            {cur.content.meta && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem", margin: "1.5rem 0" }}>
                {cur.content.meta.map((m, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>{m.label}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginTop: "0.2rem" }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 2 Items */}
            {cur.content.items && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", margin: "1.5rem 0" }}>
                {cur.content.items.map((it, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: GOLD_LIGHT, marginBottom: "0.4rem" }}>{it.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.55 }}>{it.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 3 Funnels */}
            {cur.content.funnels && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem", margin: "1.5rem 0" }}>
                {cur.content.funnels.map((f, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>{f.name}</span>
                      <span style={{ fontSize: "0.7rem", background: "rgba(56,189,248,0.15)", color: "#38bdf8", padding: "0.15rem 0.4rem", borderRadius: 4, fontWeight: 700 }}>{f.badge}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#8d95a7", marginBottom: "0.4rem" }}><strong>Target:</strong> {f.target}</div>
                    <div style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}><strong>Hook:</strong> {f.pitch}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 4 Phases */}
            {cur.content.phases && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.5rem 0" }}>
                {cur.content.phases.map((p, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, padding: "1.25rem", borderLeft: `4px solid ${GOLD}` }}>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: GOLD_LIGHT, marginBottom: "0.3rem" }}>{p.name}</div>
                    <div style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.55 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 5 Ad Copy */}
            {cur.content.adCopy && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.5rem 0" }}>
                {cur.content.adCopy.map((ad, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem", borderLeft: "4px solid #38bdf8" }}>
                    <div style={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase" }}>{ad.angle}</div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", margin: "0.2rem 0 0.4rem" }}>"{ad.headline}"</div>
                    <div style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.55 }}>{ad.copy}</div>
                    <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: GOLD, fontWeight: 700 }}>🎯 Primary CTA: {ad.cta}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 6 Features */}
            {cur.content.features && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", margin: "1.5rem 0" }}>
                {cur.content.features.map((ft, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", marginBottom: "0.4rem" }}>{ft.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.55 }}>{ft.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 7 Points */}
            {cur.content.points && (
              <ul style={{ paddingLeft: "1.5rem", lineHeight: 1.8, fontSize: "1rem", color: "#cbd5e1", margin: "1.5rem 0" }}>
                {cur.content.points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Slide Navigation Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem", marginTop: "2rem" }}>
            <button
              onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
              disabled={activeSlide === 0}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: activeSlide === 0 ? "#475569" : "#fff",
                padding: "0.5rem 1.25rem",
                borderRadius: 8,
                cursor: activeSlide === 0 ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "0.88rem"
              }}
            >
              ← Previous Slide
            </button>

            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {activeSlide + 1} / {slides.length}
            </span>

            <button
              onClick={() => setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={activeSlide === slides.length - 1}
              style={{
                background: activeSlide === slides.length - 1 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                border: "none",
                color: activeSlide === slides.length - 1 ? "#475569" : "#000",
                padding: "0.5rem 1.5rem",
                borderRadius: 8,
                cursor: activeSlide === slides.length - 1 ? "not-allowed" : "pointer",
                fontWeight: 800,
                fontSize: "0.88rem"
              }}
            >
              Next Slide ➔
            </button>
          </div>
        </div>

        {/* Official Pamphlet Inspection Preview Card */}
        <div style={{ marginTop: "3rem", background: "rgba(11,15,25,0.6)", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800, textTransform: "uppercase" }}>Original Client Source Verification</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>Official Event Pamphlet — Kudos Face of India 2026</div>
            </div>
            <span style={{ fontSize: "0.75rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.25rem 0.65rem", borderRadius: 4, fontWeight: 700 }}>
              ✓ Verified Radisson Blu & Celina Jaitly Assets
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "#000" }}>
              <img src="/kudos-pamphlet.png" alt="Kudos Face of India Pamphlet" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
              <div><strong>🏆 Event Title:</strong> KUDOS FACE OF INDIA & AWARD SHOW 2026</div>
              <div><strong>👑 Celebrity Judge:</strong> Celina Jaitly (Bollywood Star & Miss India)</div>
              <div><strong>🏢 Show Organizer:</strong> Kajal Sharma (Kudos Entertainment)</div>
              <div><strong>📅 Target Date:</strong> 12th September 2026</div>
              <div><strong>🏨 5-Star Venue:</strong> Radisson Blu, Dwarka, Delhi</div>
              <div><strong>👗 4 Award Pillars:</strong> Fashion Show • Talent Recognition • Pageant • Business Excellence</div>
              <div><strong>🌟 6 Highlights:</strong> Red Carpet Entry • Live Acts • Media Coverage • Designer Runway • Celebrity Jury • Networking Gala</div>
              <div style={{ background: "rgba(212,175,55,0.1)", padding: "0.6rem 0.9rem", borderRadius: 8, border: "1px solid rgba(212,175,55,0.25)", color: GOLD_LIGHT, marginTop: "0.5rem" }}>
                📞 <strong>Direct Registration Hotlines:</strong><br />
                84481 33592 | 8587953151 | 9999738502 | 9622472822
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
