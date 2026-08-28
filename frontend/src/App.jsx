import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import FounderLogin from "./pages/FounderLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
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
import { initAttribution } from "./utils/attribution";

import "./styles/garuda-ui.css";

function AppRoutes() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    initAttribution();
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

  useEffect(() => { fetch("/api/customer/session", { credentials: "same-origin" }).then((response) => response.json()).then((data) => setCustomer(data.authenticated ? data.customer : false)).catch(() => setCustomer(false)); }, []);

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
  const customerRoute = customer === null ? null : customer ? <CustomerDashboard customer={customer} onLogout={async () => { await fetch("/api/customer/logout", { method: "POST", credentials: "same-origin" }); setCustomer(false); navigate("/"); }} /> : <Login />;
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

  return (
    <Routes>
      <Route path="/" element={publicLanding} />
      <Route path="/what-is-garuda-ai" element={<WhatIsGarudaAI />} />
      <Route path="/garuda-ai" element={<WhatIsGarudaAI />} />
      <Route path="/chat" element={<PublicChat />} />
      <Route path="/founder" element={founderRoute} />
      <Route path="/founder/acquisition" element={acquisitionRoute} />
      <Route path="/revenue" element={revenueRoute} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/demo" element={<DemoLaunch />} />
      <Route path="/app" element={customerRoute} />
      <Route path="/pay/:ref" element={<PayLink />} />
      <Route path="/proposal/:proposalId" element={<ProposalPortal />} />
      <Route path="/services/:slug" element={<ServiceLanding />} />
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
