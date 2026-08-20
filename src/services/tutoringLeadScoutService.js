// GARUDA TUTORING LEAD SCOUT SERVICE
//
// Real background web-research for the founder's sister tutoring business.
// Finds tutoring centres (USA + UAE) via web search, fetches their sites,
// extracts contact emails, and writes scored prospects into the `tutoring`
// domain pipeline (data/tutoring-prospects.json) using the generic lead-gen
// engine. Progress is written to a status file so the founder can verify with
// /pipeline instead of trusting a chat claim.
//
// IMPORTANT: This runs as a fire-and-forget background job. The Telegram
// webhook must reply fast, so startTutoringScan() returns immediately and the
// scan continues on the long-running server (Render). Every number the bot
// reports comes from the status file — never from a hallucinated status.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { addProspects, getPipeline } = require("./leadgen/genericLeadGenEngine");

const DEFAULT_STATUS_PATH = path.join(__dirname, "..", "..", "data", "tutoring-scan-status.json");
const DEFAULT_MAX_SITES = 20;
const DEFAULT_DELAY_MS = 800;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const LOCATIONS = {
  usa: {
    cities: [
      "New York", "Edison NJ", "Jersey City NJ", "Chicago", "Houston", "Dallas",
      "Frisco TX", "Irving TX", "Atlanta", "Seattle", "Bellevue WA", "Fremont CA",
      "San Jose CA", "San Diego", "Phoenix", "Charlotte", "Orlando", "Tampa"
    ],
    country: "US"
  },
  dubai: {
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain"],
    country: "AE"
  }
};

function statusPath() {
  return process.env.TUTORING_SCAN_STATUS_PATH || DEFAULT_STATUS_PATH;
}

function loadStatus() {
  try {
    if (fs.existsSync(statusPath())) {
      return JSON.parse(fs.readFileSync(statusPath(), "utf8"));
    }
  } catch {}
  return null;
}

function saveStatus(status) {
  try {
    fs.mkdirSync(path.dirname(statusPath()), { recursive: true });
    fs.writeFileSync(statusPath(), JSON.stringify(status, null, 2), "utf8");
  } catch {}
}

function buildQueries(locKey) {
  const suffix = locKey === "usa" ? "USA" : "UAE Dubai";
  const pairs = [
    ["tutoring center", "contact email"],
    ["tutoring academy", "contact"],
    ["after school tutoring", "email"],
    ["learning center", "contact email"],
    ["tuition centre", "contact"],
    ["math tutoring center", "contact"],
    ["private tutoring center", "email"],
    ["test prep academy", "contact"]
  ];
  return pairs.map(([a, b]) => `${a} in ${suffix} ${b}`);
}

function extractEmails(html) {
  const found = new Set();
  const mailto = String(html || "").match(/mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})/gi) || [];
  for (const m of mailto) found.add(m.replace(/^mailto:/i, "").toLowerCase().trim());
  const text = String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const re = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
  const raw = text.match(re) || [];
  const placeholderDomains = new Set([
    "example.com", "example.org", "example.net", "domain.com", "yourdomain.com",
    "yourdomain.org", "test.com", "sample.com", "email.com", "sentry.io",
    "schema.org", "wixpress.com", "godaddy.com", "webmail.com", "mailinator.com",
    "yopmail.com", "getresponse.com", "sentry"
  ]);
  for (const e of raw) {
    const clean = e.toLowerCase().trim();
    if (/\.(png|jpe?g|gif|webp|svg|css|js|ico)$/.test(clean)) continue;
    const at = clean.indexOf("@");
    if (at < 0) continue;
    const domain = clean.slice(at + 1).replace(/^www\./, "");
    if (placeholderDomains.has(domain)) continue;
    found.add(clean);
  }
  return Array.from(found);
}

function findContactUrl(html, baseUrl) {
  const links = String(html || "").match(/href="([^"]+)"/gi) || [];
  const base = safeBase(baseUrl);
  for (const raw of links) {
    let href = raw.replace(/^href="/i, "").replace(/"$/, "").trim();
    const lower = href.toLowerCase();
    if (/(contact|about|reach|enquiry|inquiry|connect)/.test(lower)) {
      try {
        return new URL(href, base).href;
      } catch {}
    }
  }
  return null;
}

