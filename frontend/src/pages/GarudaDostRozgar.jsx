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
  const [activeTab, setActiveTab] = useState("leads"); // 'leads' | 'channels' | 'pitch' | 'commission' | 'settlement'
  const [copiedTool, setCopiedTool] = useState(null);

  // Leads & Client Management ("Kisko De Rahe Ho — Name & Information")
  const [leads, setLeads] = useState([]);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [clientBusinessName, setClientBusinessName] = useState("");
  const [clientContactName, setClientContactName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientService, setClientService] = useState("Cloth GST & Billing App");
  const [clientBudget, setClientBudget] = useState("₹1,500");
  const [clientCommission, setClientCommission] = useState("₹500");
  const [clientNotes, setClientNotes] = useState("");
  const [existingLoginPhone, setExistingLoginPhone] = useState("");
  const [loginError, setLoginError] = useState("");
  const [pitchClient, setPitchClient] = useState(null);
  const [generatedPitch, setGeneratedPitch] = useState("");

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

  useEffect(() => {
    if (dostSession?.partnerId) {
      try {
        const savedLeads = localStorage.getItem(`garuda_dost_leads_${dostSession.partnerId}`);
        if (savedLeads) {
          const parsed = JSON.parse(savedLeads);
          if (Array.isArray(parsed)) {
            setLeads(parsed);
          }
        }
      } catch {}
    }
  }, [dostSession]);

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

  const handleSaveLead = async (e) => {
    e?.preventDefault();
    if (!clientBusinessName.trim() || !clientPhone.trim()) {
      alert("Kripya Client / Business ka naam aur Phone number bharein.");
      return;
    }

    const cleanLeadPhone = clientPhone.replace(/\D/g, "");
    const newLead = {
      id: "lead_" + Date.now(),
      businessName: clientBusinessName.trim(),
      contactName: clientContactName.trim() || clientBusinessName.trim(),
      phone: cleanLeadPhone,
      city: clientCity.trim() || dostSession?.location || "Bharat",
      service: clientService,
      budget: clientBudget,
      commission: clientCommission,
      status: "lead_logged", // 'lead_logged' | 'demo_shown' | 'scoped' | 'converted'
      notes: clientNotes.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    if (dostSession?.partnerId) {
      localStorage.setItem(`garuda_dost_leads_${dostSession.partnerId}`, JSON.stringify(updatedLeads));
    }

    // Sync to backend core
    try {
      fetch("/api/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: `${newLead.businessName} (${newLead.contactName})`,
          clientPhone: cleanLeadPhone,
          serviceNeeded: `[DOST LEAD - ${dostSession?.partnerId}] ${newLead.service}`,
          requirements: `Dost Partner: ${dostSession?.fullName} (${dostSession?.partnerId}) | UPI: ${dostSession?.upiId}\nBudget: ${newLead.budget} | Commission: ${newLead.commission}\nCity: ${newLead.city}\nNotes: ${newLead.notes}`,
          budgetRange: newLead.budget
        })
      }).catch(() => {});
    } catch {}

    setClientBusinessName("");
    setClientContactName("");
    setClientPhone("");
    setClientCity("");
    setClientNotes("");
    setShowAddLeadModal(false);
  };

  const handleUpdateLeadStatus = (leadId, newStatus) => {
    const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    setLeads(updated);
    if (dostSession?.partnerId) {
      localStorage.setItem(`garuda_dost_leads_${dostSession.partnerId}`, JSON.stringify(updated));
    }
  };

  const handleDeleteLead = (leadId) => {
    if (window.confirm("Kya aap is client record ko hatana chahte hain?")) {
      const updated = leads.filter(l => l.id !== leadId);
      setLeads(updated);
      if (dostSession?.partnerId) {
        localStorage.setItem(`garuda_dost_leads_${dostSession.partnerId}`, JSON.stringify(updated));
      }
    }
  };

  const handleWhatsAppLead = (lead) => {
    const refLink = `https://www.garudaos.in?ref=${dostSession?.partnerId || "dost"}`;
    const pitch = encodeURIComponent(`Namaste ${lead.contactName} ji! Main ${dostSession?.fullName || "GARUDA Digital Dost"} baat kar raha hoon. Aapke vyapar "${lead.businessName}" ke liye ${lead.service} ka setup ready hai. Aap direct mobile par trial dekh sakte hain: ${refLink}`);
    window.open(`https://wa.me/91${lead.phone}?text=${pitch}`, "_blank");
  };

  const handleExistingPartnerLogin = (e) => {
    e?.preventDefault();
    setLoginError("");
    const clean = existingLoginPhone.trim().replace(/\D/g, "");
    if (!clean || clean.length < 10) {
      setLoginError("Kripya 10-digit ka valid mobile number daalein.");
      return;
    }
    const partnerId = `DOST-${clean.slice(-4)}`;
    const sessionData = {
      fullName: "Verified Sovereign Dost",
      whatsapp: clean,
      upiId: `${clean}@upi`,
      location: "Bharat",
      partnerId,
      registeredAt: new Date().toISOString()
    };
    localStorage.setItem("garuda_dost_session", JSON.stringify(sessionData));
    setDostSession(sessionData);
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
            {/* Header & Identity */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #1E293B", paddingBottom: "1.2rem", marginBottom: "1.4rem" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.72rem", color: "#34D399", fontWeight: "800", marginBottom: "0.6rem" }}>
                  <span>🌾</span> VERIFIED SOVEREIGN GARUDA DOST
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "900", color: "#FFFFFF", margin: "0 0 0.3rem 0" }}>
                  Swagat Hai, {dostSession.fullName}!
                </h2>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                  Partner Ref ID: <strong style={{ color: "#34D399" }}>{dostSession.partnerId}</strong> • Location: <strong>{dostSession.location || "Bharat"}</strong> • Registered: {dostSession.registeredAt ? new Date(dostSession.registeredAt).toLocaleDateString() : "Active"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(true)}
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#000", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>➕</span> Naya Client Add Karein
                </button>
                <button
                  type="button"
                  onClick={handleLogoutDost}
                  style={{ background: "transparent", border: "1px solid #475569", color: "#94A3B8", padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  Switch / Re-Register
                </button>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem", marginBottom: "1.6rem" }}>
              <div style={{ background: "#040711", border: "1px solid #1E293B", borderRadius: "10px", padding: "1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "800" }}>TOTAL CLIENTS LOGGED</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#38BDF8", marginTop: "4px" }}>{leads.length}</div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "2px" }}>Aapke dwaara add kiye gaye vyapari</div>
              </div>
              <div style={{ background: "#040711", border: "1px solid #1E293B", borderRadius: "10px", padding: "1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "800" }}>SCOPING IN PROGRESS</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#FBBF24", marginTop: "4px" }}>
                  {leads.filter(l => l.status !== "converted").length}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "2px" }}>Deals under demo / negotiation</div>
              </div>
              <div style={{ background: "#040711", border: "1px solid #1E293B", borderRadius: "10px", padding: "1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "800" }}>DEALS CLOSED &amp; PAID</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#34D399", marginTop: "4px" }}>
                  {leads.filter(l => l.status === "converted").length}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "2px" }}>Successful client activations</div>
              </div>
              <div style={{ background: "#040711", border: "1px solid #1E293B", borderRadius: "10px", padding: "1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "800" }}>TRACKED DOST COMMISSION</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#10B981", marginTop: "4px" }}>
                  ₹{leads.reduce((acc, l) => acc + (parseInt(String(l.commission).replace(/\D/g, "") || "0", 10)), 0).toLocaleString()}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "2px" }}>Direct UPI payout track</div>
              </div>
            </div>

            {/* Payout UPI & Master Link Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.6rem" }}>
              {/* Registered UPI */}
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

              {/* Master Referral Link */}
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

            {/* Portal Navigation Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #1E293B", paddingBottom: "0.8rem", marginBottom: "1.4rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setActiveTab("leads")}
                style={{
                  background: activeTab === "leads" ? "#10B981" : "#0B1120",
                  color: activeTab === "leads" ? "#000" : "#CBD5E1",
                  border: `1px solid ${activeTab === "leads" ? "#10B981" : "#334155"}`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                📋 Kisko Diya — Client Ledger &amp; Info ({leads.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("channels")}
                style={{
                  background: activeTab === "channels" ? "#10B981" : "#0B1120",
                  color: activeTab === "channels" ? "#000" : "#CBD5E1",
                  border: `1px solid ${activeTab === "channels" ? "#10B981" : "#334155"}`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                🛠️ Power Tools &amp; Demos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pitch")}
                style={{
                  background: activeTab === "pitch" ? "#10B981" : "#0B1120",
                  color: activeTab === "pitch" ? "#000" : "#CBD5E1",
                  border: `1px solid ${activeTab === "pitch" ? "#10B981" : "#334155"}`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                💬 1-Click WhatsApp Pitch Generator
              </button>
            </div>

            {/* TAB 1: KISKO DIYA — CLIENT LEDGER */}
            {activeTab === "leads" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.8rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF" }}>
                      Client Intake &amp; Referral Tracking
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#94A3B8" }}>
                      Aapne jin vyapariyon, dukandaron ya doston ko demo dikhaya ya software diya hai, unka record yahan manage karein.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(true)}
                    style={{ background: "#10B981", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "800", cursor: "pointer" }}
                  >
                    ➕ Naya Client Record Karein
                  </button>
                </div>

                {leads.length === 0 ? (
                  <div style={{ background: "#050811", border: "1px dashed #334155", borderRadius: "10px", padding: "2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
                    <h4 style={{ color: "#FEF08A", margin: "0 0 0.4rem 0" }}>Abhi Koi Client Add Nahi Kiya Gaya Hai</h4>
                    <p style={{ color: "#94A3B8", fontSize: "0.8rem", maxWidth: "460px", margin: "0 auto 1rem auto" }}>
                      Aapne apne aas-paas jis kapda vyapari, doctor, tailor ya dukan ko tool ka link share kiya hai, unka naam aur phone yahan add karein taaki unki lead track ho sake.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddLeadModal(true)}
                      style={{ background: "#10B981", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      Pehla Client Record Karein &rarr;
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#050811", borderBottom: "2px solid #1E293B" }}>
                          <th style={{ padding: "10px", color: "#94A3B8" }}>Vyapar &amp; Client Name</th>
                          <th style={{ padding: "10px", color: "#94A3B8" }}>Contact &amp; Location</th>
                          <th style={{ padding: "10px", color: "#94A3B8" }}>Service &amp; Deal</th>
                          <th style={{ padding: "10px", color: "#94A3B8" }}>Status</th>
                          <th style={{ padding: "10px", color: "#94A3B8" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((l) => (
                          <tr key={l.id} style={{ borderBottom: "1px solid #1E293B" }}>
                            <td style={{ padding: "12px 10px" }}>
                              <strong style={{ color: "#FFFFFF", display: "block" }}>{l.businessName}</strong>
                              <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>Person: {l.contactName}</span>
                              {l.notes && <div style={{ fontSize: "0.68rem", color: "#64748B", marginTop: "2px" }}>{l.notes}</div>}
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <a href={`tel:${l.phone}`} style={{ color: "#38BDF8", textDecoration: "none", fontWeight: "700" }}>{l.phone}</a>
                              <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>📍 {l.city}</div>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <div style={{ color: "#FEF08A", fontWeight: "700" }}>{l.service}</div>
                              <div style={{ fontSize: "0.72rem", color: "#34D399" }}>Commission: {l.commission} (Deal: {l.budget})</div>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <select
                                value={l.status}
                                onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                                style={{
                                  background: l.status === "converted" ? "rgba(16, 185, 129, 0.2)" : (l.status === "demo_shown" ? "rgba(56, 189, 248, 0.2)" : "#0B1120"),
                                  border: `1px solid ${l.status === "converted" ? "#10B981" : "#334155"}`,
                                  color: l.status === "converted" ? "#34D399" : (l.status === "demo_shown" ? "#38BDF8" : "#FEF08A"),
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.72rem",
                                  fontWeight: "700"
                                }}
                              >
                                <option value="lead_logged">Lead Logged</option>
                                <option value="demo_shown">Demo Shown</option>
                                <option value="scoped">In Negotiation</option>
                                <option value="converted">Closed &amp; Paid (UPI)</option>
                              </select>
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  onClick={() => handleWhatsAppLead(l)}
                                  title="WhatsApp Follow-up"
                                  style={{ background: "#16A34A", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700", cursor: "pointer" }}
                                >
                                  📲 Follow-up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLead(l.id)}
                                  title="Delete record"
                                  style={{ background: "transparent", border: "1px solid #475569", color: "#EF4444", padding: "4px 6px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer" }}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: POWER TOOLS & DEMOS */}
            {activeTab === "channels" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  {microTools.map((tool) => (
                    <div key={tool.id} style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                          <h4 style={{ margin: 0, color: "#FFFFFF", fontSize: "0.95rem", fontWeight: "800" }}>{tool.name}</h4>
                          <span style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34D399", padding: "2px 8px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "800" }}>
                            {tool.payout}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "0 0 1rem 0", lineHeight: 1.4 }}>
                          {tool.description}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(tool)}
                          style={{ flex: 1, background: copiedTool === tool.id ? "#10B981" : "#1E293B", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "7px 10px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          {copiedTool === tool.id ? "✔ Copied!" : "Copy Link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(tool)}
                          style={{ background: "#16A34A", border: "none", color: "#fff", padding: "7px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          WhatsApp 📲
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: 1-CLICK WHATSAPP PITCH GENERATOR */}
            {activeTab === "pitch" && (
              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "10px", padding: "1.4rem" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF" }}>
                  Instant WhatsApp Pitch Generator
                </h3>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "#94A3B8" }}>
                  Niche vyapari chunein aur 1-tap me ready message copy karke WhatsApp status ya message bhejein:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem", marginBottom: "1.2rem" }}>
                  {[
                    { id: "cloth", label: "Kapda & Saree Vyapari", msg: `Namaste bhaiji! Agar aapko apni kapde ki dukaan ke liye mobile GST billing aur WhatsApp invoice software chahiye to ye dekhein. Direct mobile se chalta hai: https://www.garudaos.in/cloth-gst.html?ref=${dostSession.partnerId}` },
                    { id: "kirana", label: "Kirana / General Store", msg: `Namaste! Ab aapki kirana dukan ka bhi online ordering app hoga jisme grahak direct WhatsApp par order de sakein. Free trial yahan dekhein: https://www.garudaos.in/pawan?ref=${dostSession.partnerId}` },
                    { id: "clinic", label: "Doctor / Clinic / Pathology", msg: `Namaste doctor saab! Clinic appointment booking aur patient prescription management ke liye GARUDA OS ka lightweight app dekhein: https://www.garudaos.in?ref=${dostSession.partnerId}` },
                    { id: "custom", label: "Any Business / Custom App", msg: `Namaste! Kya aapko apne business ke liye custom billing app, inventory ya website banwani hai? GARUDA AI se 1 din me live ho jata hai: https://www.garudaos.in?ref=${dostSession.partnerId}` }
                  ].map((p) => (
                    <div key={p.id} style={{ background: "#0B1120", border: "1px solid #334155", borderRadius: "8px", padding: "1rem" }}>
                      <div style={{ fontWeight: "800", color: "#FEF08A", fontSize: "0.82rem", marginBottom: "6px" }}>{p.label}</div>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", background: "#050811", padding: "6px 8px", borderRadius: "4px", marginBottom: "8px", maxHeight: "60px", overflow: "hidden" }}>
                        {p.msg}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(p.msg);
                          alert("Pitch message copied!");
                        }}
                        style={{ width: "100%", background: "#10B981", border: "none", color: "#000", padding: "6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                      >
                        Copy Pitch 📋
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ZERO-ADVANCE REGISTRATION & LOGIN CARD */
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

              {/* Instant Login for Existing Dost Partners */}
              <div style={{ marginTop: "1.5rem", borderTop: "1px dashed #334155", paddingTop: "1.2rem" }}>
                <div style={{ fontSize: "0.85rem", color: "#FEF08A", fontWeight: "800", marginBottom: "0.4rem" }}>
                  Pehle se Registered Dost hain?
                </div>
                <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "0 0 0.8rem 0" }}>
                  Apna registered WhatsApp mobile number daal kar apna Portal aur Lead Dashboard kholein:
                </p>
                <form onSubmit={handleExistingPartnerLogin} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    type="tel"
                    placeholder="Registered Mobile (e.g. 9876543210)"
                    value={existingLoginPhone}
                    onChange={(e) => setExistingLoginPhone(e.target.value)}
                    style={{ flex: 1, minWidth: "200px", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                  />
                  <button
                    type="submit"
                    style={{ background: "#10B981", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "800", cursor: "pointer" }}
                  >
                    Dashboard Kholein &rarr;
                  </button>
                </form>
                {loginError && <div style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "6px" }}>{loginError}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Client / Lead Console */}
        {showAddLeadModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 10000, padding: "1.5rem" }}>
            <div style={{ background: "#0B0F19", border: "2px solid #10B981", borderRadius: "14px", maxWidth: "540px", width: "100%", padding: "1.8rem", boxShadow: "0 20px 50px rgba(0,0,0,0.9)", position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#94A3B8", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", padding: "4px 10px", borderRadius: "999px", fontSize: "0.72rem", color: "#34D399", fontWeight: "800", marginBottom: "0.6rem" }}>
                <span>👥</span> KISKO DIYA — CLIENT INTAKE
              </div>
              <h3 style={{ margin: "0 0 0.3rem 0", color: "#FFFFFF", fontSize: "1.2rem", fontWeight: "900" }}>
                Naya Client Record Karein
              </h3>
              <p style={{ color: "#94A3B8", fontSize: "0.78rem", margin: "0 0 1.2rem 0" }}>
                Aap jis dukandar ya vyapari ko demo de rahe hain, unka naam aur details yahan note karein:
              </p>

              <form onSubmit={handleSaveLead}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Dukaan / Vyapar Ka Naam *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gupta Cloth Saree"
                      value={clientBusinessName}
                      onChange={(e) => setClientBusinessName(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "0.82rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Vyapari Ka Naam</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Gupta"
                      value={clientContactName}
                      onChange={(e) => setClientContactName(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "0.82rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>WhatsApp Mobile *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9826012345"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "0.82rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Shehar / Kasba</label>
                    <input
                      type="text"
                      placeholder="e.g. Jabalpur / Indore"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "0.82rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Service / Tool</label>
                    <select
                      value={clientService}
                      onChange={(e) => {
                        setClientService(e.target.value);
                        if (e.target.value.includes("Cloth")) { setClientBudget("₹1,500"); setClientCommission("₹500"); }
                        else if (e.target.value.includes("PWA")) { setClientBudget("₹3,000"); setClientCommission("₹1,000"); }
                        else if (e.target.value.includes("Custom")) { setClientBudget("₹5,000"); setClientCommission("₹1,500"); }
                        else { setClientBudget("₹500"); setClientCommission("₹150"); }
                      }}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "0.82rem" }}
                    >
                      <option value="Cloth GST & Billing App">Cloth GST &amp; Billing App</option>
                      <option value="Local Shop 1-Tap Mobile PWA">Local Shop 1-Tap Mobile PWA</option>
                      <option value="Custom Business App / Website">Custom Business App / Website</option>
                      <option value="Vernacular Resume Maker">Vernacular Resume Maker</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Aapka Expected Commission (₹)</label>
                    <input
                      type="text"
                      value={clientCommission}
                      onChange={(e) => setClientCommission(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #10B981", borderRadius: "6px", padding: "8px 10px", color: "#34D399", fontWeight: "800", fontSize: "0.82rem" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#94A3B8", marginBottom: "4px", fontWeight: "700" }}>Zaruri Notes / Requirements</label>
                  <input
                    type="text"
                    placeholder="e.g. Hindi me bill print hona chahiye, barcode scanner"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", background: "#050811", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#fff", fontSize: "0.82rem" }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: "100%", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#000", border: "none", padding: "10px", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "900", cursor: "pointer" }}
                >
                  Save Client &amp; Track Deal &rarr;
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
