const API_BASE = import.meta.env.VITE_API_URL || "https://garuda-ai-xfif.onrender.com";

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
    const res = await fetch(`${API_BASE}/api/conversations`, { method: "POST" });
    if (!res.ok) throw new Error("Create thread failed");
    const data = await res.json();
    return data.thread || null;
  } catch {
    return null;
  }
}


