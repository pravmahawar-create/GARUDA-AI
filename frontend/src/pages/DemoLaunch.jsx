import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

export default function DemoLaunch() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [state, setState] = useState("starting");
  const started = useRef(false);

  async function startDemo() {
    try {
      setState("starting");
      const response = await fetch("/api/customer/demo", { method: "POST", credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to start the demo");
      setState("ready");
      window.location.assign("/app");
    } catch (demoError) {
      setError(demoError.message);
      setState("error");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startDemo();
  }, [navigate]);

  return (
    <main className="garuda-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <SEOHead
        title="Live Sandbox Demo — GARUDA AI Operating System"
        description="Experience the live sandbox demo of GARUDA AI: Governed business automation, AI communication, operations, and revenue intelligence."
        canonical="https://www.garudaos.in/demo"
      />
      <div style={{ width: "min(100% - 2rem, 420px)", padding: "2.5rem", border: "1px solid rgba(245,215,110,0.25)", borderRadius: "20px", background: "#0b0f16", textAlign: "center" }}>
        <p className="eyebrow">GARUDA AI OS</p>
        <h1 style={{ margin: "0.4rem 0 1rem" }}>Live Demo</h1>
        {state === "starting" && <p style={{ color: "#9ca3af" }}>Preparing your private demo sandbox…</p>}
        {state === "ready" && <p style={{ color: "#75f4ab" }}>Demo ready — taking you to the customer portal…</p>}
        {state === "error" && (
          <>
            <p style={{ color: "#f87171" }}>{error}</p>
            <button type="button" onClick={() => { started.current = false; setState("starting"); startDemo(); }} style={{ marginTop: "0.75rem", padding: "0.6rem 1.4rem", background: "linear-gradient(135deg,#f5d76e,#b8860b)", border: "none", borderRadius: "999px", fontWeight: 800, cursor: "pointer" }}>
              Try again
            </button>
          </>
        )}
        <button type="button" onClick={() => navigate("/")} style={{ display: "block", margin: "1.25rem auto 0", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.85rem" }}>
          ← Back to home
        </button>
      </div>
    </main>
  );
}