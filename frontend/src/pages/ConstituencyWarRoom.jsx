import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

import { tokens } from "../components/war-room/tokens";
import EvidenceDrawer from "../components/war-room/EvidenceDrawer";
import DeepDiveModal from "../components/war-room/DeepDiveModal";
import MetaConnectionPanel from "../components/war-room/MetaConnectionPanel";

// Benchmark data for Thane 148 default

// 🏛️ Official GARUDA War Room Sovereign Palette (Warm Ivory, Graphite & Luxury Gold)
const wp = {
  // Foundation Canvas (Warm Ivory / Private Bank prestige)
  canvas: "#F7F3EA",
  canvasIvory: "#FBF9F4",
  canvasSubtle: "#F5F1E8",
  card: "#FFFFFF",

  // Text Hierarchy (Graphite, Deep Graphite & Muted Text)
  text: "#171717",
  textBody: "#292B30",
  deepGraphite: "#0F1110",
  muted: "#6F6A61",
  subtle: "#8E887E",

  // Signature GARUDA Gold (Restrained Luxury Gold)
  gold: "#B8862B",
  goldPrimary: "#B8862B",
  goldLuxury: "#C99A3A",
  goldLight: "#E7C982",
  goldMuted: "#D8B66A",
  goldDeep: "#9E6D1C",
  goldGradient: "linear-gradient(135deg, #E7C982 0%, #C99A3A 50%, #B8862B 100%)",
  goldHalo: "rgba(184, 134, 43, 0.12)",

  // Status Accents (Restrained)
  green: "#059669",
  greenLive: "#10B981",
  greenBg: "rgba(5, 150, 105, 0.08)",
  amber: "#D97706",
  amberBg: "rgba(217, 119, 6, 0.08)",
  red: "#DC2626",
  redBg: "rgba(220, 38, 38, 0.08)",
  cyan: "#0284C7",
  cyanBg: "rgba(2, 132, 199, 0.08)",

  // Borders & Shadows
  border: "#E6DCC8",
  borderSubtle: "rgba(23, 24, 27, 0.06)",
  borderGold: "rgba(184, 134, 43, 0.35)",
  shadow: "0 8px 30px rgba(40, 30, 15, 0.06)",
  shadowSm: "0 2px 10px rgba(40, 30, 15, 0.04)"
};

const INITIAL_THANE = {
  id: "thane-148",
  name: "Thane (148)",
  canonicalName: "148 - Thane Assembly Constituency",
  district: "Thane",
  state: "Maharashtra",
  assemblyNumber: 148,
  type: "Urban Mega-Hub",
  electoralBase: {
    registeredElectors: 428671,
    electorsStatus: "VERIFIED",
    source: "ECI Final Roll 2024",
    maleElectors: 224190,
    femaleElectors: 204481
  },
  pollingStructure: {
    totalBooths: 351,
    activeBooths: 348,
    gapBooths: 3,
    boothsStatus: "VERIFIED"
  },
  historicalTurnout: {
    lastElectionTurnout: "52.84%",
    turnoutStatus: "VERIFIED"
  },
  historicalMargin: {
    winningMarginPercentage: "13.56%",
    marginStatus: "VERIFIED"
  }
};

