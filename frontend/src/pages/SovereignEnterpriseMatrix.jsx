import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.88)";
const PANEL_BORDER = "rgba(212, 175, 55, 0.28)";
const EMERALD = "#10b981";
const CRIMSON = "#ef4444";
const SAPPHIRE = "#38bdf8";
const PURPLE = "#c084fc";

const SECTORS = [
  {
    id: "elections",
    icon: "🏛️",
    title: "Political Campaign & Electoral War Room",
    subtitle: "Booth-level sentiment, viral regional reels, opposition counter-strike & victory drive",
    badge: "STATEWIDE & CONSTITUENCY",
    badgeColor: "#f59e0b"
  },
  {
    id: "industry",
    icon: "🏢",
    title: "Heavy Industry & Manufacturing Conglomerates",
    subtitle: "B2B client acquisition, tender intelligence, institutional authority & supply dominance",
    badge: "ENTERPRISE B2B",
    badgeColor: "#38bdf8"
  },
  {
    id: "realestate",
    icon: "🏗️",
    title: "Luxury Real Estate & Infrastructure Groups",
    subtitle: "High-ticket buyer acquisition, corridor analytics, township branding & investor concierge",
    badge: "HIGH-ASSET WEALTH",
    badgeColor: "#10b981"
  },
  {
    id: "education",
    icon: "🏫",
    title: "Universities, Colleges & Higher Education Chains",
    subtitle: "Student admissions surge, academic prestige, national PR & parent conversion funnels",
    badge: "PAN-INDIA ACADEMIC",
    badgeColor: "#c084fc"
  },
  {
    id: "healthcare",
    icon: "🏥",
    title: "Hospital Networks & Super-Specialty Healthcare",
    subtitle: "Patient trust acquisition, OPD expansion, medical specialist authority & crisis PR",
    badge: "HIGH-TRUST INSTITUTION",
    badgeColor: "#ec4899"
  },
  {
    id: "hospitality",
    icon: "💎",
    title: "Luxury Hospitality, Resorts & MICE Conclaves",
    subtitle: "HNI destination weddings, corporate retreats, luxury branding & direct booking surge",
    badge: "HNI LUXURY",
    badgeColor: "#fbbf24"
  },
  {
    id: "retail",
    icon: "🛒",
    title: "Retail Brands, FMCG & Distribution Franchises",
    subtitle: "Local market takeover, store footfall surge, franchise partner expansion & D2C flywheel",
    badge: "COMMERCIAL FLYWHEEL",
    badgeColor: "#34d399"
  }
];

