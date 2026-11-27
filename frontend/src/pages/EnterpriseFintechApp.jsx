import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiGrid,
  FiCreditCard,
  FiCheckSquare,
  FiUsers,
  FiFileText,
  FiDroplet,
  FiTrendingUp,
  FiClipboard,
  FiShield,
  FiLink,
  FiArchive,
  FiMenu,
  FiKey,
  FiRefreshCw,
  FiExternalLink,
  FiX
} from "react-icons/fi";
import "../styles/enterprise-fintech.css";
import { createFintechApiClient, getOrCreateSimSessionId } from "../services/fintechApiClient";
import { DetailDrawer } from "../components/fintech/FintechUiPrimitives";
import { ExecutiveOverviewView, PaymentOperationsView, SettlementAndReconciliationView } from "../components/fintech/OverviewAndPaymentsViews";
import { MerchantManagementView, CommercialAgreementsView, PrepaidFuelTankView, PostpaidReceivablesView, InvoicesAndTrackingView } from "../components/fintech/CommercialViews";
import { RiskComplianceView, IntegrationsReadinessView, ReportsAndAuditView } from "../components/fintech/RiskIntegrationsAuditViews";
import FintechMerchantPortal from "./FintechMerchantPortal";

const NAV_GROUPS = [
  {
    label: "Treasury & Payments",
    items: [
      { id: "overview", label: "Executive Overview", icon: FiGrid },
      { id: "payments", label: "Payment Operations", icon: FiCreditCard },
      { id: "settlements", label: "Settlement & Recon", icon: FiCheckSquare },
      { id: "merchants", label: "Merchant Management", icon: FiUsers }
    ]
  },
  {
    label: "Commercial Engine (2%)",
    items: [
      { id: "agreements", label: "Commercial Agreements", icon: FiFileText },
      { id: "fuel_tank", label: "Prepaid Fuel Tank", icon: FiDroplet },
      { id: "receivables", label: "Postpaid Receivables", icon: FiTrendingUp },
      { id: "invoices", label: "Invoices & Tracking", icon: FiClipboard }
    ]
  },
  {
    label: "Governance & Rails",
    items: [
      { id: "risk", label: "Risk & Compliance", icon: FiShield },
      { id: "integrations", label: "Bank & CRM Integrations", icon: FiLink },
      { id: "audit", label: "Reports & Audit History", icon: FiArchive }
    ]
  }
];

