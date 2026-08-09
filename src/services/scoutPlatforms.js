const SCOUT_PLATFORMS = [
  {
    id: "upwork",
    name: "Upwork",
    url: "https://www.upwork.com",
    searchUrl: "https://www.upwork.com/nx/search/jobs/",
    access: "manual_paste",
    automationNote: "No public free jobs API. Use manual paste or CSV intake; never scrape Upwork (ToS prohibited).",
    legalNote: "Automated scraping violates Upwork ToS. Manual + official profile only."
  },
  {
    id: "fiverr",
    name: "Fiverr",
    url: "https://www.fiverr.com",
    searchUrl: "https://www.fiverr.com/search/gigs",
    access: "manual_paste",
    automationNote: "Buyer requests require a seller account. Record requests manually via intake.",
    legalNote: "Only use your own Fiverr account. No automated bid tools."
  },
  {
    id: "contra",
    name: "Contra",
    url: "https://contra.com",
    searchUrl: "https://contra.com/search",
    access: "manual_paste",
    automationNote: "No official public jobs API. Use manual intake or CSV import.",
    legalNote: "Follow Contra terms; do not scrape the site."
  },
  {
    id: "freelancer",
    name: "Freelancer.com",
    url: "https://www.freelancer.com",
    searchUrl: "https://www.freelancer.com/search/projects",
    access: "manual_paste",
    automationNote: "OAuth API exists but requires app approval and credentials. Manual/CSV intake for v1.",
    legalNote: "No scraping. API use requires authorization."
  },
  {
    id: "peopleperhour",
    name: "PeoplePerHour",
    url: "https://www.peopleperhour.com",
    searchUrl: "https://www.peopleperhour.com/freelance-jobs",
    access: "manual_paste",
    automationNote: "Website access only. Manual/CSV intake for v1.",
    legalNote: "No scraping. Follow marketplace ToS."
  },
  {
    id: "remotive",
    name: "Remotive (public API)",
    url: "https://remotive.com",
    searchUrl: "https://remotive.com/remote-jobs",
    access: "live_api",
    automationNote: "Public, documented JSON endpoint - safe automated scanning.",
    legalNote: "Public API; polite polling with rate limits."
  }
];

async function fetchRemotiveJobsLive(limit = 50) {
  const url = `https://remotive.com/api/remote-jobs?limit=${limit}`;
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "GARUDA-Revenue-Scout/1.0" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Remotive returned HTTP ${response.status}`);
  const body = await response.json();
  return Array.isArray(body.jobs) ? body.jobs : [];
}

function normalizeListedItem(raw = {}) {
  const source =
    typeof raw === "object"
      ? raw.source || raw.sourceKind || "manual"
      : "manual";

  const title = String(
    (raw && (raw.title || raw.gig_title)) || ""
  ).trim();

  return {
    platform: String((raw && raw.platform) || "manual").trim(),
    title,
    client: String((raw && (raw.client || raw.company)) || "").trim(),
    url: String((raw && raw.url) || "").trim(),
    budgetText: String((raw && (raw.budget || raw.budgetText || raw.salary)) || "").trim(),
    deadlineText: String((raw && (raw.deadline || raw.deadlineText || raw.timeline)) || "").trim(),
    categoryId: String((raw && raw.categoryId) || "").trim(),
    notes: String((raw && (raw.notes || raw.description)) || "").trim(),
    source
  };
}

async function scan({ platformId = "remotive", mode = "live_api", items = [] } = {}) {
  const platform = SCOUT_PLATFORMS.find((p) => p.id === platformId) || null;
  if (!platform) {
    throw Object.assign(new Error("Unknown platform id"), { statusCode: 400 });
  }

  if (platform.access !== "live_api" && mode === "live_api") {
    return {
      platform: platformId,
      mode,
      requestedLiveScan: true,
      allowed: false,
      reason: platform.automationNote,
      candidates: []
    };
  }

  let candidates = [];
  let fetchError = null;

  if (platform.id === "remotive" && mode === "live_api") {
    try {
      const jobs = await fetchRemotiveJobsLive(Number(items) || 50);
      candidates = jobs.map((job) =>
        normalizeListedItem({
          platform: "remotive",
          source: "remotive_public_api",
          title: job.title,
          client: job.company_name,
          url: job.url,
          budgetText: job.salary,
          deadlineText: "flexible",
          notes: job.job_type || ""
        })
      );
    } catch (error) {
      fetchError = error.message;
    }
  } else {
    const rows = Array.isArray(items)
      ? items
      : typeof items === "string"
        ? String(items)
            .split(/\r?\n/)
            .map((line) => ({ title: line }))
        : [];
    candidates = rows.map(normalizeListedItem).filter((item) => item.title);
  }

  return {
    platform: platformId,
    mode,
    allowed: true,
    fetchError,
    foundCount: candidates.length,
    candidates
  };
}

module.exports = {
  SCOUT_PLATFORMS,
  fetchRemotiveJobsLive,
  normalizeListedItem,
  scan
};