import React, { useState } from "react";

export default function FounderLogin({ onAuthenticated }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Founder login failed");
      onAuthenticated();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="garuda-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form onSubmit={handleSubmit} style={{ width: "min(100% - 2rem, 360px)", padding: "2rem", border: "1px solid rgba(255,255,255,.15)", borderRadius: "12px", background: "#111827" }}>
        <p className="eyebrow">PRIVATE AREA</p><h1 style={{ marginTop: 0 }}>Founder access</h1>
        <label htmlFor="founder-password">Password</label>
        <input id="founder-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ width: "100%", margin: "0.5rem 0 1rem", padding: "0.75rem" }} />
        {error && <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>}
        <button type="submit" disabled={loading} className="hero-panel__button hero-panel__button--primary" style={{ width: "100%" }}>{loading ? "Checking access..." : "Enter founder workspace"}</button>
      </form>
    </main>
  );
}
