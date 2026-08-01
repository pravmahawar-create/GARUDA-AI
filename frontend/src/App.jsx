import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import FounderLogin from "./pages/FounderLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import Login from "./pages/Login";
import PublicLanding from "./pages/PublicLanding";
import Signup from "./pages/Signup";
import FounderWorkspace from "./pages/FounderWorkspace";

import "./styles/garuda-ui.css";

function AppRoutes() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => { fetch("/api/customer/session", { credentials: "same-origin" }).then((response) => response.json()).then((data) => setCustomer(data.authenticated ? data.customer : false)).catch(() => setCustomer(false)); }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setAuthenticated(false);
    navigate("/");
  };

  const founderRoute = authenticated === null ? null : authenticated
    ? <FounderWorkspace onLogout={handleLogout} />
    : <FounderLogin onAuthenticated={() => setAuthenticated(true)} />;
  const customerRoute = customer === null ? null : customer ? <CustomerDashboard customer={customer} onLogout={async () => { await fetch("/api/customer/logout", { method: "POST", credentials: "same-origin" }); setCustomer(false); navigate("/"); }} /> : <Login />;
  const publicLanding = <PublicLanding onGetStarted={() => navigate("/signup")} onFounderLogin={() => navigate("/founder")} />;

  return (
    <Routes>
      <Route path="/" element={publicLanding} />
      <Route path="/founder" element={founderRoute} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/app" element={customerRoute} />
      <Route path="*" element={publicLanding} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
