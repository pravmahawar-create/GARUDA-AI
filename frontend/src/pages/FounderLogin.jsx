import React, { useState } from "react";
import { Link } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";

export default function FounderLogin({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error(data.message || "Founder login failed"), { status: response.status });
      onAuthenticated();
    } catch (loginError) {
      if (loginError.status === 503) {
        setError("Founder access is not configured yet. Use the “Set founder access” tab below to create your own password.");
        setMode("manage");
      } else if (loginError.status === 401) {
        setError("Invalid founder password. If you forgot it, reset it in the tab below.");
      } else {
        setError(loginError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManage(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/manage-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "set", currentPassword, newPassword, setupToken })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update founder access");
      setNotice("Founder password saved. Sign in below with your new password.");
      setPassword("");
      setNewPassword("");
      setCurrentPassword("");
      setSetupToken("");
      setMode("login");
    } catch (manageError) {
      setError(manageError.message);
    } finally {
      setLoading(false);
    }
  }

  const switchToManage = () => {
    setError("");
    setNotice("");
    setMode("manage");
  };

  const switchToLogin = () => {
    setError("");
    setNotice("");
    setMode("login");
  };

  const isLogin = mode === "login";

  const field = {
    width: "100%",
    margin: "0.5rem 0 1rem",
    padding: "0.8rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(245,215,110,0.22)",
    background: "rgba(5,8,14,0.7)",
    color: "#f7f2dc",
    minHeight: "44px"
  };

  const label = {
    display: "block",
    color: "#8d95a7",
    fontSize: "0.82rem",
    fontWeight: 600,
    letterSpacing: "0.05em"
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", padding: "2rem 1rem", background: "radial-gradient(circle at top, rgba(245,215,110,0.16), transparent 30%), linear-gradient(135deg, #03060a 0%, #07111d 45%, #02050a 100%)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 25%, rgba(245,215,110,0.08), transparent 22%), radial-gradient(circle at 85% 75%, rgba(125,211,252,0.06), transparent 24%)" }} />

      <div style={{ position: "relative", width: "min(100% - 2rem, 430px)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 92, height: 92, margin: "0 auto 1rem", borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(245,215,110,0.4)", background: "radial-gradient(circle, rgba(245,215,110,0.16), rgba(5,8,14,0.96))", boxShadow: "0 0 42px rgba(245,215,110,0.24)", padding: 8 }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: "50%" }} />
          </div>
          <p style={{ color: "#f5d76e", letterSpacing: "0.22em", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.5rem" }}>Private Area</p>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.06em" }}>Founder Console</h1>
        </div>

        <div style={{ display: "flex", gap: "0.35rem", background: "rgba(5,8,14,0.7)", border: "1px solid rgba(245,215,110,0.14)", padding: "0.3rem", borderRadius: "12px", marginBottom: "1.25rem" }}>
          {["login", "manage"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => (tab === "login" ? switchToLogin() : switchToManage())}
              style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                borderRadius: "9px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.04em",
                border: "none",
                background: isLogin === (tab === "login") ? "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)" : "transparent",
                color: isLogin === (tab === "login") ? "#05070b" : "#8d95a7"
              }}
            >
              {tab === "login" ? "Sign in" : "Set access"}
            </button>
          ))}
        </div>

        <form onSubmit={isLogin ? handleLogin : handleManage} style={{ padding: "1.8rem", border: "1px solid rgba(245,215,110,0.18)", borderRadius: "18px", background: "rgba(15,22,34,0.85)", backdropFilter: "blur(14px)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          {!isLogin && (
            <p style={{ color: "#8d95a7", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 1.1rem" }}>
              Go to <strong>Vercel → Project → Settings → Environment Variables</strong> and add
              <code style={{ color: "#f5d76e" }}> GARUDA_FOUNDER_SETUP_TOKEN</code> = a long secret.
              Paste that secret below to create or reset the password <strong>from this page</strong>.
            </p>
          )}

          {isLogin ? (
            <>
              <label htmlFor="founder-password" style={label}>Password</label>
              <input id="founder-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={field} placeholder="Enter founder password" />
            </>
          ) : (
            <>
              <label htmlFor="setup-token" style={label}>Setup / reset token</label>
              <input id="setup-token" type="password" autoComplete="off" value={setupToken} onChange={(event) => setSetupToken(event.target.value)} style={field} placeholder="GARUDA_FOUNDER_SETUP_TOKEN value" />
              <label htmlFor="new-password" style={label}>New founder password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength="12" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required style={field} placeholder="At least 12 characters" />
            </>
          )}

          {error && <p role="alert" style={{ color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "0.7rem 0.9rem", fontSize: "0.85rem" }}>{error}</p>}
          {notice && <p role="status" style={{ color: "#75f4ab", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", padding: "0.7rem 0.9rem", fontSize: "0.85rem" }}>{notice}</p>}

          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.35rem", padding: "0.9rem 1.4rem", borderRadius: "12px", border: "none", background: loading ? "rgba(245,215,110,0.35)" : "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070b", fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.03em", boxShadow: "0 12px 28px rgba(245,215,110,0.2)" }}>
            {loading ? (isLogin ? "Checking access..." : "Saving access...") : isLogin ? "Enter founder workspace" : "Save founder access"}
          </button>

          <div style={{ marginTop: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
            <Link to="/" style={{ color: "#8d95a7", textDecoration: "none" }}>← Back to site</Link>
            {isLogin ? (
              <button type="button" onClick={switchToManage} style={{ background: "none", border: "none", color: "#f5d76e", cursor: "pointer", fontSize: "0.82rem" }}>Forgot password? Set new</button>
            ) : (
              <button type="button" onClick={switchToLogin} style={{ background: "none", border: "none", color: "#f5d76e", cursor: "pointer", fontSize: "0.82rem" }}>I have a password →</button>
            )}
          </div>
        </form>

        <p style={{ textAlign: "center", color: "#5b6472", fontSize: "0.75rem", marginTop: "1.25rem" }}>
          GARUDA AI Operating System · Founder-controlled · Audit-trailed
        </p>
      </div>
    </main>
  );
}