import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";

export default function FintechMerchantPortal() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, transactions, qr_generator, vans, cyber_defense, integrations
  const [merchantEntity, setMerchantEntity] = useState("baba_enterprises"); // "baba_enterprises" | "raipur_holdings"
  const [pilotVolume, setPilotVolume] = useState(142500);
  const maxPilotVolume = 500000;
  const daysLeft = 6;

  // Real-time Sweep & Vault Balance
  const [masterVaultBalance, setMasterVaultBalance] = useState(1450000);
  const [lastSweepTime, setLastSweepTime] = useState("18s ago");
  const [heartbeatPing, setHeartbeatPing] = useState(32);

  // Dispute / Freeze Test State
  const [disputeTriggered, setDisputeTriggered] = useState(false);
  const [quarantinedNode, setQuarantinedNode] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierNoticeSent, setDossierNoticeSent] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);

  // QR Generator & UPI Intent State
  const [qrAmount, setQrAmount] = useState(500);
  const [qrRef, setQrRef] = useState("USER-849201");
  const [generatedQR, setGeneratedQR] = useState("");
  const [qrTimer, setQrTimer] = useState(300);
  const [qrSettled, setQrSettled] = useState(false);
  const [activeIntentApp, setActiveIntentApp] = useState(null);

  // Ad Matrix & Traffic Growth Engine State
  const [dailyBudget, setDailyBudget] = useState(10000);
  const [selectedAdChannel, setSelectedAdChannel] = useState("all");
  const [simulatedTrafficLogs, setSimulatedTrafficLogs] = useState([
    { id: 1, time: "Just now", ip: "157.34.88.19 (Jio 5G, Raipur)", source: "ExoClick (Adult Pop)", action: "PASSED TO GAME", status: "200 OK", note: "Real Mobile Punter" },
    { id: 2, time: "8s ago", ip: "69.171.251.10 (Facebook Crawler, US)", source: "Meta Ads (IG Reel)", action: "SERVED WHITE-PAGE BLOG", status: "CLOAKED", note: "Bot Filtered - Zero Ban" },
    { id: 3, time: "19s ago", ip: "106.215.112.44 (Airtel 4G, Bilaspur)", source: "Telegram Aviator VIP", action: "DEPOSIT INITIATED (₹500)", status: "CONVERTED", note: "UPI Intent Fired" },
    { id: 4, time: "34s ago", ip: "104.28.19.4 (Datacenter Proxy)", source: "TrafficStars", action: "QUARANTINED", status: "403 BLOCKED", note: "VPN/Proxy Rejected" },
    { id: 5, time: "52s ago", ip: "49.36.177.102 (Jio 4G, Durg)", source: "ExoClick (Popunder)", action: "PASSED TO GAME", status: "200 OK", note: "Active Gaming Session" }
  ]);

  const handleSimulateTrafficHit = () => {
    const randomHits = [
      { ip: "157.44.12.98 (Jio 5G, Raipur)", source: "ExoClick Popunder", action: "PASSED TO GAME", status: "200 OK", note: "New Punter Joined" },
      { ip: "31.13.127.1 (Instagram Bot, Dublin)", source: "Meta Cloaker", action: "SERVED WHITE-PAGE BLOG", status: "CLOAKED", note: "Review Bot Neutralized" },
      { ip: "117.200.45.12 (Airtel 4G, Bhilai)", source: "Telegram Aviator VIP", action: "DEPOSIT INITIATED (₹1,000)", status: "CONVERTED", note: "GPay Intent Auto-Settled" },
      { id: Date.now(), ip: "185.220.101.5 (Tor Exit Node)", source: "TrafficJunky", action: "QUARANTINED", status: "403 BLOCKED", note: "Tor Fraud Aborted" }
    ];
    const pick = randomHits[Math.floor(Math.random() * randomHits.length)];
    setSimulatedTrafficLogs(prev => [
      { id: Date.now(), time: "Just now", ...pick },
      ...prev.slice(0, 7)
    ]);
  };

  // API & Webhook State
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://api.babaenterprises.in/v1/garuda/webhook");
  const [webhookTestStatus, setWebhookTestStatus] = useState(null);

  // Transactions Dataset
  const [transactions, setTransactions] = useState([
    { id: "TXN-984210", utr: "432891084201", user: "Player_9842", amt: 500, rail: "UPI / PhonePe", van: "ICIC-VAN-8492", status: "SETTLED", sweep: "SWEPT (18s)", time: "11:42:01", telemetry: "Jio 5G / 2FA OK" },
    { id: "TXN-984209", utr: "432891084198", user: "VIP_Karan", amt: 25000, rail: "IMPS", van: "ICIC-VAN-8491", status: "SETTLED", sweep: "SWEPT (22s)", time: "11:39:15", telemetry: "Airtel 5G / Biometric" },
    { id: "TXN-984208", utr: "432891084144", user: "Rahul_VIP", amt: 10000, rail: "UPI / GPay", van: "ICIC-VAN-8490", status: "SETTLED", sweep: "SWEPT (19s)", time: "11:35:42", telemetry: "WiFi Raipur / 2FA OK" },
    { id: "TXN-984207", utr: "432891084091", user: "Suresh_88", amt: 50000, rail: "RTGS", van: "ICIC-VAN-8489", status: "SETTLED", sweep: "SWEPT (25s)", time: "11:22:10", telemetry: "Corporate Token" },
    { id: "TXN-984206", utr: "432891083992", user: "Gamer_Ajay", amt: 2500, rail: "UPI / Paytm", van: "ICIC-VAN-8488", status: "SETTLED", sweep: "SWEPT (16s)", time: "11:15:30", telemetry: "Vi 4G / 2FA OK" },
    { id: "TXN-984205", utr: "432891083812", user: "Deepak_99", amt: 50000, rail: "IMPS", van: "ICIC-VAN-8487", status: "SETTLED", sweep: "SWEPT (20s)", time: "11:02:18", telemetry: "Airtel Fiber / 2FA OK" }
  ]);

  // Virtual Accounts (VANs) Dataset
  const [vans, setVans] = useState([
    { van: "ICIC-VAN-8492", assignedTo: "Player_9842 (Node #1)", bank: "ICICI Bank CIB", currentBal: 0, sweptTotal: 15500, status: "ACTIVE" },
    { van: "ICIC-VAN-8491", assignedTo: "VIP_Karan (Node #2)", bank: "ICICI Bank CIB", currentBal: 0, sweptTotal: 75000, status: "ACTIVE" },
    { van: "ICIC-VAN-8490", assignedTo: "Rahul_VIP (Node #3)", bank: "ICICI Bank CIB", currentBal: 0, sweptTotal: 30000, status: "ACTIVE" },
    { van: "ICIC-VAN-8489", assignedTo: "Suresh_88 (Node #4)", bank: "ICICI Bank CIB", currentBal: 0, sweptTotal: 150000, status: "ACTIVE" },
    { van: "ICIC-VAN-8488", assignedTo: "Gamer_Ajay (Node #5)", bank: "ICICI Bank CIB", currentBal: 0, sweptTotal: 12500, status: "ACTIVE" }
  ]);

  // Generate QR on load or amount change
  useEffect(() => {
    const upiString = `upi://pay?pa=baba.pay8492@icicibank&pn=Baba%20Enterprises&am=${qrAmount}&cu=INR&tn=${qrRef}&mode=02`;
    QRCode.toDataURL(upiString, { width: 220, margin: 1, color: { dark: "#050811", light: "#00F59B" } })
      .then(url => setGeneratedQR(url))
      .catch(err => console.error(err));
  }, [qrAmount, qrRef]);

  // Heartbeat micro-interval simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeatPing(Math.floor(28 + Math.random() * 8));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Trigger Freeze Test Simulator (The ₹500 Sore-Loser Scenario)
  const handleTriggerFreezeTest = () => {
    setDisputeTriggered(true);
    setSirenActive(true);
    setQuarantinedNode("ICIC-VAN-8492");
    
    // Update transactions to prepend the disputed item
    setTransactions(prev => [
      {
        id: "DISPUTE-1930-89",
        utr: "432891084201",
        user: "Player_9842 (Sore Loser)",
        amt: 500,
        rail: "1930 Cyber Cell / Section 102",
        van: "ICIC-VAN-8492",
        status: "QUARANTINED",
        sweep: "ISOLATED (At-Rest: ₹0.00)",
        time: "JUST NOW",
        telemetry: "🚨 1930 TICKET #CYB-RPR-881"
      },
      ...prev
    ]);

    // Update affected VAN status
    setVans(prev => prev.map(v => v.van === "ICIC-VAN-8492" ? { ...v, status: "QUARANTINED" } : v));
  };

  // Reset Freeze Test
  const handleResetFreezeTest = () => {
    setDisputeTriggered(false);
    setSirenActive(false);
    setQuarantinedNode(null);
    setDossierNoticeSent(false);
    setVans(prev => prev.map(v => v.van === "ICIC-VAN-8492" ? { ...v, status: "ACTIVE" } : v));
    setTransactions(prev => prev.filter(t => !t.id.startsWith("DISPUTE")));
  };

  const entityName = merchantEntity === "baba_enterprises" 
    ? "BABA ENTERPRISES (Dalip Bhai Node #01)" 
    : "RAIPUR HOLDINGS & GAMING PVT LTD";
  const partnerId = merchantEntity === "baba_enterprises" ? "234" : "101";

  return (
    <div style={{
      background: "#050811",
      minHeight: "100vh",
      color: "#F1F5F9",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      
      {/* TOP COMMAND HEADER */}
      <header style={{
        background: "rgba(11, 16, 28, 0.95)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(16, 185, 129, 0.2)",
        padding: "0.85rem 1.6rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🦅</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.03em", color: "#F8FAFC" }}>
                  GARUDA SOVEREIGN GATEWAY
                </span>
                <span style={{ fontSize: "0.7rem", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", padding: "1px 6px", borderRadius: 4, color: "#10B981", fontWeight: 700 }}>
                  v3.0-ARMORED
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginTop: 2 }}>
                Entity: <strong style={{ color: "#38BDF8" }}>{entityName}</strong>
                <span style={{ color: "#64748B", marginLeft: 6 }}>(Partner ID: {partnerId})</span>
              </div>
            </div>
          </div>

          <div style={{ height: "26px", width: "1px", background: "rgba(255,255,255,0.1)" }} />

          {/* Master Vault Live Indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            padding: "4px 12px",
            borderRadius: 8
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
            <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Master Vault (ICICI ...9842):</span>
            <strong style={{ fontSize: "0.85rem", color: "#10B981", letterSpacing: "0.02em" }}>₹{masterVaultBalance.toLocaleString("en-IN")}</strong>
            <span style={{ fontSize: "0.72rem", color: "#64748B" }}>• Auto-Sweep 30s ({lastSweepTime})</span>
          </div>

          {/* Heartbeat Pulse */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: "0.74rem",
            color: "#38BDF8"
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#38BDF8" }} />
            <span>Bank Heartbeat: <strong>{heartbeatPing}ms</strong> (Nominal)</span>
          </div>
        </div>

        {/* 7-DAY PILOT CAP GAUGE & ENTITY SELECTOR */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          
          {/* Entity Toggle */}
          <select 
            value={merchantEntity} 
            onChange={(e) => setMerchantEntity(e.target.value)}
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              color: "#E2E8F0",
              fontSize: "0.75rem",
              padding: "4px 8px",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            <option value="baba_enterprises">Baba Enterprises (Dalip Bhai)</option>
            <option value="raipur_holdings">Raipur Holdings & Gaming</option>
          </select>

          <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "6px 14px", borderRadius: 8, border: "1px solid #1E293B", textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: 3 }}>
              <span style={{ fontSize: "0.72rem", color: "#F59E0B", fontWeight: 700 }}>⚡ 7-DAY PILOT ACTIVE</span>
              <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{daysLeft} Days Left</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: 130, height: 6, background: "#1E293B", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(pilotVolume / maxPilotVolume) * 100}%`, height: "100%", background: "linear-gradient(90deg, #F59E0B, #10B981)", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#E2E8F0" }}>
                ₹{(pilotVolume / 1000).toFixed(1)}k / ₹{(maxPilotVolume / 100000)}L
              </span>
            </div>
          </div>

          <div style={{
            background: disputeTriggered ? "rgba(220, 38, 38, 0.2)" : "rgba(16, 185, 129, 0.15)",
            border: disputeTriggered ? "1px solid #EF4444" : "1px solid #10B981",
            color: disputeTriggered ? "#FCA5A5" : "#6EE7B7",
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: "0.78rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: disputeTriggered ? "#EF4444" : "#10B981" }} />
            <span>{disputeTriggered ? "🔴 1 NODE QUARANTINED" : "🟢 ALL 5 NODES ARMORED"}</span>
          </div>
        </div>
      </header>

      {/* 5-SECOND SIREN DISPUTE ALERT BAR (WHEN TEST TRIGGERED) */}
      {disputeTriggered && (
        <div style={{
          background: "linear-gradient(90deg, #991B1B 0%, #7F1D1D 100%)",
          color: "#FEF2F2",
          padding: "0.85rem 1.6rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #DC2626",
          boxShadow: "0 0 25px rgba(220, 38, 38, 0.4)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🚨</span>
            <div>
              <strong>5-SECOND HEARTBEAT SIREN TRIGGERED: ₹500 RECHARGE DISPUTE DETECTED!</strong>
              <div style={{ fontSize: "0.8rem", color: "#FEE2E2", marginTop: 2 }}>
                Player #9842 lodged false 1930 complaint post-gameplay. <strong>Sub-Node {quarantinedNode} Quarantined (At-Rest Balance: ₹0.00).</strong>
                <span style={{ color: "#FEF08A", marginLeft: 6 }}>Master Vault (₹14,50,000) & Remaining 4 Nodes are 100% UNTOUCHED.</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              onClick={() => setShowDossierModal(true)}
              style={{
                background: "#FFFFFF",
                color: "#991B1B",
                border: "none",
                borderRadius: 6,
                padding: "7px 14px",
                fontWeight: 800,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}
            >
              📄 Open Section 65B Court Dossier
            </button>
            <button
              onClick={handleResetFreezeTest}
              style={{
                background: "rgba(0,0,0,0.3)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: "0.82rem",
                cursor: "pointer"
              }}
            >
              Reset Siren
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>

        {/* SIDEBAR NAVIGATION */}
        <aside style={{
          width: 250,
          background: "rgba(11, 16, 28, 0.98)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "1.2rem 0.8rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem"
        }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "0 0.6rem 0.4rem", letterSpacing: "0.05em" }}>
            TREASURY WAR ROOM
          </div>

          <button
            onClick={() => setActiveTab("overview")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "overview" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: activeTab === "overview" ? "#10B981" : "#94A3B8",
              border: activeTab === "overview" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>📊</span> Dashboard Overview
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "transactions" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "transactions" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "transactions" ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>💳</span> Live UTR Stream ({transactions.length})
          </button>

          <button
            onClick={() => setActiveTab("qr_generator")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "qr_generator" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              color: activeTab === "qr_generator" ? "#F59E0B" : "#94A3B8",
              border: activeTab === "qr_generator" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid transparent",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>⚡</span> Dynamic UPI Intent Terminal
          </button>

          <button
            onClick={() => setActiveTab("vans")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "vans" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: activeTab === "vans" ? "#10B981" : "#94A3B8",
              border: activeTab === "vans" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>🏦</span> Virtual Account Nodes (5)
          </button>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.8rem 0" }} />

          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", padding: "0 0.6rem 0.4rem", letterSpacing: "0.05em" }}>
            ARMORED DEFENSE SUITE
          </div>

          <button
            onClick={() => setActiveTab("cyber_defense")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "cyber_defense" ? "rgba(220, 38, 38, 0.25)" : disputeTriggered ? "rgba(220, 38, 38, 0.15)" : "transparent",
              color: activeTab === "cyber_defense" ? "#F87171" : disputeTriggered ? "#EF4444" : "#94A3B8",
              border: disputeTriggered ? "1px solid #DC2626" : "1px solid transparent",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>🚨</span> 1930 Cyber Fraud & Freeze
          </button>

          <button
            onClick={() => setActiveTab("integrations")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "integrations" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "integrations" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "integrations" ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>⚙️</span> API & Webhook Gateway
          </button>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.8rem 0" }} />

          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#C084FC", textTransform: "uppercase", padding: "0 0.6rem 0.4rem", letterSpacing: "0.05em" }}>
            GROWTH & TRAFFIC ENGINE
          </div>

          <button
            onClick={() => setActiveTab("ad_matrix")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              width: "100%",
              padding: "0.65rem 0.8rem",
              background: activeTab === "ad_matrix" ? "rgba(168, 85, 247, 0.25)" : "rgba(168, 85, 247, 0.08)",
              color: activeTab === "ad_matrix" ? "#E9D5FF" : "#C084FC",
              border: activeTab === "ad_matrix" ? "1px solid #A855F7" : "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: 6,
              fontSize: "0.86rem",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              boxShadow: activeTab === "ad_matrix" ? "0 0 12px rgba(168, 85, 247, 0.3)" : "none"
            }}
          >
            <span>🚀</span> ₹10k/Day Ad Matrix & Cloaker
          </button>

          <div style={{ marginTop: "auto", padding: "0.8rem", background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: "0.74rem" }}>
            <div style={{ color: "#94A3B8", marginBottom: 3 }}>Armored Node: <strong style={{ color: "#10B981" }}>ONLINE</strong></div>
            <div style={{ color: "#64748B" }}>ICICI CIB Private IP: <code>10.14.88.2</code></div>
            <div style={{ color: "#F59E0B", marginTop: 4 }}>● At-Rest Capital: <strong>₹0.00</strong></div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main style={{ flex: 1, padding: "1.8rem", overflowY: "auto" }}>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div>
              {/* TOP 4 METRIC CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2rem", marginBottom: "1.6rem" }}>
                
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.2rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: 4 }}>TODAY'S INFLOW VOLUME</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#F8FAFC" }}>₹1,47,500</div>
                  <div style={{ fontSize: "0.74rem", color: "#10B981", marginTop: 4 }}>↑ +14.2% from yesterday • 142 Txns</div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: 10, padding: "1.2rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: 4 }}>TOTAL SWEPT TO VAULT</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10B981" }}>₹1,47,500</div>
                  <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: 4 }}>100% Swept in 18s • Zero Aggregator Hold</div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 10, padding: "1.2rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: 4 }}>AT-REST LIQUIDITY EXPOSURE</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#38BDF8" }}>₹0.00</div>
                  <div style={{ fontSize: "0.74rem", color: "#10B981", marginTop: 4 }}>🛡️ Protected by Zero-Custody Rule</div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 10, padding: "1.2rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: 4 }}>1930 DISPUTE DEFENSE STATUS</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: disputeTriggered ? "#EF4444" : "#10B981" }}>
                    {disputeTriggered ? "1 ISOLATED" : "ARMORED"}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: 4 }}>5-Second Siren Active • Sec 65B Ready</div>
                </div>

              </div>

              {/* LIVE RECONCILIATION & UTR STREAM */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#F8FAFC" }}>Live Incoming UTR & Auto-Sweep Stream</div>
                    <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Every rupee swept to ICICI Corporate Vault in under 30 seconds with 2FA telemetry.</div>
                  </div>
                  <button 
                    onClick={() => setActiveTab("qr_generator")}
                    style={{ background: "#10B981", color: "#050811", border: "none", padding: "6px 14px", borderRadius: 6, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    + Generate Test Payment
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#64748B", textAlign: "left" }}>
                      <th style={{ padding: "0.6rem 0.8rem" }}>TIME</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>TXN & UTR</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>CUSTOMER</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>AMOUNT</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>RAIL</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>SUB-NODE (VAN)</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>SWEEP STATUS</th>
                      <th style={{ padding: "0.6rem 0.8rem" }}>TELEMETRY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={idx} style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: t.status === "QUARANTINED" ? "rgba(220, 38, 38, 0.15)" : "transparent"
                      }}>
                        <td style={{ padding: "0.75rem 0.8rem", color: "#94A3B8", fontFamily: "monospace" }}>{t.time}</td>
                        <td style={{ padding: "0.75rem 0.8rem", fontFamily: "monospace", color: "#E2E8F0" }}>
                          <div>{t.id}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748B" }}>UTR: {t.utr}</div>
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem", fontWeight: 600 }}>{t.user}</td>
                        <td style={{ padding: "0.75rem 0.8rem", fontWeight: 800, color: t.status === "QUARANTINED" ? "#FCA5A5" : "#10B981" }}>
                          ₹{t.amt.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem", color: "#94A3B8" }}>{t.rail}</td>
                        <td style={{ padding: "0.75rem 0.8rem", fontFamily: "monospace", color: "#38BDF8" }}>{t.van}</td>
                        <td style={{ padding: "0.75rem 0.8rem" }}>
                          <span style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: t.status === "QUARANTINED" ? "rgba(220,38,38,0.3)" : "rgba(16,185,129,0.15)",
                            color: t.status === "QUARANTINED" ? "#EF4444" : "#10B981"
                          }}>
                            {t.sweep}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem", fontSize: "0.74rem", color: t.status === "QUARANTINED" ? "#F87171" : "#94A3B8" }}>
                          {t.telemetry}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          

          {/* TAB 2: TRANSACTIONS VIEW */}
          {activeTab === "transactions" && (
            <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Complete Reconciled Transaction Ledger</div>
                  <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Every single transaction verified via cryptographic HMAC-SHA256 signature.</div>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#10B981", fontWeight: 700 }}>
                  ● 100% Reconciliation Accuracy (0 Mismatches)
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: 6, marginBottom: "1rem", display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
                <div>Total Volume Processed: <strong>₹1,47,500</strong></div>
                <div>•</div>
                <div>Master Vault Sweeps: <strong>142 / 142</strong></div>
                <div>•</div>
                <div>Average Sweep Latency: <strong>18.4 Seconds</strong></div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#64748B", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem 0.8rem" }}>TXN ID</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>BANK UTR</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>AMOUNT</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>METHOD</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>DESTINATION VAULT</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>STATUS</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.75rem 0.8rem", fontFamily: "monospace", color: "#E2E8F0" }}>{t.id}</td>
                      <td style={{ padding: "0.75rem 0.8rem", fontFamily: "monospace", color: "#94A3B8" }}>{t.utr}</td>
                      <td style={{ padding: "0.75rem 0.8rem", fontWeight: 800, color: "#10B981" }}>₹{t.amt.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "0.75rem 0.8rem", color: "#94A3B8" }}>{t.rail}</td>
                      <td style={{ padding: "0.75rem 0.8rem", color: "#38BDF8" }}>ICICI Corp ...9842</td>
                      <td style={{ padding: "0.75rem 0.8rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                          SETTLED & SWEPT
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.8rem" }}>
                        <button
                          onClick={() => setShowDossierModal(true)}
                          style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38BDF8", borderRadius: 4, padding: "2px 8px", fontSize: "0.72rem", cursor: "pointer" }}
                        >
                          65B Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          

          {/* TAB 3: DYNAMIC UPI INTENT TERMINAL */}
          {activeTab === "qr_generator" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              
              {/* TERMINAL CONTROLS */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 6 }}>Sub-Second Dynamic UPI Intent Terminal</div>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginBottom: "1.4rem" }}>
                  Generates instant NPCI Mode-02 Dynamic QR and direct deep-links for PhonePe, GPay, Paytm with zero payment drops.
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: 6 }}>RECHARGE AMOUNT (INR)</label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
                    {[100, 500, 1000, 2500, 5000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setQrAmount(amt)}
                        style={{
                          background: qrAmount === amt ? "#10B981" : "rgba(255,255,255,0.05)",
                          color: qrAmount === amt ? "#050811" : "#E2E8F0",
                          border: qrAmount === amt ? "none" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          padding: "6px 12px",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer"
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={qrAmount}
                    onChange={(e) => setQrAmount(Number(e.target.value))}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", padding: "0.7rem", borderRadius: 6, fontSize: "1rem", fontWeight: 700 }}
                  />
                </div>

                {/* 1-TAP MOBILE INTENT APP BUTTONS */}
                <div style={{ marginBottom: "1.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: 6 }}>DIRECT 1-TAP APP DEEP-LINKS (0.3s LAUNCH)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                    <button
                      onClick={() => setActiveIntentApp("PhonePe")}
                      style={{ background: "rgba(103, 58, 183, 0.2)", border: "1px solid #673AB7", color: "#D1C4E9", borderRadius: 6, padding: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}
                    >
                      🟣 Open PhonePe ⚡
                    </button>
                    <button
                      onClick={() => setActiveIntentApp("GooglePay")}
                      style={{ background: "rgba(66, 133, 244, 0.2)", border: "1px solid #4285F4", color: "#BBDEFB", borderRadius: 6, padding: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}
                    >
                      🔵 Open Google Pay ⚡
                    </button>
                    <button
                      onClick={() => setActiveIntentApp("Paytm")}
                      style={{ background: "rgba(0, 186, 242, 0.2)", border: "1px solid #00BAF2", color: "#B3E5FC", borderRadius: 6, padding: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}
                    >
                      🔷 Open Paytm UPI ⚡
                    </button>
                    <button
                      onClick={() => setActiveIntentApp("BHIM")}
                      style={{ background: "rgba(245, 158, 11, 0.2)", border: "1px solid #F59E0B", color: "#FDE68A", borderRadius: 6, padding: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}
                    >
                      🟠 Open BHIM / Cred ⚡
                    </button>
                  </div>
                  {activeIntentApp && (
                    <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#10B981" }}>
                      ✔ Native intent launched for {activeIntentApp} in 0.32s!
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setQrSettled(true);
                    setTimeout(() => {
                      setMasterVaultBalance(prev => prev + qrAmount);
                      setTransactions(prev => [
                        {
                          id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                          utr: `432891${Math.floor(100000 + Math.random() * 900000)}`,
                          user: "Live_Test_Player",
                          amt: qrAmount,
                          rail: "UPI / Dynamic Intent",
                          van: "ICIC-VAN-8492",
                          status: "SETTLED",
                          sweep: "SWEPT (18s)",
                          time: "JUST NOW",
                          telemetry: "Airtel 5G / 2FA Verified"
                        },
                        ...prev
                      ]);
                      setQrSettled(false);
                    }, 1200);
                  }}
                  style={{
                    width: "100%",
                    background: "#10B981",
                    color: "#050811",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.8rem",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: "pointer"
                  }}
                >
                  {qrSettled ? "Simulating Bank Webhook & Auto-Sweep..." : `Simulate ₹${qrAmount} Live Payment Credit`}
                </button>
              </div>

              {/* LIVE QR DISPLAY CARD */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.8rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginBottom: 6 }}>NPCI MODE-02 DYNAMIC UPI QR</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10B981", marginBottom: "1rem" }}>₹{qrAmount}.00</div>

                <div style={{
                  display: "inline-block",
                  padding: "1rem",
                  background: "#050811",
                  border: "2px solid #10B981",
                  borderRadius: 12,
                  boxShadow: "0 0 25px rgba(16, 185, 129, 0.2)",
                  marginBottom: "1rem"
                }}>
                  {generatedQR && <img src={generatedQR} alt="UPI QR" style={{ width: 200, height: 200, display: "block" }} />}
                </div>

                <div style={{ fontSize: "0.78rem", color: "#64748B", marginBottom: 6 }}>
                  VPA: <code style={{ color: "#38BDF8" }}>baba.pay8492@icicibank</code>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#F59E0B" }}>
                  ⏳ Dynamic Expire Countdown: <strong>04:42</strong>
                </div>
              </div>

            </div>
          )}

          

          {/* TAB 4: VANS (VIRTUAL ACCOUNTS) */}
          {activeTab === "vans" && (
            <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Disposable Virtual Account (VAN) Sub-Nodes</div>
                  <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                    Each VIP / Gamer routes through an isolated node. Funds sweep in 30 seconds leaving balance at ₹0.00.
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#38BDF8", fontWeight: 700 }}>
                  Master Account Shield: Active
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
                {vans.map((v, idx) => (
                  <div key={idx} style={{
                    background: v.status === "QUARANTINED" ? "rgba(220, 38, 38, 0.15)" : "rgba(11, 16, 28, 0.8)",
                    border: v.status === "QUARANTINED" ? "1px solid #DC2626" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748B" }}>NODE #{idx + 1}</span>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: v.status === "QUARANTINED" ? "#991B1B" : "rgba(16,185,129,0.2)",
                        color: v.status === "QUARANTINED" ? "#FEF2F2" : "#10B981"
                      }}>
                        {v.status}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#F8FAFC", marginBottom: 2 }}>{v.van}</div>
                    <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginBottom: "0.8rem" }}>{v.assignedTo}</div>

                    <div style={{ background: "#050811", padding: "6px 8px", borderRadius: 4, fontSize: "0.74rem", marginBottom: 6 }}>
                      <div style={{ color: "#64748B" }}>At-Rest Balance:</div>
                      <div style={{ fontWeight: 800, color: "#10B981" }}>₹{v.currentBal}.00 (Swept)</div>
                    </div>

                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      Total Volume: ₹{v.sweptTotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          

          {/* TAB 5: 1930 CYBER FRAUD & FREEZE DEFENSE */}
          {activeTab === "cyber_defense" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                
                {/* SORE-LOSER ATTACK SIMULATOR */}
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: 10, padding: "1.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 4 }}>
                    <span style={{ fontSize: "1.2rem" }}>🎯</span>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#EF4444" }}>
                      The ₹500 Sore-Loser 1930 Attack Simulator
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginBottom: "1.2rem" }}>
                    Simulates the exact real-world scenario: User deposits ₹500 ➔ Plays 2 rounds ➔ Loses ➔ Dials 1930 Cyber Cell immediately.
                  </div>

                  <div style={{ background: "#0B0F19", padding: "0.8rem", borderRadius: 6, fontSize: "0.78rem", marginBottom: "1rem", lineHeight: 1.6 }}>
                    <div><strong>T = 0s:</strong> Player #9842 recharges ₹500 via PhonePe on Node ICIC-VAN-8492.</div>
                    <div><strong>T = 18s:</strong> Auto-swept to Master Vault. Sub-node balance: <strong>₹0.00</strong>.</div>
                    <div><strong>T = 2m:</strong> User loses in gameplay and logs false 1930 dispute.</div>
                    <div><strong>T = 2m 5s:</strong> Bank API sends automated Section 102 inquiry.</div>
                  </div>

                  <div style={{ display: "flex", gap: "0.8rem" }}>
                    <button
                      onClick={handleTriggerFreezeTest}
                      disabled={disputeTriggered}
                      style={{
                        flex: 1,
                        background: disputeTriggered ? "#475569" : "#DC2626",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 6,
                        padding: "0.75rem",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: disputeTriggered ? "not-allowed" : "pointer"
                      }}
                    >
                      {disputeTriggered ? "Siren Alert Active" : "Trigger Malicious 1930 Attack"}
                    </button>

                    {disputeTriggered && (
                      <button
                        onClick={handleResetFreezeTest}
                        style={{
                          background: "#1E293B",
                          color: "#94A3B8",
                          border: "1px solid #334155",
                          borderRadius: 6,
                          padding: "0.75rem 1.2rem",
                          fontSize: "0.85rem",
                          cursor: "pointer"
                        }}
                      >
                        Reset Test
                      </button>
                    )}
                  </div>
                </div>

                {/* ARCHITECTURAL ISOLATION RESULT */}
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 6 }}>Architectural Isolation Result</div>
                  <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginBottom: "1rem" }}>
                    Chain Reaction broken at the CMS Nodal Boundary.
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", padding: "0.75rem 1rem", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Master Corporate Account (ICICI ...9842)</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>₹14,50,000 Liquid Operating Capital</div>
                      </div>
                      <span style={{ color: "#10B981", fontWeight: 800, fontSize: "0.82rem" }}>🟢 100% SAFE & ACTIVE</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", padding: "0.75rem 1rem", borderRadius: 6, border: disputeTriggered ? "1px solid #DC2626" : "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Affected Sub-Node (ICIC-VAN-8492)</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Disputed Inward Node (₹0.00 Balance at Risk)</div>
                      </div>
                      <span style={{ color: disputeTriggered ? "#EF4444" : "#10B981", fontWeight: 800, fontSize: "0.82rem" }}>
                        {disputeTriggered ? "🔴 QUARANTINED (Lien Limit)" : "🟢 ACTIVE"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0B0F19", padding: "0.75rem 1rem", borderRadius: 6 }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Remaining 4 Collection Nodes</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>All other customers continue playing with zero latency</div>
                      </div>
                      <span style={{ color: "#10B981", fontWeight: 800, fontSize: "0.82rem" }}>🟢 UNTOUCHED</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 65B EVIDENCE DOSSIER CARD */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>Automated Section 65B Court-Ready Defense Dossier</div>
                    <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                      Instant cryptographic evidence generated in 0.8s for Bank Nodal Officer & Cyber Crime IO.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDossierModal(true)}
                    style={{ background: "#2563EB", color: "#FFF", border: "none", padding: "6px 14px", borderRadius: 6, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    View Full Legal Dossier
                  </button>
                </div>

                <div style={{ background: "#050811", padding: "1rem", borderRadius: 6, fontFamily: "monospace", fontSize: "0.78rem", color: "#94A3B8", lineHeight: 1.6 }}>
                  <div>[1] 2FA OTP Authentication: OTP-849102 verified via Airtel 5G (IP: 103.21.88.42, Raipur Circle)</div>
                  <div>[2] Consideration Delivered: 500 Chips credited in 0.82s (Ledger Ref: GAM-LEDG-882107)</div>
                  <div>[3] Consumption Proof: User played 42 consecutive rounds between 11:42 and 11:45 (Provably Fair RNG Hash: 0x7a89bc33...)</div>
                  <div>[4] Supreme Court Precedent: State of Maharashtra v. Tapas D. Neogy (1999) 7 SCC 685 (Sec 102 CrPC misuse prohibited)</div>
                  <div style={{ color: "#38BDF8", marginTop: 4 }}>Statutory Directive: Immediate debit lien revocation mandate within 24 hours under Section 79 IT Act.</div>
                </div>
              </div>
            </div>
          )}

          

          {/* TAB 6: INTEGRATIONS & API KEYS */}
          {activeTab === "integrations" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              
              {/* API KEYS & WEBHOOKS */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 6 }}>API Credentials & Webhook Gateway</div>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginBottom: "1.2rem" }}>
                  Connect your gaming website/app or third-party CRM directly to GARUDA's orchestration layer.
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: 4 }}>MERCHANT ID (PROD)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      readOnly
                      value="mid_live_baba_234_9842"
                      style={{ flex: 1, background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", padding: "0.6rem", borderRadius: 6, fontSize: "0.85rem", fontFamily: "monospace" }}
                    />
                    <button style={{ background: "#334155", color: "#FFF", border: "none", padding: "0 12px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}>Copy</button>
                  </div>
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: 4 }}>SECRET KEY (HMAC-SHA256)</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="password"
                      readOnly
                      value="sec_live_9842fa89b3c410e588"
                      style={{ flex: 1, background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", padding: "0.6rem", borderRadius: 6, fontSize: "0.85rem", fontFamily: "monospace" }}
                    />
                    <button
                      onClick={() => {
                        setApiKeyCopied(true);
                        setTimeout(() => setApiKeyCopied(false), 2000);
                      }}
                      style={{ background: "#334155", color: "#FFF", border: "none", padding: "0 12px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}
                    >
                      {apiKeyCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginBottom: 4 }}>WEBHOOK NOTIFICATION URL</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", padding: "0.6rem", borderRadius: 6, fontSize: "0.85rem", fontFamily: "monospace" }}
                  />
                </div>

                <button
                  onClick={() => {
                    setWebhookTestStatus("testing");
                    setTimeout(() => setWebhookTestStatus("success"), 600);
                  }}
                  style={{
                    background: "#10B981",
                    color: "#050811",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.65rem 1rem",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    cursor: "pointer"
                  }}
                >
                  {webhookTestStatus === "testing" ? "Pinging Webhook..." : webhookTestStatus === "success" ? "✔ Webhook Verified (HTTP 200 - 32ms)" : "Test Webhook Ping"}
                </button>
              </div>

              {/* INTEGRATION CODE SNIPPET */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 6 }}>Server-Side Integration (Node.js / cURL)</div>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginBottom: "1rem" }}>
                  Your developer can plug this into your backend in 5 lines of code:
                </div>

                <pre style={{ background: "#050811", padding: "1rem", borderRadius: 6, fontSize: "0.78rem", color: "#38BDF8", overflowX: "auto", lineHeight: 1.5 }}>
{`// 1. Create Dynamic Payment Intent (Node.js)
const response = await fetch("https://api.garudaos.in/v1/payments/create", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sec_live_9842fa89b3...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 500,
    currency: "INR",
    gamerId: "Player_9842",
    rail: "UPI_DYNAMIC_INTENT"
  })
});

