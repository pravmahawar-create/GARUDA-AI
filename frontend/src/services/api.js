const API_BASE = "http://localhost:3000";

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function getDashboardSnapshot() {
  const res = await fetch(`${API_BASE}/api/dashboard/snapshot`);
  return res.json();
}

export async function askRag(question) {
  const res = await fetch(`${API_BASE}/api/rag/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  return res.json();
}

