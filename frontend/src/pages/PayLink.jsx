import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#f5d76e";

function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR"),
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  } catch {
    return `${currency || "INR"} ${Number(amount || 0).toFixed(2)}`;
  }
}

export default function PayLink() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: "", payment: null });

  async function load() {
    setState({ loading: true, error: "", payment: null });
    try {
      const response = await fetch(`/api/scout/payment/${encodeURIComponent(ref || "")}`, { credentials: "same-origin" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Payment reference not found");
      setState({ loading: false, error: "", payment: body });
    } catch (error) {
      setState({ loading: false, error: error.message, payment: null });
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 20000);
    return () => clearInterval(poll);
  }, [ref]);

  const paid = state.payment && ["paid", "captured"].includes(String(state.payment.status || ""));
  const cancelled = state.payment && ["cancelled", "failed", "expired"].includes(String(state.payment.status || ""));

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, rgba(245,215,110,0.08), transparent 45%), #04070a", color: "#e7e9ee", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", display: "grid", placeItems: "center", padding: "2rem 1.25rem" }}>
      <div style={{ width: "min(100%, 480px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center", marginBottom: "2rem" }}>
          <span style={{ width: 40, height: 40, display: "grid", placeItems: "center", overflow: "hidden", borderRadius: 10 }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.12em", color: "#fff" }}>GARUDA</span>
        </div>

        <div style={{ border: "1px solid rgba(245,215,110,0.18)", borderRadius: 22, background: "linear-gradient(165deg, rgba(245,215,110,0.07), rgba(10,14,20,0.95))", padding: "2.4rem 2rem", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
          {state.loading && (
            <div style={{ padding: "3rem 0", color: "#9ca3af" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid rgba(245,215,110,0.2)", borderTopColor: GOLD, margin: "0 auto 1.2rem", animation: "garuda-spin 0.9s linear infinite" }} />
              Resolving payment reference…
            </div>
          )}

          {!state.loading && state.error && (
            <div style={{ padding: "2rem 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>◈</div>
              <h1 style={{ margin: "0 0 0.6rem", fontSize: "1.3rem", color: "#fff" }}>Payment reference not found</h1>
              <p style={{ margin: "0 0 1.6rem", color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.6 }}>{state.error}</p>
              <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,215,110,0.3)", color: GOLD, padding: "0.7rem 1.6rem", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: "0.92rem" }}>
                Back to GARUDA
              </button>
            </div>
          )}

          {state.payment && (
            <div>
              <p style={{ margin: "0 0 0.4rem", color: "#8d95a7", letterSpacing: "0.18em", fontSize: "0.72rem", fontWeight: 700 }}>SECURE PAYMENT REQUEST</p>
              <h1 style={{ margin: "0 auto 1.2rem", fontSize: "1.4rem", fontWeight: 800, color: "#fff", maxWidth: 420, lineHeight: 1.35 }}>{state.payment.title}</h1>

              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: GOLD, margin: "0 0 0.2rem" }}>{formatAmount(state.payment.amount, state.payment.currency)}</div>
              {state.payment.mode && state.payment.mode === "test" && (
                <div style={{ display: "inline-block", fontSize: "0.68rem", letterSpacing: "0.12em", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: 4, border: "1px solid rgba(245,215,110,0.35)", color: GOLD, margin: "0.6rem 0 0" }}>TEST MODE</div>
              )}

              <div style={{ margin: "1.8rem 0", padding: "0.9rem 1rem", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.7 }}>
                {state.payment.status === "paid"
                  ? <span style={{ color: "#4ade80", fontWeight: 700 }}>Payment completed. GARUDA has recorded this payment and will begin delivery.</span>
                  : <span>Payments are processed securely by Razorpay. This page is provided by GARUDA AI for delivery settlement.</span>}
              </div>

              {paid ? (
                <div style={{ padding: "1rem 0" }}>
                  <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>✓</div>
                  <div style={{ color: "#4ade80", fontWeight: 800, letterSpacing: "0.05em" }}>PAYMENT COMPLETE</div>
                </div>
              ) : cancelled ? (
                <div style={{ padding: "1rem 0", color: "#f87171", fontWeight: 700 }}>This payment was cancelled or expired.</div>
              ) : (
                <button
                  onClick={() => window.open(state.payment.paymentUrl, "_blank", "noopener,noreferrer")}
                  style={{ width: "100%", background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070b", border: "none", padding: "1rem", borderRadius: 999, fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", boxShadow: "0 14px 36px rgba(245,215,110,0.22)" }}
                >
                  Pay {formatAmount(state.payment.amount, state.payment.currency)}
                </button>
              )}

              <p style={{ margin: "1.6rem 0 0", color: "#5b6472", fontSize: "0.72rem", lineHeight: 1.6 }}>
                Billed securely through Razorpay · Reference {String(state.payment.missionId || state.payment.reference || "").slice(0, 24)}…<br />
                Founder-controlled · Audit-trailed · GARUDA AI Operating System
              </p>
            </div>
          )}
        </div>

        <button type="button" onClick={() => navigate("/")} style={{ display: "block", margin: "1.5rem auto 0", background: "none", border: "none", color: "#8d95a7", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>
          ← Back to GARUDA
        </button>
      </div>
    </div>
  );
}