import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import FounderLogin from "./pages/FounderLogin";
import PublicLanding from "./pages/PublicLanding";
import FounderWorkspace from "./pages/FounderWorkspace";

import "./styles/garuda-ui.css";

function AppRoutes() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setAuthenticated(false);
    navigate("/");
  };

  const founderRoute = authenticated === null ? null : authenticated
    ? <FounderWorkspace onLogout={handleLogout} />
    : <FounderLogin onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <Routes>
      <Route path="/" element={<PublicLanding onLoginClick={() => navigate("/founder")} />} />
      <Route path="/founder" element={founderRoute} />
      <Route path="*" element={<PublicLanding onLoginClick={() => navigate("/founder")} />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
