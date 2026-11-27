/**
 * GARUDA Fintech Enterprise API Client (Phase 8)
 *
 * Truthful Connection Rules:
 * - LIVE mode calls strictly authenticated `/api/fintech/*` routes with `credentials: "same-origin"`
 *   plus optional bearer/founder token explicitly entered by the operator in memory.
 * - Never fabricates HTTP 200 success responses on 401/403/404/5xx or network error.
 * - SIMULATED mode talks exclusively to isolated `/api/fintech/simulation/*` endpoints.
 */

const SIM_SESSION_STORAGE_KEY = "garuda_fintech_sim_session_id";

export function getOrCreateSimSessionId() {
  try {
    let existing = window.sessionStorage.getItem(SIM_SESSION_STORAGE_KEY);
    if (!existing) {
      existing = `sim_ui_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      window.sessionStorage.setItem(SIM_SESSION_STORAGE_KEY, existing);
    }
    return existing;
  } catch {
    return "sim_ui_default";
  }
}

async function rawRequest(url, { method = "GET", body = null, authToken = "", simSessionId = "" } = {}) {
  const headers = {
    Accept: "application/json"
  };
  if (body !== null && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (simSessionId) {
    headers["x-sim-session-id"] = simSessionId;
  }
  if (authToken) {
    const trimmed = authToken.trim();
    if (trimmed.includes(".")) {
      headers.Authorization = `Bearer ${trimmed}`;
    } else {
      headers["x-founder-key"] = trimmed;
    }
  }

  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers,
      body: body !== null && body !== undefined ? JSON.stringify(body) : undefined
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        errorCode: json?.errorCode || json?.error || `HTTP_${res.status}`,
        error: json?.message || json?.error || `Request failed with HTTP ${res.status}`,
        data: json?.data || null
      };
    }
    return {
      ok: true,
      status: res.status,
      data: json?.data !== undefined ? json.data : json
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      errorCode: "NETWORK_UNAVAILABLE",
      error: err?.message || "Backend endpoint unreachable"
    };
  }
}

export function createFintechApiClient({ authToken = "", simSessionId = getOrCreateSimSessionId() } = {}) {
  return {
    // Public Diagnostics (Truthful)
    getProvidersHealth: () => rawRequest("/api/fintech/providers/health"),
    estimateFees: (amount, currency = "INR", rail = "RTGS") =>
      rawRequest(`/api/fintech/fees/estimate?amount=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}&rail=${encodeURIComponent(rail)}`),

    // Isolated SIMULATED Sandbox Endpoints
    getSimulationState: () => rawRequest("/api/fintech/simulation/state", { simSessionId }),
    resetSimulationState: () => rawRequest("/api/fintech/simulation/reset", { method: "POST", simSessionId }),
    runSimulationAction: (action, payload = {}) =>
      rawRequest(`/api/fintech/simulation/actions/${encodeURIComponent(action)}`, {
        method: "POST",
        body: payload,
        simSessionId
      }),

    // Live Tenant Endpoints (Strictly Authenticated — returns real 401/403 if unauthenticated)
    getLiveOverview: () => rawRequest("/api/fintech/overview", { authToken }),
    listLiveMerchants: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/merchants${q ? `?${q}` : ""}`, { authToken });
    },
    registerLiveMerchant: (payload) => rawRequest("/api/fintech/merchants", { method: "POST", body: payload, authToken }),
    listLivePayments: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/payments${q ? `?${q}` : ""}`, { authToken });
    },
    createLivePayment: (payload) => rawRequest("/api/fintech/payments/create", { method: "POST", body: payload, authToken }),
    listLiveSettlements: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/settlements${q ? `?${q}` : ""}`, { authToken });
    },
    listLiveAgreements: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/agreements${q ? `?${q}` : ""}`, { authToken });
    },
    createLiveAgreement: (payload) => rawRequest("/api/fintech/agreements", { method: "POST", body: payload, authToken }),
    approveLiveAgreement: (contractId, payload = {}) =>
      rawRequest(`/api/fintech/agreements/${encodeURIComponent(contractId)}/approve`, { method: "POST", body: payload, authToken }),
    updateLiveAgreementRate: (contractId, payload) =>
      rawRequest(`/api/fintech/agreements/${encodeURIComponent(contractId)}/rate`, { method: "POST", body: payload, authToken }),
    listLiveFuelTanks: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/fuel-tank${q ? `?${q}` : ""}`, { authToken });
    },
    topUpLiveFuelTank: (payload) => rawRequest("/api/fintech/fuel-tank/topup", { method: "POST", body: payload, authToken }),
    listLiveReceivables: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/commissions/receivables${q ? `?${q}` : ""}`, { authToken });
    },
    listLiveStatements: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/commissions/statements${q ? `?${q}` : ""}`, { authToken });
    },
    generateLiveDailyStatement: (payload) => rawRequest("/api/fintech/commissions/daily-statement", { method: "POST", body: payload, authToken }),
    listLiveInvoices: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/commissions/invoices${q ? `?${q}` : ""}`, { authToken });
    },
    generateLiveInvoice: (payload) => rawRequest("/api/fintech/commissions/invoices", { method: "POST", body: payload, authToken }),
    verifyLiveInvoicePayment: (invoiceId, payload) =>
      rawRequest(`/api/fintech/commissions/invoices/${encodeURIComponent(invoiceId)}/verify-payment`, { method: "POST", body: payload, authToken }),
    listLiveDisputes: () => rawRequest("/api/fintech/commissions/disputes", { authToken }),
    recordLiveFreezeEvent: (payload) => rawRequest("/api/fintech/commissions/freeze-events", { method: "POST", body: payload, authToken }),
    getLiveRiskOverview: () => rawRequest("/api/fintech/risk", { authToken }),
    acknowledgeLiveAlert: (alertId) => rawRequest(`/api/fintech/treasury/alerts/${encodeURIComponent(alertId)}/ack`, { method: "POST", authToken }),
    listLiveAudit: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return rawRequest(`/api/fintech/audit${q ? `?${q}` : ""}`, { authToken });
    },
    exportLiveEvidence: (merchantId) => rawRequest(`/api/fintech/commissions/evidence/${encodeURIComponent(merchantId)}`, { authToken }),
    listLiveIntegrations: () => rawRequest("/api/fintech/integrations", { authToken }),
    stageIntegrationConfig: (providerId, payload) =>
      rawRequest(`/api/fintech/integrations/${encodeURIComponent(providerId)}/stage`, { method: "POST", body: payload, authToken }),
    attemptActivateIntegration: (providerId) =>
      rawRequest(`/api/fintech/integrations/${encodeURIComponent(providerId)}/activate`, { method: "POST", body: {}, authToken })
  };
}
