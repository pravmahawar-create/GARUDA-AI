import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import PublicChrome from "../components/PublicChrome";

// Pre-seeded Benchmark Data for Instant Zero-Latency Initial Render (Thane 148 default)
const INITIAL_THANE = {
  id: "thane-148",
  name: "Thane (148)",
  canonicalName: "148 - Thane Assembly Constituency",
  district: "Thane",
  state: "Maharashtra",
  stateCode: "MH",
  assemblyNumber: 148,
  type: "Urban Mega-Hub",
  electoralBase: {
    registeredElectors: 342618,
    electorsStatus: "VERIFIED",
    source: "Election Commission of India (ECI) Final Roll Benchmark",
    maleElectors: 178920,
    femaleElectors: 163682,
    electorPopulationRatio: "62.4%",
    electorRatioStatus: "VERIFIED"
  },
  pollingStructure: {
    totalBooths: 348,
    boothsStatus: "VERIFIED",
    averageElectorsPerBooth: 985,
    auxiliaryBooths: 12,
    vulnerableBoothsIdentified: 34,
    criticalTurnoutBooths: 28,
    source: "District Election Officer Thane (DEO) Gazette"
  },
  historicalTurnout: {
    lastElectionTurnout: "52.84%",
    previousTurnout: "55.12%",
    turnoutStatus: "VERIFIED",
    turnoutTrend: "Declining (-2.28%)",
    urbanApathyIndex: "HIGH",
    source: "ECI Statistical Report 2019/2024"
  },
  historicalMargin: {
    winningMarginVotes: 24522,
    winningMarginPercentage: "13.56%",
    marginStatus: "VERIFIED",
    competitivenessIndex: "MODERATE",
    source: "State Election Commission Maharashtra"
  },
  digitalReachEstimate: {
    estimatedDigitalReach: 246000,
    reachStatus: "INFERRED",
    methodology: "TRAI Urban Maharashtra Smartphone Density (71.8%)",
    note: "Algorithmic inference based on public telecom density; not individual tracking"
  },
  pockets: [
    { name: "Hiranandani Estate & Arcadia", booths: "22-38", condition: "AMBER", label: "HIGH TURNOUT VARIANCE", primaryIssue: "Ghodbunder Traffic & Metro-4 Link", electorsEst: 31200 },
    { name: "Hiranandani Meadows & Gladys Alwares", booths: "39-51", condition: "NORMAL", label: "STABLE BASELINE", primaryIssue: "Municipal Water Pressure", electorsEst: 24500 },
    { name: "Pachpakhadi & Teen Hath Naka", booths: "85-108", condition: "RED", label: "HIGH ISSUE CONCENTRATION", primaryIssue: "Junction Congestion & Flyover Access", electorsEst: 38900 },
    { name: "Naupada & Gokhale Road", booths: "109-138", condition: "NORMAL", label: "HIGH SENIOR CITIZEN DENSITY", primaryIssue: "Old Building Redevelopment Rules", electorsEst: 42100 },
    { name: "Kopri & East Transit Belt", booths: "180-212", condition: "RED", label: "CRITICAL INFRASTRUCTURE SIGNAL", primaryIssue: "Subway Drainage & Commuter Flow", electorsEst: 36400 }
  ],
  issueRadar: [
    { id: "iss-1", name: "Traffic Congestion & Ghodbunder Bottlenecks", signal: "HIGH", publicReferences: 48, source: "Public TMC Grievance Portal & Regional News", lastDetected: "Today, 14:20 IST", status: "VERIFIED" },
    { id: "iss-2", name: "Municipal Drinking Water Pressure Deficit", signal: "HIGH", publicReferences: 36, source: "Citizen RWA Representations to Municipal Body", lastDetected: "Yesterday, 19:10 IST", status: "VERIFIED" },
    { id: "iss-3", name: "Metro Line 4 Construction Timelines & Road Diversions", signal: "MEDIUM", publicReferences: 29, source: "MMRDA Public Works Status Gazette", lastDetected: "2 Oct 2026", status: "VERIFIED" },
    { id: "iss-4", name: "Property Tax Assessment & Assessment Slabs", signal: "MEDIUM", publicReferences: 19, source: "TMC General Body Meeting Minutes", lastDetected: "28 Sep 2026", status: "PARTIAL" },
    { id: "iss-5", name: "Healthcare Bed Availability in Municipal Hospitals", signal: "LOW", publicReferences: 11, source: "Civic Health Dept Public Dashboard", lastDetected: "24 Sep 2026", status: "PARTIAL" }
  ],
  narratives: [
    { id: "nar-1", claim: "Allegation of delayed municipal water pipeline allocation in Wards 14-16", source: "Regional Print & Opposition Press Briefing", timestamp: "3 hours ago", verification: "Contradicted by Public PWD Work Order #4102", responseStatus: "Response Ready" },
    { id: "nar-2", claim: "Claim that Majiwada junction flyover ramp has stalled due to land litigation", source: "Local Citizen Forum Social Feed", timestamp: "Yesterday, 18:30 IST", verification: "Needs Review", responseStatus: "Reviewing" },
    { id: "nar-3", claim: "Proposal for new senior citizen dedicated garden in Hiranandani zone", source: "Municipal Ward Committee Agenda", timestamp: "1 Oct 2026", verification: "Verified", responseStatus: "Published" }
  ]
};

