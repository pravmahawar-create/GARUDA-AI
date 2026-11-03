import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

const Home = React.lazy(() => import("./pages/Home"));
const FounderLogin = React.lazy(() => import("./pages/FounderLogin"));
const CustomerDashboard = React.lazy(() => import("./pages/CustomerDashboard"));
const CustomerAuthForm = React.lazy(() => import("./pages/CustomerAuthForm"));
const Login = React.lazy(() => import("./pages/Login"));
const PublicLanding = React.lazy(() => import("./pages/PublicLanding"));
const PublicChat = React.lazy(() => import("./pages/PublicChat"));
const PayLink = React.lazy(() => import("./pages/PayLink"));
const Signup = React.lazy(() => import("./pages/Signup"));
const DemoLaunch = React.lazy(() => import("./pages/DemoLaunch"));
const FounderWorkspace = React.lazy(() => import("./pages/FounderWorkspace"));
const RevenueDepartment = React.lazy(() => import("./pages/RevenueDepartment"));
const ProposalPortal = React.lazy(() => import("./pages/ProposalPortal"));
const ServiceLanding = React.lazy(() => import("./pages/ServiceLanding"));
const FounderAcquisitionCockpit = React.lazy(() => import("./pages/FounderAcquisitionCockpit"));
const WhatIsGarudaAI = React.lazy(() => import("./pages/WhatIsGarudaAI"));
const GuidesIndex = React.lazy(() => import("./pages/GuidesIndex"));
const GuideArticle = React.lazy(() => import("./pages/GuideArticle"));
const HighCommandCenter = React.lazy(() => import("./pages/HighCommandCenter"));
const GrowthCommandCenter = React.lazy(() => import("./pages/GrowthCommandCenter"));
const ScholarStudio = React.lazy(() => import("./pages/ScholarStudio"));
const CreativeStudio = React.lazy(() => import("./pages/CreativeStudio"));
const CreativeProductionWorkspace = React.lazy(() => import("./pages/CreativeProductionWorkspace"));
const ContentStudio = React.lazy(() => import("./pages/ContentStudio"));
const BrandStudio = React.lazy(() => import("./pages/BrandStudio"));
const DigitalPresenceStudio = React.lazy(() => import("./pages/DigitalPresenceStudio"));
const EntertainmentStudio = React.lazy(() => import("./pages/EntertainmentStudio"));
const FounderKingdomAccess = React.lazy(() => import("./pages/FounderKingdomAccess"));
const InvestorExperience = React.lazy(() => import("./pages/InvestorExperience"));
const BotVerseStudio = React.lazy(() => import("./pages/BotVerseStudio"));
const MagicDelegationPortal = React.lazy(() => import("./pages/MagicDelegationPortal"));
const AstraCodingStudio = React.lazy(() => import("./pages/AstraCodingStudio"));
const PawanCodingStudio = React.lazy(() => import("./pages/PawanCodingStudio"));
const KidsVoiceApp = React.lazy(() => import("./pages/KidsVoiceApp"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const FounderProfile = React.lazy(() => import("./pages/FounderProfile"));
const GarudaDostRozgar = React.lazy(() => import("./pages/GarudaDostRozgar"));
const BoilerplateStore = React.lazy(() => import("./pages/BoilerplateStore"));
const PricingPage = React.lazy(() => import("./pages/PricingPage"));
const GarudaVsLinux = React.lazy(() => import("./pages/GarudaVsLinux"));
const SovereignEnterpriseMatrix = React.lazy(() => import("./pages/SovereignEnterpriseMatrix"));
const CaseStudies = React.lazy(() => import("./pages/CaseStudies"));
const GarudaCyberTycoon = React.lazy(() => import("./pages/GarudaCyberTycoon"));
const FounderQuantCommand = React.lazy(() => import("./pages/FounderQuantCommand"));
const FounderIntelligence = React.lazy(() => import("./pages/FounderIntelligence"));
const GarudaHealthApp = React.lazy(() => import("./pages/GarudaHealthApp"));
const CyberShieldDashboard = React.lazy(() => import("./pages/CyberShieldDashboard"));
const GarudaBilling = React.lazy(() => import("./pages/GarudaBilling"));
const FintechGatewayDemo = React.lazy(() => import("./pages/FintechGatewayDemo"));
const ConstituencyWarRoom = React.lazy(() => import("./pages/ConstituencyWarRoom"));
const BoothCadrePWA = React.lazy(() => import("./pages/BoothCadrePWA"));
const LeadLeakAudit = React.lazy(() => import("./pages/LeadLeakAudit"));
const SolutionsHub = React.lazy(() => import("./pages/SolutionsHub"));
const SolutionDetail = React.lazy(() => import("./pages/SolutionDetail"));
const VyaparOS = React.lazy(() => import("./pages/VyaparOS"));
import { initAttribution } from "./utils/attribution";


import "./styles/garuda-ui.css";

function AppRoutes() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    initAttribution();
    // GA4 auto-inject if VITE_GA4_ID is configured
    const gaId = import.meta.env.VITE_GA4_ID;
    if (gaId && !window.gtag) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", gaId);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setAuthenticated(false);
    }, 5000);

    fetch("/api/auth/session", { credentials: "same-origin", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        clearTimeout(timeoutId);
        setAuthenticated(data.authenticated === true);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setAuthenticated(false);
      });

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initCustomerAuth() {
      try {
        const response = await fetch("/api/customer/session", { credentials: "same-origin" });
        const data = await response.json();
        if (mounted && data.authenticated && data.customer) {
          setCustomer(data.customer);
          return;
        }
      } catch (_) {}

      try {
        const url = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "https://gcifzzuyswrcwvkcfqbr.supabase.co";
        const key = (typeof import.meta !== "undefined" && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) || "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(url, key);
        const { data: sbData } = await supabase.auth.getSession();
        if (mounted && sbData?.session?.user) {
          const u = sbData.session.user;
          setCustomer({
            email: u.email,
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email
          });
          return;
        }
      } catch (_) {}

      if (mounted) setCustomer(false);
    }
    initCustomerAuth();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setAuthenticated(false);
    navigate("/");
  };

  const founderRoute = authenticated === null ? (
    <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#d4af37", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA FOUNDER DESKTOP...
    </div>
  ) : authenticated ? (
    <FounderWorkspace onLogout={handleLogout} />
  ) : (
    <FounderLogin onAuthenticated={() => setAuthenticated(true)} />
  );
  const founderIntelRoute = authenticated === null ? (
    <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#38bdf8", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA FOUNDER INTELLIGENCE...
    </div>
  ) : authenticated ? (
    <FounderIntelligence />
  ) : (
    <FounderLogin onAuthenticated={() => setAuthenticated(true)} />
  );
  const customerRoute = customer === null ? (
    <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#d4af37", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA CLIENT WORKSPACE...
    </div>
  ) : customer ? (
    <CustomerDashboard
      customer={customer}
      onLogout={async () => {
        try {
          const url = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "https://gcifzzuyswrcwvkcfqbr.supabase.co";
          const key = (typeof import.meta !== "undefined" && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) || "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(url, key);
          await supabase.auth.signOut();
        } catch (_) {}
        await fetch("/api/customer/logout", { method: "POST", credentials: "same-origin" });
        setCustomer(false);
        navigate("/");
      }}
    />
  ) : (
    <div style={{ minHeight: "100vh", background: "#030712", padding: "2rem", display: "grid", placeItems: "center" }}>
      <div style={{ width: "min(420px, 100%)" }}>
        <CustomerAuthForm onAuthenticated={(cust) => setCustomer(cust)} />
      </div>
    </div>
  );
  const publicLanding = <PublicLanding onGetStarted={() => navigate("/signup")} onFounderLogin={() => navigate("/founder")} />;
  const revenueRoute = authenticated === null ? (
    <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#d4af37", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA FOUNDER DESKTOP...
    </div>
  ) : authenticated ? (
    <RevenueDepartment onBack={() => navigate("/founder")} />
  ) : (
    <FounderLogin onAuthenticated={() => setAuthenticated(true)} />
  );

  const acquisitionRoute = authenticated === null ? (
    <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#d4af37", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA FOUNDER DESKTOP...
    </div>
  ) : authenticated ? (
    <FounderAcquisitionCockpit onLogout={handleLogout} />
  ) : (
    <FounderLogin onAuthenticated={() => setAuthenticated(true)} />
  );

  const commandCenterRoute = authenticated === null ? (
    <div style={{ minHeight: "100vh", background: "#06080d", display: "grid", placeItems: "center", color: "#f59e0b", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA HIGH COMMAND CENTER...
    </div>
  ) : authenticated ? (
    <HighCommandCenter onLogout={handleLogout} />
  ) : (
    <FounderLogin onAuthenticated={() => setAuthenticated(true)} />
  );

  const growthRoute = authenticated === null ? (
    <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#d4af37", fontFamily: "sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
      GARUDA GROWTH INTELLIGENCE...
    </div>
  ) : authenticated ? (
    <GrowthCommandCenter onLogout={handleLogout} />
  ) : (
    <FounderLogin onAuthenticated={() => setAuthenticated(true)} />
  );

  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", background: "#030712", color: "#d4af37", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>GARUDA load ho raha hai…</div>}>
    <Routes>
      <Route path="/" element={publicLanding} />
      <Route path="/what-is-garuda-ai" element={<WhatIsGarudaAI />} />
      <Route path="/garuda-ai" element={<WhatIsGarudaAI />} />
      <Route path="/garuda" element={<WhatIsGarudaAI />} />
      <Route path="/garudaos" element={<WhatIsGarudaAI />} />
      <Route path="/garuda-os" element={<WhatIsGarudaAI />} />
      <Route path="/chat" element={<PublicChat />} />
      <Route path="/billing" element={<GarudaBilling />} />
      <Route path="/billing-software" element={<GarudaBilling />} />
      <Route path="/scholar" element={<ScholarStudio />} />
      <Route path="/vidya" element={<ScholarStudio />} />
      <Route path="/research" element={<ScholarStudio />} />

      {/* Ring 3 Canonical — Creative Production OS (website-first) */}
      <Route path="/creative" element={<CreativeProductionWorkspace />} />
      <Route path="/creative/legacy" element={<CreativeStudio />} />
      <Route path="/studio" element={<CreativeProductionWorkspace />} />
      <Route path="/agency" element={<CreativeProductionWorkspace />} />
      <Route path="/creator" element={<CreativeProductionWorkspace />} />
      <Route path="/content" element={<ContentStudio />} />
      <Route path="/brand" element={<BrandStudio />} />
      <Route path="/digital-presence" element={<DigitalPresenceStudio />} />
      <Route path="/entertainment" element={<EntertainmentStudio />} />
      <Route path="/entertainment/tycoon" element={<GarudaCyberTycoon />} />
      <Route path="/play" element={<GarudaCyberTycoon />} />
      <Route path="/game" element={<Navigate to="/play" replace />} />

      {/* Founder Sovereign Access & 24/7 Mobile Gateway */}
      <Route path="/founder/access" element={<FounderKingdomAccess />} />
      <Route path="/founder/mobile" element={<FounderKingdomAccess />} />
      <Route path="/founder/gateway" element={<FounderKingdomAccess />} />
      <Route path="/enterprise" element={<SovereignEnterpriseMatrix />} />
      <Route path="/founder/enterprise" element={<SovereignEnterpriseMatrix />} />
      <Route path="/sovereign-matrix" element={<SovereignEnterpriseMatrix />} />
      <Route path="/founder/quant" element={<FounderQuantCommand onLogout={handleLogout} />} />
<Route path="/founder/intelligence" element={founderIntelRoute} />
<Route path="/founder-intelligence" element={<Navigate to="/founder/intelligence" replace />} />
<Route path="/intelligence" element={<Navigate to="/founder/intelligence" replace />} />
      <Route path="/quant" element={<FounderQuantCommand onLogout={handleLogout} />} />
      <Route path="/finance/quant" element={<FounderQuantCommand onLogout={handleLogout} />} />
      <Route path="/kingdom" element={<Navigate to="/founder/access" replace />} />
      <Route path="/command" element={<Navigate to="/command-center" replace />} />
      <Route path="/command-center" element={commandCenterRoute} />
      <Route path="/high-command" element={<Navigate to="/command-center" replace />} />
      <Route path="/growth" element={growthRoute} />
      <Route path="/growth-command" element={<Navigate to="/growth" replace />} />
      <Route path="/founder" element={founderRoute} />
      <Route path="/founder/acquisition" element={acquisitionRoute} />
      <Route path="/bot-verse" element={<BotVerseStudio />} />
      <Route path="/founder/bot-verse" element={<BotVerseStudio />} />
      <Route path="/delegate" element={<MagicDelegationPortal />} />
      <Route path="/delegate/:token" element={<MagicDelegationPortal />} />
      <Route path="/pawan" element={<PawanCodingStudio />} />
      <Route path="/founder/pawan" element={<PawanCodingStudio founderSessionActive={authenticated === true} />} />
      <Route path="/kids-play" element={<KidsVoiceApp />} />
      <Route path="/kids-app" element={<KidsVoiceApp />} />
      <Route path="/astra" element={<Navigate to="/pawan" replace />} />
      <Route path="/founder/astra" element={<Navigate to="/founder/pawan" replace />} />
      <Route path="/revenue" element={revenueRoute} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/demo" element={<DemoLaunch />} />
      <Route path="/app" element={customerRoute} />
      <Route path="/pay/:ref" element={<PayLink />} />
      <Route path="/proposal" element={<ProposalPortal />} />
      <Route path="/proposal/:proposalId" element={<ProposalPortal />} />
      <Route path="/services/:slug" element={<ServiceLanding />} />
      <Route path="/guides" element={<GuidesIndex />} />
      <Route path="/guides/:slug" element={<GuideArticle />} />
      <Route path="/best-ai" element={<Navigate to="/guides/best-custom-ai-platforms-operating-systems-2026" replace />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/praveen-mahawar" element={<FounderProfile />} />
      <Route path="/praveen" element={<FounderProfile />} />
      <Route path="/founder-praveen" element={<FounderProfile />} />
      <Route path="/founder-profile" element={<FounderProfile />} />
      <Route path="/about" element={<FounderProfile />} />
      <Route path="/about-founder" element={<FounderProfile />} />
      <Route path="/experience" element={<InvestorExperience />} />
      <Route path="/dost" element={<GarudaDostRozgar />} />
      <Route path="/garuda-dost" element={<GarudaDostRozgar />} />
      <Route path="/rozgar" element={<GarudaDostRozgar />} />
      <Route path="/dost/dashboard" element={<GarudaDostRozgar />} />
      <Route path="/sahayak" element={<GarudaDostRozgar />} />
      <Route path="/starter" element={<BoilerplateStore />} />
      <Route path="/boilerplate" element={<BoilerplateStore />} />
      <Route path="/whatsapp-bot" element={<BoilerplateStore />} />
      <Route path="/whatsapp-ai-bot" element={<BoilerplateStore />} />
      <Route path="/store" element={<BoilerplateStore />} />
      <Route path="/sovereign-starter" element={<BoilerplateStore />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/plans" element={<PricingPage />} />
      <Route path="/pricing-plans" element={<PricingPage />} />
      <Route path="/garuda-ai-vs-garuda-linux" element={<GarudaVsLinux />} />
      <Route path="/case-studies" element={<CaseStudies />} />
      {/* GARUDA AAHAR — Human Nutrition & Wellness Platform */}
      <Route path="/health" element={<GarudaHealthApp />} />
      <Route path="/aahar" element={<GarudaHealthApp />} />
      <Route path="/wellness" element={<GarudaHealthApp />} />
      <Route path="/garuda-aahar" element={<GarudaHealthApp />} />
      {/* GARUDA CyberShield™ — Sovereign Anti-Troll Defense Cockpit */}
      <Route path="/cybershield" element={<CyberShieldDashboard customer={customer} onLogout={handleLogout} />} />
      {/* GARUDA SOVEREIGN FINTECH — Multi-Rail Zero-Hold Switch */}
      <Route path="/fintech-gateway" element={<FintechGatewayDemo />} />
      <Route path="/gateway-demo" element={<FintechGatewayDemo />} />
      <Route path="/fintech" element={<FintechGatewayDemo />} />
      {/* GARUDA Live Constituency Intelligence War Room & Commercial Command */}
      <Route path="/war-room" element={<ConstituencyWarRoom />} />
      <Route path="/constituency" element={<Navigate to="/war-room" replace />} />
      <Route path="/election" element={<Navigate to="/war-room" replace />} />
      {/* GARUDA Cadre Field PWA */}
      <Route path="/booth-cadre" element={<BoothCadrePWA />} />
      <Route path="/cadre" element={<Navigate to="/booth-cadre" replace />} />
      {/* GARUDA Sovereign Audit & Problem-First Solutions */}
      <Route path="/audit" element={<LeadLeakAudit />} />
      <Route path="/lead-audit" element={<LeadLeakAudit />} />
      <Route path="/tools/audit" element={<LeadLeakAudit />} />
      <Route path="/solutions" element={<SolutionsHub />} />
      <Route path="/solutions/:slug" element={<SolutionDetail />} />
      {/* VYAPAR OS / GADDI HUB — Unified Enterprise Business OS (Lakshya Traders, Jabalpur) */}
      <Route path="/vyapar-os" element={<VyaparOS />} />
      <Route path="/vyapar" element={<Navigate to="/vyapar-os" replace />} />
      <Route path="/gaddi-hub" element={<Navigate to="/vyapar-os" replace />} />
      <Route path="/gaddi" element={<Navigate to="/vyapar-os" replace />} />
      <Route path="*" element={publicLanding} />

    </Routes>
    </React.Suspense>

  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GARUDA UI Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#030712", color: "#f87171", padding: "2rem", fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#d4af37" }}>GARUDA Founder Console UI Notice</h2>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", color: "#000", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            Reload Console
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