function safeBase(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "https://garudaos.in";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" }
    });
    if (!res.ok) return { ok: false, status: res.status };
    const contentType = String(res.headers.get("content-type") || "");
    if (!/html/.test(contentType)) return { ok: false, status: res.status, reason: "not_html" };
    return { ok: true, html: await res.text() };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function searchWeb(query) {
  const googleKey = process.env.GOOGLE_CSE_API_KEY;
  const googleCx = process.env.GOOGLE_CSE_ID;
  if (googleKey && googleCx) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(googleKey)}&cx=${encodeURIComponent(googleCx)}&q=${encodeURIComponent(query)}&num=10`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        return data.items.map((i) => ({ title: i.title, url: i.link, snippet: i.snippet || "" }));
      }
    } catch {}
  }

  const serpKey = process.env.SERPAPI_KEY;
  if (serpKey) {
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=10&api_key=${encodeURIComponent(serpKey)}`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const data = await res.json();
      if (Array.isArray(data.organic_results)) {
        return data.organic_results.map((i) => ({ title: i.title, url: i.link, snippet: i.snippet || "" }));
      }
    } catch {}
  }

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const html = await res.text();
    return parseDuckDuckGoHtml(html);
  } catch {}

  return [];
}

function parseDuckDuckGoHtml(html) {
  const results = [];
  const re = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(String(html || ""))) !== null) {
    const url = match[1].replace(/uddg=([^&]+)/, "$1");
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    let finalUrl = url;
    try {
      const decoded = decodeURIComponent(url);
      if (/^https?:\/\//.test(decoded)) finalUrl = decoded;
    } catch {}
    results.push({ title, url: finalUrl, snippet: "" });
    if (results.length >= 10) break;
  }
  return results;
}

function pickCity(locKey) {
  const cities = (LOCATIONS[locKey] || LOCATIONS.usa).cities;
  return cities[Math.floor(Math.random() * cities.length)];
}