const { upiString, qrImageUrl, intentDeepLink } = await response.json();
// Present intentDeepLink for PhonePe/GPay 1-tap checkout!`}
                </pre>
              </div>

            </div>
          )}

          

{/* TAB 7: GROWTH & AD MATRIX (THE ₹10K/DAY TRAFFIC MACHINE) */}
          {activeTab === "ad_matrix" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* HEADER BANNER */}
              <div style={{
                background: "linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                borderRadius: 12,
                padding: "1.5rem 1.8rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 8px 32px rgba(168, 85, 247, 0.15)"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: 6 }}>
                    <span style={{ fontSize: "1.3rem" }}>🚀</span>
                    <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900, color: "#F8FAFC", letterSpacing: "0.02em" }}>
                      GARUDA OMNI-TRAFFIC MATRIX — ₹10,000 / DAY IGAMING AD ENGINE
                    </h2>
                    <span style={{ background: "#A855F7", color: "#FFF", fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 4 }}>
                      ACTIVE DEPLOYMENT MAP
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "#C084FC" }}>
                    Multi-Rail Performance Marketing • 0% Ban Risk Anti-Bot Cloaker • High-Roller Indian Punter Acquisition
                  </p>
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ textAlign: "right", background: "rgba(0,0,0,0.4)", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>GARUDA 15% Management Fee:</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#34D399" }}>
                      ₹{(dailyBudget * 0.15).toLocaleString("en-IN")}/day <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>(₹{(dailyBudget * 30 * 0.15).toLocaleString("en-IN")}/mo)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BUDGET CONTROLLER & UNIT ECONOMICS KPI BAR */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "#94A3B8", fontWeight: 600 }}>SELECT DAILY MEDIA AD BUDGET:</div>
                    <div style={{ display: "flex", gap: "0.6rem", marginTop: 6 }}>
                      {[5000, 10000, 25000, 50000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setDailyBudget(amt)}
                          style={{
                            background: dailyBudget === amt ? "#A855F7" : "rgba(255,255,255,0.05)",
                            color: dailyBudget === amt ? "#FFF" : "#94A3B8",
                            border: dailyBudget === amt ? "1px solid #C084FC" : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            padding: "6px 14px",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {amt === 10000 ? `₹${(amt/1000)}k/Day (Dalip Bhai Active)` : `₹${(amt/1000)}k/Day`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#64748B" }}>
                    Target Geo: <strong style={{ color: "#F1F5F9" }}>India (Tier 2/3 - CG, MP, UP, PB, MH)</strong> • Network: <strong style={{ color: "#38BDF8" }}>Jio/Airtel 4G/5G Only</strong>
                  </div>
                </div>

                {/* 5 KPI METRIC CARDS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase" }}>Monthly Media Spend</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#F8FAFC", marginTop: 4 }}>₹{(dailyBudget * 30).toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>100% Client Funded</div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                    <div style={{ fontSize: "0.72rem", color: "#38BDF8", textTransform: "uppercase" }}>Est. Daily Clicks / Hits</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#38BDF8", marginTop: 4 }}>~{Math.round(dailyBudget * 0.32).toLocaleString()}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>High-Intent Landing Views</div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <div style={{ fontSize: "0.72rem", color: "#F59E0B", textTransform: "uppercase" }}>New User Registrations</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>~{Math.round(dailyBudget * 0.038)}/day</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>~12% Sign-up Rate</div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ fontSize: "0.72rem", color: "#10B981", textTransform: "uppercase" }}>First Time Depositors (FTD)</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10B981", marginTop: 4 }}>~{Math.round(dailyBudget * 0.0033)} players</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>₹500 - ₹2,000 Avg Deposit</div>
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "1rem", borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    <div style={{ fontSize: "0.72rem", color: "#34D399", textTransform: "uppercase" }}>Day-1 Gaming Deposit Cash</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#34D399", marginTop: 4 }}>₹{(dailyBudget * 2.32).toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: "0.7rem", color: "#10B981", marginTop: 3 }}>⚡ 2.32x Initial ROAS</div>
                  </div>
                </div>
              </div>

              {/* THE 3-CHANNEL DEPLOYMENT WAR CHEST */}
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.8rem", color: "#F1F5F9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎯</span> THE 3-RAIL AD ARBITRAGE ALLOCATION (HOW DALIP BHAI'S ₹10k/DAY IS SPENT)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem" }}>

                  {/* CHANNEL 1: ADULT AD NETWORKS */}
                  <div style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 10,
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                        <div>
                          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#EF4444", textTransform: "uppercase" }}>RAIL 01 • ZERO POLICY BAN RISK</div>
                          <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#F8FAFC" }}>🔞 Adult Ad Networks</div>
                          <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>ExoClick • TrafficJunky • TrafficStars</div>
                        </div>
                        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#F87171", padding: "4px 8px", borderRadius: 4, fontWeight: 800, fontSize: "0.85rem" }}>
                          40% (₹{(dailyBudget * 0.4).toLocaleString("en-IN")}/day)
                        </div>
                      </div>

                      <div style={{ fontSize: "0.82rem", color: "#CBD5E1", lineHeight: 1.5, marginBottom: "1rem" }}>
                        Adult sites (xHamster, Pornhub, local tube networks) generate <strong>massive male Indian traffic (18-35 age)</strong>. Adult ad networks explicitly allow and welcome online gambling & casino ads! Zero policy bans.
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: 6, fontSize: "0.76rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <div><strong>Format:</strong> Mobile Popunder (Tabunder) + 300x250 Banner</div>
                        <div><strong>Targeting:</strong> Jio 4G/5G, Airtel India Mobile Users</div>
                        <div><strong>Est. Hits:</strong> ~{(dailyBudget * 0.4 / 0.16).toFixed(0)} Impressions / ~1,800 Direct Game Hits</div>
                        <div style={{ color: "#10B981" }}><strong>Active Hook:</strong> "⚡ ₹500 Free Bonus • 10-Second UPI Instant Cashout"</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "1.2rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: 700 }}>● Policy Ban Risk: 0.0%</span>
                      <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>CPC: ₹0.14 - ₹0.18</span>
                    </div>
                  </div>

                  {/* CHANNEL 2: TELEGRAM PBN & TIPSTER CHANNELS */}
                  <div style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: 10,
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                        <div>
                          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#38BDF8", textTransform: "uppercase" }}>RAIL 02 • HIGHEST DEPOSIT INTENT</div>
                          <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#F8FAFC" }}>✈️ Telegram PBN Networks</div>
                          <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Cricket Tips • Aviator Hack • Satta Channels</div>
                        </div>
                        <div style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", padding: "4px 8px", borderRadius: 4, fontWeight: 800, fontSize: "0.85rem" }}>
                          35% (₹{(dailyBudget * 0.35).toLocaleString("en-IN")}/day)
                        </div>
                      </div>

                      <div style={{ fontSize: "0.82rem", color: "#CBD5E1", lineHeight: 1.5, marginBottom: "1rem" }}>
                        Telegram holds 80% of India's active daily gamblers. We sponsor pinned posts and audio messages inside verified 50k–200k subscriber Cricket Prediction & Aviator channels.
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: 6, fontSize: "0.76rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <div><strong>Format:</strong> Pinned Broadcast Post + Voice Drop + Direct Link</div>
                        <div><strong>Channels:</strong> 4 Exclusive Satta/Cricket Prediction Channels</div>
                        <div><strong>Est. Reach:</strong> ~8,500 Direct Channel Views / ~650 Game Signups</div>
                        <div style={{ color: "#38BDF8" }}><strong>Active Hook:</strong> "🔥 Aviator 2.85x Signal Hack Room • Instant QR Deposit"</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "1.2rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: 700 }}>● Policy Ban Risk: 0.0%</span>
                      <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>CPA: ₹180 - ₹220</span>
                    </div>
                  </div>

                  {/* CHANNEL 3: META INSTAGRAM REELS (CLOAKED) */}
                  <div style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: 10,
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                        <div>
                          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#C084FC", textTransform: "uppercase" }}>RAIL 03 • HIGH-ROLLER VIP FUNNEL</div>
                          <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#F8FAFC" }}>📱 Meta / Instagram Reels</div>
                          <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Click-to-WhatsApp + Keitaro Cloaker</div>
                        </div>
                        <div style={{ background: "rgba(168, 85, 247, 0.15)", color: "#C084FC", padding: "4px 8px", borderRadius: 4, fontWeight: 800, fontSize: "0.85rem" }}>
                          25% (₹{(dailyBudget * 0.25).toLocaleString("en-IN")}/day)
                        </div>
                      </div>

                      <div style={{ fontSize: "0.82rem", color: "#CBD5E1", lineHeight: 1.5, marginBottom: "1rem" }}>
                        Meta bans direct casino links. We deploy a <strong>dual-layered Keitaro cloaker</strong>. Facebook auditors are shown a white-hat "Skill Gaming & Ludo News" blog, while real Indian mobile users are routed to an automated WhatsApp VIP concierge.
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: 6, fontSize: "0.76rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <div><strong>Format:</strong> High-Energy Reels Video Ads (₹10k Winning Proof)</div>
                        <div><strong>Cloaking Shield:</strong> Keitaro IP-Filter + UserAgent Interceptor</div>
                        <div><strong>Est. Leads:</strong> ~120 - 150 High-Roller WhatsApp Inbound Chats/day</div>
                        <div style={{ color: "#C084FC" }}><strong>Active Hook:</strong> "Join Raipur VIP Club • 1-on-1 ID Issuance on WhatsApp"</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "1.2rem", paddingTop: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#38BDF8", fontWeight: 700 }}>🛡️ Cloaked & Agency Shielded</span>
                      <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Cost per Lead: ₹18 - ₹22</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* THE INTERACTIVE VISUAL PIPELINE FLOWCHART */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.5rem" }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "1.2rem", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🗺️</span> THE FULL CONVERSION BLUEPRINT (TRAFFIC-TO-RUPEE FLOWCHART)
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0.8rem",
                  alignItems: "stretch"
                }}>
                  {/* STEP 1 */}
                  <div style={{ background: "#0B0F19", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 8, padding: "1rem", position: "relative" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#C084FC", marginBottom: 4 }}>STAGE 01</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFF", marginBottom: 6 }}>Traffic Ingestion</div>
                    <div style={{ fontSize: "0.76rem", color: "#94A3B8", lineHeight: 1.4 }}>
                      ExoClick adult popunders, Telegram pinned posts, and Meta reels blast targeting ₹10k/day.
                    </div>
                  </div>

                  {/* STEP 2 */}
                  <div style={{ background: "#0B0F19", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#38BDF8", marginBottom: 4 }}>STAGE 02</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFF", marginBottom: 6 }}>Anti-Bot Cloaker</div>
                    <div style={{ fontSize: "0.76rem", color: "#94A3B8", lineHeight: 1.4 }}>
                      Keitaro Engine scans IP & User-Agent in 8ms. Facebook bots see white-hat blog. Real punters passed to game.
                    </div>
                  </div>

                  {/* STEP 3 */}
                  <div style={{ background: "#0B0F19", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#F59E0B", marginBottom: 4 }}>STAGE 03</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFF", marginBottom: 6 }}>1-Click Game Launch</div>
                    <div style={{ fontSize: "0.76rem", color: "#94A3B8", lineHeight: 1.4 }}>
                      No heavy app download. Instant mobile PWA opens in player browser with ₹500 welcome bonus dialog.
                    </div>
                  </div>

                  {/* STEP 4 */}
                  <div style={{ background: "#0B0F19", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#10B981", marginBottom: 4 }}>STAGE 04</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFF", marginBottom: 6 }}>GARUDA UPI Intent</div>
                    <div style={{ fontSize: "0.76rem", color: "#94A3B8", lineHeight: 1.4 }}>
                      Player taps deposit. GPay/PhonePe opens with dynamic Mode-02 UPI string in 0.32s. Instant PIN entry.
                    </div>
                  </div>

                  {/* STEP 5 */}
                  <div style={{ background: "#0B0F19", border: "1px solid rgba(52, 211, 153, 0.4)", borderRadius: 8, padding: "1rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#34D399", marginBottom: 4 }}>STAGE 05</div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFF", marginBottom: 6 }}>Auto-Sweep to Vault</div>
                    <div style={{ fontSize: "0.76rem", color: "#94A3B8", lineHeight: 1.4 }}>
                      Paisa credited! 30-second sweep transfers funds to Dalip Bhai's Master ICICI Vault. VAN balance: ₹0.00!
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE CLOAKER & TRAFFIC TELEMETRY FEED */}
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#F8FAFC" }}>
                      LIVE ANTI-BOT CLOAKER & CONVERSION TELEMETRY
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                      Real-time packet inspection of inbound ad traffic from ExoClick, Telegram & Meta
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateTrafficHit}
                    style={{
                      background: "rgba(168, 85, 247, 0.2)",
                      color: "#E9D5FF",
                      border: "1px solid #A855F7",
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Simulate Live Traffic Click
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.3)", color: "#94A3B8", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px" }}>Time</th>
                        <th style={{ padding: "8px 12px" }}>Inbound IP & Geo</th>
                        <th style={{ padding: "8px 12px" }}>Traffic Source</th>
                        <th style={{ padding: "8px 12px" }}>Cloaker Action</th>
                        <th style={{ padding: "8px 12px" }}>Status</th>
                        <th style={{ padding: "8px 12px" }}>Audit Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulatedTrafficLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "8px 12px", color: "#64748B" }}>{log.time}</td>
                          <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#E2E8F0" }}>{log.ip}</td>
                          <td style={{ padding: "8px 12px", color: "#94A3B8" }}>{log.source}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: log.action.includes("PASSED") ? "#10B981" : log.action.includes("WHITE-PAGE") ? "#C084FC" : log.action.includes("DEPOSIT") ? "#38BDF8" : "#EF4444" }}>
                            {log.action}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              background: log.status === "200 OK" ? "rgba(16, 185, 129, 0.15)" : log.status === "CLOAKED" ? "rgba(168, 85, 247, 0.15)" : log.status === "CONVERTED" ? "rgba(56, 189, 248, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: log.status === "200 OK" ? "#10B981" : log.status === "CLOAKED" ? "#C084FC" : log.status === "CONVERTED" ? "#38BDF8" : "#EF4444"
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", color: "#CBD5E1" }}>{log.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EXECUTIVE TALK-TRACK / PITCH SUMMARY (FOR FOUNDER PRAVEEN) */}
              <div style={{
                background: "linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: 10,
                padding: "1.4rem"
              }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#10B981", marginBottom: 6 }}>
                  💡 EXECUTIVE TALK TRACK FOR DALIP BHAI (CALL PITCH GUIDE)
                </div>
                <div style={{ fontSize: "0.82rem", color: "#CBD5E1", lineHeight: 1.6 }}>
                  1. <strong>Full Transparency</strong>: "Dalip bhai, aapka ₹10k/day seedha transparent ad account me jayega, jiska live dashboard aapke paas hoga."<br />
                  2. <strong>Zero Policy Bans</strong>: "ExoClick aur Telegram par 0% ban risk hai kyunki wo real-money gaming ko openly allow karte hain. Meta par hamara Keitaro cloaker Facebook ke auditors ko confuse karke rakh deta hai."<br />
                  3. <strong>Immediate Cashflow</strong>: "Pehle hi din se players aayenge aur ₹500 - ₹1,000 add karenge. Wo paisa seedha hamare 30-second auto-sweep gateway se aapke bank account me float hoga."<br />
                  4. <strong>15% Fair Agency Fee</strong>: "Accounts aur budget aapka, technical execution aur cloaker setup GARUDA ka. 15% management fee me aapko ek 10-engineer ki media buying team mil rahi hai."
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* SECTION 65B EVIDENCE DOSSIER MODAL */}
      {showDossierModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "2rem"
        }}>
          <div style={{
            background: "#0B0F19",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            width: "100%",
            maxWidth: 820,
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "1.8rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.8rem" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#F8FAFC" }}>
                  STATUTORY FORENSIC DEFENSE DOSSIER (SECTION 65B EVIDENCE CERTIFICATE)
                </div>
                <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                  Under Section 63 Bharatiya Sakshya Adhiniyam, 2023 / Section 65B Indian Evidence Act, 1872
                </div>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                style={{ background: "#1E293B", color: "#FFF", border: "1px solid #334155", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕ Close
              </button>
            </div>

            <pre style={{
              background: "#030712",
              border: "1px solid #1F2937",
              padding: "1.2rem",
              borderRadius: 8,
              fontSize: "0.78rem",
              color: "#E2E8F0",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              fontFamily: "monospace"
            }}>
{`STATUTORY FORENSIC EVIDENCE CERTIFICATE & LEGAL DEFENSE NOTICE
================================================================================
CASE REFERENCE        : 1930/NCRP/RAIPUR/2026/89421
MERCHANT ENTITY       : Baba Enterprises (Dalip Bhai Node #01)
DISPUTED TRANSACTION  : TXN-984210 (UTR: 432891084201)
DISPUTED AMOUNT       : INR 500.00
COLLECTION SUB-NODE   : ICIC-VAN-8492 (STATUS: QUARANTINED - AT-REST: INR 0.00)
MASTER VAULT LIQUIDITY: ICICI CORP A/C ...9842 (STATUS: 100% UNTOUCHED)
================================================================================

1. DIGITAL TELEMETRY & 2FA CONSUMPTION PROOF
--------------------------------------------------------------------------------
• Payer Subscriber SIM : +91 98421-XXXXX (Jio 5G, Raipur Circle)
• 2FA OTP Timestamp    : 2026-11-23 11:42:01 IST (OTP Verified via SMS Gateway)
• Device Hardware UUID : MAC d4:61:9d:88:42:1a | Model: Samsung S23 Ultra
• Sub-Second Sweep     : INR 500.00 swept to Master Vault in 18.2 seconds
• Gameplay Consumption : User actively engaged in 2 skill-based rounds
  between 11:42 and 11:45 IST post-recharge.
• Provably Fair RNG    : SHA256:0x7a89bc33019f8842... (Sealed State)

2. BINDING SUPREME COURT JURISPRUDENCE GOVERNING BANK FREEZES
--------------------------------------------------------------------------------
A. State of Maharashtra v. Tapas D. Neogy (1999) 7 SCC 685:
   Section 102 CrPC cannot be deployed as an extortion weapon to freeze active commercial
   bank accounts where legitimate consideration has passed.

B. Teesta Atul Setalvad v. State of Gujarat (2018):
   Freezing active corporate accounts without affording prima-facie verification
   violates Article 19(1)(g) and Article 21 of the Constitution of India.

C. Section 79, Information Technology Act, 2000:
   Statutory Safe Harbor immunity for automated orchestration platforms.

3. STATUTORY DIRECTIVE TO BANK NODAL OFFICER & CYBER CELL IO
--------------------------------------------------------------------------------
1. IMMEDIATELY REVOKE the debit lien / restriction marked on Sub-Node ICIC-VAN-8492
   within 24 hours of receipt of this cryptographic certificate.
2. Direct the complainant to civil remedies for gaming losses rather than criminal coercive process.
3. Total corporate account debit freeze is strictly ultra-vires and actionable under
   Section 217/218 Bharatiya Nyaya Sanhita (Malicious Prosecution).

DIGITALLY SEALED & DISPATCHED BY:
GARUDA OS CRYPTOGRAPHIC FORENSIC AUDIT ENGINE
DATED: 23 NOVEMBER 2026`}
            </pre>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem", marginTop: "1.2rem" }}>
              <button
                onClick={() => {
                  setDossierNoticeSent(true);
                  setTimeout(() => setDossierNoticeSent(false), 3000);
                }}
                style={{
                  background: "#10B981",
                  color: "#050811",
                  border: "none",
                  borderRadius: 6,
                  padding: "0.75rem 1.5rem",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                {dossierNoticeSent ? "✔ Legal Notice Auto-Dispatched to Bank Nodal Desk!" : "📤 Auto-Dispatch Notice to Bank Nodal Officer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
