import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import FounderLogin from "./pages/FounderLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerAuthForm from "./pages/CustomerAuthForm";
import Login from "./pages/Login";
import PublicLanding from "./pages/PublicLanding";
import PublicChat from "./pages/PublicChat";
import PayLink from "./pages/PayLink";
import Signup from "./pages/Signup";
import DemoLaunch from "./pages/DemoLaunch";
import FounderWorkspace from "./pages/FounderWorkspace";
import RevenueDepartment from "./pages/RevenueDepartment";
import ProposalPortal from "./pages/ProposalPortal";
import ServiceLanding from "./pages/ServiceLanding";
import FounderAcquisitionCockpit from "./pages/FounderAcquisitionCockpit";
import WhatIsGarudaAI from "./pages/WhatIsGarudaAI";
import GuidesIndex from "./pages/GuidesIndex";
import GuideArticle from "./pages/GuideArticle";
import HighCommandCenter from "./pages/HighCommandCenter";
import GrowthCommandCenter from "./pages/GrowthCommandCenter";
import ScholarStudio from "./pages/ScholarStudio";
import CreativeStudio from "./pages/CreativeStudio";
import CreativeProductionWorkspace from "./pages/CreativeProductionWorkspace";
import ContentStudio from "./pages/ContentStudio";
import BrandStudio from "./pages/BrandStudio";
import DigitalPresenceStudio from "./pages/DigitalPresenceStudio";
import EntertainmentStudio from "./pages/EntertainmentStudio";
import FounderKingdomAccess from "./pages/FounderKingdomAccess";
import InvestorExperience from "./pages/InvestorExperience";
import BotVerseStudio from "./pages/BotVerseStudio";
import MagicDelegationPortal from "./pages/MagicDelegationPortal";
import AstraCodingStudio from "./pages/AstraCodingStudio";
import PawanCodingStudio from "./pages/PawanCodingStudio";
import KidsVoiceApp from "./pages/KidsVoiceApp";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import FounderProfile from "./pages/FounderProfile";
import GarudaDostRozgar from "./pages/GarudaDostRozgar";
import BoilerplateStore from "./pages/BoilerplateStore";
import PricingPage from "./pages/PricingPage";
import GarudaVsLinux from "./pages/GarudaVsLinux";
import SovereignEnterpriseMatrix from "./pages/SovereignEnterpriseMatrix";
import CaseStudies from "./pages/CaseStudies";
import GarudaCyberTycoon from "./pages/GarudaCyberTycoon";
import FounderQuantCommand from "./pages/FounderQuantCommand";
import GarudaHealthApp from "./pages/GarudaHealthApp";
import CyberShieldDashboard from "./pages/CyberShieldDashboard";
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
    <Routes>
      <Route path="/" element={publicLanding} />
      <Route path="/what-is-garuda-ai" element={<WhatIsGarudaAI />} />
      <Route path="/garuda-ai" element={<WhatIsGarudaAI />} />
      <Route path="/chat" element={<PublicChat />} />
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

      {/* Founder Sovereign Access */}
      <Route path="/founder/access" element={<FounderKingdomAccess />} />
      <Route path="/enterprise" element={<SovereignEnterpriseMatrix />} />
      <Route path="/founder/enterprise" element={<SovereignEnterpriseMatrix />} />
      <Route path="/sovereign-matrix" element={<SovereignEnterpriseMatrix />} />
      <Route path="/founder/quant" element={<FounderQuantCommand onLogout={handleLogout} />} />
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
      <Route path="/founder/pawan" element={<PawanCodingStudio />} />
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
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/praveen-mahawar" element={<FounderProfile />} />
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
      <Route path="/store" element={<BoilerplateStore />} />
      <Route path="/sovereign-starter" element={<BoilerplateStore />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/plans" element={<PricingPage />} />
      <Route path="/billing" element={<PricingPage />} />
      <Route path="/garuda-ai-vs-garuda-linux" element={<GarudaVsLinux />} />
      <Route path="/case-studies" element={<CaseStudies />} />
      {/* GARUDA AAHAR — Human Nutrition & Wellness Platform */}
      <Route path="/health" element={<GarudaHealthApp />} />
      <Route path="/aahar" element={<GarudaHealthApp />} />
      <Route path="/wellness" element={<GarudaHealthApp />} />
      <Route path="/garuda-aahar" element={<GarudaHealthApp />} />
      {/* GARUDA CyberShield™ — Sovereign Anti-Troll Defense Cockpit */}
      <Route path="/cybershield" element={<CyberShieldDashboard customer={customer} onLogout={handleLogout} />} />
      <Route path="*" element={publicLanding} />

    </Routes>

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