export default function ConstituencyWarRoom() {
  const navigate = useNavigate();
  const p = tokens.palette;

  // Active State
  const [constituency, setConstituency] = useState(INITIAL_THANE);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, intel, booths, pwa, voter, rebuttal, cybershield, meta, analytics, commercial
  const [activeMode, setActiveMode] = useState("Executive"); // Executive, Tactical, Field, Audit
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Modals & Drawers
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState(null);
  const [activeEvidence, setActiveEvidence] = useState(null);
  const [deepDiveModuleId, setDeepDiveModuleId] = useState(null);
  const [metaDiscovering, setMetaDiscovering] = useState(false);
  const [metaResult, setMetaResult] = useState(null);
  const [commercialModalOpen, setCommercialModalOpen] = useState(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      setCurrentTime(`${dateStr} | ${timeStr} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Mode Change
  const handleModeChange = (modeId) => {
    setActiveMode(modeId);
  };

  // Handle Generate 12-Section PDF Dossier
  const handleGenerateDossier = async () => {
    setIsGeneratingPdf(true);
    setDossierModalOpen(true);
    try {
      const res = await fetch("/api/war-room/dossier/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constituencyData: constituency })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedPdf(data.data);
      } else {
        setGeneratedPdf({ error: data.message || "Failed to generate PDF" });
      }
    } catch (err) {
      setGeneratedPdf({ error: err.message });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Meta Discover Pages
  const handleMetaDiscover = async () => {
    setMetaDiscovering(true);
    try {
      const res = await fetch("/api/war-room/meta/discover");
      const data = await res.json();
      setMetaResult(data);
    } catch (e) {
      setMetaResult({ success: false, message: e.message });
    } finally {
      setMetaDiscovering(false);
    }
  };

  // Quick Action Switcher
  const handleQuickAction = (action) => {
    if (action === "dossier") handleGenerateDossier();
    if (action === "rebuttal") setActiveTab("rebuttal");
    if (action === "cybershield") setActiveTab("cybershield");
    if (action === "commercial") setCommercialModalOpen(true);
  };

  return (
    <div
      style={{
        backgroundColor: wp.canvas,
        color: wp.text,
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflowX: "hidden"
      }}
    >
      <SEOHead
        title="GARUDA OS Sovereign War Room | AI-Powered Constituency Intelligence"
        description="High-command constituency war room for election campaigns. Live booth signals, Meta integration, 15-minute rapid rebuttal, ground cadre PWA, and single-seat territorial exclusivity."
        canonical="https://www.garudaos.in/war-room"
      />

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR                                                           */}
      {/* ========================================================================= */}
      <aside
        style={{
          width: "264px",
          backgroundColor: wp.canvasIvory,
          borderRight: "1px solid " + wp.border,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
          padding: "20px 14px"
        }}
      >
        {/* LOGO BRANDING */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 8px 20px 8px", borderBottom: "1px solid " + wp.borderSubtle, marginBottom: "16px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "11px",
              background: wp.goldHalo,
              border: "1.5px solid " + wp.goldMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(184, 134, 43, 0.2)"
            }}
          >
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="goldGradBrand" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E7C982" />
                  <stop offset="50%" stopColor="#C99A3A" />
                  <stop offset="100%" stopColor="#9E6D1C" />
                </linearGradient>
              </defs>
              <path d="M 50 20 L 76 34 L 88 56 L 76 60 L 64 48 L 50 64 L 36 48 L 24 60 L 12 56 L 24 34 Z" fill="url(#goldGradBrand)" />
              <polygon points="50,14 62,38 78,42 66,54 70,72 50,60 30,72 34,54 22,42 38,38" fill="url(#goldGradBrand)" />
              <polygon points="50,56 60,78 50,72 40,78" fill="url(#goldGradBrand)" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: wp.deepGraphite, letterSpacing: "1.2px", lineHeight: 1.1, fontFamily: "'Inter', sans-serif" }}>
              GARUDA OS
            </div>
            <div style={{ fontSize: "9.5px", fontWeight: 750, color: wp.muted, letterSpacing: "1.4px", textTransform: "uppercase", marginTop: "3px" }}>
              SOVEREIGN WAR ROOM
            </div>
          </div>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
          {[
            { id: "dashboard", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>, title: "Dashboard", sub: "Command Center" },
            { id: "intel", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><polygon points="12 2 2 8.5 2 15.5 12 22 22 15.5 22 8.5 12 2"/><circle cx="12" cy="12" r="3"/></svg>, title: "Constituency Intel", sub: "Data & Dossier" },
            { id: "booths", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: "Booth Management", sub: "348 / 351 Booths" },
            { id: "pwa", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title: "Cadre Field PWA", sub: "Live Field Telemetry" },
            { id: "voter", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Voter Insights", sub: "Demographics & Clusters" },
            { id: "rebuttal", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>, title: "Crisis Rebuttal", sub: "15-Min Rapid Response" },
            { id: "cybershield", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, title: "CyberShield", sub: "Legal Notices & Takedown" },
            { id: "meta", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><path d="M12 12c-2.5-3.5-5.5-4-8-1.5S2 16 5 17s6-1.5 7-5c1-3.5 4-6 7-5s4 4 1.5 6.5-5.5 2-8-1.5z"/></svg>, title: "Meta Integration", sub: "Ads, Pages & Publishing" },
            { id: "analytics", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: "War Room Analytics", sub: "Performance & Reports" },
            { id: "commercial", icon: (active) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? wp.goldPrimary : wp.muted} strokeWidth={active ? 2.2 : 1.8}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title: "Commercial", sub: "₹35L Sovereign Plan" }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "pwa") {
                    navigate("/booth-cadre");
                  } else if (item.id === "commercial") {
                    setCommercialModalOpen(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(184, 134, 43, 0.12)" : "transparent",
                  border: isActive ? "1px solid " + wp.goldMuted : "1px solid transparent",
                  borderLeft: isActive ? "3px solid " + wp.goldPrimary : "1px solid transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon(isActive)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: isActive ? 750 : 600, color: isActive ? wp.deepGraphite : wp.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "10.5px", color: isActive ? wp.goldPrimary : wp.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px" }}>
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* BOTTOM SINGLE-SEAT EXCLUSIVITY CARD */}
        <div
          style={{
            marginTop: "16px",
            background: wp.card,
            boxShadow: wp.shadowSm,
            border: "1px solid " + wp.border,
            borderRadius: "12px",
            padding: "13px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: wp.goldHalo,
              border: "1px solid " + wp.borderGold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px"
            }}
          >
            🔒
          </div>
          <div>
            <div style={{ fontSize: "11.5px", fontWeight: 800, color: wp.goldPrimary, letterSpacing: "0.5px" }}>
              Single-Seat Exclusivity
            </div>
            <div style={{ fontSize: "9.5px", color: wp.muted, fontWeight: 700, letterSpacing: "0.4px", marginTop: "2px" }}>
              ONLY ONE CANDIDATE PER SEAT
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWPORT (TOPBAR + CONTENT)                                       */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* TOPBAR */}
        <header
          style={{
            height: "68px",
            backgroundColor: "rgba(251, 249, 244, 0.94)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid " + wp.border,
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 30
          }}
        >
          {/* LEFT: CONSTITUENCY DROPDOWN + LIVE PILL */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: wp.card,
                boxShadow: wp.shadowSm,
                border: "1px solid " + wp.border,
                borderRadius: "9px",
                padding: "7px 14px",
                cursor: "pointer"
              }}
            >
              <span style={{ fontSize: "15px" }}>🛡️</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 750, color: wp.deepGraphite }}>{constituency.name}</div>
                <div style={{ fontSize: "10px", color: wp.muted, marginTop: "1px" }}>{constituency.state} · Assembly</div>
              </div>
              <span style={{ fontSize: "10px", color: wp.muted, marginLeft: "4px" }}>▾</span>
            </div>

            {/* LIVE PILL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: wp.greenBg,
                border: "1px solid rgba(5, 150, 105, 0.35)",
                borderRadius: "20px",
                padding: "4px 11px",
                fontSize: "11.5px",
                fontWeight: 750,
                color: wp.green
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: wp.green, boxShadow: "0 0 8px rgba(5, 150, 105, 0.4)" }} />
              LIVE
            </div>
          </div>

          {/* CENTER: SEARCH INPUT */}
          <div
            style={{
              position: "relative",
              maxWidth: "400px",
              width: "100%",
              margin: "0 24px"
            }}
          >
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: wp.muted }}>
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search booth, voter group, issue, report..."
              style={{
                width: "100%",
                background: wp.card,
                border: "1px solid " + wp.border,
                borderRadius: "9px",
                padding: "9px 42px 9px 36px",
                fontSize: "12.5px",
                color: wp.text,
                outline: "none"
              }}
            />
            <span
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: wp.canvasSubtle,
                border: "1px solid " + wp.border,
                borderRadius: "5px",
                padding: "2.5px 7px",
                fontSize: "10.5px",
                color: wp.muted,
                fontFamily: "monospace"
              }}
            >
              ⌘ K
            </span>
          </div>

          {/* RIGHT: MODE SWITCHER + NOTIFICATION + USER PROFILE */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* MODE SWITCHER */}
            <div
              style={{
                display: "flex",
                background: wp.canvasSubtle,
                border: "1px solid " + wp.border,
                borderRadius: "9px",
                padding: "3.5px"
              }}
            >
              {["Executive", "Tactical", "Field", "Audit"].map((mode) => {
                const isSelected = activeMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    style={{
                      background: isSelected ? wp.goldGradient : "transparent",
                      color: isSelected ? wp.deepGraphite : wp.muted,
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: "11.5px",
                      padding: "6px 14px",
                      borderRadius: "7px",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 2px 8px rgba(184, 134, 43, 0.25)" : "none"
                    }}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>

            {/* Operational Posture Indicator */}
            <div style={{ display: "none" }} aria-hidden="true">
              {`ACTIVE POSTURE // ${activeMode.toUpperCase()}`}
            </div>

            {/* NOTIFICATION BELL */}
            <div style={{ position: "relative", cursor: "pointer", fontSize: "17px", color: wp.muted }}>
              🔔
              <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "7px", height: "7px", borderRadius: "50%", background: wp.red }} />
            </div>

            {/* USER PROFILE */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid " + wp.border, paddingLeft: "16px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: wp.goldHalo,
                  border: "1.5px solid " + wp.goldLuxury,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  color: wp.goldPrimary
                }}
              >
                PM
              </div>
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: 750, color: wp.deepGraphite, lineHeight: 1.1 }}>Praveen Mahawar</div>
                <div style={{ fontSize: "10px", color: wp.muted, marginTop: "2px" }}>Founder • GARUDA OS</div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* HEADER ROW: TITLE + CLOCK + GENERATE DOSSIER BUTTON */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <linearGradient id="goldGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E7C982" />
                      <stop offset="50%" stopColor="#C99A3A" />
                      <stop offset="100%" stopColor="#9E6D1C" />
                    </linearGradient>
                  </defs>
                  <path d="M 50 20 L 76 34 L 88 56 L 76 60 L 64 48 L 50 64 L 36 48 L 24 60 L 12 56 L 24 34 Z" fill="url(#goldGradHeader)" />
                  <polygon points="50,14 62,38 78,42 66,54 70,72 50,60 30,72 34,54 22,42 38,38" fill="url(#goldGradHeader)" />
                  <polygon points="50,56 60,78 50,72 40,78" fill="url(#goldGradHeader)" />
                </svg>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", fontWeight: 750, letterSpacing: "0.18em", textTransform: "uppercase", color: wp.goldPrimary, marginBottom: "6px" }}>
                  <span>GARUDA OS</span>
                  <span style={{ color: wp.subtle }}>›</span>
                  <span>CONSTITUENCY WAR ROOM</span>
                </div>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 700, color: wp.deepGraphite, margin: 0, letterSpacing: "-0.015em", lineHeight: 1.15 }}>
                  Constituency War Room
                </h1>
                <p style={{ fontSize: "13px", color: wp.muted, margin: "4px 0 0 0" }}>
                  AI-Powered Intelligence. Real-World Impact.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: wp.deepGraphite, fontWeight: 600 }}>
                  {currentTime || "Tue, 3 Sep 2024 | 14:28:17 IST"}
                </div>
                <div style={{ fontSize: "11px", color: wp.green, fontWeight: 750, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", marginTop: "2px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: wp.green, boxShadow: "0 0 8px rgba(5, 150, 105, 0.4)" }} />
                  System Online
                </div>
              </div>

              <button
                onClick={handleGenerateDossier}
                style={{
                  background: wp.goldGradient,
                  color: wp.deepGraphite,
                  border: "1px solid " + wp.goldLuxury,
                  borderRadius: "9px",
                  padding: "11px 22px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  boxShadow: "0 4px 16px rgba(184, 134, 43, 0.28)",
                  letterSpacing: "0.02em",
                  transition: "all 0.15s ease"
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F1110" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Generate 12-Section Dossier
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 1: 5 KEY METRIC KPI CARDS                                             */}
          {/* ========================================================================= */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>

            {/* Card 1: Total Booths */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 650, letterSpacing: "0.03em", textTransform: "uppercase" }}>Total Booths ↻</span>
                <span style={{ border: "1px solid " + wp.borderGold, background: wp.goldHalo, color: wp.goldPrimary, padding: "5px 7px", borderRadius: "7px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={wp.goldPrimary} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
              </div>
              <div style={{ fontSize: "34px", fontWeight: 800, color: wp.deepGraphite, fontFamily: "'JetBrains Mono', 'Inter', monospace", lineHeight: 1.1 }}>351</div>
              <div style={{ fontSize: "11px", color: wp.green, marginTop: "6px", fontWeight: 650 }}>
                ● 348 Active <span style={{ color: wp.amber }}>• 3 Gap</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                <div style={{ flex: 1, height: "5px", background: "rgba(23, 24, 27, 0.06)", borderRadius: "3px", overflow: "hidden", marginRight: "10px" }}>
                  <div style={{ width: "99.1%", height: "100%", background: wp.green, borderRadius: "3px" }} />
                </div>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 700 }}>99.1%</span>
              </div>
            </div>

            {/* Card 2: Active Cadre */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 650, letterSpacing: "0.03em", textTransform: "uppercase" }}>Active Cadre</span>
                <span style={{ border: "1px solid rgba(2, 132, 199, 0.3)", background: wp.cyanBg, color: wp.cyan, padding: "5px 7px", borderRadius: "7px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={wp.cyan} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
              </div>
              <div style={{ fontSize: "34px", fontWeight: 800, color: wp.deepGraphite, fontFamily: "'JetBrains Mono', 'Inter', monospace", lineHeight: 1.1 }}>286</div>
              <div style={{ fontSize: "11px", color: wp.green, marginTop: "6px", fontWeight: 650 }}>
                ● Live from Field
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                <div style={{ flex: 1, height: "5px", background: "rgba(23, 24, 27, 0.06)", borderRadius: "3px", overflow: "hidden", marginRight: "10px" }}>
                  <div style={{ width: "81.5%", height: "100%", background: wp.cyan, borderRadius: "3px" }} />
                </div>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 700 }}>81.5%</span>
              </div>
            </div>

            {/* Card 3: Voter Base */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 650, letterSpacing: "0.03em", textTransform: "uppercase" }}>Voter Base (Est.)</span>
                <span style={{ border: "1px solid rgba(217, 119, 6, 0.3)", background: wp.amberBg, color: wp.amber, padding: "5px 7px", borderRadius: "7px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={wp.amber} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
              </div>
              <div style={{ fontSize: "34px", fontWeight: 800, color: wp.deepGraphite, fontFamily: "'JetBrains Mono', 'Inter', monospace", lineHeight: 1.1 }}>4,28,671</div>
              <div style={{ fontSize: "11px", color: wp.muted, marginTop: "6px" }}>
                From ECI Data (2024)
              </div>
            </div>

            {/* Card 4: Key Issues */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 650, letterSpacing: "0.03em", textTransform: "uppercase" }}>Key Issues</span>
                <span style={{ border: "1px solid rgba(2, 132, 199, 0.3)", background: wp.cyanBg, color: wp.cyan, padding: "5px 7px", borderRadius: "7px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={wp.cyan} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </span>
              </div>
              <div style={{ fontSize: "34px", fontWeight: 800, color: wp.deepGraphite, fontFamily: "'JetBrains Mono', 'Inter', monospace", lineHeight: 1.1 }}>12</div>
              <div style={{ fontSize: "11px", color: wp.muted, marginTop: "6px" }}>
                Top Civic Themes
              </div>
            </div>

            {/* Card 5: Sentiment */}
            <div
              style={{
                background: wp.card,
                boxShadow: wp.shadow,
                border: "1px solid " + wp.border,
                borderRadius: "14px",
                padding: "18px 20px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Tactical Warriors Backdrop Artwork */}
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", opacity: 0.08, pointerEvents: "none", overflow: "hidden" }}>
                <svg viewBox="0 0 120 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                  <path d="M0,100 L20,70 L35,80 L55,50 L75,65 L95,30 L110,45 L120,20 L120,100 Z" fill={wp.green} />
                  <circle cx="80" cy="30" r="14" fill={wp.goldPrimary} opacity="0.3" />
                </svg>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", position: "relative", zIndex: 1 }}>
                <span style={{ fontSize: "11px", color: wp.muted, fontWeight: 650, letterSpacing: "0.03em", textTransform: "uppercase" }}>Sentiment</span>
                <span style={{ color: wp.green, fontSize: "14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={wp.green} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </span>
              </div>
              <div style={{ fontSize: "34px", fontWeight: 800, color: wp.green, fontFamily: "'JetBrains Mono', 'Inter', monospace", lineHeight: 1.1, position: "relative", zIndex: 1 }}>+12%</div>
              <div style={{ fontSize: "11px", color: wp.muted, marginTop: "6px", position: "relative", zIndex: 1 }}>
                Positive Trend
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* ROW 2: MIDDLE OPERATIONAL GRID (3 COLUMNS: MAP | FEED | META & PWA)       */}
          {/* ========================================================================= */}
          <div style={{ display: "grid", gridTemplateColumns: "1.65fr 0.85fr 0.85fr", gap: "18px" }}>

            {/* COLUMN 1: CONSTITUENCY MAP (BOOTH LEVEL) - VISUAL ANCHOR */}
            <div
              style={{
                background: wp.card,
                boxShadow: wp.shadow,
                border: "1px solid " + wp.border,
                borderRadius: "14px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: wp.deepGraphite, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>
                    Constituency Map — Booth Level
                  </div>
                  <div style={{ fontSize: "10.5px", color: wp.muted, marginTop: "2px", letterSpacing: "0.02em" }}>
                    Thane (148) • Spatial Field Cadre & Polling Station Grid
                  </div>
                </div>
              </div>

              {/* HIGH-TECH VECTOR MAP VISUALIZATION (Dark satellite map surface inside for contrast) */}
              <div
                style={{
                  flex: 1,
                  minHeight: "410px",
                  background: "#080B11",
                  borderRadius: "12px",
                  border: "1.5px solid rgba(216, 182, 106, 0.3)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {/* FLOATING BOOTH STATUS LEGEND BOX */}
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    background: "rgba(8, 11, 17, 0.94)",
                    border: "1px solid rgba(201, 154, 58, 0.4)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    zIndex: 10,
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.6)"
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#E7C982", fontWeight: 750, marginBottom: "6px", letterSpacing: "0.5px" }}>Booth Status</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                    <span style={{ color: "#10B981", fontWeight: 650 }}>● Active (348)</span>
                    <span style={{ color: "#EF4444", fontWeight: 650 }}>● Inactive (2)</span>
                    <span style={{ color: "#F59E0B", fontWeight: 650 }}>● Gap (3)</span>
                  </div>
                </div>

                {/* Grid Overlay */}
                <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.15 }}>
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* High-Tech Vector Map with Gold Polygon Boundary */}
                <svg viewBox="0 0 500 350" style={{ width: "94%", height: "94%", zIndex: 1 }}>
                  {/* Subtle Arterial Network */}
                  <g stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.0">
                    <line x1="210" y1="50" x2="250" y2="185" />
                    <line x1="100" y1="185" x2="250" y2="185" />
                    <line x1="390" y1="200" x2="250" y2="185" />
                    <line x1="280" y1="285" x2="250" y2="185" />
                    <line x1="340" y1="90" x2="250" y2="185" />
                    <line x1="140" y1="250" x2="250" y2="185" />
                  </g>

                  {/* Outer Ward Polygon in Gold */}
                  <polygon
                    points="120,40 280,30 380,80 440,180 390,290 260,320 150,290 80,190 70,90"
                    fill="rgba(184, 134, 43, 0.12)"
                    stroke="#E7C982"
                    strokeWidth="2.4"
                    strokeDasharray="5 3"
                  />

                  {/* Ward Lines */}
                  <line x1="120" y1="40" x2="250" y2="185" stroke="rgba(255,255,255,0.12)" />
                  <line x1="280" y1="30" x2="250" y2="185" stroke="rgba(255,255,255,0.10)" />
                  <line x1="380" y1="80" x2="250" y2="185" stroke="rgba(255,255,255,0.10)" />
                  <line x1="440" y1="180" x2="250" y2="185" stroke="rgba(255,255,255,0.10)" />
                  <line x1="390" y1="290" x2="250" y2="185" stroke="rgba(255,255,255,0.10)" />
                  <line x1="150" y1="290" x2="250" y2="185" stroke="rgba(255,255,255,0.10)" />

                  {/* Ward Labels */}
                  <text x="210" y="55" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Ghodbunder</text>
                  <text x="340" y="90" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Kalwa</text>
                  <text x="375" y="195" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Mumbra</text>
                  <text x="90" y="105" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Kasarvadavali</text>
                  <text x="110" y="190" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Thane West</text>
                  <text x="145" y="245" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Thane East</text>
                  <text x="160" y="295" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Balkum</text>
                  <text x="290" y="290" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Vartak Nagar</text>
                  <text x="380" y="260" fill="#D1D5DB" fontSize="10" fontWeight="650" letterSpacing="0.5px">Kopri</text>

                  {/* Center Bold Label */}
                  <text x="250" y="185" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="800" letterSpacing="1.5px">
                    THANE (148)
                  </text>

                  {/* Dense Tactical Cluster of Green Active Booth Dots */}
                  {[
                    [210, 50], [225, 45], [195, 55], [240, 55], [215, 65], [250, 60], [230, 70], [180, 65], [190, 75],
                    [95, 110], [110, 100], [125, 115], [105, 125], [130, 95], [140, 110], [115, 135], [135, 130],
                    [330, 85], [350, 95], [320, 100], [360, 110], [335, 115], [315, 90], [345, 125], [370, 105],
                    [160, 290], [175, 280], [150, 275], [185, 295], [170, 305], [195, 285],
                    [100, 185], [115, 175], [125, 195], [110, 205], [90, 195], [135, 180], [140, 200], [120, 215],
                    [180, 140], [195, 135], [210, 145], [225, 130], [240, 140], [260, 135], [275, 145], [290, 140],
                    [170, 160], [185, 170], [200, 160], [220, 165], [280, 160], [295, 170], [310, 160],
                    [175, 195], [190, 210], [210, 200], [225, 210], [270, 200], [285, 210], [305, 195],
                    [135, 240], [150, 235], [145, 255], [160, 245], [130, 250], [155, 265], [140, 270],
                    [280, 285], [295, 275], [270, 295], [305, 290], [290, 305], [315, 280], [260, 300],
                    [370, 255], [385, 245], [360, 265], [395, 260], [380, 275], [365, 280], [400, 270],
                    [365, 190], [380, 180], [390, 200], [405, 185], [375, 210], [415, 195], [385, 220],
                    [160, 115], [175, 105], [205, 110], [220, 100], [235, 110], [250, 95], [265, 110], [280, 105],
                    [150, 150], [165, 135], [230, 155], [270, 150], [300, 130], [320, 140], [340, 150],
                    [160, 220], [180, 230], [200, 225], [220, 230], [240, 220], [260, 230], [280, 225], [300, 230], [320, 220],
                    [210, 250], [230, 260], [250, 250], [270, 260], [220, 275], [240, 280], [260, 270],
                    [330, 170], [345, 185], [360, 165], [325, 200], [340, 215], [355, 230]
                  ].map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3.2" fill="#10B981" />
                    </g>
                  ))}

                  {/* Inactive Red Dots */}
                  <circle cx="195" cy="115" r="4.2" fill="#EF4444" />
                  <circle cx="280" cy="245" r="4.2" fill="#EF4444" />

                  {/* Gap Yellow Dots */}
                  <circle cx="190" cy="210" r="4.2" fill="#F59E0B" />
                  <circle cx="310" cy="180" r="4.2" fill="#F59E0B" />
                  <circle cx="230" cy="95" r="4.2" fill="#F59E0B" />
                </svg>

                {/* Zoom Controls */}
                <div style={{ position: "absolute", right: "14px", bottom: "14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  <button style={{ width: "28px", height: "28px", background: "#161B22", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "6px", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  <button style={{ width: "28px", height: "28px", background: "#161B22", border: "1px solid rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "6px", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                </div>
              </div>
            </div>

            {/* COLUMN 2: BOOTH ACTIVITY FEED */}
            <div
              style={{
                background: wp.card,
                boxShadow: wp.shadow,
                border: "1px solid " + wp.border,
                borderRadius: "14px",
                padding: "22px",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: wp.deepGraphite, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>
                  Booth Activity Feed
                </div>
                <span style={{ background: wp.greenBg, color: wp.green, fontSize: "10px", fontWeight: 750, padding: "3px 10px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "4px", border: "1px solid rgba(5, 150, 105, 0.3)" }}>
                  <span>◆</span> Live
                </span>
              </div>

              {/* FEED LIST WITH RADAR PULSE DOTS */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
                {[
                  { id: "Booth 148-102", cadre: "Cadre Active", net: "4G", batt: "78%", time: "2 min ago" },
                  { id: "Booth 148-087", cadre: "Cadre Active", net: "5G", batt: "62%", time: "3 min ago" },
                  { id: "Booth 148-210", cadre: "Cadre Active", net: "4G", batt: "91%", time: "5 min ago" },
                  { id: "Booth 148-056", cadre: "Cadre Active", net: "4G", batt: "45%", time: "8 min ago" },
                  { id: "Booth 148-019", cadre: "Cadre Active", net: "5G", batt: "67%", time: "11 min ago" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: wp.canvasIvory,
                      border: "1px solid " + wp.border,
                      borderRadius: "9px",
                      padding: "11px 13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                      {/* Radar Pulse Double Ring */}
                      <div style={{ position: "relative", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ position: "absolute", width: "16px", height: "16px", borderRadius: "50%", border: "1px solid rgba(5, 150, 105, 0.4)" }} />
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: wp.green, boxShadow: "0 0 6px rgba(5, 150, 105, 0.4)" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: 750, color: wp.deepGraphite }}>{item.id}</div>
                        <div style={{ fontSize: "10.5px", color: wp.muted, marginTop: "1px" }}>
                          {item.cadre} • {item.net} • {item.batt}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "10.5px", color: wp.subtle }}>{item.time}</span>
                  </div>
                ))}
              </div>

              {/* VIEW ALL BOOTHS BUTTON */}
              <button
                onClick={() => setActiveTab("booths")}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  background: wp.canvasIvory,
                  border: "1px solid " + wp.border,
                  borderRadius: "8px",
                  padding: "10px",
                  color: wp.deepGraphite,
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                View All Booths →
              </button>
            </div>

            {/* COLUMN 3: META INTEGRATION + CADRE FIELD PWA (STACKED) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* META INTEGRATION CARD */}
              <div
                style={{
                  background: wp.card,
                  boxShadow: wp.shadow,
                  border: "1px solid " + wp.border,
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#0081FB", fontSize: "17px", fontWeight: 800 }}>♾️</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: wp.deepGraphite, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>Meta Integration</span>
                  </div>
                  <span style={{ background: wp.amberBg, color: wp.amber, border: "1px solid rgba(217, 119, 6, 0.4)", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "5px" }}>
                    PARTIAL
                  </span>
                </div>

                {/* META METRIC ROWS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: wp.muted }}>🔗 Graph API</span>
                    <span style={{ color: wp.green, fontWeight: 650 }}>● Connected (v21.0)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: wp.muted }}>💳 Ad Account</span>
                    <span style={{ color: wp.green, fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px" }}>● act_334107975616856</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: wp.muted }}>🏢 Business Portfolio</span>
                    <span style={{ color: wp.green, fontWeight: 650 }}>● Garuda OS</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: wp.muted }}>📄 Facebook Page</span>
                    <span style={{ color: wp.red, fontWeight: 650 }}>● 0 Pages Found</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: wp.muted }}>📷 Instagram</span>
                    <span style={{ color: wp.red, fontWeight: 650 }}>● Not Available</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: wp.muted }}>🚀 Publishing</span>
                    <span style={{ color: wp.red, fontWeight: 650 }}>● Blocked (Human Approval)</span>
                  </div>
                </div>

                {/* DISCOVER PAGES BUTTON */}
                <button
                  onClick={handleMetaDiscover}
                  disabled={metaDiscovering}
                  style={{
                    marginTop: "6px",
                    width: "100%",
                    background: wp.goldGradient,
                    color: wp.deepGraphite,
                    border: "none",
                    borderRadius: "7px",
                    padding: "9px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: metaDiscovering ? "wait" : "pointer",
                    boxShadow: "0 2px 10px rgba(184, 134, 43, 0.22)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {metaDiscovering ? "Scanning..." : "🔍 Discover Pages"}
                </button>
              </div>

              {/* CADRE FIELD PWA CARD */}
              <div
                style={{
                  background: wp.card,
                  boxShadow: wp.shadow,
                  border: "1px solid " + wp.border,
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "15px" }}>📱</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: wp.deepGraphite, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>Cadre Field PWA</span>
                    <span style={{ background: wp.greenBg, color: wp.green, border: "1px solid rgba(5, 150, 105, 0.35)", fontSize: "9.5px", fontWeight: 800, padding: "2px 7px", borderRadius: "5px" }}>
                      ● LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: wp.muted, fontFamily: "'JetBrains Mono', monospace", marginBottom: "10px" }}>
                    /booth-cadre
                  </div>
                  <div style={{ fontSize: "11.5px", color: wp.green, fontWeight: 650 }}>
                    ● 286 Active Devices
                  </div>
                  <div style={{ fontSize: "11.5px", color: wp.green, fontWeight: 650, marginTop: "2px" }}>
                    💚 97% Success Rate
                  </div>
                </div>

                {/* QR CODE PREVIEW */}
                <Link
                  to="/booth-cadre"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textDecoration: "none",
                    gap: "5px"
                  }}
                >
                  <div
                    style={{
                      width: "66px",
                      height: "66px",
                      background: "#FFFFFF",
                      border: "1px solid " + wp.border,
                      borderRadius: "8px",
                      padding: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: wp.shadowSm
                    }}
                  >
                    {/* SVG QR Code Simulation */}
                    <svg viewBox="0 0 25 25" width="100%" height="100%" fill="#000000">
                      <rect x="1" y="1" width="7" height="7" />
                      <rect x="2" y="2" width="5" height="5" fill="#FFFFFF" />
                      <rect x="3" y="3" width="3" height="3" />
                      <rect x="17" y="1" width="7" height="7" />
                      <rect x="18" y="2" width="5" height="5" fill="#FFFFFF" />
                      <rect x="19" y="3" width="3" height="3" />
                      <rect x="1" y="17" width="7" height="7" />
                      <rect x="2" y="18" width="5" height="5" fill="#FFFFFF" />
                      <rect x="3" y="19" width="3" height="3" />
                      <rect x="10" y="3" width="2" height="4" />
                      <rect x="10" y="9" width="4" height="2" />
                      <rect x="15" y="11" width="3" height="3" />
                      <rect x="10" y="15" width="2" height="6" />
                      <rect x="14" y="17" width="5" height="2" />
                      <rect x="19" y="19" width="3" height="3" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "9.5px", color: wp.goldPrimary, fontWeight: 750 }}>Open on Mobile</span>
                </Link>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* ROW 3: BOTTOM 4 CARDS (DEMOGRAPHICS | ISSUES | SENTIMENT | ACTIONS)       */}
          {/* ========================================================================= */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>

            {/* Card 1: Voter Demographics */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "15.5px", fontWeight: 700, color: wp.deepGraphite, marginBottom: "16px", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>
                Voter Demographics
              </div>

              {/* Donut Chart & Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1 }}>
                <div style={{ position: "relative", width: "96px", height: "96px", flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" width="100%" height="100%">
                    {/* Ring background */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(23, 24, 27, 0.08)" strokeWidth="4" />
                    {/* Youth 22% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0284C7" strokeWidth="4" strokeDasharray="22 78" strokeDashoffset="25" />
                    {/* Working 46% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#00C4DF" strokeWidth="4" strokeDasharray="46 54" strokeDashoffset="3" />
                    {/* Seniors 24% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#D97706" strokeWidth="4" strokeDasharray="24 76" strokeDashoffset="57" />
                    {/* Others 8% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8E887E" strokeWidth="4" strokeDasharray="8 92" strokeDashoffset="33" />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: wp.deepGraphite, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>4.28L</div>
                    <div style={{ fontSize: "8px", color: wp.muted, marginTop: "2px" }}>Total Voters</div>
                  </div>
                </div>

                {/* Legend List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0284C7" }} />
                    <span style={{ color: wp.textBody }}>Youth (18-25)</span>
                    <span style={{ fontWeight: 750, color: wp.deepGraphite, marginLeft: "auto" }}>22%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00C4DF" }} />
                    <span style={{ color: wp.textBody }}>Working (26-45)</span>
                    <span style={{ fontWeight: 750, color: wp.deepGraphite, marginLeft: "auto" }}>46%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#D97706" }} />
                    <span style={{ color: wp.textBody }}>Seniors (46+)</span>
                    <span style={{ fontWeight: 750, color: wp.deepGraphite, marginLeft: "auto" }}>24%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#8E887E" }} />
                    <span style={{ color: wp.textBody }}>Others</span>
                    <span style={{ fontWeight: 750, color: wp.deepGraphite, marginLeft: "auto" }}>8%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "14px", fontSize: "11.5px", color: wp.goldPrimary, cursor: "pointer", fontWeight: 750 }}>
                View Detailed Analysis →
              </div>
            </div>

            {/* Card 2: Top Civic Issues */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "15.5px", fontWeight: 700, color: wp.deepGraphite, marginBottom: "16px", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>
                Top Civic Issues
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                {[
                  { num: "1", name: "Water Supply", pct: "28%", color: "#DC2626" },
                  { num: "2", name: "Road Infra", pct: "18%", color: "#D97706" },
                  { num: "3", name: "Public Transport", pct: "14%", color: "#0284C7" },
                  { num: "4", name: "Employment", pct: "12%", color: "#B8862B" },
                  { num: "5", name: "Healthcare", pct: "10%", color: "#059669" }
                ].map((iss) => (
                  <div key={iss.num} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "17px", height: "17px", borderRadius: "50%", background: wp.canvasSubtle, border: "1px solid " + wp.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9.5px", color: wp.muted, fontWeight: 750 }}>
                          {iss.num}
                        </span>
                        <span style={{ color: wp.deepGraphite, fontWeight: 550 }}>{iss.name}</span>
                      </div>
                      <span style={{ fontWeight: 750, color: wp.deepGraphite }}>{iss.pct}</span>
                    </div>
                    <div style={{ height: "5px", background: "rgba(23, 24, 27, 0.06)", borderRadius: "3px", overflow: "hidden", marginLeft: "25px" }}>
                      <div style={{ width: iss.pct, height: "100%", background: iss.color, borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "14px", fontSize: "11.5px", color: wp.goldPrimary, cursor: "pointer", fontWeight: 750 }}>
                View All 12 Issues →
              </div>
            </div>

            {/* Card 3: Sentiment Trend */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "15.5px", fontWeight: 700, color: wp.deepGraphite, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>Sentiment Trend</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: wp.green, background: wp.greenBg, padding: "2px 7px", borderRadius: "5px" }}>+12%</span>
              </div>

              {/* Sparkline Curve with Y-axis */}
              <div style={{ display: "flex", flex: 1, gap: "10px", minHeight: "105px" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "9.5px", color: wp.muted, paddingBottom: "20px" }}>
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                    <svg viewBox="0 0 200 80" style={{ width: "100%", height: "85px", overflow: "visible" }}>
                      <defs>
                        <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area fill */}
                      <polygon
                        points="0,60 30,52 60,56 90,44 120,38 150,32 180,24 200,16 200,80 0,80"
                        fill="url(#sentimentGrad)"
                      />
                      {/* Line */}
                      <polyline
                        points="0,60 30,52 60,56 90,44 120,38 150,32 180,24 200,16"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.8"
                      />
                      {/* Endpoint pulse */}
                      <circle cx="200" cy="16" r="4.5" fill="#059669" />
                    </svg>
                  </div>
                  {/* X Axis Months */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: wp.muted, marginTop: "6px" }}>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "14px", fontSize: "11.5px", color: wp.goldPrimary, cursor: "pointer", fontWeight: 750 }}>
                View Analytics →
              </div>
            </div>

            {/* Card 4: Quick Actions */}
            <div style={{ background: wp.card, boxShadow: wp.shadow, border: "1px solid " + wp.border, borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "15.5px", fontWeight: 700, color: wp.deepGraphite, marginBottom: "16px", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>
                Quick Actions
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1 }}>
                {[
                  { id: "dossier", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={wp.goldPrimary} strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, title: "Generate Dossier" },
                  { id: "rebuttal", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={wp.goldPrimary} strokeWidth="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "Crisis Rebuttal" },
                  { id: "cybershield", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={wp.goldPrimary} strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, title: "Legal Notice (CyberShield)" },
                  { id: "commercial", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={wp.goldPrimary} strokeWidth="2.2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: "View Commercial Plan" }
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => handleQuickAction(act.id)}
                    style={{
                      background: wp.canvasIvory,
                      border: "1px solid " + wp.border,
                      borderRadius: "9px",
                      padding: "10px 14px",
                      color: wp.deepGraphite,
                      fontSize: "11.5px",
                      fontWeight: 650,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <span>{act.icon}</span>
                      <span>{act.title}</span>
                    </span>
                    <span style={{ color: wp.goldPrimary, fontWeight: 700 }}>→</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. DOSSIER & COMMERCIAL MODALS                                            */}
      {/* ========================================================================= */}
      {dossierModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: wp.card,
              boxShadow: wp.shadow,
              border: "1px solid " + wp.border,
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: wp.goldPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>
                12-Section Strategic Dossier
              </div>
              <button onClick={() => setDossierModalOpen(false)} style={{ background: "none", border: "none", color: wp.muted, fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            {isGeneratingPdf ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚙️</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: wp.text }}>Compiling Physical ISO-PDF...</div>
                <div style={{ fontSize: "11px", color: wp.muted, marginTop: "4px" }}>Embedding ECI Gazette citations & SHA-256 evidence seal</div>
              </div>
            ) : generatedPdf ? (
              <div>
                <div style={{ background: wp.greenBg, border: "1px solid rgba(5, 150, 105, 0.3)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                  <div style={{ color: wp.green, fontWeight: 700, fontSize: "12px" }}>✅ Deliverable Generated & Verified</div>
                  <div style={{ fontSize: "11px", color: wp.textBody, marginTop: "4px" }}>File: {generatedPdf.fileName || "dossier.pdf"}</div>
                  <div style={{ fontSize: "10px", color: wp.muted, fontFamily: "monospace", marginTop: "2px" }}>SHA-256: {generatedPdf.sha256Hash?.slice(0, 24)}...</div>
                </div>
                {generatedPdf.url && (
                  <a
                    href={generatedPdf.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      textAlign: "center",
                      background: wp.goldGradient,
                      color: wp.deepGraphite,
                      padding: "10px",
                      borderRadius: "8px",
                      fontWeight: 800,
                      fontSize: "12px",
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(184, 134, 43, 0.25)"
                    }}
                  >
                    Download Physical PDF
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* COMMERCIAL PLAN MODAL */}
      {commercialModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: wp.card,
              boxShadow: wp.shadow,
              border: "1px solid " + wp.border,
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: wp.goldPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  GARUDA SOVEREIGN FLAGSHIP
                </div>
                <div style={{ fontSize: "11px", color: wp.muted }}>
                  Full Campaign Lifecycle War Room & Field Cadre Grid
                </div>
              </div>
              <button onClick={() => setCommercialModalOpen(false)} style={{ background: "none", border: "none", color: wp.muted, fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ background: wp.canvasSubtle, border: "1px solid " + wp.border, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: wp.deepGraphite, fontFamily: "'JetBrains Mono', monospace" }}>₹35,00,000</div>
              <div style={{ fontSize: "11px", color: wp.goldPrimary, fontWeight: 700, marginTop: "2px" }}>
                Full Campaign Retainer (Single-Candidate Territorial Exclusivity)
              </div>
            </div>

            <div style={{ fontSize: "12px", color: wp.textBody, marginBottom: "16px", lineHeight: 1.6 }}>
              <strong>Milestone Structure:</strong><br />
              • 50% (₹17,50,000) upon contract signing & territory lock<br />
              • 30% (₹10,50,000) upon field PWA deployment & 15-min rebuttal setup<br />
              • 20% (₹7,00,000) upon D-Day live monitoring & final audit handover
            </div>

            <div style={{ fontSize: "10.5px", color: wp.muted, background: wp.canvasIvory, padding: "10px", borderRadius: "6px", border: "1px solid " + wp.border, marginBottom: "16px" }}>
              ⚠️ Notice: Meta ad spend is billed directly by Meta to client account. Never commingled with GARUDA engineering fees.
            </div>

            <button
              onClick={() => setCommercialModalOpen(false)}
              style={{
                width: "100%",
                background: wp.goldGradient,
                color: wp.deepGraphite,
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(184, 134, 43, 0.25)"
              }}
            >
              Close Plan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
