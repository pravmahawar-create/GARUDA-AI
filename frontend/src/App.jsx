import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PublicLanding from "./pages/PublicLanding";
import FounderWorkspace from "./pages/FounderWorkspace";

import "./styles/garuda-ui.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/founder" element={<FounderWorkspace />} />
      <Route path="*" element={<PublicLanding />} />
    </Routes>
  </BrowserRouter>
);