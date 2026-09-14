import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://gcifzzuyswrcwvkcfqbr.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";

function getSupabaseClient() {
  const url = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  const key = (typeof import.meta !== "undefined" && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  return createClient(url, key);
}

async function postEmailPassword(url, email, password) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to continue");
  return data;
}

function enterApp() {
  window.location.assign("/app");
}

export default function CustomerAuthForm({ mode, onAuthenticated }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function googleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message || "Google Sign-In initialization failed. Please use email/password or instant demo.");
      setGoogleLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await postEmailPassword(`/api/customer/${isSignup ? "signup" : "login"}`, email, password);
      if (typeof onAuthenticated === "function" && data?.customer) {
        onAuthenticated(data.customer);
      } else {
        enterApp();
      }
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  }

  async function demoLogin() {
    setError("");
    setDemoLoading(true);
    try {
      const response = await fetch("/api/customer/demo", { method: "POST", credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to start the demo");
      if (typeof onAuthenticated === "function" && data?.customer) {
        onAuthenticated(data.customer);
      } else {
        enterApp();
      }
    } catch (authError) {
      setError(authError.message);
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <main className="garuda-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ width: "min(100% - 2rem, 400px)", padding: "2rem", border: "1px solid rgba(255,255,255,.15)", borderRadius: "12px", background: "#111827" }}>
        <p className="eyebrow">GARUDA AI</p>
        <h1 style={{ marginTop: 0 }}>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <button
          type="button"
          disabled={googleLoading || loading || demoLoading}
          onClick={googleLogin}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "#ffffff",
            color: "#1f2937",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: googleLoading ? "wait" : "pointer",
            marginBottom: "1.25rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "opacity 0.2s ease"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0 0 1.25rem 0" }}>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.12)" }} />
          <span style={{ color: "#6b7280", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>or continue with email</span>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.12)" }} />
        </div>
        <label htmlFor="customer-email">Email</label>
        <input
          id="customer-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ width: "100%", margin: "0.5rem 0 1rem", padding: "0.75rem" }}
        />
        <label htmlFor="customer-password">Password</label>
        <input
          id="customer-password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength="5"
          required
          style={{ width: "100%", margin: "0.5rem 0 1rem", padding: "0.75rem" }}
        />
        {isSignup && <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Use at least 5 characters.</p>}
        {error && <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>}
        <button type="submit" disabled={loading || demoLoading} className="hero-panel__button hero-panel__button--primary" style={{ width: "100%" }}>
          {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
        </button>
        <p style={{ color: "#9ca3af", marginBottom: 0 }}>
          {isSignup ? "Already have an account?" : "New to GARUDA?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"} style={{ color: "#fbbf24" }}>
            {isSignup ? "Log in" : "Get started"}
          </Link>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.12)" }} />
          <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.12)" }} />
        </div>
        <button
          type="button"
          disabled={demoLoading || loading}
          onClick={demoLogin}
          style={{ width: "100%", background: "transparent", border: "1px solid rgba(251,191,36,.45)", color: "#fbbf24", padding: "0.75rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
        >
          {demoLoading ? "Preparing demo…" : "Try a one-click demo account"}
        </button>
      </form>
    </main>
  );
}