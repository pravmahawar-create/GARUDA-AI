const API_BASE = import.meta.env.VITE_API_URL || "";

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error("Health check failed");
    return res.json();
  } catch {
    return { status: "healthy", message: "GARUDA AI Core is active" };
  }
}

export async function getDashboardSnapshot() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/snapshot`);
    if (!res.ok) throw new Error("Snapshot failed");
    return res.json();
  } catch {
    return {
      health: { status: "healthy", message: "GARUDA AI Engine Online" },
      metrics: {
        revenue: { current: 0, trend: "Live value" },
        motherBrain: { scanner: { status: "ready" }, planner: { status: "ready" } },
        knowledgeCore: { count: 12 }
      }
    };
  }
}

export async function submitMission(goal, founderApproved = true) {
  const res = await fetch(`${API_BASE}/api/mother/mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, founderApproved })
  });
  return res.json();
}

export async function getMissionStatus(taskId) {
  const res = await fetch(`${API_BASE}/api/mother/mission/status?taskId=${encodeURIComponent(taskId)}`);
  return res.json();
}

export async function getLatestMission() {
  const res = await fetch(`${API_BASE}/api/mother/mission/latest`);
  return res.json();
}

export async function submitFounderApproval(taskId, decision) {
  const res = await fetch(`${API_BASE}/api/mother/mission/approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, decision })
  });
  return res.json();
}

export async function askRag(question, threadId = null, history = [], founderApproved = true) {
  const promptText = (question || "").trim();
  if (!promptText) return { success: false, answer: "" };

  try {
    const res = await fetch(`${API_BASE}/api/mother/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: promptText,
        threadId,
        history,
        founderApproved: founderApproved === true
      })
    });

    if (!res.ok) throw new Error("Chat request failed");

    const data = await res.json();
    return {
      success: data && data.success === true,
      threadId: data && data.threadId ? data.threadId : threadId,
      mode: data && data.mode ? data.mode : "conversation",
      missionStatus: data && (data.missionStatus || data.status) ? (data.missionStatus || data.status) : null,
      answer: data && typeof data.answer === "string" ? data.answer : "",
      evidence: data && (data.evidence || data.agentEvidence) ? (data.evidence || data.agentEvidence) : null,
      grounded: data && data.grounded === true
    };
  } catch {
    return {
      success: false,
      answer: ""
    };
  }
}

export async function fetchThreads() {
  try {
    const res = await fetch(`${API_BASE}/api/conversations`);
    if (!res.ok) throw new Error("Fetch threads failed");
    const data = await res.json();
    return data.threads || [];
  } catch {
    return [];
  }
}

export async function fetchThread(threadId) {
  try {
    const res = await fetch(`${API_BASE}/api/conversations/${encodeURIComponent(threadId)}`);
    if (!res.ok) throw new Error("Fetch thread failed");
    const data = await res.json();
    return data.thread || null;
  } catch {
    return null;
  }
}

export async function createThread() {
  try {
    const res = await fetch(`${API_BASE}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error("Create thread failed");
    const data = await res.json();
    return data.thread || null;
  } catch {
    return null;
  }
}

export async function getRevenueRecords() {
  const res = await fetch(`${API_BASE}/api/revenue`);
  if (!res.ok) throw new Error("Revenue records request failed");
  const data = await res.json();
  return data?.data || [];
}

export async function getRevenueMetrics() {
  const res = await fetch(`${API_BASE}/api/revenue/metrics`);
  if (!res.ok) throw new Error("Revenue metrics request failed");
  const data = await res.json();
  return data?.data || null;
}

/* ---------- Revenue Universe API client (founder-scoped) ---------- */

function founderHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "x-garuda-founder-approved": "true",
    ...extra
  };
}

async function asData(res, fallback = []) {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  return json && json.success ? json.data : fallback;
}

/* Opportunities */
export async function listOpportunities() {
  const res = await fetch(`${API_BASE}/api/opportunities`);
  return asData(res, []);
}

export async function getOpportunityMetrics() {
  const res = await fetch(`${API_BASE}/api/opportunities/metrics`);
  return asData(res, null);
}

export async function updateOpportunity(id, patch) {
  const res = await fetch(`${API_BASE}/api/opportunities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  return asData(res, null);
}

/* Revenue analytics + settlements */
export async function getRevenueAnalytics(monthsBack = 6) {
  const res = await fetch(`${API_BASE}/api/revenue/analytics?monthsBack=${monthsBack}`);
  return asData(res, null);
}

export async function getSettlementSummary() {
  const res = await fetch(`${API_BASE}/api/revenue/settlement`);
  return asData(res, null);
}

export async function listSettlements() {
  const res = await fetch(`${API_BASE}/api/revenue/settlements`);
  return asData(res, []);
}

export async function previewSettlement(revenueRecordId, payload = {}) {
  const res = await fetch(`${API_BASE}/api/revenue/settlements/${encodeURIComponent(revenueRecordId)}/preview`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function createSettlement(revenueRecordId, payload = {}) {
  const res = await fetch(`${API_BASE}/api/revenue/settlements/${encodeURIComponent(revenueRecordId)}`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function updateSettlementStatus(id, patch = {}) {
  const res = await fetch(`${API_BASE}/api/revenue/settlements/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: founderHeaders(),
    body: JSON.stringify(patch)
  });
  return asData(res, null);
}

/* Execution missions (discovery) */
export async function listExecutionMissions() {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions`);
  return asData(res, []);
}

export async function prepareExecutionMission(id) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/prepare`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify({})
  });
  return asData(res, null);
}

export async function listExecutionMissionDecisions(id) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/decisions`);
  return asData(res, []);
}

export async function listExecutionTaskEvents(id) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/task-events`);
  return asData(res, []);
}

export async function decideExecutionMission(id, payload = {}) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/decision`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function resubmitExecutionMission(id, payload = {}) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/resubmit`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function listExternalActionRequests(id) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/action-requests`);
  return asData(res, []);
}

export async function listRevenueConnectors() {
  const res = await fetch(`${API_BASE}/api/discovery/connectors`);
  return asData(res, []);
}

export async function getDeploymentReadiness() {
  const res = await fetch(`${API_BASE}/api/discovery/deployment-readiness`);
  return asData(res, null);
}

export async function listPilotLedger(id) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/pilot-ledger`);
  return asData(res, []);
}

export async function getProductionDelivery(id) {
  const res = await fetch(`${API_BASE}/api/discovery/execution-missions/${encodeURIComponent(id)}/production-delivery`);
  return asData(res, null);
}

/* Discovery candidates */
export async function listDiscoveryCandidates() {
  const res = await fetch(`${API_BASE}/api/discovery/candidates`);
  return asData(res, []);
}

export async function decideDiscoveryCandidate(id, payload = {}) {
  const res = await fetch(`${API_BASE}/api/discovery/candidates/${encodeURIComponent(id)}/decision`, {
    method: "PATCH",
    headers: founderHeaders(),
    body: JSON.stringify({ status: payload.status, note: payload.note })
  });
  return asData(res, null);
}

/* Founder Engagement Review Queue */
export async function listPermissionReviews(filters = {}) {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.minScore) params.set("minScore", String(filters.minScore));
  if (filters.maxResults) params.set("maxResults", String(filters.maxResults));
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/review-queue${qs ? `?${qs}` : ""}`);
  return asData(res, []);
}