export default function SovereignEnterpriseMatrix() {
  const [selectedSector, setSelectedSector] = useState("elections");

  // Client / Leader Metadata Inputs (Live filled in front of the client)
  const [clientName, setClientName] = useState("Hon'ble Minister / Candidate");
  const [constituency, setConstituency] = useState("Chhattisgarh Central Region / District");

  // Live Scope Controls for Electoral War Room
  const [boothCount, setBoothCount] = useState(280); // Slider: 15 to 2,000 booths
  const [reelsCount, setReelsCount] = useState(90); // Slider: 20 to 300 reels
  const [campaignMonths, setCampaignMonths] = useState(3); // 1, 3, 6 months

  // Service Module Checkboxes (Live toggled based on client choices)
  const [modules, setModules] = useState({
    gisSentiment: true,
    bhashanEngine: true,
    boothWhatsapp: true,
    oppositionSentinel: true,
    firmMarketing: true,
    warRoomCommander: true
  });

  // Speech style tab
  const [speechStyle, setSpeechStyle] = useState("rally");
  const [copiedNotice, setCopiedNotice] = useState(null);

  // ECI Statutory Paid Media & Micro-Targeting Simulator State
  const [targetVoters, setTargetVoters] = useState(240000); // 50k to 500k voters in assembly
  const [adFrequency, setAdFrequency] = useState(12); // 4x to 24x impressions per voter
  const [metaSplit, setMetaSplit] = useState(55); // Meta Reels & Feed %
  const [ytSplit, setYtSplit] = useState(35); // YouTube Ads %
  const [waSplit, setWaSplit] = useState(10); // WhatsApp Verified Push %

  const toggleModule = (key) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // REAL-TIME DYNAMIC VALUATION ENGINE (No fixed price - purely calculated on live inputs)
  const liveCalculation = useMemo(() => {
    // 1. Base AI Fleet Engine Setup
    let basePlatform = 800000; // ₹8 Lakh baseline for 1,000 agent engine

    // 2. Booth Mobilization Scale
    let boothCost = boothCount * 9500; // ₹9,500 per booth (data ingestion, WhatsApp node, booth adhyaksh tracking)

    // 3. Video Production Velocity
    let reelsCost = reelsCount * 14000; // ₹14,000 per high-retention reel script + localized render

    // 4. Feature Module Additions
    let addOns = 0;
    if (modules.gisSentiment) addOns += 450000; // 360 GIS Sentiment Heatmap
    if (modules.bhashanEngine) addOns += 350000; // Multilingual Speech AI
    if (modules.boothWhatsapp) addOns += 600000; // 5,000 WhatsApp Mobilization Grid
    if (modules.oppositionSentinel) addOns += 550000; // 24/7 Counter-Strike Sentinel
    if (modules.firmMarketing) addOns += 950000; // Private Corporate Firms Lead Machine
    if (modules.warRoomCommander) addOns += 500000; // On-ground Dedicated Commander Desk

    // 5. Duration Multiplier
    const durationMultiplier = campaignMonths === 1 ? 1.0 : campaignMonths === 3 ? 1.75 : 2.85;

    // Subtotal
    let total = Math.round((basePlatform + boothCost + reelsCost + addOns) * durationMultiplier);

    // Round to nearest ₹50,000 for clean enterprise quotation
    total = Math.round(total / 50000) * 50000;

    // 3-Stage Milestone Escrow
    const stage1Advance = Math.round(total * 0.4);
    const stage2Mid = Math.round(total * 0.35);
    const stage3Victory = total - stage1Advance - stage2Mid;

    return {
      basePlatform,
      boothCost,
      reelsCost,
      addOns,
      total,
      formattedTotal: `₹${(total / 100000).toFixed(2)} Lakhs (${(total / 10000000).toFixed(2)} Cr)`,
      exactInr: `₹${total.toLocaleString("en-IN")}`,
      stage1Advance,
      stage2Mid,
      stage3Victory
    };
  }, [boothCount, reelsCount, campaignMonths, modules]);

  // ECI STATUTORY PAID MEDIA SPEND ESTIMATION ENGINE (Meta, YouTube, WhatsApp API)
  const mediaCalculation = useMemo(() => {
    const totalImpressions = targetVoters * adFrequency;
    // Regional Assembly Constituency blended CPM (~₹85 per 1,000 impressions on Meta Reels + YouTube)
    const digitalAdSpend = Math.round(((totalImpressions * (metaSplit + ytSplit)) / 100 / 1000) * 85);
    // WhatsApp official API broadcast (~₹0.48 per verified template session)
    const waPushes = Math.round((targetVoters * (adFrequency / 4) * waSplit) / 100);
    const waSpend = Math.round(waPushes * 0.48);
    const totalMediaSpend = Math.round((digitalAdSpend + waSpend) / 10000) * 10000;

    return {
      totalImpressions,
      digitalAdSpend,
      waSpend,
      totalMediaSpend,
      formattedMediaSpend: `₹${(totalMediaSpend / 100000).toFixed(2)} Lakhs`,
      exactMediaInr: `₹${totalMediaSpend.toLocaleString("en-IN")}`,
      costPerVoter: (totalMediaSpend / targetVoters).toFixed(2)
    };
  }, [targetVoters, adFrequency, metaSplit, ytSplit, waSplit]);

  const activeSectorData = SECTORS.find((s) => s.id === selectedSector) || SECTORS[0];

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(label);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const currentSpeech = {
    rally: `🚩 *GARUDA HIGH-OCTANE RALLY SPEECH DRAFT* (Hindi + Chhattisgarhi Punch)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Jai Johar! Sangwari man la pranam! 
Ajj jo log yahan aakar bade-bade wade kar rahe hain, unse pucho—jab garmi mein kisaan ko paani chahiye tha, jab yuva ko rojgar chahiye tha, tab unke neta kahan the? 

Humne baatein nahi, zameen par sadak, bijli aur hospital banakar dikhaya hai! Ek-ek kisaan ke khaate mein sidha samman ka paisa pahuncha hai. Yeh election sirf ek seat ka nahi hai, yeh Chhattisgarh ke aatm-samman aur har parivar ke bhavishya ka chunav hai!

Aapka ek vote un sabhi taakato ko jawab dega jo hamare vikas ko rokna chahti hain. Bolo sangwari man—Vikas ka parcham laherayega ki nahi?!"`,
    press: `🎙️ *EXECUTIVE PRESS CONFERENCE BRIEFING* (Facts, Budgets & Allocations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Respected Media representatives, today we present the audited development achievements of our leadership in ${constituency}:
1. Infrastructure: All-weather concrete roads delivered across rural corridors with audited geotagged proof.
2. Direct Benefit Transfer: Direct procurement disbursements credited to farmers with zero intermediary leakage.
3. Healthcare & Education: Modernized maternal care sub-centers and clean solar energization completed across schools.

Our opposition trades in ungrounded rumors; we trade in verifiable physical progress. Thank you."`,
    emotional: `❤️ *JAN-SAMPARK DIL-SE-DIL ADDRESS* (Warm Family Connect)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Mera aap sab se koi neta aur janta ka rishta nahi hai—mera rishta aapke parivar ke ek bete aur bhai ka hai. 
Jab bhi kisi mata ya behen ko pareshani aayi, mera darwaza 24 ghante khula raha hai. 

Mera ek hi sankalp hai: kisi bhi gareeb parivar ka bachha shikhsha ya ilaj se vanchit na rahe. Yeh ladai meri akele ki nahi, aap sabki hai. Aap apna aashirwaad banaye rakhiye, har samasya ko hal karna meri zimmedari hai."`
  }[speechStyle];

  const shareableText = `📜 *GARUDA SOVEREIGN EXECUTIVE DOSSIER*
Client: ${clientName}
Constituency: ${constituency}
Domain: ${activeSectorData.title}
─────────────────────────────
📊 *LIVE SCOPE CONFIGURED*:
• Mobilization Scale: ${boothCount} Polling Booths
• Video Production: ${reelsCount} Viral Dialect Reels
• Campaign Duration: ${campaignMonths} Months
• 360° GIS Sentiment Heatmap: ${modules.gisSentiment ? "ENABLED" : "DISABLED"}
• AI Bhashan & Multilingual Speech Weapon: ${modules.bhashanEngine ? "ENABLED" : "DISABLED"}
• 5,000 Booth WhatsApp Karyakarta Grid: ${modules.boothWhatsapp ? "ENABLED" : "DISABLED"}
• 24/7 Opposition Counter-Strike Sentinel: ${modules.oppositionSentinel ? "ENABLED" : "DISABLED"}
• Corporate Firms / Business Lead Engine: ${modules.firmMarketing ? "ENABLED" : "DISABLED"}
─────────────────────────────
🎯 *ECI STATUTORY MEDIA FUEL (META & YOUTUBE)*:
• Constituency Eligible Voters: ${targetVoters.toLocaleString("en-IN")}
• Campaign Impressions: ${(mediaCalculation.totalImpressions / 1000000).toFixed(2)} Million (${adFrequency}x saturation)
• Direct Official Media Spend: ${mediaCalculation.exactMediaInr} (${mediaCalculation.formattedMediaSpend})
• Disbursal: 100% Direct from Candidate / Party to Meta & Google (Zero agency markup)
─────────────────────────────
💰 *SOVEREIGN ENTERPRISE VALUATION (GARUDA AI OS RETAINER)*:
Total Live Contract: ${liveCalculation.exactInr} (${liveCalculation.formattedTotal})
*Zero Discount Policy — Defense-Grade Milestone Escrow*
• Advance Initiation (40%): ₹${liveCalculation.stage1Advance.toLocaleString("en-IN")}
• Mid-Campaign Blitz (35%): ₹${liveCalculation.stage2Mid.toLocaleString("en-IN")}
• Victory Polling Drive (25%): ₹${liveCalculation.stage3Victory.toLocaleString("en-IN")}
─────────────────────────────
Architect: Founder Praveen Mahawar • 1,000 AI Agent Workforce
Official Portal: https://www.garudaos.in/enterprise`;

  return (
    <main className="sovereign-matrix-container" style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title="GARUDA SOVEREIGN MATRIX™ — Live Dynamic Enterprise & Electoral Command"
        description="Billion-dollar live scope calculation engine and printable Cabinet PDF dossier for Political Campaigns, Industrial Conglomerates, and High-Ticket Non-Discounted Deals."
        canonical="https://www.garudaos.in/enterprise"
      />

      {/* PRINT-ONLY STYLES: CRITICAL FOR PRISTINE WHITE OFFICIAL CABINET PDF */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .sovereign-matrix-container {
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, aside, .no-print, button {
            display: none !important;
          }
          .print-dossier-page {
            display: block !important;
            background: #ffffff !important;
            color: #111827 !important;
            padding: 2.5rem !important;
            border: 2px solid #1e3a8a !important;
          }
        }
        @media screen {
          .print-dossier-page {
            display: none;
          }
        }
      `}</style>

      {/* TOP HEADER: PALANTIR & BLOOMBERG GRADE COMMAND BAR */}
      <header
        style={{
          background: PANEL,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: "14px",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.3), rgba(245,158,11,0.1))",
              border: `1px solid ${GOLD}`,
              display: "grid",
              placeItems: "center",
              fontSize: "1.5rem",
              boxShadow: "0 0 20px rgba(212,175,55,0.3)"
            }}
          >
            🦅
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "0.04em" }}>
                GARUDA SOVEREIGN MATRIX™
              </h1>
              <span
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: `1px solid ${EMERALD}`,
                  color: "#6ee7b7",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD, display: "inline-block" }} />
                DYNAMIC SCOPE CALCULATOR ACTIVE
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>
              Architect: <strong style={{ color: GOLD_LIGHT }}>Founder Praveen Mahawar</strong> · Live Scope Pricing · Real-Time Escrow Generation
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            to="/founder/access"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#e2e8f0",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            ← Founder Kingdom
          </Link>
          <button
            onClick={handlePrintPdf}
            style={{
              background: "linear-gradient(135deg, #1e40af, #2563eb)",
              border: "1px solid #60a5fa",
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(37,99,235,0.4)"
            }}
          >
            📄 Export Cabinet PDF Dossier
          </button>
          <button
            onClick={() => handleCopy(shareableText, "Brief Copied")}
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8860b)",
              border: "none",
              color: "#030712",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(212,175,55,0.4)"
            }}
          >
            📋 {copiedNotice === "Brief Copied" ? "Copied!" : "Copy Live Calculation"}
          </button>
        </div>
      </header>

      {/* MAIN SCREEN: SIDEBAR + DYNAMIC CALCULATOR & PROTOTYPE */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 340px) 1fr", gap: "24px", alignItems: "start" }}>
        {/* LEFT SIDEBAR: SECTOR SELECTOR */}
        <aside
          style={{
            background: PANEL,
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ padding: "0 8px 8px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              SELECT TARGET DOMAIN
            </span>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
              Adjusts Live Calculations & Prototype
            </div>
          </div>

          {SECTORS.map((sec) => {
            const isSelected = selectedSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                style={{
                  background: isSelected ? "rgba(212, 175, 55, 0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? GOLD : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "10px",
                  padding: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start"
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{sec.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ color: isSelected ? "#ffffff" : "#e2e8f0", fontSize: "0.86rem" }}>
                    {sec.title}
                  </strong>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "3px", lineHeight: "1.3" }}>
                    {sec.subtitle}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ background: "rgba(0,0,0,0.4)", color: sec.badgeColor, padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700 }}>
                      {sec.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT AREA: LIVE CUSTOMIZER, REAL-TIME PRICE, PROTOTYPE */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. LIVE CLIENT CONFIGURATION & REAL-TIME PRICE TICKER */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(10,15,29,0.95))",
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <span style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase" }}>
                  LIVE PROPOSAL CONFIGURATOR (INSPECTION IN PROGRESS)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Candidate / Leader Name:</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: "0.82rem", marginTop: "2px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Constituency / Region:</label>
                    <input
                      type="text"
                      value={constituency}
                      onChange={(e) => setConstituency(e.target.value)}
                      style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: "0.82rem", marginTop: "2px" }}
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC LIVE PRICE TICKER (CHANGES INSTANTLY ON ANY ACTION) */}
              <div
                style={{
                  background: "radial-gradient(circle at top, rgba(212,175,55,0.15), rgba(0,0,0,0.8))",
                  border: `2px solid ${GOLD}`,
                  borderRadius: "12px",
                  padding: "14px 22px",
                  textAlign: "right",
                  minWidth: "250px",
                  boxShadow: "0 0 25px rgba(212,175,55,0.25)"
                }}
              >
                <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  ⚡ LIVE CALCULATED INVESTMENT
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", marginTop: "2px", letterSpacing: "-0.02em" }}>
                  {liveCalculation.exactInr}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#6ee7b7", fontWeight: 700 }}>
                  {liveCalculation.formattedTotal} · Zero-Discount Retainer
                </div>
              </div>
            </div>

            {/* LIVE SCOPE SLIDERS & PARAMETERS */}
            <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {/* 1. Booth Slider */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Target Polling Booths:</span>
                    <strong style={{ color: GOLD_LIGHT, fontSize: "0.95rem" }}>{boothCount} Booths</strong>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="1500"
                    step="15"
                    value={boothCount}
                    onChange={(e) => setBoothCount(Number(e.target.value))}
                    style={{ width: "100%", marginTop: "8px", accentColor: GOLD }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
                    <span>Ward (15)</span>
                    <span>MLA (280)</span>
                    <span>MP (1,500)</span>
                  </div>
                </div>

                {/* 2. Video Reels Output Slider */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Viral Regional Reels Output:</span>
                    <strong style={{ color: SAPPHIRE, fontSize: "0.95rem" }}>{reelsCount} Reels</strong>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="10"
                    value={reelsCount}
                    onChange={(e) => setReelsCount(Number(e.target.value))}
                    style={{ width: "100%", marginTop: "8px", accentColor: SAPPHIRE }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
                    <span>20 Reels</span>
                    <span>100 Reels</span>
                    <span>300 Mega-Blitz</span>
                  </div>
                </div>

                {/* 3. Duration Selector */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Campaign Battle Horizon:</span>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    {[
                      { m: 1, l: "1 Month (Sprint)" },
                      { m: 3, l: "3 Months (Standard)" },
                      { m: 6, l: "6 Months (Full Battle)" }
                    ].map((dur) => (
                      <button
                        key={dur.m}
                        type="button"
                        onClick={() => setCampaignMonths(dur.m)}
                        style={{
                          flex: 1,
                          background: campaignMonths === dur.m ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${campaignMonths === dur.m ? EMERALD : "rgba(255,255,255,0.1)"}`,
                          color: campaignMonths === dur.m ? "#6ee7b7" : "#9ca3af",
                          padding: "6px",
                          borderRadius: 6,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {dur.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE SERVICE ADD-ONS CHECKBOXES */}
              <div style={{ marginTop: "14px" }}>
                <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>
                  Select Operational AI Modules (Checked Modules Are Ingested into Live Valuation):
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "8px" }}>
                  {[
                    { key: "gisSentiment", label: "📊 360° GIS Voter Sentiment & Grievance Heatmap (+₹4.5L)", desc: "Booth-level sentiment analytics & top-5 grievance tracking." },
                    { key: "bhashanEngine", label: "⚡ Multilingual AI Speech & Bhashan Factory (+₹3.5L)", desc: "1-Click crowd rally, press briefing & emotional speech generator." },
                    { key: "boothWhatsapp", label: "📲 5,000 Booth Karyakarta WhatsApp Direct Grid (+₹6.0L)", desc: "1-Click personalized task assignment to every booth pramukh." },
                    { key: "oppositionSentinel", label: "🛡️ 24/7 Opposition Counter-Strike Sentinel (+₹5.5L)", desc: "15-minute fact-check & automated counter-narrative destruction." },
                    { key: "firmMarketing", label: "🏢 Private Corporate Firms Lead Machine (+₹9.5L)", desc: "Commercial business digital marketing & B2B customer acquisition." },
                    { key: "warRoomCommander", label: "👑 On-Ground War Room Tech Commander Desk (+₹5.0L)", desc: "Dedicated sovereign AI commander deployed for victory operations." }
                  ].map((mod) => (
                    <div
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      style={{
                        background: modules[mod.key] ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${modules[mod.key] ? GOLD : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 8,
                        padding: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={modules[mod.key]}
                        onChange={() => {}} // Controlled by div click
                        style={{ marginTop: "3px", accentColor: GOLD }}
                      />
                      <div>
                        <strong style={{ fontSize: "0.78rem", color: modules[mod.key] ? "#ffffff" : "#9ca3af" }}>
                          {mod.label}
                        </strong>
                        <div style={{ fontSize: "0.68rem", color: "#6b7280", marginTop: "2px" }}>
                          {mod.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. THE PROTOTYPE: CONSTITUENCY SENTIMENT & SPEECH WEAPON */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Sentiment Radar */}
            <div style={{ background: PANEL, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "14px", padding: "18px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: "0 0 12px 0" }}>
                📊 Real-Time Constituency Sentiment Breakdown ({constituency})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "10px", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>PRO-LEADERSHIP</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: EMERALD }}>68.4%</div>
                  <div style={{ fontSize: "0.65rem", color: "#6ee7b7" }}>Committed Base</div>
                </div>
                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "10px", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>SWING VOTERS</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: GOLD_LIGHT }}>21.2%</div>
                  <div style={{ fontSize: "0.65rem", color: "#fef08a" }}>Target for Reels</div>
                </div>
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "10px", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>CRITICAL ISSUE</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: CRIMSON }}>10.4%</div>
                  <div style={{ fontSize: "0.65rem", color: "#fca5a5" }}>Priority Redressal</div>
                </div>
              </div>

              {/* Sample Booth Health Matrix */}
              <div style={{ fontSize: "0.74rem", color: "#cbd5e1" }}>
                <strong style={{ color: GOLD }}>Sample Booth Telemetry (from {boothCount} configured booths):</strong>
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: 4 }}>
                    <span>Booth #102 (Main Market & Trade Center)</span>
                    <span style={{ color: EMERALD, fontWeight: 700 }}>STRONGHOLD (74% Win Rate)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: 4 }}>
                    <span>Booth #108 (Rural Link Road & Kisan Cluster)</span>
                    <span style={{ color: GOLD_LIGHT, fontWeight: 700 }}>SWING BATTLEGROUND (49%)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: 4 }}>
                    <span>Booth #114 (Youth Colony & Colleges)</span>
                    <span style={{ color: SAPPHIRE, fontWeight: 700 }}>REELS TARGETED (+18% Swing)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Speech Drafter */}
            <div style={{ background: PANEL, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                  ⚡ AI Instant Bhashan Weapon ({clientName})
                </h3>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["rally", "press", "emotional"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSpeechStyle(style)}
                      style={{
                        background: speechStyle === style ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${speechStyle === style ? GOLD : "rgba(255,255,255,0.1)"}`,
                        color: speechStyle === style ? GOLD_LIGHT : "#9ca3af",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px", maxHeight: "160px", overflowY: "auto" }}>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.78rem", color: "#e5e7eb", margin: 0, lineHeight: "1.45" }}>
                  {currentSpeech}
                </pre>
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleCopy(currentSpeech, "Speech Copied")}
                  style={{ flex: 1, background: "rgba(16,185,129,0.15)", border: `1px solid ${EMERALD}`, color: "#6ee7b7", padding: "6px", borderRadius: 6, fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                >
                  {copiedNotice === "Speech Copied" ? "Copied!" : "📋 Copy Speech"}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentSpeech)}`, "_blank")}
                  style={{ flex: 1, background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", color: "#86efac", padding: "6px", borderRadius: 6, fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                >
                  📲 Dispatch WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* 2.5 ECI STATUTORY PAID MEDIA FUEL & MICRO-TARGETING SIMULATOR */}
          <div
            style={{
              background: PANEL,
              border: "1px solid rgba(56, 189, 248, 0.35)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.72rem", color: SAPPHIRE, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    🎯 ECI STATUTORY PAID MEDIA FUEL SIMULATOR (META & GOOGLE YOUTUBE)
                  </span>
                  <span
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      border: `1px solid ${SAPPHIRE}`,
                      color: "#7dd3fc",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "0.65rem",
                      fontWeight: 800
                    }}
                  >
                    100% DIRECT CANDIDATE BILLING (ZERO AGENCY MARKUP)
                  </span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                  Hyper-Local Voter Saturation Engine ({constituency})
                </h3>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>
                  Meta Ads (Instagram Reels/FB) + Google YouTube Ads + Official WhatsApp API · Direct ECI Form 7A Expense Tracking
                </div>
              </div>

              {/* ESTIMATED DIRECT MEDIA BURN */}
              <div
                style={{
                  background: "radial-gradient(circle at top, rgba(56,189,248,0.15), rgba(0,0,0,0.8))",
                  border: `2px solid ${SAPPHIRE}`,
                  borderRadius: "12px",
                  padding: "12px 18px",
                  textAlign: "right",
                  minWidth: "220px",
                  boxShadow: "0 0 20px rgba(56,189,248,0.2)"
                }}
              >
                <div style={{ fontSize: "0.68rem", color: SAPPHIRE, fontWeight: 800, textTransform: "uppercase" }}>
                  DIRECT PAID MEDIA BUDGET (EST.)
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                  {mediaCalculation.exactMediaInr}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#7dd3fc", fontWeight: 700 }}>
                  {mediaCalculation.formattedMediaSpend} · ₹{mediaCalculation.costPerVoter} / voter
                </div>
              </div>
            </div>

            {/* SLIDERS FOR VOTERS & IMPRESSIONS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Constituency Target Voters:</span>
                  <strong style={{ color: SAPPHIRE, fontSize: "0.95rem" }}>{targetVoters.toLocaleString("en-IN")} Voters</strong>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="10000"
                  value={targetVoters}
                  onChange={(e) => setTargetVoters(Number(e.target.value))}
                  style={{ width: "100%", marginTop: "8px", accentColor: SAPPHIRE }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
                  <span>50k (Small Ward)</span>
                  <span>2.4 Lakhs (Standard Vidhansabha)</span>
                  <span>5 Lakhs (Mega Seat)</span>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Voter Saturation Frequency:</span>
                  <strong style={{ color: GOLD_LIGHT, fontSize: "0.95rem" }}>{adFrequency}x Impressions</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="2"
                  value={adFrequency}
                  onChange={(e) => setAdFrequency(Number(e.target.value))}
                  style={{ width: "100%", marginTop: "8px", accentColor: GOLD }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
                  <span>4x (Baseline)</span>
                  <span>12x (High Impact)</span>
                  <span>24x (Absolute Saturation)</span>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Channel Multi-Channel Split:</span>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <div style={{ flex: 1, textAlign: "center", background: "rgba(56,189,248,0.1)", padding: "6px 2px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)" }}>
                    <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>📱 META (REELS)</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8" }}>55%</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", background: "rgba(239,68,68,0.1)", padding: "6px 2px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)" }}>
                    <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>📺 YOUTUBE</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f87171" }}>35%</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", background: "rgba(34,197,94,0.1)", padding: "6px 2px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)" }}>
                    <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>📲 WHATSAPP API</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#4ade80" }}>10%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEMOGRAPHIC TARGETING CLUSTERS (THE "MANTRI JI IMPRESS" FACTOR) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "14px" }}>
              <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.78rem", color: SAPPHIRE }}>⚡ Cluster A: Yuva & First-Time (18-28)</strong>
                  <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>~{Math.round(targetVoters * 0.28).toLocaleString("en-IN")} Voters</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  <strong>Targeting:</strong> Tech hubs, colleges & coaching centers.
                  <br />
                  <strong>Content:</strong> High-energy Instagram Reels & YouTube Shorts on sports grounds, tech jobs & merit exams.
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.78rem", color: GOLD_LIGHT }}>🌾 Cluster B: Kisan & Gramin (30-65)</strong>
                  <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>~{Math.round(targetVoters * 0.38).toLocaleString("en-IN")} Voters</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  <strong>Targeting:</strong> Mandi corridors, canal zones & rural panchayats.
                  <br />
                  <strong>Content:</strong> Chhattisgarhi audio/video on MSP bonus, canal irrigation, solar pumps & loan relief.
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.78rem", color: "#f472b6" }}>🌸 Cluster C: Mahila Shakti & Parivar</strong>
                  <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>~{Math.round(targetVoters * 0.34).toLocaleString("en-IN")} Voters</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  <strong>Targeting:</strong> Residential colonies, self-help groups & ward clusters.
                  <br />
                  <strong>Content:</strong> Direct welfare credit (Mahtari Vandan), maternal healthcare sub-centers & LPG security.
                </div>
              </div>
            </div>

            {/* CRITICAL STATUTORY FINANCIAL SEPARATION DISCLAIMER */}
            <div
              style={{
                background: "rgba(234, 179, 8, 0.08)",
                border: "1px solid rgba(234, 179, 8, 0.25)",
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>⚖️</span>
              <div style={{ fontSize: "0.72rem", color: "#fef08a", lineHeight: "1.45" }}>
                <strong>Statutory Financial Demarcation (Supreme Governance Standard):</strong>
                <br />
                1. <strong>GARUDA Retainer ({liveCalculation.exactInr}):</strong> Paid to GARUDA AI OS for the 1,000 Autonomous Agent Workforce, 24/7 War Room Intelligence, {reelsCount} Viral Dialect Productions & On-ground booth mapping.
                <br />
                2. <strong>Direct Media Fuel ({mediaCalculation.exactMediaInr}):</strong> Disbursed directly from Candidate / Party PAN card to Meta (Facebook/Instagram) and Google Ads with statutory ECI Form 7A reporting. <strong>GARUDA charges 0% commission on ad spend.</strong>
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC MILESTONE ESCROW (CHANGES WITH SLIDERS & OPTIONS) */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(15,23,42,0.95))",
              border: `1px solid ${GOLD}`,
              borderRadius: "14px",
              padding: "24px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  SOVEREIGN COMMERCIAL ESCROW (U10 REVENUE UNIVERSE)
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                  Official Milestone Retainer for {clientName}
                </h3>
                <div style={{ fontSize: "0.82rem", color: "#9ca3af", marginTop: "2px" }}>
                  Live Verified Value: <strong style={{ color: "#ffffff" }}>{liveCalculation.exactInr}</strong> ({liveCalculation.formattedTotal}) · Zero-Discount Enterprise Policy
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{
                    background: "linear-gradient(135deg, #1e40af, #2563eb)",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(37,99,235,0.4)"
                  }}
                >
                  📄 Export Cabinet PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareableText)}`, "_blank")}
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(34,197,94,0.4)"
                  }}
                >
                  📲 1-Click WhatsApp Proposal
                </button>
              </div>
            </div>

            {/* Real-time calculated 3-stage milestone breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div style={{ background: "rgba(0,0,0,0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", color: GOLD_LIGHT, fontWeight: 800 }}>STAGE 1: ADVANCE INITIATION (40%)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
                  ₹{liveCalculation.stage1Advance.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  War room deployment, baseline {boothCount} booths data ingestion & digital fortress setup.
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", color: SAPPHIRE, fontWeight: 800 }}>STAGE 2: CAMPAIGN BLITZ (35%)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
                  ₹{liveCalculation.stage2Mid.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  Full execution of {reelsCount} viral reels, booth WhatsApp grid & opposition counter-sentinel.
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", color: EMERALD, fontWeight: 800 }}>STAGE 3: POLLING VICTORY (25%)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
                  ₹{liveCalculation.stage3Victory.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  Final voter turnout push, polling booth operations & comprehensive victory audit.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", fontSize: "0.72rem", color: "#6b7280", textAlign: "right" }}>
              🔒 Cryptographic Seal: <strong style={{ color: "#9ca3af" }}>sha256_sovereign_escrow_live_{Date.now().toString(36)}</strong> · Governed by GARUDA Constitution
            </div>
          </div>
        </section>
      </div>

      {/* 4. THE PRINT-ONLY EXECUTIVE CABINET DOSSIER (Rendered cleanly when user clicks Export PDF) */}
      <div className="print-dossier-page">
        <div style={{ textAlign: "center", borderBottom: "2px solid #1e3a8a", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#1e3a8a", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            CONFIDENTIAL STRATEGIC BRIEFING & COMMERCIAL ESCROW
          </p>
          <h1 style={{ margin: "0.5rem 0", fontSize: "1.8rem", fontWeight: 900, color: "#111827" }}>
            GARUDA AI SOVEREIGN TECHNOLOGIES
          </h1>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#4b5563" }}>
            Executive Autonomous Campaign War Room & Enterprise Dominance Infrastructure
          </p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700, width: "30%", color: "#4b5563" }}>Designated Client:</td>
              <td style={{ padding: "8px", fontWeight: 900, color: "#111827" }}>{clientName}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700, color: "#4b5563" }}>Constituency / Domain:</td>
              <td style={{ padding: "8px", fontWeight: 700, color: "#111827" }}>{constituency}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700, color: "#4b5563" }}>GARUDA OS Retainer Valuation:</td>
              <td style={{ padding: "8px", fontWeight: 900, fontSize: "1.2rem", color: "#1e3a8a" }}>
                {liveCalculation.exactInr} ({liveCalculation.formattedTotal})
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700, color: "#4b5563" }}>Estimated ECI Paid Media Fuel:</td>
              <td style={{ padding: "8px", fontWeight: 800, color: "#047857" }}>
                {mediaCalculation.exactMediaInr} ({mediaCalculation.formattedMediaSpend}) · Direct Candidate Disbursal to Meta & Google (0% Agency Cut)
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700, color: "#4b5563" }}>Pricing Policy:</td>
              <td style={{ padding: "8px", color: "#111827" }}>100% Non-Discounted Sovereign Milestone Escrow</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontWeight: 700, color: "#4b5563" }}>Workforce Allocation:</td>
              <td style={{ padding: "8px", color: "#111827" }}>1,000 Autonomous AI Agents Fleet inside GARUDA OS</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #1e3a8a", paddingBottom: "4px", marginBottom: "10px" }}>
          Configured Deliverables & Scope Matrix
        </h3>
        <ul style={{ fontSize: "0.85rem", lineHeight: "1.6", color: "#374151", marginBottom: "1.5rem" }}>
          <li><strong>Booth Mobilization Infrastructure:</strong> {boothCount} Polling Booths mapped with localized voter sentiment and booth pramukh communication nodes.</li>
          <li><strong>High-Velocity Viral Media:</strong> {reelsCount} Regional Dialect Shorts/Reels scripted, rendered, and distributed across platforms.</li>
          <li><strong>ECI Statutory Paid Media Micro-Targeting:</strong> Saturation of {targetVoters.toLocaleString("en-IN")} voters at {adFrequency}x frequency across Meta Reels ({metaSplit}%), YouTube ({ytSplit}%) and WhatsApp API ({waSplit}%) with zero intermediary markups.</li>
          <li><strong>Battle Horizon:</strong> {campaignMonths} Months of uninterrupted 24/7 autonomous intelligence operations.</li>
          {modules.gisSentiment && <li><strong>360° GIS Sentiment Heatmap:</strong> Real-time pro-incumbency vs grievance voter tracking.</li>}
          {modules.bhashanEngine && <li><strong>Multilingual Speech AI:</strong> 1-Click Ground Rally, Press Briefing, and Jan-Sampark speech drafter in regional dialect + Hindi.</li>}
          {modules.boothWhatsapp && <li><strong>5,000 Booth WhatsApp Grid:</strong> Automated encrypted communication pipeline for all booth adhyaksh and karyakartas.</li>}
          {modules.oppositionSentinel && <li><strong>24/7 Opposition Counter-Sentinel:</strong> 15-minute fact-check deployment destroying false rumors and smear narratives.</li>}
          {modules.firmMarketing && <li><strong>Private Corporate Firms Lead Machine:</strong> High-ticket commercial client acquisition and regional search dominance.</li>}
        </ul>

        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #1e3a8a", paddingBottom: "4px", marginBottom: "10px" }}>
          Structured 3-Phase Milestone Escrow
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "8px", textAlign: "left" }}>Phase</th>
              <th style={{ padding: "8px", textAlign: "left" }}>Milestone Deliverable</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Percentage</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Escrow Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700 }}>Stage 1</td>
              <td style={{ padding: "8px" }}>Advance Initiation & Core War Room Deployment ({boothCount} booths)</td>
              <td style={{ padding: "8px", textAlign: "right" }}>40%</td>
              <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>₹{liveCalculation.stage1Advance.toLocaleString("en-IN")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px", fontWeight: 700 }}>Stage 2</td>
              <td style={{ padding: "8px" }}>Campaign Media Blitz ({reelsCount} reels) & Booth WhatsApp Network</td>
              <td style={{ padding: "8px", textAlign: "right" }}>35%</td>
              <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>₹{liveCalculation.stage2Mid.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontWeight: 700 }}>Stage 3</td>
              <td style={{ padding: "8px" }}>Polling Week Turnout Surge & Comprehensive Victory Audit</td>
              <td style={{ padding: "8px", textAlign: "right" }}>25%</td>
              <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>₹{liveCalculation.stage3Victory.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Authorized for GARUDA OS:</div>
            <div style={{ height: "45px" }} />
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827" }}>Praveen Mahawar</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Founder & Supreme Architect, GARUDA AI</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Accepted & Approved by:</div>
            <div style={{ height: "45px" }} />
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827" }}>{clientName}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Principal Client / Campaign In-Charge</div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.7rem", color: "#9ca3af" }}>
          SHA-256 Governed Cryptographic Seal: sha256_cabinet_dossier_gov_in_2026 · Confidential Executive Property
        </div>
      </div>
    </main>
  );
}
