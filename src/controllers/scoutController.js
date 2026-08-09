const { AI_SERVICE_CATEGORIES, getCategory } = require("../services/scoutCategories");
const { SCOUT_PLATFORMS, scan } = require("../services/scoutPlatforms");
const scoutService = require("../services/scoutOpportunityService");
const scoutEmergentBridge = require("../services/scoutEmergentBridgeService");
const { PARTNERS, disclosureText, linkFor, recordEvent, ledger, summary } = require("../services/scoutAffiliateEngine");
const { getPlan } = require("../services/scoutPlan");

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function fail(res, error) {
  const status = error && error.statusCode ? error.statusCode : 500;
  return res.status(status).json({ success: false, error: error && error.message ? error.message : String(error) });
}

const categories = (req, res) => ok(res, { categories: AI_SERVICE_CATEGORIES });

const platforms = (req, res) =>
  ok(res, {
    platforms: SCOUT_PLATFORMS.map(({ automationNote, legalNote, ...rest }) => ({
      ...rest,
      automationNote,
      legalNote
    }))
  });

async function runScan(req, res) {
  try {
    const result = await scan({ platformId: req.body.platform, mode: req.body.mode, items: req.body.items });
    ok(res, { ...result });
  } catch (error) {
    fail(res, error);
  }
}

async function createOpportunity(req, res) {
  try {
    const created = await scoutService.createOpportunity(req.body);
    ok(res, { opportunity: created }, 201);
  } catch (error) {
    fail(res, error);
  }
}

async function bulkCreate(req, res) {
  try {
    const rows = Array.isArray(req.body.opportunities) ? req.body.opportunities : [];
    const created = [];
    const errors = [];
    for (const row of rows) {
      try {
        created.push(await scoutService.createOpportunity(row));
      } catch (error) {
        errors.push({ row, message: error && error.message ? error.message : String(error) });
      }
    }
    ok(res, { created: created.length, opportunities: created, errors });
  } catch (error) {
    fail(res, error);
  }
}

async function listOpportunities(req, res) {
  try {
    const items = await scoutService.listOpportunities(req.query);
    ok(res, { count: items.length, opportunities: items });
  } catch (error) {
    fail(res, error);
  }
}

async function getOpportunity(req, res) {
  try {
    const item = await scoutService.getOpportunity(req.params.id);
    if (!item) return fail(res, Object.assign(new Error("Opportunity not found"), { statusCode: 404 }));
    ok(res, { opportunity: item });
  } catch (error) {
    fail(res, error);
  }
}

async function scoreOpportunity(req, res) {
  try {
    const result = await scoutService.scoreOpportunityRecord(req.params.id, req.body);
    ok(res, { opportunity: result });
  } catch (error) {
    fail(res, error);
  }
}

async function draftProposal(req, res) {
  try {
    const result = await scoutService.draftProposal(req.params.id);
    ok(res, { opportunity: result });
  } catch (error) {
    fail(res, error);
  }
}

async function approveOpportunity(req, res) {
  try {
    const result = await scoutService.approveOpportunity(req.params.id, { founderApproved: req.body.founderApproved });
    ok(res, { opportunity: result });
  } catch (error) {
    fail(res, error);
  }
}

async function submitOpportunity(req, res) {
  try {
    const result = await scoutService.submitOpportunity(req.params.id, {
      founderApproved: req.body.founderApproved,
      submissionUrl: req.body.submissionUrl
    });
    ok(res, { opportunity: result });
  } catch (error) {
    fail(res, error);
  }
}

async function recordOutcome(req, res) {
  try {
    const result = await scoutService.recordOutcome(req.params.id, req.body);
    ok(res, { opportunity: result });
  } catch (error) {
    fail(res, error);
  }
}

async function requestPayment(req, res) {
  try {
    const result = await scoutEmergentBridge.requestPaymentForWonOpportunity(req.params.id, req.body, {
      founderApproved: req.body.founderApproved,
      env: process.env,
      rootDir: process.cwd()
    });
    ok(res, { ...result });
  } catch (error) {
    fail(res, error);
  }
}

function paymentBridgeStatus(req, res) {
  ok(res, { payment: scoutEmergentBridge.paymentReadiness(process.env) });
}

async function publicPayment(req, res) {
  try {
    const detail = await scoutEmergentBridge.publicPaymentByReference(req.params.ref, { env: process.env });
    ok(res, detail);
  } catch (error) {
    fail(res, error);
  }
}

async function dashboard(req, res) {
  try {
    const result = await scoutService.getDashboard();
    ok(res, { ...result });
  } catch (error) {
    fail(res, error);
  }
}

function affiliatePartners(req, res) {
  ok(res, { partners: PARTNERS.map((p) => ({ id: p.id, name: p.name, url: p.url, program: p.program, commission: p.commission })) });
}

function affiliateLink(req, res) {
  ok(res, { link: linkFor(String(req.query.partner || "")) });
}

function affiliateDisclosure(req, res) {
  ok(res, { disclosure: disclosureText() });
}

function affiliateRecord(req, res) {
  try {
    const entry = recordEvent(String(req.body.partner || ""), req.body);
    ok(res, { entry }, 201);
  } catch (error) {
    fail(res, error);
  }
}

function affiliateSummary(req, res) {
  ok(res, { ...summary() });
}

function affiliateLedger(req, res) {
  ok(res, { count: ledger.length, ledger: ledger.slice(-50) });
}

function plan(req, res) {
  ok(res, { ...getPlan() });
}

function categoryDetail(req, res) {
  const category = getCategory(String(req.params.id || ""));
  if (!category) return fail(res, Object.assign(new Error("Unknown category"), { statusCode: 404 }));
  ok(res, { category });
}

module.exports = {
  affiliateDisclosure,
  affiliateLedger,
  affiliateLink,
  affiliatePartners,
  affiliateRecord,
  affiliateSummary,
  approveOpportunity,
  bulkCreate,
  categories,
  categoryDetail,
  createOpportunity,
  dashboard,
  draftProposal,
  getOpportunity,
  listOpportunities,
  paymentBridgeStatus,
  plan,
  publicPayment,
  platforms,
  recordOutcome,
  requestPayment,
  runScan,
  scoreOpportunity,
  submitOpportunity
};