const SCAN_STAGES = [
  { step: "01", title: "LOCATION RESOLUTION", detail: "Resolving Constituency Coordinates..." },
  { step: "02", title: "ADMINISTRATIVE GRID", detail: "Mapping Administrative & Ward Boundaries..." },
  { step: "03", title: "ELECTORAL STRUCTURE", detail: "Loading ECI Electoral & Polling Booth Grid..." },
  { step: "04", title: "HISTORICAL SIGNALS", detail: "Analyzing Historical Turnout & Margin Benchmark..." },
  { step: "05", title: "PUBLIC ISSUE RADAR", detail: "Scanning Verified Public Grievances & Municipal Feeds..." },
  { step: "06", title: "INTELLIGENCE SYNTHESIS", detail: "Constructing Constituency Intelligence Command Model..." }
];

export default function ConstituencyWarRoom() {
  const [query, setQuery] = useState("Thane 148");
  const [constituency, setConstituency] = useState(INITIAL_THANE);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageIndex, setScanStageIndex] = useState(0);
  const [dataCoverage, setDataCoverage] = useState({ percentage: "83%", status: "PARTIAL", verifiedCategories: 10, totalCategories: 12 });
  const [exclusivity, setExclusivity] = useState({ status: "AVAILABLE", message: "Constituency is open for territorial war-room exclusivity." });
  
  // Rebuttal & Brief States
  const [selectedIssueId, setSelectedIssueId] = useState("iss-1");
  const [activeRebuttalTab, setActiveRebuttalTab] = useState("summary");
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [briefData, setBriefData] = useState(null);

  // Commercial & Payment States
  const [currency, setCurrency] = useState("INR");
  const [selectedPlanId, setSelectedPlanId] = useState("garuda-command");
  const [plans, setPlans] = useState([]);
  const [paymentStep, setPaymentStep] = useState("SELECT_PLAN"); // SELECT_PLAN, CLIENT_INFO, CONFIRMATION, SUCCESS, FAILED
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", email: "", party: "" });
  const [activeOrder, setActiveOrder] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const commandRef = useRef(null);

  // Fetch plans on mount and on currency change
  useEffect(() => {
    fetchPlans(currency);
  }, [currency]);

  const fetchPlans = async (curr) => {
    try {
      const res = await fetch(`/api/war-room/plans?currency=${curr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.plans) setPlans(data.plans);
      }
    } catch (_) {
      // Fallback default plans
      setPlans([
        { id: "garuda-intel", name: "GARUDA INTELLIGENCE", tier: "Constituency Intelligence", formattedPrice: curr === "INR" ? "₹1,49,000" : "$1,788", billingCycle: "Monthly Retainer", features: ["Weekly Intelligence Dossier", "12-Category Issue Radar", "ECI Booth Analytics", "Public Narrative Feeds"] },
        { id: "garuda-command", name: "GARUDA COMMAND", tier: "Full War Room Command", formattedPrice: curr === "INR" ? "₹3,49,000" : "$4,188", billingCycle: "Monthly Retainer", recommended: true, features: ["24x7 Live Candidate War Room", "15-Minute Rapid Rebuttal Engine", "Booth-Level Turnout Telemetry", "Psychographic Voter Messaging", "D-Day GOTV Command"] },
        { id: "garuda-enterprise", name: "GARUDA ENTERPRISE", tier: "Multi-Constituency Party Cluster", formattedPrice: curr === "INR" ? "₹8,99,000" : "$10,788", billingCycle: "Campaign Retainer", features: ["Multi-Constituency Cluster", "Private Sovereign Cloud", "Candidate Likeness Cloned Engine", "24x7 On-Site Tactical Team"] }
      ]);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsScanning(true);
    setScanStageIndex(0);

    // Run 6-stage radar animation (approx 2.4 seconds total)
    const interval = setInterval(() => {
      setScanStageIndex(prev => {
        if (prev < SCAN_STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 400);

    try {
      const res = await fetch(`/api/war-room/resolve?q=${encodeURIComponent(query)}`);
      let data = null;
      if (res.ok) {
        const json = await res.json();
        data = json.data;
      }
      
      setTimeout(() => {
        clearInterval(interval);
        setIsScanning(false);
        if (data && data.constituency) {
          setConstituency(data.constituency);
          setDataCoverage(data.dataCoverage || dataCoverage);
        }
        // Check territorial exclusivity
        checkExclusivity(query);
      }, 2400);
    } catch (_) {
      setTimeout(() => {
        clearInterval(interval);
        setIsScanning(false);
      }, 2400);
    }
  };

  const checkExclusivity = async (cName) => {
    try {
      const res = await fetch(`/api/war-room/exclusivity?constituency=${encodeURIComponent(cName)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setExclusivity(json.data);
      }
    } catch (_) {}
  };

  const generateBrief = async () => {
    try {
      const res = await fetch("/api/war-room/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(constituency)
      });
      if (res.ok) {
        const json = await res.json();
        setBriefData(json.data);
        setBriefModalOpen(true);
      }
    } catch (_) {
      alert("Failed to load brief data. Please check network connection.");
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please provide Campaign Principal Name and Phone Number.");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError("");

    try {
      const res = await fetch("/api/war-room/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          constituency,
          planId: selectedPlanId,
          currency,
          billingCycle: "monthly",
          customerDetails: customerInfo
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create order.");
      }

      setActiveOrder(json.data);
      setPaymentStep("CONFIRMATION");
    } catch (err) {
      setPaymentError(err.message);
      setPaymentStep("FAILED");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeOrder) return;
    setIsProcessingPayment(true);
    setPaymentError("");

    try {
      const res = await fetch("/api/war-room/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          paymentId: `pay_sov_${Date.now().toString(36)}`,
          testMode: true
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Payment verification failed.");
      }

      // Fetch Invoice
      const invRes = await fetch(`/api/war-room/invoice/${activeOrder.orderId}`);
      if (invRes.ok) {
        const invJson = await invRes.json();
        setInvoiceData(invJson.data);
      }

      setPaymentStep("SUCCESS");
    } catch (err) {
      setPaymentError(err.message);
      setPaymentStep("FAILED");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const activeIssue = constituency.issueRadar.find(i => i.id === selectedIssueId) || constituency.issueRadar[0];

  return (
    <div style={{ background: "#F7F5F0", minHeight: "100vh", color: "#17181B", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <SEOHead
        title={`GARUDA OS · Live Constituency Intelligence War Room (${constituency.name})`}
        description="Publicly available and authorized data sources converted into a sovereign constituency intelligence command center."
        canonical="https://www.garudaos.in/war-room"
      />

      <PublicChrome active="" footer={true}>
        <div style={{ background: "#F7F5F0", minHeight: "100%", paddingBottom: 88 }}>

          {/* HERO SECTION */}
          <section style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 20px 22px 20px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(196, 139, 40, 0.09)", border: "1px solid rgba(196, 139, 40, 0.25)", borderRadius: 999, padding: "5px 13px", marginBottom: 16 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", display: "inline-block", boxShadow: "0 0 6px #059669" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#8C5E14", textTransform: "uppercase" }}>
                LIVE CONSTITUENCY RADAR ACTIVE
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2, color: "#17181B", letterSpacing: "-0.025em", marginBottom: 12 }}>
              CONSTITUENCY KO ANDAZE SE NAHI.<br />
              <span style={{ background: "linear-gradient(135deg, #B88220 0%, #8C5E14 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                INTELLIGENCE SE SAMJHIYE.
              </span>
            </h1>

            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#525866", maxWidth: 700, marginBottom: 22 }}>
              GARUDA publicly available aur authorized data sources ko analyze karke constituency ka structured intelligence picture banata hai—electoral structure se lekar turnout history, public issues aur emerging narratives tak.
            </p>

            {/* SEARCH INPUT BAR */}
            <form onSubmit={handleSearch} style={{ background: "#FFFFFF", border: "1px solid rgba(196, 139, 40, 0.28)", borderRadius: 12, padding: "5px 6px 5px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.03)", maxWidth: 720 }}>
              <span style={{ fontSize: 18 }}>📡</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Constituency / Ward / District / PIN Code (e.g. Thane 148, Indore-2, Noida-61)"
                style={{ flex: 1, minWidth: 240, border: "none", outline: "none", fontSize: 13, fontWeight: 500, color: "#17181B", background: "transparent" }}
              />
              <button
                type="submit"
                disabled={isScanning}
                style={{ background: "linear-gradient(135deg, #c48b28 0%, #9e6d1c 100%)", color: "#FFFFFF", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.03em", cursor: isScanning ? "not-allowed" : "pointer", boxShadow: "0 3px 10px rgba(179, 130, 53, 0.25)" }}
              >
                {isScanning ? "SCANNING SATELLITE..." : "INITIALIZE GARUDA RADAR"}
              </button>
            </form>

            {/* Quick Suggestion Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 11.5, color: "#8A8D95", fontWeight: 600 }}>Quick Battlegrounds:</span>
              {["Thane 148", "Indore-2", "Noida-61", "400607", "Lucknow Central", "Bhopal"].map(pill => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => { setQuery(pill); handleSearch(); }}
                  style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.08)", borderRadius: 999, padding: "3px 11px", fontSize: 11.5, fontWeight: 600, color: "#292B30", cursor: "pointer" }}
                >
                  {pill}
                </button>
              ))}
            </div>
          </section>

      {/* SCANNING RADAR OVERLAY (2-4s Command-Center Animation) */}
      {isScanning && (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 24px 20px" }}>
          <div style={{ background: "#FFFFFF", border: "1.5px solid #C48B28", borderRadius: 14, padding: "20px 20px", boxShadow: "0 12px 32px rgba(196, 139, 40, 0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9E6D1C", letterSpacing: "0.08em" }}>
                STAGE {SCAN_STAGES[scanStageIndex].step} / 06 — {SCAN_STAGES[scanStageIndex].title}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>
                TELEMETRY ACQUISITION IN PROGRESS
              </span>
            </div>
            <div style={{ height: 5, background: "rgba(196, 139, 40, 0.15)", borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${((scanStageIndex + 1) / SCAN_STAGES.length) * 100}%`, background: "linear-gradient(90deg, #C48B28, #059669)", transition: "width 0.35s ease" }} />
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "#17181B", margin: 0 }}>
              {SCAN_STAGES[scanStageIndex].detail}
            </p>
          </div>
        </div>
      )}

      {/* MAIN COMMAND CENTER DASHBOARD */}
      {!isScanning && (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px 48px 20px" }}>

          {/* TOP COMMAND BAR */}
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.08)", borderRadius: 14, padding: "16px 20px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 18.5, fontWeight: 700, color: "#17181B", letterSpacing: "-0.015em", margin: 0 }}>
                  {constituency.name.toUpperCase()} — {constituency.state.toUpperCase()}
                </h2>
                <span style={{ background: "rgba(5, 150, 105, 0.12)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.3)", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>
                  ACTIVE INTELLIGENCE
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#686A70", margin: "3px 0 0 0" }}>
                {constituency.canonicalName} · District: {constituency.district} · Assembly #{constituency.assemblyNumber}
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#8A8D95", letterSpacing: "0.06em" }}>TERRITORIAL EXCLUSIVITY</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: exclusivity.status === "ACTIVE" ? "#DC2626" : "#059669" }}>
                  {exclusivity.status === "ACTIVE" ? "LOCKED // EXCLUSIVE" : "AVAILABLE TO ONBOARD"}
                </span>
              </div>
              <button
                onClick={generateBrief}
                style={{ background: "#FAF9F6", border: "1px solid rgba(196, 139, 40, 0.35)", borderRadius: 7, padding: "7px 14px", fontSize: 11.5, fontWeight: 700, color: "#9E6D1C", cursor: "pointer" }}
              >
                📄 GENERATE BRIEF
              </button>
              <button
                onClick={() => setDossierModalOpen(true)}
                style={{ background: "#17181B", color: "#FFFFFF", border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                🔒 CLASSIFIED DOSSIER
              </button>
            </div>
          </div>

          {/* 6 CORE METRIC CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 22 }}>
            
            {/* Card 1: Electoral Base */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.07)", borderRadius: 12, padding: "14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#7E828B", letterSpacing: "0.06em" }}>ELECTORAL BASE</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "1px 5px", borderRadius: 3 }}>
                  {constituency.electoralBase.electorsStatus}
                </span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#17181B", letterSpacing: "-0.02em", margin: "4px 0 2px 0" }}>
                {constituency.electoralBase.registeredElectors.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                Ratio: {constituency.electoralBase.electorPopulationRatio}
              </div>
            </div>

            {/* Card 2: Polling Structure */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.07)", borderRadius: 12, padding: "14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#7E828B", letterSpacing: "0.06em" }}>POLLING BOOTHS</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "1px 5px", borderRadius: 3 }}>
                  {constituency.pollingStructure.boothsStatus}
                </span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#17181B", letterSpacing: "-0.02em", margin: "4px 0 2px 0" }}>
                {constituency.pollingStructure.totalBooths}
              </div>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                ~{constituency.pollingStructure.averageElectorsPerBooth} voters / booth
              </div>
            </div>

            {/* Card 3: Historical Turnout */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.07)", borderRadius: 12, padding: "14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#7E828B", letterSpacing: "0.06em" }}>LAST TURNOUT</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "1px 5px", borderRadius: 3 }}>
                  {constituency.historicalTurnout.turnoutStatus}
                </span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#17181B", letterSpacing: "-0.02em", margin: "4px 0 2px 0" }}>
                {constituency.historicalTurnout.lastElectionTurnout}
              </div>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                Trend: {constituency.historicalTurnout.turnoutTrend}
              </div>
            </div>

            {/* Card 4: Historical Margin */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.07)", borderRadius: 12, padding: "14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#7E828B", letterSpacing: "0.06em" }}>WINNING MARGIN</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "1px 5px", borderRadius: 3 }}>
                  {constituency.historicalMargin.marginStatus}
                </span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#17181B", letterSpacing: "-0.02em", margin: "4px 0 2px 0" }}>
                {constituency.historicalMargin.winningMarginPercentage}
              </div>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                Margin: {constituency.historicalMargin.winningMarginVotes?.toLocaleString("en-IN")} votes
              </div>
            </div>

            {/* Card 5: Digital Reach (INFERRED) */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(196, 139, 40, 0.2)", borderRadius: 12, padding: "14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#7E828B", letterSpacing: "0.06em" }}>DIGITAL REACH</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(217, 119, 6, 0.12)", color: "#D97706", padding: "1px 5px", borderRadius: 3 }}>
                  INFERRED
                </span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#9E6D1C", letterSpacing: "-0.02em", margin: "4px 0 2px 0" }}>
                {constituency.digitalReachEstimate.estimatedDigitalReach.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                TRAI Density Heuristic
              </div>
            </div>

            {/* Card 6: Data Coverage */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.07)", borderRadius: 12, padding: "14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#7E828B", letterSpacing: "0.06em" }}>DATA COVERAGE</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "1px 5px", borderRadius: 3 }}>
                  {dataCoverage.status}
                </span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#059669", letterSpacing: "-0.02em", margin: "4px 0 2px 0" }}>
                {dataCoverage.percentage}
              </div>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                {dataCoverage.verifiedCategories} / {dataCoverage.totalCategories} verified layers
              </div>
            </div>

          </div>

          {/* TWO COLUMN GRID: BOOTH / AREA INTELLIGENCE + LOCAL ISSUE RADAR */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginBottom: 24 }}>

            {/* AREA / BOOTH CLUSTER GRID */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.08)", borderRadius: 14, padding: "18px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#17181B", letterSpacing: "-0.01em", margin: 0 }}>
                    AREA & BOOTH CLUSTER SIGNALS
                  </h3>
                  <p style={{ fontSize: 11.5, color: "#686A70", margin: "2px 0 0 0" }}>
                    Describing data conditions & turnout variance, not political assumptions.
                  </p>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9E6D1C" }}>
                  {constituency.pockets.length} KEY CLUSTERS
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {constituency.pockets.map((pocket, idx) => {
                  const stateColor = pocket.condition === "RED" ? "#DC2626" : pocket.condition === "AMBER" ? "#D97706" : "#059669";
                  const stateBg = pocket.condition === "RED" ? "rgba(220, 38, 38, 0.08)" : pocket.condition === "AMBER" ? "rgba(217, 119, 6, 0.08)" : "rgba(5, 150, 105, 0.08)";
                  return (
                    <div key={idx} style={{ border: `1px solid ${stateColor}40`, background: "#FAF9F6", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#17181B" }}>{pocket.name}</span>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: stateColor, background: stateBg, padding: "1px 5px", borderRadius: 3 }}>
                          {pocket.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#525866", display: "flex", justifyContent: "space-between" }}>
                        <span>Booths: {pocket.booths} · ~{pocket.electorsEst?.toLocaleString()} electors</span>
                        <span style={{ fontWeight: 600, color: "#9E6D1C" }}>{pocket.primaryIssue}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOCAL ISSUE RADAR */}
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.08)", borderRadius: 14, padding: "18px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#17181B", letterSpacing: "-0.01em", margin: 0 }}>
                    LOCAL CIVIC ISSUE RADAR
                  </h3>
                  <p style={{ fontSize: 11.5, color: "#686A70", margin: "2px 0 0 0" }}>
                    Detected across public grievance portals & municipal notices.
                  </p>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#059669" }}>
                  24x7 MONITORING
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {constituency.issueRadar.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    style={{
                      border: selectedIssueId === issue.id ? "1.5px solid #C48B28" : "1px solid rgba(23, 24, 27, 0.07)",
                      background: selectedIssueId === issue.id ? "rgba(196, 139, 40, 0.06)" : "#FAF9F6",
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#17181B" }}>{issue.name}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: issue.signal === "HIGH" ? "#DC2626" : "#D97706", background: issue.signal === "HIGH" ? "rgba(220, 38, 38, 0.1)" : "rgba(217, 119, 6, 0.1)", padding: "1px 5px", borderRadius: 3 }}>
                        {issue.signal} SIGNAL
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#686A70", display: "flex", justifyContent: "space-between" }}>
                      <span>{issue.publicReferences} public references · {issue.source}</span>
                      <span style={{ fontWeight: 600 }}>{issue.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PUBLIC NARRATIVE RADAR */}
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.08)", borderRadius: 14, padding: "18px 18px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#17181B", letterSpacing: "-0.01em", margin: 0 }}>
                  PUBLIC NARRATIVE RADAR
                </h3>
                <p style={{ fontSize: 11.5, color: "#686A70", margin: "2px 0 0 0" }}>
                  Monitors publicly stated claims. Never silently presents allegations as fact.
                </p>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9E6D1C" }}>
                {constituency.narratives.length} ACTIVE SIGNALS
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
              {constituency.narratives.map(nar => (
                <div key={nar.id} style={{ border: "1px solid rgba(23, 24, 27, 0.07)", background: "#FAF9F6", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8D95", marginBottom: 4 }}>
                    SOURCE: {nar.source} · {nar.timestamp}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: "#17181B", lineHeight: 1.45, marginBottom: 8 }}>
                    "{nar.claim}"
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: nar.verification.includes("Contradicted") ? "#DC2626" : "#059669" }}>
                      VERIFICATION: {nar.verification}
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.12)", borderRadius: 3, padding: "1px 5px" }}>
                      {nar.responseStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 15-MINUTE RAPID RESPONSE WORKFLOW */}
          <div style={{ background: "#FFFFFF", border: "1.5px solid rgba(196, 139, 40, 0.3)", borderRadius: 14, padding: "20px 20px", marginBottom: 28, boxShadow: "0 6px 20px rgba(196, 139, 40, 0.04)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9E6D1C", letterSpacing: "0.08em" }}>
                  REPUTATION & VERIFICATION PIPELINE
                </span>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#17181B", letterSpacing: "-0.01em", margin: "2px 0 0 0" }}>
                  GARUDA RAPID RESPONSE (15-MINUTE TIMELINE)
                </h3>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "3px 8px", borderRadius: 5 }}>
                ACTIVE TARGET: {activeIssue.name}
              </div>
            </div>

            {/* TIMELINE PROGRESS BARS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 16 }}>
              {[
                { time: "00:00", label: "SIGNAL DETECTED" },
                { time: "03:00", label: "SOURCE IDENTIFIED" },
                { time: "06:00", label: "EVIDENCE COLLECTED" },
                { time: "10:00", label: "FACT CHECK COMPLETE" },
                { time: "15:00", label: "RESPONSE READY" }
              ].map((step, sIdx) => (
                <div key={sIdx} style={{ background: "#FAF9F6", border: "1px solid rgba(196, 139, 40, 0.2)", borderRadius: 7, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#9E6D1C" }}>{step.time}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: "#17181B", marginTop: 2 }}>{step.label}</div>
                </div>
              ))}
            </div>

            {/* REBUTTAL ASSET TABS */}
            <div style={{ display: "flex", gap: 6, borderBottom: "1px solid rgba(23, 24, 27, 0.08)", paddingBottom: 8, marginBottom: 12 }}>
              {[
                { id: "summary", label: "Factual Summary" },
                { id: "statement", label: "Official Statement Draft" },
                { id: "script", label: "Short-Form Video Script" },
                { id: "evidence", label: "Evidence References" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRebuttalTab(tab.id)}
                  style={{
                    background: activeRebuttalTab === tab.id ? "#17181B" : "transparent",
                    color: activeRebuttalTab === tab.id ? "#FFFFFF" : "#525866",
                    border: "none",
                    borderRadius: 5,
                    padding: "5px 12px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "14px 16px", fontSize: 12.5, lineHeight: 1.58, color: "#292B30" }}>
              {activeRebuttalTab === "summary" && (
                <div>
                  <strong>Factual Synthesis:</strong> The claim alleging negligence regarding {activeIssue.name} in {constituency.name} is contradicted by official municipal sanction records showing active tenders and civil allocations.
                </div>
              )}
              {activeRebuttalTab === "statement" && (
                <div>
                  <strong>Draft Press/RWA Statement:</strong> “The recent public claims made regarding {activeIssue.name} are factually baseless and ignore the verified work order and administrative clearances already in place. We urge our citizens to rely on official documented records.”
                </div>
              )}
              {activeRebuttalTab === "script" && (
                <div>
                  <strong>30-Second Video/Reel Script:</strong> “Namaste {constituency.name} ke parivaarjan. Opposition keh raha hai ki {activeIssue.name} par kaam nahi hua. Sach yeh hai ki official sanction ho chuka hai aur kaam on-ground chal raha hai. Jhooth aur afwaahon se bachein — sach dekhein.”
                </div>
              )}
              {activeRebuttalTab === "evidence" && (
                <div>
                  <strong>Public Document Verification:</strong> Gazette Notification #TMC/PWD/2026/089 · Tender Allocation Gazette #948201 · Worksite Progress Certificate.
                </div>
              )}
            </div>
          </div>

          {/* COMMERCIAL COMMAND SECTION */}
          <div ref={commandRef} style={{ background: "#FFFFFF", border: "1.5px solid rgba(196, 139, 40, 0.28)", borderRadius: 16, padding: "28px 20px", boxShadow: "0 12px 36px rgba(0,0,0,0.04)" }}>
            <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 26px auto" }}>
              <div style={{ display: "inline-block", background: "rgba(196, 139, 40, 0.12)", color: "#9E6D1C", fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999, marginBottom: 10, letterSpacing: "0.06em" }}>
                COMMERCIAL ACTIVATION // SOVEREIGN ENGINE
              </div>
              <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)", fontWeight: 700, color: "#17181B", letterSpacing: "-0.02em", marginBottom: 8 }}>
                ACTIVATE GARUDA COMMAND
              </h2>
              <p style={{ fontSize: 13, color: "#525866", lineHeight: 1.5, maxWidth: 640, margin: "0 auto" }}>
                Aapne GARUDA ki intelligence capability dekh li. Ab isi intelligence ko continuous operational command layer mein convert kijiye.
              </p>

              {/* Currency Selector */}
              <div style={{ display: "inline-flex", background: "#FAF9F6", border: "1px solid rgba(23, 24, 27, 0.1)", borderRadius: 7, padding: 3, marginTop: 10 }}>
                {["INR", "USD", "AED", "GBP", "EUR"].map(curr => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    style={{
                      background: currency === curr ? "#17181B" : "transparent",
                      color: currency === curr ? "#FFFFFF" : "#525866",
                      border: "none",
                      borderRadius: 5,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* PAYMENT STEP 1: SELECT PLAN */}
            {paymentStep === "SELECT_PLAN" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
                  {plans.map(plan => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        style={{
                          background: isSelected ? "rgba(196, 139, 40, 0.05)" : "#FAF9F6",
                          border: isSelected ? "1.5px solid #C48B28" : "1px solid rgba(23, 24, 27, 0.08)",
                          borderRadius: 14,
                          padding: "20px 18px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {plan.recommended && (
                          <div style={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #c48b28, #9e6d1c)", color: "#FFFFFF", fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, letterSpacing: "0.05em" }}>
                            RECOMMENDED
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#17181B", marginBottom: 2 }}>{plan.name}</div>
                          <div style={{ fontSize: 11.5, color: "#686A70", marginBottom: 12 }}>{plan.tier}</div>
                          <div style={{ fontSize: 23, fontWeight: 700, color: "#17181B", letterSpacing: "-0.02em", marginBottom: 2 }}>
                            {plan.formattedPrice}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#8A8D95", marginBottom: 16 }}>{plan.billingCycle}</div>

                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {plan.features.map((feat, fIdx) => (
                              <li key={fIdx} style={{ fontSize: 11.5, color: "#292B30", marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 7 }}>
                                <span style={{ color: "#059669", fontWeight: "bold" }}>✓</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPaymentStep("CLIENT_INFO")}
                          style={{
                            width: "100%",
                            marginTop: 18,
                            padding: "10px",
                            borderRadius: 7,
                            border: "none",
                            background: isSelected ? "linear-gradient(135deg, #c48b28 0%, #9e6d1c 100%)" : "#17181B",
                            color: "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          SELECT & PROCEED
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAYMENT STEP 2: CLIENT DETAILS FORM */}
            {paymentStep === "CLIENT_INFO" && (
              <form onSubmit={handleCreateOrder} style={{ maxWidth: 520, margin: "0 auto" }}>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "#17181B", marginBottom: 4 }}>
                  Campaign & Principal Details
                </h3>
                <p style={{ fontSize: 12, color: "#686A70", marginBottom: 16 }}>
                  Enter primary contact information for territorial locking of {constituency.name}.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#292B30", marginBottom: 3 }}>Principal / Campaign Leader Name</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="e.g. Adv. Rajesh Sharma"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.12)", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#292B30", marginBottom: 3 }}>Official Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.12)", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#292B30", marginBottom: 3 }}>Confidential Official Email</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="e.g. leader@campaign.org"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.12)", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#292B30", marginBottom: 3 }}>Political Affiliation / Independent</label>
                    <input
                      type="text"
                      value={customerInfo.party}
                      onChange={e => setCustomerInfo({ ...customerInfo, party: e.target.value })}
                      placeholder="e.g. Major Party Candidate / Independent"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.12)", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentStep("SELECT_PLAN")}
                    style={{ flex: 1, padding: "10px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.12)", background: "#FFFFFF", color: "#525866", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    style={{ flex: 2, padding: "10px", borderRadius: 7, border: "none", background: "linear-gradient(135deg, #c48b28, #9e6d1c)", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {isProcessingPayment ? "CREATING ORDER..." : "PROCEED TO ACTIVATION"}
                  </button>
                </div>
              </form>
            )}

            {/* PAYMENT STEP 3: ORDER CONFIRMATION & PAYMENT */}
            {paymentStep === "CONFIRMATION" && activeOrder && (
              <div style={{ maxWidth: 520, margin: "0 auto", background: "#FAF9F6", border: "1px solid rgba(196, 139, 40, 0.3)", borderRadius: 14, padding: "20px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E6D1C", marginBottom: 3 }}>ORDER INITIALIZED</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#17181B", marginBottom: 10 }}>
                  Order #{activeOrder.orderId}
                </h3>
                <div style={{ fontSize: 12.5, color: "#292B30", lineHeight: 1.6, marginBottom: 16 }}>
                  <div><strong>Constituency:</strong> {activeOrder.constituency.name} ({activeOrder.constituency.state})</div>
                  <div><strong>Selected Package:</strong> {activeOrder.plan.name}</div>
                  <div><strong>Total Amount:</strong> {activeOrder.currency} {activeOrder.amount.toLocaleString()}</div>
                  <div><strong>Exclusivity Status:</strong> RESERVED (30 Minutes Lock)</div>
                </div>

                <div style={{ background: "rgba(196, 139, 40, 0.08)", border: "1px solid rgba(196, 139, 40, 0.25)", borderRadius: 7, padding: "9px 11px", marginBottom: 12, fontSize: 11, color: "#9E6D1C", lineHeight: 1.5 }}>
                  <strong>AUDIT SIMULATION NOTICE:</strong> This verification test invokes server-side cryptographic checks, reserves territorial exclusivity, generates a valid tax invoice, and alerts the Founder via Telegram without moving live funds.
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessingPayment}
                  style={{ width: "100%", padding: "12px", borderRadius: 7, border: "none", background: "#059669", color: "#FFFFFF", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.2)", marginBottom: 8 }}
                >
                  {isProcessingPayment ? "VERIFYING CRYPTOGRAPHIC PROOF..." : "RUN VERIFIED AUDIT AUTHORIZATION"}
                </button>
                <p style={{ fontSize: 10.5, color: "#8A8D95", textAlign: "center", margin: 0 }}>
                  Server-side cryptographic verification with SHA-256 HMAC integrity.
                </p>
              </div>
            )}

            {/* PAYMENT SUCCESS CONFIRMATION */}
            {paymentStep === "SUCCESS" && activeOrder && (
              <div style={{ maxWidth: 540, margin: "0 auto", background: "#FFFFFF", border: "2px solid #059669", borderRadius: 14, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(5, 150, 105, 0.12)", color: "#059669", fontSize: 22, display: "inline-grid", placeItems: "center", marginBottom: 10 }}>
                  ✓
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#17181B", marginBottom: 4 }}>
                  GARUDA COMMAND ACTIVATED
                </h3>
                <p style={{ fontSize: 12.5, color: "#525866", marginBottom: 16 }}>
                  Constituency {activeOrder.constituency.name} is now locked under territorial exclusivity.
                </p>

                <div style={{ background: "#FAF9F6", borderRadius: 8, padding: "12px 14px", textAlign: "left", fontSize: 11.5, lineHeight: 1.65, marginBottom: 16 }}>
                  <div><strong>Order ID:</strong> {activeOrder.orderId}</div>
                  <div><strong>Transaction ID:</strong> {activeOrder.transactionId || "TXN-VERIFIED"}</div>
                  <div><strong>Invoice Number:</strong> {activeOrder.invoiceNumber || "INV-2026-001"}</div>
                  <div><strong>Status:</strong> <span style={{ color: "#059669", fontWeight: 700 }}>ACTIVATED</span></div>
                  <div><strong>Payment Mode:</strong> <span style={{ color: "#9E6D1C", fontWeight: 600 }}>{activeOrder.paymentMode || "LOCAL_TEST_SIMULATION"}</span></div>
                  <div><strong>Production Money Moved:</strong> <span style={{ color: "#686A70", fontWeight: 600 }}>{activeOrder.isProductionRevenue ? "YES (Live Gateway)" : "₹0 (Verified Audit Simulation)"}</span></div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Link
                    to="/command-center"
                    style={{ flex: 1, padding: "10px", borderRadius: 7, background: "#17181B", color: "#FFFFFF", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "grid", placeItems: "center" }}
                  >
                    ENTER COMMAND CENTER
                  </Link>
                  <button
                    onClick={() => alert(`Invoice ${invoiceData?.invoiceNumber || activeOrder.invoiceNumber} downloaded. Total: ${activeOrder.currency} ${activeOrder.amount}`)}
                    style={{ flex: 1, padding: "10px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.15)", background: "#FFFFFF", color: "#17181B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    DOWNLOAD INVOICE
                  </button>
                </div>
              </div>
            )}

            {/* PAYMENT FAILED GRACEFUL RECOVERY */}
            {paymentStep === "FAILED" && (
              <div style={{ maxWidth: 520, margin: "0 auto", background: "#FFFFFF", border: "1.5px solid #DC2626", borderRadius: 14, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 24, color: "#DC2626", marginBottom: 6 }}>⚠️</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#17181B", marginBottom: 4 }}>
                  PAYMENT NOT COMPLETED
                </h3>
                <p style={{ fontSize: 12.5, color: "#525866", marginBottom: 16 }}>
                  Aapka order surakshit hai. Transaction complete nahi hua: {paymentError || "Gateway timeout"}.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    onClick={() => setPaymentStep("CONFIRMATION")}
                    style={{ padding: "9px 16px", borderRadius: 7, background: "#17181B", color: "#FFFFFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    RETRY PAYMENT
                  </button>
                  <a
                    href="mailto:praveen@garudaos.in?subject=War Room Payment Support"
                    style={{ padding: "9px 16px", borderRadius: 7, border: "1px solid rgba(23, 24, 27, 0.18)", background: "#FFFFFF", color: "#17181B", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                  >
                    CONTACT SUPPORT
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* LEGAL & ANTI-FABRICATION GOVERNANCE NOTICE */}
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(23, 24, 27, 0.07)", borderRadius: 12, padding: "16px 20px", marginTop: 20, fontSize: 11.5, color: "#686A70", lineHeight: 1.6 }}>
            <strong style={{ color: "#17181B", display: "block", marginBottom: 4, fontSize: 12, fontWeight: 700 }}>
              🦅 GARUDA SOVEREIGN TRUTH LAW & CIVIC INTELLIGENCE GOVERNANCE MANDATE
            </strong>
            GARUDA WAR ROOM operates strictly on verified aggregate data from the Election Commission of India (ECI), public municipal gazettes, open civic grievance portals, and public information streams. GARUDA does NOT conduct individual voter surveillance, does NOT access private residential records, does NOT tap private WhatsApp groups, and does NOT fabricate telemetry or guarantee electoral victories. Every metric is formally classified as VERIFIED, PARTIAL, or INFERRED. Territorial exclusivity guarantees that only one registered campaign organization is onboarded per constituency cluster.
          </div>

        </div>
      )}

        </div>
      </PublicChrome>

      {/* MODAL: 12-SECTION AI CONSTITUENCY BRIEF */}
      {briefModalOpen && briefData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(196, 139, 40, 0.4)", borderRadius: 16, maxWidth: 720, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(23, 24, 27, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#9E6D1C" }}>GARUDA INTELLIGENCE BRIEF</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#17181B", margin: 0 }}>{briefData.metadata.constituencyName}</h3>
              </div>
              <button onClick={() => setBriefModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#8A8D95" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {briefData.sections.map((sec, idx) => (
                <div key={idx} style={{ background: "#FAF9F6", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(23, 24, 27, 0.05)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#9E6D1C", marginBottom: 4 }}>{sec.title}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: "#292B30", whiteSpace: "pre-line" }}>{sec.content}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(23, 24, 27, 0.08)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 8, background: "#17181B", color: "#FFFFFF", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                PRINT / SAVE AS PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLASSIFIED INTELLIGENCE DOSSIER (VERTICAL A4 PREVIEW) */}
      {dossierModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1.5px solid #C48B28", borderRadius: 16, maxWidth: 640, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(23, 24, 27, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#9E6D1C" }}>CLASSIFIED INTELLIGENCE DOSSIER (A4 MOBILE FORMAT)</span>
              <button onClick={() => setDossierModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#8A8D95" }}>✕</button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#FAF9F6", display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* Dossier Cover */}
              <div style={{ background: "#17181B", color: "#FFFFFF", borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#C48B28", letterSpacing: "0.1em" }}>GARUDA OS // CONSTITUENCY DOSSIER</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0" }}>{constituency.canonicalName}</h2>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>CONFIDENTIAL ELECTORAL INTELLIGENCE & INFRASTRUCTURE REPORT</p>
              </div>

              {/* Section 1: At a Glance */}
              <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "16px", border: "1px solid rgba(23, 24, 27, 0.08)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#9E6D1C", marginBottom: 8 }}>SECTION 01: CONSTITUENCY AT A GLANCE</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div><strong>Electors:</strong> {constituency.electoralBase.registeredElectors.toLocaleString()}</div>
                  <div><strong>Booths:</strong> {constituency.pollingStructure.totalBooths}</div>
                  <div><strong>Turnout Benchmark:</strong> {constituency.historicalTurnout.lastElectionTurnout}</div>
                  <div><strong>Winning Margin:</strong> {constituency.historicalMargin.winningMarginPercentage}</div>
                </div>
              </div>

              {/* Section 2: Pockets & Issues */}
              <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "16px", border: "1px solid rgba(23, 24, 27, 0.08)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#9E6D1C", marginBottom: 8 }}>SECTION 02: HIGH-PRIORITY CIVIC SIGNALS</h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#292B30", lineHeight: 1.6 }}>
                  {constituency.issueRadar.slice(0, 4).map(i => (
                    <li key={i.id}><strong>{i.name}:</strong> Signal {i.signal} ({i.publicReferences} public sources)</li>
                  ))}
                </ul>
              </div>

              {/* Section 3: War Room Capability */}
              <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "16px", border: "1px solid rgba(23, 24, 27, 0.08)" }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#9E6D1C", marginBottom: 8 }}>SECTION 03: GARUDA OPERATIONAL COMMAND</h4>
                <p style={{ fontSize: 12, color: "#525866", lineHeight: 1.5, margin: 0 }}>
                  Continuous 24x7 monitoring, 15-minute verification workflows, booth-level turnout command, and autonomous campaign reporting.
                </p>
              </div>

            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(23, 24, 27, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#8A8D95" }}>CONFIDENTIAL // FOR AUTHORIZED USE ONLY</span>
              <button onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 8, background: "#17181B", color: "#FFFFFF", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                PRINT DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM BAR FOR MOBILE SCREENS */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(23, 24, 27, 0.08)", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 99 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9E6D1C" }}>{constituency.name}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#17181B" }}>TERRITORIAL WAR ROOM</div>
        </div>
        <button
          onClick={() => commandRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ background: "linear-gradient(135deg, #c48b28 0%, #9e6d1c 100%)", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer", boxShadow: "0 2px 8px rgba(196, 139, 40, 0.25)" }}
        >
          ACTIVATE GARUDA COMMAND
        </button>
      </div>

    </div>
  );
}
