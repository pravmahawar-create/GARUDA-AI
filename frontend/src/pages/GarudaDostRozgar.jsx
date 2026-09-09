import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GarudaDostRozgar() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [upiId, setUpiId] = useState("");
  const [location, setLocation] = useState("");
  const [dostSession, setDostSession] = useState(null);
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [newUpi, setNewUpi] = useState("");
  const [activeTab, setActiveTab] = useState("channels"); // 'channels' | 'commission' | 'settlement'
  const [copiedTool, setCopiedTool] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("garuda_dost_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.whatsapp || parsed.upiId)) {
          setDostSession(parsed);
          setFullName(parsed.fullName || "");
          setWhatsapp(parsed.whatsapp || "");
          setUpiId(parsed.upiId || "");
          setLocation(parsed.location || "");
        }
      }
    } catch {}
  }, []);

  const microTools = [
    {
      id: "cloth-gst",
      name: "Cloth GST & Billing Khata Tool",
      description: "Kapda vyapariyon aur shops ke liye 1-tap GST & billing calculator with WhatsApp invoice.",
      link: "https://www.garudaos.in/cloth-gst.html",
      payout: "₹200 - ₹500 per active shop"
    },
    {
      id: "resume-maker",
      name: "Instant Vernacular Resume Maker",
      description: "Gaon aur kasbon ke job seekers ke liye 2 minute me mobile resume aur bio-data generator.",
      link: "https://www.garudaos.in/pawan",
      payout: "₹50 - ₹150 per resume"
    },
    {
      id: "merchant-pwa",
      name: "Local Shop 1-Tap Mobile PWA",
      description: "Kirana, medical, boutique aur tailor shops ke liye standalone Android home screen ordering app.",
      link: "https://www.garudaos.in/pawan",
      payout: "₹1,000 - ₹2,500 per closed shop"
    }
  ];

  const currentRefTag = dostSession ? dostSession.partnerId || `DOST-${dostSession.whatsapp?.slice(-4) || "PARTNER"}` : (whatsapp ? `DOST-${whatsapp.slice(-4)}` : "dost");

  const handleCopyLink = (tool) => {
    const refLink = `${tool.link}?ref=${encodeURIComponent(currentRefTag)}`;
    navigator.clipboard.writeText(refLink);
    setCopiedTool(tool.id);
    setTimeout(() => setCopiedTool(null), 3000);
  };

  const handleShareWhatsApp = (tool) => {
    const refLink = `${tool.link}?ref=${encodeURIComponent(currentRefTag)}`;
    const pitch = encodeURIComponent(`Bhai, GARUDA ka ye tool dekho — ${tool.name}. Bina kisi installation ke direct mobile par chalta hai. Free me try karo: ${refLink}`);
    window.open(`https://wa.me/?text=${pitch}`, "_blank");
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !whatsapp.trim() || !upiId.trim()) {
      alert("Kripya apna Naam, WhatsApp Number aur UPI ID daalein.");
      return;
    }

    const cleanPhone = whatsapp.trim().replace(/\D/g, "");
    const partnerId = `DOST-${cleanPhone.slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;
    const sessionData = {
      fullName: fullName.trim(),
      whatsapp: cleanPhone,
      upiId: upiId.trim(),
      location: location.trim(),
      partnerId,
      registeredAt: new Date().toISOString()
    };

    try {
      localStorage.setItem("garuda_dost_session", JSON.stringify(sessionData));
      setDostSession(sessionData);

      await fetch("/api/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: fullName,
          clientPhone: cleanPhone,
          serviceNeeded: "GARUDA DOST • Zero-Advance Rozgar Registration",
          requirements: `Partner ID: ${partnerId}\nUPI ID: ${upiId}\nLocation: ${location || "Not specified"}\nRegistered: ${new Date().toISOString()}`,
          budgetRange: "₹0 (Zero Advance - Pay As You Earn)"
        })
      });
    } catch {}
  };

  const handleUpdateUpi = () => {
    if (!newUpi.trim()) return;
    const updated = { ...dostSession, upiId: newUpi.trim() };
    setDostSession(updated);
    setUpiId(newUpi.trim());
    localStorage.setItem("garuda_dost_session", JSON.stringify(updated));
    setIsEditingUpi(false);
    setNewUpi("");
  };

  const handleLogoutDost = () => {
    if (window.confirm("Kya aap dusre number se login ya naya registration karna chahte hain?")) {
      localStorage.removeItem("garuda_dost_session");
      setDostSession(null);
      setFullName("");
      setWhatsapp("");
      setUpiId("");
      setLocation("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.08) 0%, #06080E 60%, #030408 100%)", color: "#F8FAFC", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* Top Header & Brand Bar */}
        <div style={{ borderBottom: "1px solid rgba(16, 185, 129, 0.25)", paddingBottom: "1.2rem", marginBottom: "1.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "999px", padding: "4px 14px", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem" }}>🌾</span>
                <span style={{ color: "#34D399", fontWeight: "800", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  GARUDA DOST • ZERO-ADVANCE ROZGAR SETU
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)", fontWeight: "900", margin: "0.2rem 0", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                Aap Gaon me ho ya Shehar me — GARUDA Aapka Digital Dost Hai
              </h1>
              <p style={{ margin: 0, color: "#6EE7B7", fontSize: "0.9rem", fontWeight: "600" }}>
                “Bina kisi advance fees ke • Pay When You Earn” — AI jo har ghar tak rozgar aur aamadani laye
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => navigate("/pawan")}
                style={{ background: "#111827", border: "1px solid #374151", color: "#E5E7EB", padding: "8px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
              >
                🦅 Pawan Studio
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                style={{ background: "#10B981", border: "none", color: "#000", padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "800", cursor: "pointer" }}
              >
                Portal Home &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Hero Mission Statement Card */}
        <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
            <div>
              <div style={{ color: "#34D399", fontWeight: "800", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
                FOUNDER PRAVEEN MAHAWAR KI PRATIGYA
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 0.6rem 0" }}>
                “GARUDA ek dost ke roop me shuru hua hai — jiske paas koi skill nahi hai, uske ghar bhi samman se roti jayegi.”
              </h2>
              <p style={{ color: "#CBD5E1", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Aapko coding, English ya technical gyaan seekhne ki koi zaroorat nahi hai. Skill aur brain <strong>GARUDA ka hai</strong>, 
                aur kamai ka hakdaar <strong>aap ho</strong>. GARUDA internet se kaam aur tools banayega, aap bas apne mobile se connect karoge, 
                aur payment bina kisi beech ke seedha aapke UPI me aayega.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", borderBottom: "1px solid #1E293B", paddingBottom: "0.6rem", overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => setActiveTab("channels")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: activeTab === "channels" ? "1px solid #10B981" : "1px solid transparent",
              background: activeTab === "channels" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: activeTab === "channels" ? "#6EE7B7" : "#94A3B8",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            🌾 3 Zero-Travel Earning Channels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("commission")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: activeTab === "commission" ? "1px solid #D4AF37" : "1px solid transparent",
              background: activeTab === "commission" ? "rgba(212, 175, 55, 0.15)" : "transparent",
              color: activeTab === "commission" ? "#FEF08A" : "#94A3B8",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            💰 Commission Matrix (10% - 40%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settlement")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: activeTab === "settlement" ? "1px solid #38BDF8" : "1px solid transparent",
              background: activeTab === "settlement" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "settlement" ? "#38BDF8" : "#94A3B8",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            ⚖️ 3-Stage Payment Settlement Truth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("support")}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: activeTab === "support" ? "1px solid #EF4444" : "1px solid transparent",
              background: activeTab === "support" ? "rgba(239, 68, 68, 0.15)" : "transparent",
              color: activeTab === "support" ? "#FCA5A5" : "#94A3B8",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            🚨 Founder Direct Helpdesk
          </button>
        </div>

        {/* TAB 1: 3 ZERO-TRAVEL EARNING CHANNELS */}
        {activeTab === "channels" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "1.2rem", marginBottom: "2.5rem" }}>
            
            {/* Channel 1 */}
            <div style={{ background: "#0B1120", border: "1px solid #1E293B", borderRadius: "12px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "3px 10px", borderRadius: "6px", fontSize: "0.72rem", color: "#38BDF8", fontWeight: "800", marginBottom: "0.8rem" }}>
                  <span>📱</span> CHANNEL 1: DIGITAL SETU
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 0.5rem 0" }}>
                  Viral Utility Micro-Tools
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "0.82rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  Gaon ke WhatsApp groups me free utility tools share karo (Kisan mandi rate, Cloth GST calculator). Har active vyapari ya user jab tool use karega, aapko per-action commission milega.
                </p>

                <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "8px", padding: "10px", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "700", marginBottom: "6px" }}>READY TOOLS TO SHARE:</div>
                  {microTools.map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #141D2F", fontSize: "0.78rem", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ color: "#E2E8F0", fontWeight: "600" }}>{t.name}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(t)}
                          style={{ background: copiedTool === t.id ? "#10B981" : "#1E293B", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "4px 9px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer" }}
                        >
                          {copiedTool === t.id ? "✔ Copied!" : "Copy Link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(t)}
                          style={{ background: "#16A34A", border: "none", color: "#fff", padding: "4px 9px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          WhatsApp 📲
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#34D399", fontWeight: "700" }}>
                Potential: ₹500 - ₹2,000 / week (Bina kisi travel ke)
              </div>
            </div>

            {/* Channel 2 */}
            <div style={{ background: "#0B1120", border: "1px solid #1E293B", borderRadius: "12px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "3px 10px", borderRadius: "6px", fontSize: "0.72rem", color: "#F59E0B", fontWeight: "800", marginBottom: "0.8rem" }}>
                  <span>🏪</span> CHANNEL 2: LOCAL MERCHANT UPGRADE
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 0.5rem 0" }}>
                  1-Click Shop App Generator
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "0.82rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  Apne aas-paas ya WhatsApp par kisi kapda vyapari, tailor ya clinic ko unka digital billing ya appointment app dikhao jo Pawan ne banaya hai.
                </p>

                <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "8px", padding: "10px", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.76rem", color: "#FEF08A", fontWeight: "700" }}>KAISE CHALTA HAI?</div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", lineHeight: 1.5, marginTop: "4px" }}>
                    1. Shopkeeper gives ₹1,500 for his custom app.<br/>
                    2. GARUDA synthesizes code + 1-Tap APK.<br/>
                    3. <strong>₹1,200 goes direct to your UPI!</strong>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#F59E0B", fontWeight: "700" }}>
                Potential: ₹1,200 - ₹3,000 per single merchant
              </div>
            </div>

            {/* Channel 3 */}
            <div style={{ background: "#0B1120", border: "1px solid #1E293B", borderRadius: "12px", padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "3px 10px", borderRadius: "6px", fontSize: "0.72rem", color: "#A78BFA", fontWeight: "800", marginBottom: "0.8rem" }}>
                  <span>🎯</span> CHANNEL 3: AUTONOMOUS LEAD BOUNTY
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 0.5rem 0" }}>
                  Global B2B Lead Connector
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "0.82rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  GARUDA internet se badi companies (Dubai, London, Mumbai) ke software requirements hunt karta hai. Aapko bas WhatsApp par verified intro dispatch karna hota hai.
                </p>

                <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "8px", padding: "10px", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.76rem", color: "#DDD6FE", fontWeight: "700" }}>HIGH-TICKET CLOSE:</div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", lineHeight: 1.5, marginTop: "4px" }}>
                    Deal Value: ₹50,000 - ₹1,50,000<br/>
                    GARUDA closes and delivers code.<br/>
                    <strong>Your Partner Bounty: ₹10,000 - ₹30,000</strong>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#A78BFA", fontWeight: "700" }}>
                Potential: ₹10,000+ per qualified deal
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COMMISSION MATRIX */}
        {activeTab === "commission" && (
          <div style={{ background: "#0B1120", border: "1px solid #1E293B", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
            <h3 style={{ color: "#FEF08A", fontSize: "1.1rem", margin: "0 0 1rem 0" }}>
              Transparent Sovereign Commission Structure
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.82rem", margin: "0 0 1.2rem 0" }}>
              GARUDA ka commission model bilkul transparent hai — koi chupa hua charge nahi, payment seedha UPI par.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#050811", borderBottom: "1px solid #1E293B" }}>
                    <th style={{ padding: "10px", color: "#34D399" }}>Tier</th>
                    <th style={{ padding: "10px", color: "#FFFFFF" }}>Role Description</th>
                    <th style={{ padding: "10px", color: "#F59E0B" }}>GARUDA Cut</th>
                    <th style={{ padding: "10px", color: "#38BDF8" }}>Aapka Share (UPI Direct)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #141D2F" }}>
                    <td style={{ padding: "10px", fontWeight: "700" }}>Tier 1 (10%)</td>
                    <td style={{ padding: "10px", color: "#CBD5E1" }}>Self-Operated: Client aap laye, baat aapne ki, bas GARUDA tool use kiya.</td>
                    <td style={{ padding: "10px", color: "#F59E0B" }}>10%</td>
                    <td style={{ padding: "10px", color: "#34D399", fontWeight: "800" }}>90% aapka</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #141D2F" }}>
                    <td style={{ padding: "10px", fontWeight: "700" }}>Tier 2 (20%)</td>
                    <td style={{ padding: "10px", color: "#CBD5E1" }}>AI-Assisted: Pawan ne code aur proposal ready kiya, aapne delivery ki.</td>
                    <td style={{ padding: "10px", color: "#F59E0B" }}>20%</td>
                    <td style={{ padding: "10px", color: "#34D399", fontWeight: "800" }}>80% aapka</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #141D2F" }}>
                    <td style={{ padding: "10px", fontWeight: "700" }}>Tier 3 (30%)</td>
                    <td style={{ padding: "10px", color: "#CBD5E1" }}>Managed Pipeline: Client scoping, testing aur milestone Pawan ne sambhala.</td>
                    <td style={{ padding: "10px", color: "#F59E0B" }}>30%</td>
                    <td style={{ padding: "10px", color: "#34D399", fontWeight: "800" }}>70% aapka</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", fontWeight: "700" }}>Tier 4 (40%)</td>
                    <td style={{ padding: "10px", color: "#CBD5E1" }}>100% Autonomous: Lead hunt, email outreach, closing aur delivery sab GARUDA ne kiya.</td>
                    <td style={{ padding: "10px", color: "#F59E0B" }}>40%</td>
                    <td style={{ padding: "10px", color: "#34D399", fontWeight: "800" }}>60% Partner Pool</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: 3-STAGE PAYMENT SETTLEMENT TRUTH */}
        {activeTab === "settlement" && (
          <div style={{ background: "#0B1120", border: "1px solid #1E293B", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.72rem", color: "#38BDF8", fontWeight: "800", marginBottom: "0.8rem" }}>
              <span>🛡️</span> 100% ANTI-FABRICATION SETTLEMENT DOCTRINE
            </div>
            <h3 style={{ color: "#38BDF8", fontSize: "1.2rem", margin: "0 0 0.6rem 0", fontWeight: "800" }}>
              Payment Tracking Aur Payout Ka Sach (Zero Fake Claims)
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.84rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
              Praveen ji ka niyam bilkul spasht hai — <strong>GARUDA kabhi jhooth nahi bolta</strong>. Razorpay gateway domestic banking rules ke tehat settlement karta hai. Pura 3-stage flow neeche samjhein:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <div style={{ color: "#F59E0B", fontWeight: "800", fontSize: "0.75rem", marginBottom: "4px" }}>STAGE 1: LEAD PAYMENT CAPTURED</div>
                <h4 style={{ color: "#FFFFFF", margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>Client Razorpay Se Pay Karta Hai</h4>
                <p style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
                  Jaise hi aapke link se koi shopkeeper ya client payment karta hai, Razorpay webhook se instant payment capture record hota hai.
                </p>
                <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "#34D399", fontWeight: "700" }}>Status: Captured (Verified ID)</div>
              </div>

              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <div style={{ color: "#38BDF8", fontWeight: "800", fontSize: "0.75rem", marginBottom: "4px" }}>STAGE 2: BANK SETTLEMENT ESCROW</div>
                <h4 style={{ color: "#FFFFFF", margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>3 Se 5 Working Days Clearing Window</h4>
                <p style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
                  Razorpay local settlement <strong>T+2 se T+3 working days</strong> me karta hai. Is dauran paisa gateway se bank account me aane ke raste me hota hai. Hum kabhi fake claim nahi karte ki turant ho gaya.
                </p>
                <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "#38BDF8", fontWeight: "700" }}>Status: Gateway In-Flight (T+3)</div>
              </div>

              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <div style={{ color: "#34D399", fontWeight: "800", fontSize: "0.75rem", marginBottom: "4px" }}>STAGE 3: DOST UPI DISBURSEMENT</div>
                <h4 style={{ color: "#FFFFFF", margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>Direct UPI Payout with Real UTR</h4>
                <p style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
                  Jaise hi bank account me funds aate hain, GARUDA engine aapke registered UPI ID par commission turant transfer karta hai real UTR number ke sath.
                </p>
                <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "#34D399", fontWeight: "700" }}>Status: Direct UPI Dispatched</div>
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "12px", fontSize: "0.8rem", color: "#6EE7B7", lineHeight: 1.6 }}>
              💡 <strong>Founder Guarantee:</strong> Aapka ek bhi rupya nahi fasega. Kisi bhi settlement query ke liye aap niche diye gaye <strong>Founder Direct Helpdesk</strong> se sidha Praveen ji se baat kar sakte hain.
            </div>
          </div>
        )}

        {/* TAB 4: FOUNDER DIRECT HELPDESK */}
        {activeTab === "support" && (
          <div style={{ background: "#0B1120", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.72rem", color: "#F87171", fontWeight: "800", marginBottom: "0.8rem" }}>
              <span>🚨</span> FOUNDER DIRECT ESCALATION PIPE
            </div>
            <h3 style={{ color: "#FFFFFF", fontSize: "1.2rem", margin: "0 0 0.6rem 0", fontWeight: "800" }}>
              Koi Bhi Dikkat Aaye — Sidha Founder Praveen Mahawar Tak Baat Pahuchegi
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.84rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
              Agar tool link me koi error ho, client ne pay kiya ho aur aapko update na mila ho, ya UPI change karna ho — bina kisi bot ke direct Founder se sampark karein:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#22C55E", fontWeight: "800", marginBottom: "4px" }}>OFFICIAL 24/7 HELPDESK &amp; CHAT</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF", marginBottom: "6px" }}>garudaos.in/chat</div>
                <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "0 0 12px 0" }}>Direct Automated Priority Helpdesk &amp; Escalation</p>
                <a
                  href="/chat?ref=dost-helpdesk"
                  style={{ display: "inline-block", background: "#16A34A", color: "#fff", padding: "8px 16px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "800", textDecoration: "none" }}
                >
                  Priority Chat Par Baat Karein &rarr;
                </a>
              </div>

              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#38BDF8", fontWeight: "800", marginBottom: "4px" }}>OFFICIAL VERIFIED EMAIL</div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: "#FFFFFF", marginBottom: "6px" }}>praveen@garudaos.in</div>
                <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "0 0 12px 0" }}>Emergency Desk: response within 2-4 hours</p>
                <a
                  href={`mailto:praveen@garudaos.in?subject=${encodeURIComponent(`[GARUDA DOST SUPPORT] - ${dostSession?.fullName || "Partner"}`)}&body=${encodeURIComponent(`Aapka Dost ID: ${currentRefTag}\nWhatsApp: ${dostSession?.whatsapp || whatsapp}\nUPI ID: ${dostSession?.upiId || upiId}\n\nDikkat ka vivaran yahan likhein:\n`)}`}
                  style={{ display: "inline-block", background: "#1E293B", border: "1px solid #38BDF8", color: "#38BDF8", padding: "8px 16px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "800", textDecoration: "none" }}
                >
                  Email Emergency Desk &rarr;
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MAIN ACTION SECTION: PERSISTENT DASHBOARD OR REGISTRATION */}
        {dostSession ? (
          /* ACTIVE SOVEREIGN DOST DASHBOARD */
          <div style={{ background: "#080D1A", border: "1px solid #10B981", borderRadius: "14px", padding: "1.8rem", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #1E293B", paddingBottom: "1.2rem", marginBottom: "1.4rem" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.72rem", color: "#34D399", fontWeight: "800", marginBottom: "0.6rem" }}>
                  <span>🌾</span> VERIFIED SOVEREIGN GARUDA DOST
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#FFFFFF", margin: "0 0 0.3rem 0" }}>
                  Swagat Hai, {dostSession.fullName}!
                </h2>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                  Partner Ref ID: <strong style={{ color: "#34D399" }}>{dostSession.partnerId}</strong> • Registered: {dostSession.registeredAt ? new Date(dostSession.registeredAt).toLocaleDateString() : "Active"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={handleLogoutDost}
                  style={{ background: "transparent", border: "1px solid #475569", color: "#94A3B8", padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  Switch / Re-Register
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.6rem" }}>
              {/* Card 1: Registered UPI */}
              <div style={{ background: "#040711", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "800" }}>REGISTERED PAYOUT UPI ID</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingUpi(!isEditingUpi)}
                    style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                  >
                    {isEditingUpi ? "Cancel" : "Change UPI"}
                  </button>
                </div>
                {!isEditingUpi ? (
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#34D399" }}>{dostSession.upiId}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "4px" }}>Har kamai bina cut ke is UPI ID par credit hogi.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <input
                      type="text"
                      placeholder="e.g. name@okhdfcbank"
                      value={newUpi}
                      onChange={(e) => setNewUpi(e.target.value)}
                      style={{ flex: 1, background: "#0B1120", border: "1px solid #334155", color: "#fff", padding: "6px 10px", borderRadius: "4px", fontSize: "0.8rem" }}
                    />
                    <button
                      type="button"
                      onClick={handleUpdateUpi}
                      style={{ background: "#10B981", border: "none", color: "#000", padding: "6px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Master Referral Link */}
              <div style={{ background: "#040711", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "800", display: "block", marginBottom: "8px" }}>
                  AAPKA MASTER REFERRAL LINK
                </span>
                <div style={{ fontSize: "0.85rem", color: "#FEF08A", wordBreak: "break-all", marginBottom: "10px", fontWeight: "600" }}>
                  https://www.garudaos.in?ref={dostSession.partnerId}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://www.garudaos.in?ref=${dostSession.partnerId}`);
                      setCopiedTool("master");
                      setTimeout(() => setCopiedTool(null), 3000);
                    }}
                    style={{ background: copiedTool === "master" ? "#10B981" : "#1E293B", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "5px 10px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer" }}
                  >
                    {copiedTool === "master" ? "✔ Copied!" : "Copy Master Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pitch = encodeURIComponent(`Namaste! Main GARUDA ka verified digital partner hoon. Agar aapko apne business ke liye billing app, website ya custom software banwana hai to dekhein: https://www.garudaos.in?ref=${dostSession.partnerId}`);
                      window.open(`https://wa.me/?text=${pitch}`, "_blank");
                    }}
                    style={{ background: "#16A34A", border: "none", color: "#fff", padding: "5px 10px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
                  >
                    Share On WhatsApp 📲
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", padding: "12px 16px" }}>
              <div style={{ fontSize: "0.82rem", color: "#CBD5E1" }}>
                🌾 <strong>Ab kya karein?</strong> Upar diye gaye <strong>3 Earning Channels</strong> me se kisi bhi tool ka link apne WhatsApp status ya groups me share karein!
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("channels");
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
                style={{ background: "#10B981", border: "none", color: "#000", padding: "6px 14px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
              >
                Tools Dekhein &rarr;
              </button>
            </div>
          </div>
        ) : (
          /* ZERO-ADVANCE REGISTRATION CARD */
          <div style={{ background: "#0B0F19", border: "1px solid #10B981", borderRadius: "14px", padding: "1.8rem", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.72rem", color: "#34D399", fontWeight: "800", marginBottom: "0.8rem" }}>
                <span>✍️</span> ZERO ADVANCE • DIRECT ENROLLMENT
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 0.4rem 0" }}>
                GARUDA DOST Partner Banein (Zero Investment)
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "0.84rem", margin: "0 0 1.5rem 0" }}>
                Apna Naam aur UPI ID daalein. Jaise hi aapke link se koi tool use hoga ya client aayega, paisa bina kisi delay ke seedha aapke UPI me credit hoga.
              </p>

              <form onSubmit={handleRegisterSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Aapka Poora Naam *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "10px 12px", color: "#fff", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>WhatsApp Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "10px 12px", color: "#fff", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.4rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Aapka UPI ID (Jisme Kamai Aayegi) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ramesh@okaxis ya phonepe"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "10px 12px", color: "#fff", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Gaon / Shehar / District</label>
                    <input
                      type="text"
                      placeholder="e.g. Alwar, Rajasthan"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "10px 12px", color: "#fff", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ width: "100%", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFFFFF", border: "none", padding: "12px", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)" }}
                >
                  🚀 Register as GARUDA DOST Partner (₹0 Advance) &rarr;
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
