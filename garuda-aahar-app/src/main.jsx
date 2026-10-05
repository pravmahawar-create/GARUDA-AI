import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import GarudaHealthApp from "./GarudaHealthApp";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <GarudaHealthApp />
    </HashRouter>
  </React.StrictMode>
);