export default function EnterpriseFintechApp() {
  const [activeModule, setActiveModule] = useState("overview");
  const [mode, setMode] = useState("SIMULATED"); // "SIMULATED" | "LIVE"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLegacyTerminal, setShowLegacyTerminal] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("view") === "terminal" || p.get("view") === "classic" || p.get("terminal") === "true";
    }
    return false;
  });

  // Live mode authentication token kept strictly in React state (optional session cookie also sent automatically)
  const [authToken, setAuthToken] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");

  const [simSessionId] = useState(() => getOrCreateSimSessionId());
  const api = useMemo(() => createFintechApiClient({ authToken, simSessionId }), [authToken, simSessionId]);

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyAction, setBusyAction] = useState(false);
  const [toast, setToast] = useState(null);
  const [journeyResult, setJourneyResult] = useState(null);
  const [drawerData, setDrawerData] = useState({ open: false, title: "", data: null });

  const switchMode = useCallback((nextMode) => {
    setMode(nextMode);
    setError(null);
    setToast(null);
    setDrawerData({ open: false, title: "", data: null });
    if (nextMode === "LIVE") setJourneyResult(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setDrawerData({ open: false, title: "", data: null });
        setShowAuthModal(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const showNotice = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (mode === "SIMULATED") {
      const res = await api.getSimulationState();
      if (!res.ok) {
        setError(res.error);
        setSnapshot(null);
      } else {
        setSnapshot(res.data);
      }
      setLoading(false);
      return;
    }

    // LIVE mode: strictly query real tenant endpoints (never silently substitute simulated data)
    const ovRes = await api.getLiveOverview();
    if (!ovRes.ok) {
      setError(`${ovRes.errorCode || ovRes.status}: ${ovRes.error}`);
      setSnapshot(null);
      setLoading(false);
      return;
    }

    const [mRes, pRes, aRes, fRes, rRes, sRes, iRes, dRes, riskRes, intRes, audRes] = await Promise.all([
      api.listLiveMerchants({ limit: 100 }),
      api.listLivePayments({ limit: 100 }),
      api.listLiveAgreements({ limit: 100 }),
      api.listLiveFuelTanks({}),
      api.listLiveReceivables({ limit: 100 }),
      api.listLiveStatements({ limit: 100 }),
      api.listLiveInvoices({ limit: 100 }),
      api.listLiveDisputes(),
      api.getLiveRiskOverview(),
      api.listLiveIntegrations(),
      api.listLiveAudit({ limit: 100 })
    ]);

    setSnapshot({
      environmentMode: "LIVE_TENANT_WORKSPACE",
      isSimulated: false,
      tenantId: ovRes.data.tenantId,
      zeroCustodyPrincipalHeld: ovRes.data.zeroCustodyPrincipalHeld ?? 0,
      overview: ovRes.data,
      dashboards: ovRes.data.dashboards,
      merchants: mRes.ok ? mRes.data.items : [],
      intents: pRes.ok ? pRes.data.items : [],
      agreements: aRes.ok ? aRes.data.items : [],
      fuelTanks: fRes.ok ? fRes.data.tanks : [],
      receivables: rRes.ok ? rRes.data.items : [],
      invoices: iRes.ok ? iRes.data.items : [],
      statements: sRes.ok ? sRes.data.items : [],
      disputes: dRes.ok ? dRes.data.freezeEvents : [],
      adjustments: dRes.ok ? dRes.data.adjustments : [],
      integrations: intRes.ok ? intRes.data.connectors : [],
      risk: riskRes.ok ? riskRes.data : {},
      audit: {
        chainIntegrityValid: audRes.ok ? audRes.data.chainIntegrityValid : true,
        entries: audRes.ok ? audRes.data.items : []
      }
    });
    setLoading(false);
  }, [mode, api]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleRunSimAction = async (action, payload = {}) => {
    setBusyAction(true);
    const res = action === "reset"
      ? await api.resetSimulationState()
      : await api.runSimulationAction(action, payload);
    setBusyAction(false);
    if (!res.ok) {
      showNotice("error", res.error);
      return;
    }
    if (action === "reset") {
      setSnapshot(res.data);
      setJourneyResult(null);
      showNotice("info", "Isolated SIMULATED workspace reset to clean baseline.");
    } else {
      setSnapshot(res.data.workspace);
      if (action === "full_customer_journey" && res.data.outcome?.journeySteps) {
        setJourneyResult(res.data.outcome);
      }
      showNotice("success", res.data.outcome?.message || "Simulation scenario completed.");
    }
  };

  const wrapLiveAction = async (promise, successMessage) => {
    setBusyAction(true);
    const res = await promise;
    setBusyAction(false);
    if (!res.ok) {
      showNotice("error", `${res.errorCode}: ${res.error}`);
      return false;
    }
    showNotice("success", successMessage);
    await loadWorkspace();
    return true;
  };

  const inspectRow = (title, row) => {
    setDrawerData({ open: true, title, data: row });
  };

  if (showLegacyTerminal) {
    return (
      <div>
        <div style={{ background: "#0f172a", borderBottom: "1px solid #334155", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#e2e8f0", fontSize: "0.84rem", fontWeight: 600 }}>Classic Merchant Terminal View (Dalip Bhai Demo Preserved)</span>
          <button type="button" onClick={() => setShowLegacyTerminal(false)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Return to Enterprise Treasury OS
          </button>
        </div>
        <FintechMerchantPortal />
      </div>
    );
  }

  const navCounts = {
    merchants: snapshot?.merchants?.length || 0,
    payments: snapshot?.intents?.length || 0,
    agreements: snapshot?.agreements?.length || 0,
    invoices: snapshot?.invoices?.length || 0
  };

  return (
    <div className="ef-shell">
      {/* Explicit Operational Mode Indicator */}
      <div className={`ef-mode-ribbon ${mode === "SIMULATED" ? "ef-mode-ribbon--sim" : "ef-mode-ribbon--live"}`}>
        <div>
          {mode === "SIMULATED"
            ? "MODE: ISOLATED SIMULATED SANDBOX — All merchants, payments, UTRs, invoices & receipts carry explicit SIMULATED identifiers."
            : `MODE: AUTHENTICATED LIVE WORKSPACE — Tenant: ${snapshot?.tenantId || "Unauthenticated (Sign in or supply session token)"} · Zero-Custody Lock Active.`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="ef-btn ef-btn--sm"
            onClick={() => setShowLegacyTerminal(true)}
            style={{ background: "#0284c7", color: "#fff", fontWeight: 700 }}
          >
            ⚡ Live Operating Terminal (QR & 1930 Cyber)
          </button>
          <button
            type="button"
            className={`ef-btn ef-btn--sm ${mode === "SIMULATED" ? "ef-btn--amber" : ""}`}
            onClick={() => switchMode("SIMULATED")}
          >
            Simulated Sandbox
          </button>
          <button
            type="button"
            className={`ef-btn ef-btn--sm ${mode === "LIVE" ? "ef-btn--primary" : ""}`}
            onClick={() => switchMode("LIVE")}
          >
            Live Tenant API
          </button>
        </div>
      </div>

      <div className="ef-workspace">
        {mobileMenuOpen && (
          <div className="ef-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}
        {/* Sidebar Navigation */}
        <aside className={`ef-sidebar ${mobileMenuOpen ? "ef-sidebar--open" : ""}`}>
          <div className="ef-brand-block" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div className="ef-brand-title">
                <FiShield color="#10b981" /> Treasury & Revenue OS
              </div>
              <div className="ef-brand-sub">Zero-Custody Orchestration · Powered by GARUDA</div>
            </div>
            <button
              type="button"
              className="ef-mobile-close"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiX size={15} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="ef-nav-group-label">{group.label}</div>
                <div className="ef-nav-list">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`ef-nav-btn ${active ? "ef-nav-btn--active" : ""}`}
                        onClick={() => {
                          setActiveModule(item.id);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <span className="ef-nav-btn-left">
                          <Icon size={15} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                        </span>
                        {navCounts[item.id] !== undefined && (
                          <span className="ef-nav-count ef-num">{navCounts[item.id]}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--ef-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" className="ef-btn ef-btn--sm" onClick={() => setShowLegacyTerminal(true)}>
              <FiExternalLink /> Classic Merchant View
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="ef-main">
          <header className="ef-topbar">
            <div className="ef-topbar-left">
              <button
                type="button"
                className="ef-mobile-menu-btn"
                aria-label="Toggle navigation menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <FiMenu />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                  {NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeModule)?.label || "Executive Overview"}
                </h1>
                <div style={{ fontSize: "0.73rem", color: "var(--ef-text-muted)" }}>
                  200 bps Default Software License Basis · Bank Integrations: NOT CONNECTED / AWAITING CUSTOMER ACCESS
                </div>
              </div>
            </div>

            <div className="ef-topbar-right">
              {mode === "LIVE" && (
                <button type="button" className="ef-btn ef-btn--sm" onClick={() => { setTokenDraft(authToken); setShowAuthModal(true); }}>
                  <FiKey /> {authToken ? "API Credentials Loaded" : "Set Live Session Token"}
                </button>
              )}
              <button type="button" className="ef-btn ef-btn--sm" onClick={loadWorkspace} disabled={loading}>
                <FiRefreshCw /> {loading ? "Syncing..." : "Refresh"}
              </button>
            </div>
          </header>

          <main className="ef-content">
            {toast && (
              <div className={`ef-alert-box ef-alert-box--${toast.type}`}>
                <span>{toast.text}</span>
                <button type="button" className="ef-btn ef-btn--sm" onClick={() => setToast(null)}>Dismiss</button>
              </div>
            )}

            {mode === "LIVE" && error && error.includes("401") && (
              <div className="ef-alert-box ef-alert-box--warning">
                <div>
                  <strong>Live Workspace Requires Authentication (HTTP 401):</strong> Live routes fail closed for unauthenticated visitors. Sign in with an authenticated session, provide an operator JWT / Founder key above, or switch to the <strong>Simulated Sandbox</strong> mode to explore the full product demo safely.
                </div>
                <button type="button" className="ef-btn ef-btn--amber ef-btn--sm" onClick={() => switchMode("SIMULATED")}>
                  Switch to SIMULATED
                </button>
              </div>
            )}

            {activeModule === "overview" && (
              <ExecutiveOverviewView
                mode={mode}
                snapshot={snapshot}
                journeyResult={journeyResult}
                loading={loading}
                error={error}
                onNavigate={setActiveModule}
                onRunSimAction={handleRunSimAction}
                busyAction={busyAction}
              />
            )}

            {activeModule === "payments" && (
              <PaymentOperationsView
                mode={mode}
                intents={snapshot?.intents || []}
                merchants={snapshot?.merchants || []}
                loading={loading}
                error={error}
                onCreatePayment={(p) => wrapLiveAction(api.createLivePayment(p), "Payment intent created cleanly.")}
                onRunSimAction={handleRunSimAction}
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "settlements" && (
              <SettlementAndReconciliationView
                mode={mode}
                intents={snapshot?.intents || []}
                webhookMetrics={snapshot?.overview?.webhookMetrics || {}}
                loading={loading}
                error={error}
                onRunSimAction={handleRunSimAction}
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "merchants" && (
              <MerchantManagementView
                mode={mode}
                merchants={snapshot?.merchants || []}
                loading={loading}
                error={error}
                onRegisterMerchant={(payload) =>
                  mode === "SIMULATED"
                    ? handleRunSimAction("onboard_merchant", payload)
                    : wrapLiveAction(api.registerLiveMerchant(payload), "Merchant registered cleanly.")
                }
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "agreements" && (
              <CommercialAgreementsView
                mode={mode}
                agreements={snapshot?.agreements || []}
                merchants={snapshot?.merchants || []}
                loading={loading}
                error={error}
                onCreateAgreement={(payload) =>
                  mode === "SIMULATED"
                    ? handleRunSimAction("create_agreement", payload)
                    : wrapLiveAction(api.createLiveAgreement(payload), "Agreement draft created at 200 bps.")
                }
                onApproveAgreement={(contractId) =>
                  mode === "SIMULATED"
                    ? handleRunSimAction("approve_agreement", { contractId })
                    : wrapLiveAction(api.approveLiveAgreement(contractId, { signedRef: `MSA-${Date.now()}` }), "Agreement founder-approved & activated.")
                }
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "fuel_tank" && (
              <PrepaidFuelTankView
                mode={mode}
                tanks={snapshot?.fuelTanks || []}
                loading={loading}
                error={error}
                onTopUp={(payload) =>
                  mode === "SIMULATED"
                    ? handleRunSimAction("topup_fuel_tank", payload)
                    : wrapLiveAction(api.topUpLiveFuelTank(payload), "Fuel tank credited against verified bank receipt.")
                }
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "receivables" && (
              <PostpaidReceivablesView
                mode={mode}
                receivables={snapshot?.receivables || []}
                statements={snapshot?.statements || []}
                loading={loading}
                error={error}
                onGenerateStatement={(payload) =>
                  mode === "SIMULATED"
                    ? handleRunSimAction("generate_postpaid_invoice", payload)
                    : wrapLiveAction(
                        api.generateLiveDailyStatement({
                          merchantId: snapshot?.merchants?.[0]?.merchantId,
                          dateKey: new Date().toISOString().slice(0, 10)
                        }),
                        "Daily signed statement generated."
                      )
                }
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "invoices" && (
              <InvoicesAndTrackingView
                mode={mode}
                invoices={snapshot?.invoices || []}
                loading={loading}
                error={error}
                onVerifyInvoicePayment={(payload) =>
                  mode === "SIMULATED"
                    ? handleRunSimAction("settle_invoice_payment", payload)
                    : wrapLiveAction(api.verifyLiveInvoicePayment(payload.invoiceId, payload), "Invoice payment verified via server bank receipt.")
                }
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "risk" && (
              <RiskComplianceView
                mode={mode}
                riskData={mode === "SIMULATED" ? { metrics: snapshot?.overview?.webhookMetrics, alerts: [] } : (snapshot?.risk || {})}
                disputes={snapshot?.disputes || []}
                adjustments={snapshot?.adjustments || []}
                merchants={snapshot?.merchants || []}
                loading={loading}
                error={error}
                onAckAlert={(id) => wrapLiveAction(api.acknowledgeLiveAlert(id), "Alert acknowledged.")}
                onRecordFreeze={(p) => handleRunSimAction("record_merchant_freeze", p)}
                onInspectRow={inspectRow}
                busyAction={busyAction}
              />
            )}

            {activeModule === "integrations" && (
              <IntegrationsReadinessView
                mode={mode}
                connectors={snapshot?.integrations || []}
                loading={loading}
                error={error}
                onStageConfig={(providerId, payload) => wrapLiveAction(api.stageIntegrationConfig(providerId, payload), "Non-live configuration metadata staged securely (masked).")}
                onAttemptActivate={(providerId) => wrapLiveAction(api.attemptActivateIntegration(providerId), "Activation check complete.")}
                busyAction={busyAction}
              />
            )}

            {activeModule === "audit" && (
              <ReportsAndAuditView
                mode={mode}
                auditEntries={snapshot?.audit?.entries || []}
                chainIntegrityValid={snapshot?.audit?.chainIntegrityValid !== false}
                snapshot={snapshot}
                loading={loading}
                error={error}
                onInspectRow={inspectRow}
              />
            )}
          </main>
        </div>
      </div>

      {/* Record Inspection Drawer */}
      <DetailDrawer
        open={drawerData.open}
        title={drawerData.title}
        simulated={mode === "SIMULATED" || Boolean(drawerData.data?.isSimulated)}
        subtitle={`Environment: ${mode} · Click outside to dismiss`}
        data={drawerData.data}
        onClose={() => setDrawerData({ open: false, title: "", data: null })}
      />

      {/* Live API Token Modal */}
      {showAuthModal && (
        <div className="ef-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <form
            className="ef-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setAuthToken(tokenDraft.trim());
              setShowAuthModal(false);
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Connect Authenticated Live Session</h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ef-text-muted)", lineHeight: 1.5 }}>
              Paste a verified JWT Bearer token or authorized Founder Admin Key to query real tenant endpoints (`/api/fintech/*`). Stored strictly in React memory for this tab (never persisted to localStorage).
            </p>
            <input
              type="password"
              autoComplete="off"
              className="ef-input"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="Bearer JWT or Founder key (leave empty to rely on browser cookie)"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ef-btn" onClick={() => { setAuthToken(""); setTokenDraft(""); setShowAuthModal(false); }}>Clear</button>
              <button type="submit" className="ef-btn ef-btn--primary">Apply Session Token</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