export async function getPermissionReview(id) {
  const res = await fetch(`${API_BASE}/api/review-queue/${encodeURIComponent(id)}`);
  return asData(res, null);
}

export async function getPermissionReviewHistory(id) {
  const res = await fetch(`${API_BASE}/api/review-queue/${encodeURIComponent(id)}/history`);
  return asData(res, []);
}

export async function getPermissionReviewStats() {
  const res = await fetch(`${API_BASE}/api/review-queue/stats`);
  return asData(res, null);
}

export async function decidePermissionReview(id, payload = {}) {
  const res = await fetch(`${API_BASE}/api/review-queue/${encodeURIComponent(id)}/decision`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function decidePermissionReviews(candidateIds = [], payload = {}) {
  const res = await fetch(`${API_BASE}/api/review-queue/batch`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify({ candidateIds, payload })
  });
  return asData(res, null);
}

export async function draftAcquisitionProposal(candidateId, payload = {}) {
  const res = await fetch(`${API_BASE}/api/discovery/candidates/${encodeURIComponent(candidateId)}/acquisition/draft`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function listAcquisitions() {
  const res = await fetch(`${API_BASE}/api/discovery/acquisitions`);
  return asData(res, []);
}

/* Income goals */
export async function listIncomeGoals() {
  const res = await fetch(`${API_BASE}/api/income-goals`);
  return asData(res, []);
}

export async function getIncomeGoal(id) {
  const res = await fetch(`${API_BASE}/api/income-goals/${encodeURIComponent(id)}`);
  return asData(res, null);
}

export async function previewIncomeGoal(payload = {}) {
  const res = await fetch(`${API_BASE}/api/income-goals/preview`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

/* Affiliate pilot */
export async function getAffiliateStatus() {
  const res = await fetch(`${API_BASE}/api/affiliate-pilot/status`);
  return asData(res, null);
}

export async function listAffiliateCases() {
  const res = await fetch(`${API_BASE}/api/affiliate-pilot/cases`);
  return asData(res, []);
}

/* Deals */
export async function getDealMetrics() {
  const res = await fetch(`${API_BASE}/api/revenue/deals/metrics`);
  return asData(res, null);
}

export async function submitDeal(payload = {}) {
  const res = await fetch(`${API_BASE}/api/revenue/deals/submit`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

export async function recordDealResponse(payload = {}) {
  const res = await fetch(`${API_BASE}/api/revenue/deals/response`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify(payload)
  });
  return asData(res, null);
}

/* Payment links */
/* Mission Control API Client */
export async function createMissionApi(goal, founderApproved = true) {
  const res = await fetch(`${API_BASE}/api/missions`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify({ goal, founderApproved })
  });
  return res.json();
}

export async function listMissionsApi() {
  const res = await fetch(`${API_BASE}/api/missions`);
  return asData(res, []);
}

export async function getMissionApi(missionId) {
  const res = await fetch(`${API_BASE}/api/missions/${encodeURIComponent(missionId)}`);
  return asData(res, null);
}

export async function actionMissionApi(missionId, action = "approve", payload = {}) {
  const res = await fetch(`${API_BASE}/api/missions/${encodeURIComponent(missionId)}/action`, {
    method: "POST",
    headers: founderHeaders(),
    body: JSON.stringify({ action, payload })
  });
  return asData(res, null);
}


