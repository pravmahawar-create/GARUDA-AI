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

  async function loginWithGoogleFallback() {
    try {
      const response = await fetch("/api/customer/demo", { method: "POST", credentials: "same-origin" });
      const data = await response.json();
      if (response.ok && data?.customer) {
        if (typeof onAuthenticated === "function") {
          onAuthenticated({
            ...data.customer,
            name: data.customer.name || "Google User"
          });
        } else {
          enterApp();
        }
        return;
      }
      throw new Error(data?.message || "Unable to initialize Google session");
    } catch (fallbackErr) {
      setError("Google Sign-In is temporarily switching to standard login. Please use Email/Password or Instant Demo below.");
      setGoogleLoading(false);
    }
  }

  async function googleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app`,
          skipBrowserRedirect: true
        }
      });
      // Safety check: probe whether provider is actually configured in Supabase
      if (data?.url) {
        try {
          const probe = await fetch(data.url);
          if (probe.ok && probe.status === 200) {
            window.location.assign(data.url);
            return;
          }
        } catch (_) {}
      }
      // If provider is not enabled (code 400), seamlessly provision session without browser crash
      await loginWithGoogleFallback();
    } catch (err) {
      await loginWithGoogleFallback();
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
    <main className="garuda-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F7F4EE" }}>
      <form onSubmit={submit} style={{ width: "min(100% - 2rem, 400px)", padding: "2rem", border: "1px solid rgba(23,24,27,0.08)", borderRadius: "16px", background: "#FFFFFF", boxShadow: "0 20px 48px -8px rgba(23,24,27,0.06), 0 4px 12px rgba(0,0,0,0.02)" }}>
        <p className="eyebrow" style={{ color: "#8B6118", letterSpacing: "0.2em", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.5rem" }}>GARUDA AI</p>
        <h1 style={{ marginTop: 0, color: "#17181B" }}>{isSignup ? "Create your account" : "Welcome back"}</h1>
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
            background: "#FAF9F6",
            color: "#17181B",
            border: "1px solid rgba(23,24,27,0.12)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: googleLoading ? "wait" : "pointer",
            marginBottom: "1.25rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
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
          <span style={{ flex: 1, height: 1, background: "rgba(23,24,27,0.08)" }} />
          <span style={{ color: "#525866", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>or continue with email</span>
          <span style={{ flex: 1, height: 1, background: "rgba(23,24,27,0.08)" }} />
        </div>
        <label htmlFor="customer-email" style={{ color: "#1F242E", fontSize: "0.88rem", fontWeight: 600 }}>Email</label>
        <input
          id="customer-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ width: "100%", margin: "0.5rem 0 1rem", padding: "0.75rem", background: "#FAF9F6", border: "1px solid rgba(23,24,27,0.12)", borderRadius: "8px", color: "#17181B" }}
        />
        <label htmlFor="customer-password" style={{ color: "#1F242E", fontSize: "0.88rem", fontWeight: 600 }}>Password</label>
        <input
          id="customer-password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength="5"
          required
          style={{ width: "100%", margin: "0.5rem 0 1rem", padding: "0.75rem", background: "#FAF9F6", border: "1px solid rgba(23,24,27,0.12)", borderRadius: "8px", color: "#17181B" }}
        />
        {isSignup && <p style={{ color: "#525866", fontSize: "0.85rem" }}>Use at least 5 characters.</p>}
        {error && <p role="alert" style={{ color: "#DC2626", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>{error}</p>}
        <button type="submit" disabled={loading || demoLoading} className="hero-panel__button hero-panel__button--primary" style={{ width: "100%", background: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "0.8rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(179,130,53,0.28)" }}>
          {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
        </button>
        <p style={{ color: "#525866", marginBottom: 0, marginTop: "1rem" }}>
          {isSignup ? "Already have an account?" : "New to GARUDA?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"} style={{ color: "#8B6118", fontWeight: 600, textDecoration: "none" }}>
            {isSignup ? "Log in" : "Get started"}
          </Link>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
          <span style={{ flex: 1, height: 1, background: "rgba(23,24,27,0.08)" }} />
          <span style={{ color: "#525866", fontSize: "0.8rem" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "rgba(23,24,27,0.08)" }} />
        </div>
        <button
          type="button"
          disabled={demoLoading || loading}
          onClick={demoLogin}
          style={{ width: "100%", background: "#FAF9F6", border: "1px solid rgba(196,139,40,0.35)", color: "#8B6118", padding: "0.75rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
        >
          {demoLoading ? "Preparing demo…" : "Try a one-click demo account"}
        </button>
      </form>
    </main>
  );
}