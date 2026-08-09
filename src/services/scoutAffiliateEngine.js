const PARTNERS = [
  {
    id: "hostinger",
    name: "Hostinger",
    url: "https://www.hostinger.com",
    program: "Hostinger Affiliate Program",
    commission: "~60% recurring style (varies by region; verify current terms)",
    env: "SCOUT_AFF_HOSTINGER"
  },
  {
    id: "canva",
    name: "Canva",
    url: "https://www.canva.com",
    program: "Canva Affiliate Partner Program",
    commission: "$ per qualifying new user (verify current terms)",
    env: "SCOUT_AFF_CANVA"
  },
  {
    id: "pabbly",
    name: "Pabbly",
    url: "https://www.pabbly.com",
    program: "Pabbly Affiliate Program",
    commission: "Subscription commissions (verify current terms)",
    env: "SCOUT_AFF_PABBLY"
  },
  {
    id: "zapier",
    name: "Zapier",
    url: "https://zapier.com",
    program: "Zapier Affiliate/Partner program",
    commission: "Varies (verify current terms)",
    env: "SCOUT_AFF_ZAPIER"
  },
  {
    id: "notion",
    name: "Notion",
    url: "https://www.notion.com",
    program: "Notion affiliates via partner programs",
    commission: "Varies (verify current terms)",
    env: "SCOUT_AFF_NOTION"
  },
  {
    id: "render",
    name: "Render",
    url: "https://render.com",
    program: "Render Affiliate Program",
    commission: "Varies (verify current terms)",
    env: "SCOUT_AFF_RENDER"
  }
];

const ledger = [];

function getPartner(id) {
  return PARTNERS.find((p) => p.id === id) || null;
}

function linkFor(id) {
  const partner = getPartner(id);
  if (!partner) return null;
  const tag = (process.env[partner.env] || "").trim();
  return {
    partnerId: id,
    name: partner.name,
    url: partner.url,
    affiliateReady: Boolean(tag),
    affiliateParam: tag || null,
    note: tag
      ? "Affiliate param configured."
      : `No personal affiliate link configured yet (set ${partner.env}). Using program homepage.`
  };
}

function disclosureText(partnerIds = []) {
  return [
    "Affiliate Disclosure: this page contains affiliate links. If you purchase through them, GARUDA may earn a commission at no extra cost to you. We only recommend tools we would genuinely use.",
    "Compliance: affiliate links are disclosed; no fake reviews, no fabricated screenshots, no guaranteed-income claims."
  ].join(" ");
}

function recordEvent(partnerId, event = {}) {
  const partner = getPartner(partnerId);
  if (!partner) throw Object.assign(new Error("Unknown partner id"), { statusCode: 400 });
  const type = String(event.type || "click").trim();
  if (!["click", "conversion", "commission"].includes(type)) {
    throw Object.assign(new Error("type must be click, conversion or commission"), { statusCode: 400 });
  }
  if (type === "commission" && !(Number(event.amount) > 0)) {
    throw Object.assign(new Error("commission requires a verified amount"), { statusCode: 400 });
  }

  const entry = {
    id: `af_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    partnerId,
    partnerName: partner.name,
    type,
    amount: Number(event.amount) || 0,
    currency: String(event.currency || "USD").trim().toUpperCase(),
    note: String(event.note || "").trim(),
    source: String(event.source || "manual").trim(),
    recordedAt: new Date().toISOString()
  };
  ledger.push(entry);
  return { ...entry };
}

function summary() {
  const totals = { clicks: 0, conversions: 0, commission: 0 };
  for (const entry of ledger) {
    if (entry.type === "click") totals.clicks += 1;
    if (entry.type === "conversion") totals.conversions += 1;
    if (entry.type === "commission") totals.commission += Number(entry.amount) || 0;
  }
  return {
    ...totals,
    totalRecords: ledger.length,
    partners: PARTNERS.map((p) => ({ id: p.id, name: p.name, configured: Boolean(process.env[p.env]) }))
  };
}

module.exports = {
  PARTNERS,
  disclosureText,
  getPartner,
  ledger,
  linkFor,
  recordEvent,
  summary
};