async function runTutoringScanOnce(options = {}) {
  const jobId = options.jobId || `ts_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const locations = options.location === "dubai" ? ["dubai"] : options.location === "usa" ? ["usa"] : ["usa", "dubai"];
  const maxSites = Math.max(1, Number(options.maxSites) || DEFAULT_MAX_SITES);
  const delayMs = Math.max(0, Number(options.delayMs) || DEFAULT_DELAY_MS);
  const searchFn = typeof options.searchFn === "function" ? options.searchFn : searchWeb;
  const fetchFn = typeof options.fetchFn === "function" ? options.fetchFn : fetchPage;
  const notifyFounder = options.notifyFounder !== false;

  const status = {
    jobId,
    running: true,
    startedAt: new Date().toISOString(),
    location: options.location || "both",
    phase: "starting",
    scanned: 0,
    emailsFound: 0,
    errors: [],
    lastFound: null,
    progress: "running"
  };
  saveStatus(status);

  const seenDomains = new Set();
  let scanned = 0;
  let emailsFound = 0;
  const errors = [];
  const sources = [];

  for (const locKey of locations) {
    const queries = buildQueries(locKey);
    for (const query of queries) {
      if (scanned >= maxSites) break;
      saveStatus({ ...loadStatus(), phase: `searching (${locKey})`, query });
      let results = [];
      try {
        results = await searchFn(query);
      } catch (error) {
        errors.push(`search "${query}": ${error && error.message ? error.message : error}`);
      }
      if (!results.length) continue;
      for (const result of results) {
        if (scanned >= maxSites) break;
        if (!result || !result.url) continue;
        let hostname = "";
        try {
          hostname = new URL(result.url).hostname.replace(/^www\./, "");
        } catch {
          continue;
        }
        if (seenDomains.has(hostname)) continue;
        seenDomains.add(hostname);
        scanned += 1;
        saveStatus({ ...loadStatus(), phase: `fetching ${hostname}`, scanned, emailsFound });

        const home = await fetchFn(result.url);
        let emails = [];
        let siteHtml = "";
        if (home.ok) {
          siteHtml = home.html || "";
          emails.push(...extractEmails(siteHtml));
          if (delayMs) await sleep(delayMs);
          const contactUrl = findContactUrl(siteHtml, result.url);
          if (contactUrl) {
            const contact = await fetchFn(contactUrl);
            if (contact.ok) emails.push(...extractEmails(contact.html));
            if (delayMs) await sleep(delayMs);
          }
        } else {
          errors.push(`${hostname}: ${home.status ? "http_" + home.status : home.error || "fetch_failed"}`);
        }

        emails = Array.from(new Set(emails.map((e) => String(e).toLowerCase().trim())));
        const prospects = emails.map((email) => ({
          businessName: String(result.title || hostname).slice(0, 200),
          website: result.url,
          email,
          city: pickCity(locKey),
          locale: "en",
          country: (LOCATIONS[locKey] || LOCATIONS.usa).country,
          notes: `Found via tutoring web-scan (${query})`,
          source: "web_research"
        }));
        if (prospects.length) {
          try {
            const added = await addProspects(prospects, {
              domain: "tutoring",
              prospectsPath: options.prospectsPath,
              contactsPath: options.contactsPath,
              ledgerPath: options.ledgerPath
            });
            emailsFound += (added.added || []).length;
            sources.push(hostname);
            saveStatus({ ...loadStatus(), scanned, emailsFound, lastFound: result.url });
          } catch (error) {
            errors.push(`${hostname}: ${error && error.message ? error.message : error}`);
          }
        }
      }
    }
  }

  const finalStatus = {
    ...loadStatus(),
    jobId,
    running: false,
    doneAt: new Date().toISOString(),
    phase: "done",
    scanned,
    emailsFound,
    errors: errors.slice(0, 12),
    sources: sources.slice(0, 30),
    lastFound: loadStatus() && loadStatus().lastFound ? loadStatus().lastFound : null,
    progress: "done"
  };
  saveStatus(finalStatus);

  if (notifyFounder && emailsFound > 0) {
    try {
      const telegramBotService = require("./telegramBotService");
      await telegramBotService.sendFounderAlert(
        "GARUDA — Tutoring Scan Results",
        `Job ${jobId} done. Scanned ${scanned} tutoring sites (${locations.join(" + ")}), found ${emailsFound} contact emails. /pipeline se dekho, phir outreach preview karke send karne ka approval do.`
      );
    } catch {}
  }

  return finalStatus;
}

function startTutoringScan(options = {}) {
  const jobId = `ts_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  saveStatus({
    jobId,
    running: true,
    startedAt: new Date().toISOString(),
    location: options.location || "both",
    phase: "starting",
    scanned: 0,
    emailsFound: 0,
    errors: [],
    lastFound: null,
    progress: "starting"
  });
  runTutoringScanOnce({ ...options, jobId })
    .catch((error) => {
      saveStatus({
        ...loadStatus(),
        jobId,
        running: false,
        doneAt: new Date().toISOString(),
        phase: "failed",
        error: error && error.message ? error.message : String(error),
        progress: "failed"
      });
    });
  return { jobId, started: true, running: true };
}

function getTutoringScanStatus() {
  const status = loadStatus();
  const pipeline = (() => {
    try {
      return getPipeline({ domain: "tutoring" });
    } catch {
      return { total: 0, hot: 0, strong: 0 };
    }
  })();
  if (!status || !status.jobId) {
    return {
      status: "never_run",
      running: false,
      scanned: 0,
      emailsFound: 0,
      progress: "never_run",
      message: "Abhi tak koi tutoring web-scan start nahi hua.",
      pipeline
    };
  }
  return { ...status, pipeline };
}

module.exports = {
  buildQueries,
  extractEmails,
  findContactUrl,
  getTutoringScanStatus,
  parseDuckDuckGoHtml,
  runTutoringScanOnce,
  startTutoringScan
};