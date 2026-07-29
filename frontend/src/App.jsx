import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import PublicLanding from "./pages/PublicLanding";
import FounderWorkspace from "./pages/FounderWorkspace";

import "./styles/garuda-ui.css";

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<PublicLanding onLoginClick={() => navigate("/founder")} />} />
      <Route path="/founder" element={<FounderWorkspace />} />
      <Route path="*" element={<PublicLanding onLoginClick={() => navigate("/founder")} />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
