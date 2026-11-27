import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { QR_SOURCE_TYPES, resolveCheckoutQrState } from "../utils/checkoutQrGuard.mjs";
import {
  FiActivity,
  FiShield,
  FiZap,
  FiFileText,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertTriangle,
  FiDownload,
  FiRefreshCw,
  FiLock,
  FiLayers,
  FiCreditCard,
  FiKey,
  FiArrowUpRight
} from "react-icons/fi";
import CommercialRevenueDashboard from "../components/CommercialRevenueDashboard";

const SIM_SESSION_KEY = "garuda_merchant_ops_sim_id";
function getSimOpsId() {
  try {
    let id = window.sessionStorage.getItem(SIM_SESSION_KEY);
    if (!id) {
      id = `sim_ops_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      window.sessionStorage.setItem(SIM_SESSION_KEY, id);
    }
    return id;
  } catch {
    return "sim_ops_default";
  }
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FintechMerchantPortal() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | checkout | vans | evidence | growth | eligibility
  const [mode, setMode] = useState("SIMULATED"); // SIMULATED | LIVE
  const [authToken, setAuthToken] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // Interactive Form States
  const [selectedMerchantId, setSelectedMerchantId] = useState("SIM_GM_ESPORTS_01");
  const [checkoutAmount, setCheckoutAmount] = useState(2500);
  const [checkoutRail, setCheckoutRail] = useState("IMPS");
  const [livePreviewQr, setLivePreviewQr] = useState("");
  const [activeIntentId, setActiveIntentId] = useState("");
  const [staleInvalidatedReason, setStaleInvalidatedReason] = useState("");
  const [dailyBudget, setDailyBudget] = useState(10000);

  // BSA Sec 63 Case Creation & Signatory Modals
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [partAForm, setPartAForm] = useState({ deponentName: "", designation: "" });
  const [partBForm, setPartBForm] = useState({ expertName: "", qualification: "" });
  const [newCaseRef, setNewCaseRef] = useState("");

  const [simSessionId] = useState(() => getSimOpsId());

  const showToast = useCallback((type, msg) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 6000);
  }, []);

  const callApi = useCallback(async (url, { method = "GET", body = null } = {}) => {
    const headers = { Accept: "application/json", "x-sim-session-id": simSessionId };
    if (body !== null) headers["Content-Type"] = "application/json";
    if (authToken) {
      headers[authToken.includes(".") ? "Authorization" : "x-founder-key"] = authToken.includes(".") ? `Bearer ${authToken}` : authToken;
    }
    try {
      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers,
        body: body !== null ? JSON.stringify(body) : undefined
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        return { ok: false, status: res.status, errorCode: json?.errorCode || `HTTP_${res.status}`, error: json?.error || `HTTP ${res.status}` };
      }
      return { ok: true, status: res.status, data: json?.data ?? json };
    } catch (err) {
      return { ok: false, status: 0, errorCode: "NETWORK_UNAVAILABLE", error: err?.message || "Network error" };
    }
  }, [authToken, simSessionId]);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (mode === "SIMULATED") {
      const r = await callApi("/api/merchant/simulation/state");
      if (!r.ok) {
        setError(r.error);
        setSnapshot(null);
      } else {
        setSnapshot(r.data);
        if (r.data.evidenceCases?.length && !selectedCaseId) {
          setSelectedCaseId(r.data.evidenceCases[0].caseId);
        }
      }
      setLoading(false);
      return;
    }

    // LIVE authenticated mode (strict 401 if unauthenticated, never falls back to demo state)
    const [elig, intents, cmp, evCases, tax] = await Promise.all([
      callApi("/api/merchant/eligibility"),
      callApi("/api/merchant/checkout/intents"),
      callApi("/api/merchant/campaigns"),
      callApi("/api/merchant/evidence/cases"),
      callApi("/api/merchant/tax-config")
    ]);

    if (!elig.ok) {
      setError(`${elig.errorCode}: ${elig.error}`);
      setSnapshot(null);
      setLoading(false);
      return;
    }

    setSnapshot({
      environmentMode: "LIVE_OPERATIONS",
      isSimulated: false,
      declarations: elig.data.declarations || [],
      intents: intents.ok ? intents.data.items : [],
      campaigns: cmp.ok ? cmp.data.campaigns : [],
      attributionEvents: cmp.ok ? cmp.data.attributionEvents : [],
      evidenceCases: evCases.ok ? evCases.data.cases : [],
      taxConfig: tax.ok ? tax.data : null
    });
    setLoading(false);
  }, [mode, callApi, selectedCaseId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const intents = snapshot?.intents || [];
  const declarations = snapshot?.declarations || [];
  const campaigns = snapshot?.campaigns || [];
  const attributionEvents = snapshot?.attributionEvents || [];
  const evidenceCases = snapshot?.evidenceCases || [];
  const taxConfig = snapshot?.taxConfig || null;

  const activeCase = evidenceCases.find((c) => c.caseId === selectedCaseId) || evidenceCases[0] || null;
  const activeMerchantDecl = declarations.find((d) => d.merchantId === selectedMerchantId) || declarations[0] || null;
  const primaryCampaign = campaigns[0] || null;
  const settledIntents = intents.filter((i) => i.status === "SETTLED");
  const totalSettledVolume = settledIntents.reduce((s, i) => s + Number(i.amount || 0), 0);

  const selectedCheckoutIntent = useMemo(
    () => (activeIntentId ? intents.find((i) => i.id === activeIntentId) || null : null),
    [intents, activeIntentId]
  );

  const qrState = useMemo(
    () =>
      resolveCheckoutQrState({
        mode,
        selectedMerchantId,
        checkoutAmount,
        checkoutRail,
        activeIntent: selectedCheckoutIntent,
        invalidatedReason: staleInvalidatedReason
      }),
    [mode, selectedMerchantId, checkoutAmount, checkoutRail, selectedCheckoutIntent, staleInvalidatedReason]
  );

  const handleCheckoutAmountChange = useCallback(
    (nextVal) => {
      setCheckoutAmount(nextVal);
      if (selectedCheckoutIntent && Number(nextVal) !== Number(selectedCheckoutIntent.amount)) {
        setStaleInvalidatedReason(
          `Amount changed from ₹${Number(selectedCheckoutIntent.amount).toLocaleString("en-IN")} to ${nextVal === "" ? "empty" : `₹${nextVal}`} — previous intent ${selectedCheckoutIntent.id} invalidated.`
        );
        setActiveIntentId("");
      }
    },
    [selectedCheckoutIntent]
  );

  const handleCheckoutRailChange = useCallback(
    (nextRail) => {
      setCheckoutRail(nextRail);
      if (selectedCheckoutIntent && String(nextRail) !== String(selectedCheckoutIntent.selectedRail || "")) {
        setStaleInvalidatedReason(`Rail changed to ${nextRail} — previous intent ${selectedCheckoutIntent.id} invalidated.`);
        setActiveIntentId("");
      }
    },
    [selectedCheckoutIntent]
  );

  const handleMerchantChange = useCallback(
    (nextMerchantId) => {
      setSelectedMerchantId(nextMerchantId);
      if (selectedCheckoutIntent && String(nextMerchantId) !== String(selectedCheckoutIntent.merchantId || "")) {
        setStaleInvalidatedReason(`Merchant changed — previous intent ${selectedCheckoutIntent.id} invalidated.`);
        setActiveIntentId("");
      }
    },
    [selectedCheckoutIntent]
  );

  // Real-time reactive QR generator: updates ONLY for valid consistent payloads; clears on invalid/mismatch
  useEffect(() => {
    let cancelled = false;
    if (!qrState.valid || !qrState.consistency.consistent || !qrState.payloadUri) {
      setLivePreviewQr("");
      return undefined;
    }
    QRCode.toDataURL(qrState.payloadUri, { width: 220, margin: 1, color: { dark: "#050811", light: "#FFFFFF" } })
      .then((url) => {
        if (!cancelled) setLivePreviewQr(url);
      })
      .catch(() => {
        if (!cancelled) setLivePreviewQr("");
      });
    return () => {
      cancelled = true;
    };
  }, [qrState]);

  const triggerSim = async (action, body = {}) => {
    setBusy(true);
    const res = action === "reset"
      ? await callApi("/api/merchant/simulation/reset", { method: "POST" })
      : await callApi(`/api/merchant/simulation/actions/${encodeURIComponent(action)}`, { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      showToast("error", `${res.errorCode}: ${res.error}`);
      return null;
    }
    if (action === "reset") {
      setSnapshot(res.data);
      setActiveIntentId("");
      setStaleInvalidatedReason("");
      showToast("info", "Operations terminal sandbox reset cleanly.");
      return res.data;
    }
    setSnapshot(res.data.workspace);
    if (action === "create_checkout" && res.data.outcome?.intent?.id) {
      setActiveIntentId(res.data.outcome.intent.id);
      setStaleInvalidatedReason("");
    }
    showToast("success", res.data.outcome?.message || "Operation executed cleanly.");
    return res.data;
  };

  const triggerLiveEvidence = async (path, body) => {
    setBusy(true);
    const res = await callApi(`/api/merchant${path}`, { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      showToast("error", `${res.errorCode}: ${res.error}`);
      return null;
    }
    showToast("success", "Action persisted via authenticated backend.");
    await loadState();
    return res.data;
  };

  const navItems = [
    { id: "overview", label: "Operations Overview", icon: FiActivity },
    { id: "checkout", label: "UPI Checkout & QR", icon: FiCreditCard },
    { id: "vans", label: "VAN & Sweep Monitor", icon: FiLayers },
    { id: "evidence", label: "BSA Sec 63 Evidence Desk", icon: FiFileText },
    { id: "growth", label: "Gaming & Esports Growth Studio", icon: FiTrendingUp },
    { id: "eligibility", label: "Legal Eligibility & 2% Tax", icon: FiShield }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060913", color: "#F1F5F9", fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top Environment & Safety Ribbon */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        padding: "8px 20px",
        fontSize: "0.78rem",
        fontWeight: 600,
        background: mode === "SIMULATED" ? "linear-gradient(90deg, rgba(168,85,247,0.22), rgba(245,158,11,0.16))" : "linear-gradient(90deg, rgba(16,185,129,0.2), rgba(56,189,248,0.14))",
        borderBottom: "1px solid rgba(148,163,184,0.2)",
        color: mode === "SIMULATED" ? "#FDE68A" : "#A7F3D0"
      }}>
        <div>
          {mode === "SIMULATED"
            ? "SIMULATED OPERATIONS SANDBOX — Prohibited India Online Money Gaming remains FAIL-CLOSED (403); permitted Esports & Social Game demos active."
            : "LIVE MERCHANT OPERATIONS WORKSPACE — Authenticated Tenant & Founder Scope · Bank Rails: NOT CONNECTED / AWAITING CUSTOMER ACCESS."}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={() => { setMode("SIMULATED"); setActiveIntentId(""); setStaleInvalidatedReason(""); }} style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.45)", background: mode === "SIMULATED" ? "rgba(245,158,11,0.28)" : "#0f172a", color: "#fff", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
            Simulated Mode
          </button>
          <button type="button" onClick={() => { setMode("LIVE"); setActiveIntentId(""); setStaleInvalidatedReason(""); }} style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.45)", background: mode === "LIVE" ? "#059669" : "#0f172a", color: "#fff", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
            Live API Mode
          </button>
          <Link to="/merchant" style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.4)", background: "rgba(56,189,248,0.14)", color: "#7DD3FC", textDecoration: "none", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            Enterprise Treasury OS <FiArrowUpRight />
          </Link>
        </div>
      </div>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, padding: "14px 22px", background: "#0B1120", borderBottom: "1px solid rgba(148,163,184,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #10b981)", display: "grid", placeItems: "center", fontWeight: 900 }}>
            <FiZap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.02rem", letterSpacing: "-0.01em" }}>
              Merchant Operations Terminal <span style={{ fontSize: "0.7rem", marginLeft: 6, padding: "2px 8px", borderRadius: 999, background: "rgba(16,185,129,0.16)", color: "#34D399", border: "1px solid rgba(16,185,129,0.35)" }}>ZERO-CUSTODY</span>
            </div>
            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
              Checkout Ops • Bank-Verified VAN Monitor • BSA Sec 63 Evidence • Permitted Gaming Growth · Powered by GARUDA
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {declarations.length > 0 && (
            <select value={selectedMerchantId} onChange={(e) => handleMerchantChange(e.target.value)} style={{ background: "#060913", color: "#F1F5F9", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 8, padding: "6px 10px", fontSize: "0.78rem" }}>
              {declarations.map((d) => (
                <option key={d.merchantId} value={d.merchantId}>{d.legalName} [{d.evaluation?.decision || d.decision}]</option>
              ))}
            </select>
          )}
          {mode === "LIVE" && (
            <button type="button" onClick={() => { setTokenDraft(authToken); setShowAuthModal(true); }} style={{ background: "#1e293b", color: "#F1F5F9", border: "1px solid #475569", borderRadius: 8, padding: "6px 12px", fontSize: "0.78rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FiKey /> {authToken ? "Session Token Ready" : "Set API Token"}
            </button>
          )}
          {mode === "SIMULATED" && (
            <button type="button" disabled={busy} onClick={() => triggerSim("reset")} style={{ background: "rgba(245,158,11,0.16)", color: "#FDE68A", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <FiRefreshCw /> Reset Ops Sandbox
            </button>
          )}
        </div>
      </header>

      {/* Main Split Layout */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, flexWrap: "wrap" }}>
        <aside style={{ width: 252, flexShrink: 0, background: "#0A0F1C", borderRight: "1px solid rgba(148,163,184,0.14)", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: active ? "1px solid rgba(168,85,247,0.45)" : "1px solid transparent",
                  background: active ? "linear-gradient(90deg, rgba(168,85,247,0.2), rgba(16,185,129,0.08))" : "transparent",
                  color: active ? "#F8FAFC" : "#94A3B8",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.83rem",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main style={{ flex: 1, minWidth: 280, padding: "22px 24px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
          {notice && (
            <div style={{
              padding: "11px 14px",
              borderRadius: 10,
              fontSize: "0.82rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: notice.type === "error" ? "rgba(244,63,94,0.16)" : notice.type === "info" ? "rgba(56,189,248,0.14)" : "rgba(16,185,129,0.16)",
              border: `1px solid ${notice.type === "error" ? "rgba(244,63,94,0.4)" : notice.type === "info" ? "rgba(56,189,248,0.35)" : "rgba(16,185,129,0.4)"}`,
              color: "#F8FAFC"
            }}>
              <span>{notice.msg}</span>
              <button type="button" onClick={() => setNotice(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}>Dismiss</button>
            </div>
          )}

          {error && (
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)", color: "#FECDD3", fontSize: "0.84rem" }}>
              <strong>Backend Auth / Connection State:</strong> {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", border: "1px dashed rgba(148,163,184,0.25)", borderRadius: 12 }}>
              Loading Merchant Operations Telemetry...
            </div>
          ) : (
            <>
              {/* TAB 1: OPERATIONS OVERVIEW */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                    <div style={{ background: "#0F172A", border: "1px solid rgba(16,185,129,0.28)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700 }}>AT-REST CUSTODY EXPOSURE</div>
                      <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#34D399", marginTop: 6 }}>₹0.00</div>
                      <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: 4 }}>Zero-Custody Principal Enforced</div>
                    </div>
                    <div style={{ background: "#0F172A", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700 }}>SETTLED CHECKOUT VOLUME</div>
                      <div style={{ fontSize: "1.55rem", fontWeight: 800, marginTop: 6 }}>₹{totalSettledVolume.toLocaleString("en-IN")}</div>
                      <div style={{ fontSize: "0.74rem", color: "#7DD3FC", marginTop: 4 }}>{settledIntents.length} bank-verified transactions</div>
                    </div>
                    <div style={{ background: "#0F172A", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700 }}>GAMING LEGAL GATE STATUS</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#C084FC", marginTop: 8 }}>{activeMerchantDecl?.evaluation?.decision || "FAIL-CLOSED ACTIVE"}</div>
                      <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: 4 }}>Prohibited Money Games blocked (403)</div>
                    </div>
                    <div style={{ background: "#0F172A", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700 }}>BSA SEC 63 EVIDENCE CASES</div>
                      <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#FCD34D", marginTop: 6 }}>{evidenceCases.length}</div>
                      <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: 4 }}>SHA-256 original bytes preserved</div>
                    </div>
                  </div>

                  {mode === "SIMULATED" && (
                    <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontWeight: 700, marginBottom: 10 }}>Quick Operations Verifier (SIMULATED Backend)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        <button type="button" disabled={busy} onClick={() => triggerSim("create_checkout", { merchantId: "SIM_GM_ESPORTS_01", amount: 3500, rail: "IMPS" })} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #10b981", background: "#059669", color: "#fff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                          Create Permitted Checkout Intent
                        </button>
                        <button type="button" disabled={busy} onClick={() => triggerSim("settle_checkout", {})} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #38bdf8", background: "rgba(56,189,248,0.16)", color: "#7DD3FC", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                          Verify Bank Settlement Webhook
                        </button>
                        <button type="button" disabled={busy} onClick={() => triggerSim("test_prohibited_rmg_block", {})} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #f43f5e", background: "rgba(244,63,94,0.16)", color: "#FDA4AF", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                          <FiLock /> Test Blocked India Money-Game (403)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CHECKOUT & PROVIDER-NEUTRAL UPI QR */}
              {activeTab === "checkout" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
                  <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 18 }}>
                    <h3 style={{ margin: "0 0 6px" }}>Eligibility-Gated Checkout Intent Terminal</h3>
                    <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "#94A3B8" }}>
                      Lifecycle: CREATED -&gt; PAYMENT_INSTRUCTION_CREATED -&gt; SETTLED. Returning to checkout screen never fakes settlement without authenticated bank webhook.
                    </p>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginBottom: 6 }}>Quick Amount Presets (Instant LOCAL_PREVIEW_QR)</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[500, 1000, 2500, 10000, 25000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleCheckoutAmountChange(preset)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: qrState.valid && qrState.amount === preset ? "1px solid #34D399" : "1px solid #334155",
                                background: qrState.valid && qrState.amount === preset ? "rgba(16,185,129,0.2)" : "#060913",
                                color: "#F8FAFC",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              ₹{preset.toLocaleString("en-IN")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                        Amount (INR)
                        <input id="checkout-amount-input" type="number" min="1" value={checkoutAmount} onChange={(e) => handleCheckoutAmountChange(e.target.value)} style={{ width: "100%", marginTop: 4, padding: "8px 10px", background: "#060913", color: "#fff", border: qrState.valid ? "1px solid #334155" : "1px solid #F43F5E", borderRadius: 8 }} />
                      </label>
                      {!qrState.valid && (
                        <div id="checkout-amount-error" style={{ fontSize: "0.76rem", color: "#FDA4AF", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.35)", borderRadius: 8, padding: "7px 10px" }}>
                          {qrState.validationError}
                        </div>
                      )}
                      {qrState.isIntentStale && qrState.staleReason && (
                        <div id="checkout-stale-warning" style={{ fontSize: "0.75rem", color: "#FDE68A", background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "7px 10px" }}>
                          <strong>STALE_INVALIDATED:</strong> {qrState.staleReason}
                        </div>
                      )}
                      <label style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                        Rail
                        <select value={checkoutRail} onChange={(e) => handleCheckoutRailChange(e.target.value)} style={{ width: "100%", marginTop: 4, padding: "8px 10px", background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8 }}>
                          <option value="IMPS">IMPS</option>
                          <option value="RTGS">RTGS</option>
                          <option value="NEFT">NEFT</option>
                        </select>
                      </label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <button
                          type="button"
                          disabled={busy || !qrState.valid}
                          onClick={() =>
                            mode === "SIMULATED"
                              ? triggerSim("create_checkout", { merchantId: selectedMerchantId, amount: qrState.amount, rail: checkoutRail })
                              : callApi("/api/merchant/checkout/intents", { method: "POST", body: { merchantId: selectedMerchantId, amount: qrState.amount, destinationBankIban: "INICIC000104998811", merchantLegalName: activeMerchantDecl?.legalName || selectedMerchantId, selectedRail: checkoutRail } }).then((r) => {
                                  if (!r.ok) return showToast("error", `${r.errorCode}: ${r.error}`);
                                  if (r.data?.id) {
                                    setActiveIntentId(r.data.id);
                                    setStaleInvalidatedReason("");
                                  }
                                  return loadState();
                                })
                          }
                          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #10b981", background: busy || !qrState.valid ? "#1E293B" : "#059669", color: "#fff", fontWeight: 700, cursor: busy || !qrState.valid ? "not-allowed" : "pointer", opacity: busy || !qrState.valid ? 0.6 : 1 }}
                        >
                          Generate Checkout & VAN
                        </button>
                        {mode === "SIMULATED" && (
                          <button
                            type="button"
                            disabled={busy || !qrState.valid || !selectedCheckoutIntent || qrState.isIntentStale || selectedCheckoutIntent.status === "SETTLED"}
                            onClick={() => triggerSim("settle_checkout", { intentId: selectedCheckoutIntent?.id })}
                            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #38bdf8", background: "rgba(56,189,248,0.16)", color: "#7DD3FC", fontWeight: 700, cursor: busy || !qrState.valid || !selectedCheckoutIntent || qrState.isIntentStale || selectedCheckoutIntent.status === "SETTLED" ? "not-allowed" : "pointer", opacity: busy || !qrState.valid || !selectedCheckoutIntent || qrState.isIntentStale || selectedCheckoutIntent.status === "SETTLED" ? 0.45 : 1 }}
                          >
                            Confirm Bank Webhook
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                      <h3 style={{ margin: 0 }}>Dynamic Checkout QR Preview</h3>
                      <span
                        id="checkout-qr-origin-badge"
                        data-qr-origin={qrState.qrOrigin}
                        data-live-payment-ready={String(qrState.isLivePaymentReady)}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 999,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          border: qrState.isLivePaymentReady ? "1px solid #10b981" : "1px solid #f59e0b",
                          background: qrState.isLivePaymentReady ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.16)",
                          color: qrState.isLivePaymentReady ? "#34D399" : "#FDE68A"
                        }}
                      >
                        {qrState.qrOrigin === QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR
                          ? "PROVIDER_GENERATED_PAYMENT_QR · VERIFIED"
                          : qrState.qrOrigin === QR_SOURCE_TYPES.LOCAL_PREVIEW_QR
                            ? "LOCAL_PREVIEW_QR · NOT LIVE NPCI"
                            : "QR DISABLED"}
                      </span>
                    </div>
                    {qrState.valid && livePreviewQr ? (
                      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <img
                          id="dynamic-checkout-qr-img"
                          src={livePreviewQr}
                          data-qr-amount={String(qrState.amount)}
                          data-qr-reference={qrState.reference}
                          data-qr-origin={qrState.qrOrigin}
                          alt="Dynamic checkout QR"
                          style={{ width: 160, height: 160, borderRadius: 10, background: "#fff", padding: 6 }}
                        />
                        <div style={{ fontSize: "0.8rem", display: "grid", gap: 5, flex: 1, minWidth: 200 }}>
                          <div><strong>Live QR Amount:</strong> <span id="checkout-displayed-amount" style={{ color: "#34D399", fontWeight: 800 }}>₹{qrState.amount.toLocaleString("en-IN")}</span> ({checkoutRail})</div>
                          <div><strong>Checkout Reference:</strong> <code id="checkout-displayed-reference">{qrState.reference}</code></div>
                          <div><strong>Active Server Intent:</strong> <code id="checkout-active-intent-id">{selectedCheckoutIntent && !qrState.isIntentStale ? selectedCheckoutIntent.id : "None (Generate fresh intent for current amount)"}</code></div>
                          <div><strong>Intent State:</strong> <span id="checkout-intent-status" style={{ color: qrState.isIntentStale ? "#F87171" : selectedCheckoutIntent?.status === "SETTLED" ? "#34D399" : "#FCD34D", fontWeight: 700 }}>{qrState.intentStatus}</span></div>
                          <div><strong>UTR Ref:</strong> {selectedCheckoutIntent && !qrState.isIntentStale ? (selectedCheckoutIntent.bankSettlementRef || "Pending Bank Confirmation") : "Pending Fresh Intent"}</div>
                          <div id="checkout-qr-readiness-note" style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{qrState.statusBadgeText}</div>
                        </div>
                      </div>
                    ) : (
                      <div id="checkout-qr-disabled-box" style={{ color: "#FDA4AF", fontSize: "0.84rem", padding: "12px 0" }}>
                        {qrState.validationError || "Generating dynamic QR preview..."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: BANK-VERIFIED VAN & SETTLEMENT MONITOR */}
              {activeTab === "vans" && (
                <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 18 }}>
                  <h3 style={{ margin: "0 0 4px" }}>Collection VAN & Bank-Verified Settlement Status</h3>
                  <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginBottom: 14 }}>
                    ₹0.00 VAN balance and settled state strictly reflect bank/provider confirmation evidence — never client timers.
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                          <th style={{ padding: 10 }}>Intent ID</th>
                          <th style={{ padding: 10 }}>VAN / Node</th>
                          <th style={{ padding: 10 }}>Amount</th>
                          <th style={{ padding: 10 }}>Bank UTR Ref</th>
                          <th style={{ padding: 10 }}>Verified Sweep State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {intents.map((i) => (
                          <tr key={i.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                            <td style={{ padding: 10 }}><code>{i.id}</code></td>
                            <td style={{ padding: 10 }}>{i.van?.vanIdentifier || "Pending"}</td>
                            <td style={{ padding: 10 }}>₹{Number(i.amount).toLocaleString("en-IN")}</td>
                            <td style={{ padding: 10, color: i.bankSettlementRef ? "#34D399" : "#64748B" }}>{i.bankSettlementRef || "Awaiting Bank Feed"}</td>
                            <td style={{ padding: 10 }}>{i.status} {i.isSimulated && <span style={{ fontSize: "0.68rem", color: "#C084FC" }}>(SIMULATED)</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: BSA SECTION 63 ELECTRONIC EVIDENCE ENGINE */}
              {activeTab === "evidence" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#0F172A", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0 }}>BSA 2023 Section 63 Evidence & Dispute Case Desk</h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#94A3B8" }}>
                          Lifecycle: ALERT_RECEIVED -&gt; EVIDENCE_PRESERVED -&gt; UNDER_REVIEW -&gt; BANK_NOTIFIED -&gt; RESOLVED. Preserves raw bytes + SHA-256 chain. Software NEVER auto-signs or claims "court certified".
                        </p>
                      </div>
                      {mode === "SIMULATED" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input value={newCaseRef} onChange={(e) => setNewCaseRef(e.target.value)} placeholder="Complaint Ref (e.g. DISP-88)" style={{ background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontSize: "0.78rem" }} />
                          <button type="button" disabled={busy} onClick={() => triggerSim("create_evidence_case", { complaintRef: newCaseRef || undefined })} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #f59e0b", background: "rgba(245,158,11,0.2)", color: "#FDE68A", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>
                            + Preserve New Dispute Case
                          </button>
                        </div>
                      )}
                    </div>

                    {evidenceCases.length > 0 && (
                      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {evidenceCases.map((c) => (
                          <button key={c.caseId} type="button" onClick={() => setSelectedCaseId(c.caseId)} style={{ padding: "6px 12px", borderRadius: 8, border: activeCase?.caseId === c.caseId ? "1px solid #38bdf8" : "1px solid #334155", background: activeCase?.caseId === c.caseId ? "rgba(56,189,248,0.16)" : "#060913", color: "#fff", fontSize: "0.78rem", cursor: "pointer" }}>
                            {c.complaintRef} ({c.status})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeCase && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
                      <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 18, display: "grid", gap: 10 }}>
                        <div style={{ fontWeight: 700 }}>Schedule Part A — Authorized Custodian Signatory</div>
                        <div style={{ fontSize: "0.76rem", color: activeCase.partAAttestation?.signed ? "#34D399" : "#FCD34D" }}>
                          Status: {activeCase.partAAttestation?.status}
                        </div>
                        {activeCase.partAAttestation?.signed ? (
                          <div style={{ fontSize: "0.8rem", background: "#060913", padding: 10, borderRadius: 8 }}>
                            Signed by: <strong>{activeCase.partAAttestation.deponentName}</strong> ({activeCase.partAAttestation.designation}) at {activeCase.partAAttestation.signedAtIst}
                          </div>
                        ) : (
                          <>
                            <input placeholder="Human Deponent Full Name" value={partAForm.deponentName} onChange={(e) => setPartAForm({ ...partAForm, deponentName: e.target.value })} style={{ padding: "7px 10px", background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8, fontSize: "0.8rem" }} />
                            <input placeholder="Designation (e.g. Compliance Head)" value={partAForm.designation} onChange={(e) => setPartAForm({ ...partAForm, designation: e.target.value })} style={{ padding: "7px 10px", background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8, fontSize: "0.8rem" }} />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => mode === "SIMULATED" ? triggerSim("sign_part_a", { caseId: activeCase.caseId, ...partAForm }) : triggerLiveEvidence(`/evidence/cases/${activeCase.caseId}/part-a-sign`, partAForm)}
                              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #10b981", background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}
                            >
                              Record Human Part A Signature
                            </button>
                          </>
                        )}
                      </div>

                      <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 18, display: "grid", gap: 10 }}>
                        <div style={{ fontWeight: 700 }}>Schedule Part B — Qualified Technical Expert</div>
                        <div style={{ fontSize: "0.76rem", color: activeCase.partBVerification?.signed ? "#34D399" : "#FCD34D" }}>
                          Status: {activeCase.partBVerification?.status} · Chain Integrity: {activeCase.chainIntegrity?.valid ? "MATCHED" : "CHECK"}
                        </div>
                        {activeCase.partBVerification?.signed ? (
                          <div style={{ fontSize: "0.8rem", background: "#060913", padding: 10, borderRadius: 8 }}>
                            Verified by: <strong>{activeCase.partBVerification.expertName}</strong> ({activeCase.partBVerification.qualification}) at {activeCase.partBVerification.signedAtIst}
                          </div>
                        ) : (
                          <>
                            <input placeholder="Technical Expert Full Name" value={partBForm.expertName} onChange={(e) => setPartBForm({ ...partBForm, expertName: e.target.value })} style={{ padding: "7px 10px", background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8, fontSize: "0.8rem" }} />
                            <input placeholder="Qualification (e.g. M.Tech / Forensics Lead)" value={partBForm.qualification} onChange={(e) => setPartBForm({ ...partBForm, qualification: e.target.value })} style={{ padding: "7px 10px", background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8, fontSize: "0.8rem" }} />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => mode === "SIMULATED" ? triggerSim("sign_part_b", { caseId: activeCase.caseId, ...partBForm }) : triggerLiveEvidence(`/evidence/cases/${activeCase.caseId}/part-b-sign`, partBForm)}
                              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #38bdf8", background: "rgba(56,189,248,0.18)", color: "#7DD3FC", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}
                            >
                              Record Expert Part B Verification
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (mode === "SIMULATED") {
                              const out = await triggerSim("export_bsa_certificate", { caseId: activeCase.caseId });
                              if (out?.outcome?.exportPackage) downloadJson(`BSA_Sec63_Draft_${activeCase.complaintRef}.json`, out.outcome.exportPackage);
                            } else {
                              const res = await callApi(`/api/merchant/evidence/cases/${activeCase.caseId}/export`);
                              if (res.ok) downloadJson(`BSA_Sec63_Draft_${activeCase.complaintRef}.json`, res.data);
                              else showToast("error", `${res.errorCode}: ${res.error}`);
                            }
                          }}
                          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(168,85,247,0.5)", background: "rgba(168,85,247,0.16)", color: "#E9D5FF", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.8rem" }}
                        >
                          <FiDownload /> Export BSA Sec 63 Manifest & Part A/B Draft
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: GAMING & ESPORTS GROWTH STUDIO (HIGH STYLE & CHARM, STRICTLY PERMITTED) */}
              {activeTab === "growth" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.34) 0%, rgba(16, 185, 129, 0.14) 55%, rgba(15, 23, 42, 0.96) 100%)",
                    border: "1px solid rgba(168, 85, 247, 0.45)",
                    borderRadius: 14,
                    padding: "20px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 14,
                    boxShadow: "0 12px 36px rgba(124, 58, 237, 0.16)"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1.25rem" }}>🎮</span>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Permitted Gaming & Esports Growth Intelligence Studio</h2>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: "rgba(16,185,129,0.2)", color: "#34D399", border: "1px solid rgba(16,185,129,0.4)" }}>
                          ELIGIBILITY GATED · 2026 COMPLIANT
                        </span>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#DDD6FE" }}>
                        Exclusive to Recognized Esports & Non-Monetary Social Games • Consent-Gated S2S Lineage • Risk-Scored IVT Defense (Prohibited India Money Gaming Auto-Blocked)
                      </p>
                    </div>
                    <div style={{ background: "rgba(6, 9, 19, 0.72)", padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(168,85,247,0.3)", textAlign: "right" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>Permitted Campaign Mgmt Fee (15%)</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#34D399" }}>
                        ₹{Math.round(dailyBudget * 0.15).toLocaleString("en-IN")}/day
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500 }}> (₹{Math.round(dailyBudget * 30 * 0.15).toLocaleString("en-IN")}/mo)</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Budget Matrix & Funnel Economics */}
                  <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 12, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, marginBottom: 6 }}>DAILY CLIENT MEDIA ALLOCATION TARGET (SIMULATED PROJECTION)</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[5000, 10000, 25000, 50000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setDailyBudget(amt)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: dailyBudget === amt ? "1px solid #C084FC" : "1px solid #334155",
                                background: dailyBudget === amt ? "linear-gradient(135deg, #7c3aed, #9333ea)" : "#060913",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer"
                              }}
                            >
                              ₹{(amt / 1000)}k / Day
                            </button>
                          ))}
                        </div>
                      </div>

                      {mode === "SIMULATED" && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" disabled={busy} onClick={() => triggerSim("record_campaign_hit", { channelId: "CREATOR_COMMUNITIES", ipType: "RESIDENTIAL_MOBILE", stage: "VERIFIED_SETTLEMENT" })} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #10b981", background: "#059669", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                            + Simulate Consent Conversion
                          </button>
                          <button type="button" disabled={busy} onClick={() => triggerSim("record_campaign_hit", { channelId: "APPROVED_SOCIAL_REELS", ipType: "DATACENTER_PROXY", stage: "CLICK" })} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #f59e0b", background: "rgba(245,158,11,0.18)", color: "#FDE68A", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                            Simulate Proxy IVT Risk Signal
                          </button>
                          <button type="button" disabled={busy} onClick={() => triggerSim("test_prohibited_rmg_block", {})} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #f43f5e", background: "rgba(244,63,94,0.16)", color: "#FDA4AF", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                            Test Prohibited RMG Block (403)
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 10 }}>
                      <div style={{ background: "#060913", padding: 14, borderRadius: 10, border: "1px solid rgba(148,163,184,0.14)" }}>
                        <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>MONTHLY CLIENT SPEND</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>₹{(dailyBudget * 30).toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>Permitted Categories Only</div>
                      </div>
                      <div style={{ background: "#060913", padding: 14, borderRadius: 10, border: "1px solid rgba(56,189,248,0.22)" }}>
                        <div style={{ fontSize: "0.7rem", color: "#38BDF8" }}>CONSENT-VERIFIED CLICKS</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#38BDF8", marginTop: 4 }}>{primaryCampaign?.stats?.consentVerifiedClicks ?? 0}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>Pseudonymous S2S Lineage</div>
                      </div>
                      <div style={{ background: "#060913", padding: 14, borderRadius: 10, border: "1px solid rgba(245,158,11,0.25)" }}>
                        <div style={{ fontSize: "0.7rem", color: "#F59E0B" }}>FLAGGED IVT SIGNALS</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>{primaryCampaign?.stats?.flaggedIvtSignals ?? 0}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 3 }}>Score-based review (never blind ban)</div>
                      </div>
                      <div style={{ background: "#060913", padding: 14, borderRadius: 10, border: "1px solid rgba(16,185,129,0.28)" }}>
                        <div style={{ fontSize: "0.7rem", color: "#10B981" }}>SETTLED PASS REVENUE</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34D399", marginTop: 4 }}>₹{(primaryCampaign?.stats?.verifiedSettledRevenueInr ?? 0).toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: "0.7rem", color: "#34D399", marginTop: 3 }}>{primaryCampaign?.stats?.verifiedConversions ?? 0} Verified Conversions</div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Permitted Media Channels */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 }}>
                    {(primaryCampaign?.channels || [
                      { id: "OPEN_GAMING_PUBLISHERS", label: "Authorized Gaming & Utility Publishers", sharePercent: 40 },
                      { id: "CREATOR_COMMUNITIES", label: "Verified Esports & Creator Channels", sharePercent: 35 },
                      { id: "APPROVED_SOCIAL_REELS", label: "Platform-Approved Social & IVT Shielded", sharePercent: 25 }
                    ]).map((ch) => (
                      <div key={ch.id} style={{ background: "#0F172A", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#C084FC" }}>PERMITTED RAIL</span>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#34D399" }}>{ch.sharePercent}% (₹{Math.round((dailyBudget * ch.sharePercent) / 100).toLocaleString("en-IN")}/day)</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", marginTop: 6 }}>{ch.label}</div>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                          Policy-verified placement for statutory Esports & Social Games with explicit age/consent gate and zero cloaking.
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Attribution Lineage Log */}
                  <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 12, padding: 18 }}>
                    <h4 style={{ margin: "0 0 10px" }}>Pseudonymous Consent-Verified Event Lineage (Zero PII)</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                            <th style={{ padding: 8 }}>Click ID</th>
                            <th style={{ padding: 8 }}>Channel</th>
                            <th style={{ padding: 8 }}>Consent Ref</th>
                            <th style={{ padding: 8 }}>IVT Risk Score</th>
                            <th style={{ padding: 8 }}>Classification</th>
                            <th style={{ padding: 8 }}>Linked Intent / UTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attributionEvents.map((e) => (
                            <tr key={e.eventId} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                              <td style={{ padding: 8 }}><code>{e.clickId}</code></td>
                              <td style={{ padding: 8 }}>{e.channelId}</td>
                              <td style={{ padding: 8, color: "#7DD3FC" }}>{e.consentRef}</td>
                              <td style={{ padding: 8, fontWeight: 700, color: e.ivtRiskScore >= 60 ? "#FCD34D" : "#34D399" }}>{e.ivtRiskScore}/100</td>
                              <td style={{ padding: 8 }}>{e.classification} {e.appealAllowed ? "(Appealable)" : ""}</td>
                              <td style={{ padding: 8 }}>{e.verifiedSettlementRef || e.paymentIntentId || "Click Only"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: LEGAL ELIGIBILITY GATE, CONFIGURABLE TAX & 2% SHARED ENGINE */}
              {activeTab === "eligibility" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 18 }}>
                    <h3 style={{ margin: "0 0 6px" }}>Merchant Legal Eligibility Declarations (Fail-Closed Gate)</h3>
                    <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginBottom: 14 }}>
                      India Promotion & Regulation of Online Gaming Act, 2025 (Rules effective 1 May 2026): Prohibited ONLINE_MONEY_GAME & UNVERIFIED entities cannot activate campaigns or payment intents.
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                            <th style={{ padding: 10 }}>Merchant</th>
                            <th style={{ padding: 10 }}>Category</th>
                            <th style={{ padding: 10 }}>Stakes / Winnings</th>
                            <th style={{ padding: 10 }}>Statutory / Counsel Ref</th>
                            <th style={{ padding: 10 }}>Gate Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {declarations.map((d) => (
                            <tr key={d.merchantId} style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                              <td style={{ padding: 10, fontWeight: 600 }}>{d.legalName}</td>
                              <td style={{ padding: 10 }}><code>{d.category}</code></td>
                              <td style={{ padding: 10 }}>{d.involvesMoneyStakeOrWinnings ? "YES (Prohibited)" : "No"}</td>
                              <td style={{ padding: 10, fontSize: "0.75rem", color: "#94A3B8" }}>{d.esportsRegistrationRef || d.counselReference || "Blocked"}</td>
                              <td style={{ padding: 10, fontWeight: 800, color: d.decision === "ELIGIBLE" ? "#34D399" : "#FDA4AF" }}>{d.decision}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {taxConfig && (
                    <div style={{ background: "#0F172A", border: "1px solid rgba(56,189,248,0.28)", borderRadius: 12, padding: 18 }}>
                      <h3 style={{ margin: "0 0 8px" }}>Configurable Effective-Date Tax Framework</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, fontSize: "0.8rem" }}>
                        <div><strong>Effective Date:</strong> {taxConfig.effectiveFrom}</div>
                        <div><strong>Statutory Framework:</strong> {taxConfig.statutoryCodeLabel}</div>
                        <div><strong>GST / SAC:</strong> {taxConfig.gstRatePercent}% (SAC {taxConfig.sacCode})</div>
                        <div><strong>CA Sign-Off:</strong> <span style={{ color: taxConfig.caApproved ? "#34D399" : "#FCD34D" }}>{taxConfig.caApproved ? "CA Approved" : "Pending Merchant CA Confirmation"}</span></div>
                      </div>
                    </div>
                  )}

                  <CommercialRevenueDashboard />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showAuthModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,14,0.78)", zIndex: 70, display: "grid", placeItems: "center", padding: 16 }} onClick={() => setShowAuthModal(false)}>
          <form
            style={{ width: "min(460px, 100%)", background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: 20, display: "grid", gap: 12 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setAuthToken(tokenDraft.trim());
              setShowAuthModal(false);
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Live Operations API Authentication</h3>
            <input type="password" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="Bearer JWT or Founder key" style={{ padding: "8px 10px", background: "#060913", color: "#fff", border: "1px solid #334155", borderRadius: 8 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setShowAuthModal(false)} style={{ padding: "7px 14px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "1px solid #475569", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ padding: "7px 14px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Apply Token</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
