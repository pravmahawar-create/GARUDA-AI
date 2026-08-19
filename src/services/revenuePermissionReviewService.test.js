const assert = require("assert");
const path = require("path");
const fs = require("fs");
const service = require("./revenuePermissionReviewService");
const { FOUNDER_ATTESTATION_REQUIRED } = service;
const { resolveEarningMode, resolveContractPermission } = require("../models/DiscoveryCandidate");
const { validateApprovedCandidate } = require("./revenueExecutionMissionService");
const { classifySourceTruth } = require("./revenueSourceTruthService");

const rootDir = path.resolve(__dirname, "../..");
const CANDIDATE_ID = "507f1f77bcf86cd799439011";

function permissionUnknownCandidate(overrides = {}) {
  const base = {
    _id: CANDIDATE_ID,
    externalId: "ext-1",
    title: "Full-time Senior Node.js Developer",
    company: "Acme Corp",
    source: "remotive",
    url: "https://remotive.com/job/1",
    sourceAttribution: "Remotive",
    opportunityChannel: "founder_garuda",
    status: "ranked",
    score: 88,
    priority: "NORMAL",
    verification: { sourceVerified: true, scamSignalsClear: true, garudaExecutionEligible: false, verifiedAt: "2026-07-22T09:00:00.000Z" },
    valueModel: { status: "ESTIMATED", estimatedINR: 60000, rank: 60 },
    publishedAt: "2026-07-20T12:00:00.000Z",
    discoveredAt: new Date("2026-07-20T12:00:00.000Z"),
    capabilityAssessment: {
      selfEarningEligible: false,
      humanIdentityRequired: true,
      matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 82 }]
    }
  };
  const merged = { ...base, ...overrides };
  merged.toJSON = () => {
    const { toJSON, ...rest } = merged;
    return rest;
  };
  return merged;
}

function confirmPayload(overrides = {}) {
  return {
    decision: "PERMISSION_CONFIRMED",
    evidenceType: "CLIENT_EMPLOYER_EXPLICIT_PERMISSION",
    evidenceSource: "Client email dated 2026-07-20 granting permission",
    evidenceSummary: "The client explicitly authorized GARUDA-assisted delivery of this engagement.",
    founderAttestation: FOUNDER_ATTESTATION_REQUIRED,
    note: "",
    ...overrides
  };
}

function withStubs(stubs, fn) {
  const restore = [];
  for (const key of Object.keys(stubs)) {
    const [modName, methName] = key.split(".");
    const target = modName === "DiscoveryCandidate"
      ? require("../models/DiscoveryCandidate").DiscoveryCandidate
      : require("../models/PermissionReview").PermissionReview;
    restore.push([target, methName, target[methName]]);
    target[methName] = stubs[key];
  }
  return fn().then(
    (result) => { for (const [t, m, v] of restore) t[m] = v; return result; },
    (error) => { for (const [t, m, v] of restore) t[m] = v; throw error; }
  );
}

(async () => {
  // -------------------------------------------------------------------------
  // CASE A — Queue visibility: only PERMISSION_UNKNOWN candidates are listed,
  // including legacy records that resolve deterministically.
  // -------------------------------------------------------------------------
  await withStubs(
    {
      "DiscoveryCandidate.find": async () => [
        permissionUnknownCandidate(),
        permissionUnknownCandidate({ _id: "507f1f77bcf86cd799439021", externalId: "ext-2", opportunityChannel: "human_opportunity_only", earningMode: undefined }),
        permissionUnknownCandidate({ _id: "507f1f77bcf86cd799439031", externalId: "ext-3", opportunityChannel: "garuda_deliverable", capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "x", name: "x", score: 90 }] } })
      ],
      "PermissionReview.find": () => ({ sort: () => ({ lean: async () => [] }) })
    },
    async () => {
      const queue = await service.listPendingReviews({});
      assert.strictEqual(queue.length, 2, "only PERMISSION_UNKNOWN candidates appear in the queue");
      assert.ok(queue.every((c) => c.resolvedState.earningMode === "PERMISSION_UNKNOWN"));
      assert.strictEqual(queue[0].resolvedState.contractPermission, "UNKNOWN");
    }
  );

  // -------------------------------------------------------------------------
  // CASE B — PERMISSION_CONFIRMED with evidence promotes the candidate.
  // -------------------------------------------------------------------------
  const b = service.resolveReviewTransition({ candidate: permissionUnknownCandidate(), payload: confirmPayload(), founderApproved: "true" });
  assert.strictEqual(b.newState.earningMode, "FOUNDER_ENGAGED_GARUDA_ASSISTED");
  assert.strictEqual(b.newState.contractPermission, "PERMITTED");
  assert.strictEqual(b.newState.opportunityChannel, "founder_garuda");
  assert.strictEqual(b.newState.status, "ranked", "CONFIRM must not change candidate status");

  // -------------------------------------------------------------------------
  // CASE C — PERMISSION_PROHIBITED moves to NOT_ELIGIBLE + PROHIBITED.
  // -------------------------------------------------------------------------
  const c = service.resolveReviewTransition({
    candidate: permissionUnknownCandidate(),
    payload: { decision: "PERMISSION_PROHIBITED", evidenceType: "CONTRACT_ENGAGEMENT_TERMS", evidenceSource: "Employment contract clause 4", evidenceSummary: "Contract explicitly prohibits subcontracting/AI-assisted delivery." },
    founderApproved: true
  });
  assert.strictEqual(c.newState.earningMode, "NOT_ELIGIBLE");
  assert.strictEqual(c.newState.contractPermission, "PROHIBITED");

  // -------------------------------------------------------------------------
  // CASE D — NEEDS_INFORMATION leaves the candidate PERMISSION_UNKNOWN.
  // -------------------------------------------------------------------------
  const d = service.resolveReviewTransition({
    candidate: permissionUnknownCandidate(),
    payload: { decision: "NEEDS_INFORMATION", note: "Need the employer policy text" },
    founderApproved: true
  });
  assert.deepStrictEqual(d.newState, d.previousState, "NEEDS_INFORMATION must not change state");
  assert.strictEqual(d.newState.earningMode, "PERMISSION_UNKNOWN");

  // -------------------------------------------------------------------------
  // CASE E — Missing / fabricated evidence is blocked.
  // -------------------------------------------------------------------------
  assert.throws(() => service.validateReviewPayload({ decision: "PERMISSION_CONFIRMED", evidenceType: "UNKNOWN" }), /concrete evidence/);
  assert.throws(() => service.validateReviewPayload({ decision: "PERMISSION_CONFIRMED", evidenceType: "FOUNDER_ATTESTATION", evidenceSummary: "x" }), /evidence source/);
  assert.throws(() => service.validateReviewPayload({ decision: "PERMISSION_CONFIRMED", evidenceType: "FOUNDER_ATTESTATION", evidenceSource: "x" }), /evidence summary/);
  assert.throws(() => service.validateReviewPayload(confirmPayload({ founderAttestation: "I just trust it." })), /attestation text/);
  assert.throws(() => service.validateReviewPayload({ decision: "BOGUS" }), /decision must be one of/);
  assert.throws(() => service.validateReviewPayload({ decision: "PERMISSION_PROHIBITED" }), /evidence source/);

  // -------------------------------------------------------------------------
  // CASE F — Explicit prohibition can never be overridden by Founder approval.
  // -------------------------------------------------------------------------
  assert.throws(
    () => service.resolveReviewTransition({
      candidate: permissionUnknownCandidate({ contractPermission: "PROHIBITED", earningMode: "PERMISSION_UNKNOWN" }),
      payload: confirmPayload(),
      founderApproved: true
    }),
    /cannot override it/
  );
  assert.throws(
    () => service.resolveReviewTransition({
      candidate: permissionUnknownCandidate({ earningMode: "NOT_ELIGIBLE" }),
      payload: confirmPayload(),
      founderApproved: true
    }),
    /not awaiting permission review/
  );

  // -------------------------------------------------------------------------
  // CASE G — PERMISSION_UNKNOWN must never execute externally.
  // -------------------------------------------------------------------------
  const roleRecord = { source: "remotive", externalId: "role-1", title: "Full-time Senior Node.js Developer Position", company: "Acme Corp", description: "Seeking a senior Node.js backend developer for project execution and technical deliverables.", category: "full_time_job", url: "https://remotive.com/job/role-1", sourceAttribution: "Remotive" };
  const humanRoleTruth = { ...classifySourceTruth(roleRecord), verifiedAt: "2026-07-22T09:00:00.000Z", prohibitedContentClear: true, scamSignalsClear: true };
  const founderEngagedBase = {
    ...roleRecord,
    _id: CANDIDATE_ID,
    missionId: "507f191e810c19729de860ea",
    status: "approved",
    opportunityChannel: "founder_garuda",
    score: 88,
    capabilityAssessment: { selfEarningEligible: false, humanIdentityRequired: true, matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 82 }] },
    verification: humanRoleTruth,
    decision: { actor: "founder", decidedAt: "2026-07-22T10:00:00.000Z" }
  };
  assert.throws(
    () => validateApprovedCandidate({ ...founderEngagedBase, earningMode: "PERMISSION_UNKNOWN", contractPermission: "UNKNOWN" }, { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }),
    /PERMISSION_UNKNOWN|permission not established/,
    "PERMISSION_UNKNOWN must never reach execution"
  );

  // -------------------------------------------------------------------------
  // CASE H — The review queue can never trigger outreach/email/apply/contact.
  // Static firewall: the service must not depend on any external side-effect
  // service, and recordDecision only writes the single candidate + audit record.
  // -------------------------------------------------------------------------
  const source = fs.readFileSync(path.resolve(__dirname, "./revenuePermissionReviewService.js"), "utf8");
  const banned = /emailRelayService|revenueOutreachService|revenueExternalActionService|revenueConnectorRegistryService|revenueSignedWebhookService|razorpay|paymentWebhook|motherPlatformAuthService|revenueProductionDeliveryService|autonomousRevenueTaskRunnerService|revenueExecutionMissionService/;
  assert.ok(!banned.test(source), "review queue service must not depend on external side-effect services");
  const exportsList = Object.keys(service);
  assert.ok(!exportsList.some((k) => /dispatch|execute|send|apply|contact|email|payment/i.test(k)), "no external action is exported by the review queue");

  // -------------------------------------------------------------------------
  // CASE I — A CONFIRMED founder-engaged candidate reaches the mission gate.
  // (The queue itself never triggers execution; the gate simply accepts the
  //  confirmed state under a separate founder-approved mission.)
  // -------------------------------------------------------------------------
  const founderEngaged = { ...founderEngagedBase, earningMode: "FOUNDER_ENGAGED_GARUDA_ASSISTED", contractPermission: "PERMITTED" };
  assert.doesNotThrow(() => validateApprovedCandidate(founderEngaged, { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }), "confirmed founder-engaged state is accepted at the mission gate");

  // -------------------------------------------------------------------------
  // CASE J — DIRECT_GARUDA remains fully functional.
  // -------------------------------------------------------------------------
  const directRecord = { source: "verified_client_portal", externalId: "opportunity-1", title: "Build a governed Node API integration", company: "Example", description: "Request for proposal with a fixed price, scope of work, project milestone, delivery deadline, and acceptance criteria.", category: "contract_project", url: "https://client.example/opportunity/1", sourceAttribution: "Verified client portal" };
  const directTruth = { ...classifySourceTruth(directRecord), verifiedAt: "2026-07-22T09:00:00.000Z", prohibitedContentClear: true, scamSignalsClear: true };
  const directCandidate = {
    ...directRecord,
    _id: CANDIDATE_ID,
    missionId: "507f191e810c19729de860ea",
    status: "approved",
    opportunityChannel: "garuda_deliverable",
    earningMode: "DIRECT_GARUDA",
    contractPermission: "PERMITTED",
    score: 90,
    capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 85 }] },
    verification: directTruth,
    decision: { actor: "founder", decidedAt: "2026-07-22T10:00:00.000Z" }
  };
  assert.doesNotThrow(() => validateApprovedCandidate(directCandidate, { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }), "DIRECT_GARUDA execution path still works");
  assert.strictEqual(resolveEarningMode({ opportunityChannel: "garuda_deliverable", capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{}] } }), "DIRECT_GARUDA");

  // -------------------------------------------------------------------------
  // CASE K — Scam / ineligible candidates are never reviewable.
  // -------------------------------------------------------------------------
  const scamCandidate = permissionUnknownCandidate({ capabilityAssessment: { selfEarningEligible: false, humanIdentityRequired: true, matches: [] }, verification: { scamSignalsClear: false } });
  assert.strictEqual(resolveEarningMode(scamCandidate), "NOT_ELIGIBLE");
  assert.throws(
    () => service.resolveReviewTransition({ candidate: scamCandidate, payload: confirmPayload(), founderApproved: true }),
    /not awaiting permission review/
  );

  // -------------------------------------------------------------------------
  // CASE L — Legacy records (no earningMode field) resolve to PERMISSION_UNKNOWN.
  // -------------------------------------------------------------------------
  assert.strictEqual(
    resolveEarningMode({ opportunityChannel: "human_opportunity_only", capabilityAssessment: { humanIdentityRequired: true, matches: [{ capabilityId: "x", name: "x", score: 80 }] } }),
    "PERMISSION_UNKNOWN"
  );
  assert.strictEqual(
    resolveEarningMode({ opportunityChannel: "founder_garuda", capabilityAssessment: { humanIdentityRequired: true, matches: [{ capabilityId: "x", name: "x", score: 80 }] } }),
    "PERMISSION_UNKNOWN"
  );

  // -------------------------------------------------------------------------
  // CASE M — Every decision creates an auditable PermissionReview record with
  // previous/new state and evidence, and updates only the single candidate.
  // -------------------------------------------------------------------------
  let createdPayload = null;
  let updateCalls = [];
  let updateManyCalled = false;
  const candidateUnderReview = permissionUnknownCandidate();
  const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
  const { PermissionReview } = require("../models/PermissionReview");
  await withStubs(
    {
      "DiscoveryCandidate.findById": async () => candidateUnderReview,
      "DiscoveryCandidate.updateOne": async (filter, update) => { updateCalls.push({ filter, update }); return { modifiedCount: 1 }; },
      "DiscoveryCandidate.updateMany": async () => { updateManyCalled = true; return {}; },
      "PermissionReview.create": async (payload) => { createdPayload = payload; return { toJSON: () => ({ ...payload, id: "rev-1", candidateId: String(payload.candidateId) }) }; }
    },
    async () => {
      const result = await service.recordDecision(CANDIDATE_ID, confirmPayload(), { founderApproved: "true", actor: "founder" });
      assert.strictEqual(updateManyCalled, false, "updateMany must never be called");
      assert.strictEqual(updateCalls.length, 1, "only one candidate update");
      assert.deepStrictEqual(updateCalls[0].filter, { _id: CANDIDATE_ID }, "single-document update keyed by _id");
      assert.strictEqual(updateCalls[0].update.$set.earningMode, "FOUNDER_ENGAGED_GARUDA_ASSISTED");
      assert.strictEqual(updateCalls[0].update.$set.contractPermission, "PERMITTED");
      assert.ok(createdPayload, "audit record created");
      assert.strictEqual(createdPayload.decision, "PERMISSION_CONFIRMED");
      assert.strictEqual(createdPayload.evidenceType, "CLIENT_EMPLOYER_EXPLICIT_PERMISSION");
      assert.strictEqual(createdPayload.evidenceSource, "Client email dated 2026-07-20 granting permission");
      assert.strictEqual(createdPayload.evidenceSummary, "The client explicitly authorized GARUDA-assisted delivery of this engagement.");
      assert.strictEqual(createdPayload.founderAttestation, FOUNDER_ATTESTATION_REQUIRED);
      assert.strictEqual(createdPayload.reviewer, "founder");
      assert.strictEqual(createdPayload.previousState.earningMode, "PERMISSION_UNKNOWN");
      assert.strictEqual(createdPayload.newState.earningMode, "FOUNDER_ENGAGED_GARUDA_ASSISTED");
      assert.strictEqual(createdPayload.candidateId, CANDIDATE_ID);
      assert.ok(!result.externalAction && !result.payment && !result.mission, "review decision returns no external action");
      assert.deepStrictEqual(Object.keys(result).sort(), ["candidate", "review"], "recordDecision only returns review + candidate");
    }
  );

  // -------------------------------------------------------------------------
  // CASE N — Unauthorized users cannot mutate decisions (403).
  // -------------------------------------------------------------------------
  assert.throws(() => service.resolveReviewTransition({ candidate: permissionUnknownCandidate(), payload: confirmPayload(), founderApproved: false }), /Founder approval is required/);
  assert.throws(() => service.resolveReviewTransition({ candidate: permissionUnknownCandidate(), payload: confirmPayload(), founderApproved: undefined }), /Founder approval is required/);
  assert.throws(() => service.resolveReviewTransition({ candidate: permissionUnknownCandidate(), payload: confirmPayload() }), /Founder approval is required/);

  // -------------------------------------------------------------------------
  // CASE O — No bulk modification: queueStats counts resolved modes across the
  // full set while recordDecision still updates only one candidate.
  // -------------------------------------------------------------------------
  const manyCandidates = [];
  for (let i = 0; i < 121; i += 1) {
    const permissionUnknown = i < 118;
    manyCandidates.push(permissionUnknown
      ? permissionUnknownCandidate({ _id: `507f1f77bcf86cd79943${String(9000 + i)}`, externalId: `ext-${i}` })
      : permissionUnknownCandidate({ _id: `507f1f77bcf86cd79943${String(9000 + i)}`, externalId: `ext-${i}`, earningMode: "NOT_ELIGIBLE", opportunityChannel: "no_verified_capability_match" }));
  }
  await withStubs(
    {
      "DiscoveryCandidate.find": async () => manyCandidates,
      "PermissionReview.find": async () => []
    },
    async () => {
      const stats = await service.queueStats();
      assert.strictEqual(stats.totalCandidates, 121);
      assert.strictEqual(stats.counts.PERMISSION_UNKNOWN, 118, "only unresolved candidates are counted as pending");
      assert.strictEqual(stats.counts.NOT_ELIGIBLE, 3);
      assert.strictEqual(stats.reviewedCandidates, 0);
    }
  );

  // -------------------------------------------------------------------------
  // CASE P — Batch guards: cap, empty set, invalid ids, founder approval,
  // and the shared-attestation-only rule for batch confirm.
  // -------------------------------------------------------------------------
  await assert.rejects(() => service.recordBatchDecisions([], { decision: "DISMISS" }, { founderApproved: "true" }), /at least one candidate id/);
  const overCap = Array.from({ length: 51 }, (_, i) => `507f1f77bcf86cd799439${String(1000 + i)}`);
  await assert.rejects(() => service.recordBatchDecisions(overCap, { decision: "DISMISS" }, { founderApproved: "true" }), /safety cap of 50/);
  await assert.rejects(() => service.recordBatchDecisions(["not-an-objectid"], { decision: "DISMISS" }, { founderApproved: "true" }), /invalid candidate id/);
  await assert.rejects(() => service.recordBatchDecisions([CANDIDATE_ID], { decision: "DISMISS" }, {}), /Founder approval is required/);
  await assert.rejects(
    () => service.recordBatchDecisions([CANDIDATE_ID], confirmPayload(), { founderApproved: "true" }),
    /FOUNDER_ATTESTATION/,
    "batch confirm must use shared FOUNDER_ATTESTATION evidence"
  );

  // -------------------------------------------------------------------------
  // CASE Q — Batch success: per-candidate single-document updates + per-candidate
  // audit documents, shared attestation evidence, individual failures never
  // abort the rest, and updateMany is never called.
  // -------------------------------------------------------------------------
  const batchA = "507f1f77bcf86cd799439101";
  const batchB = "507f1f77bcf86cd799439102";
  const batchC = "507f1f77bcf86cd799439103";
  const batchD = "507f1f77bcf86cd799439104";
  const candidatesById = {
    [batchA]: permissionUnknownCandidate({ _id: batchA, externalId: "ext-batchA", title: "Batch candidate A" }),
    [batchB]: permissionUnknownCandidate({ _id: batchB, externalId: "ext-batchB", title: "Batch candidate B" }),
    [batchC]: permissionUnknownCandidate({ _id: batchC, externalId: "ext-batchC", title: "Batch candidate C", earningMode: "NOT_ELIGIBLE", opportunityChannel: "no_verified_capability_match" })
  };
  const batchConfirm = {
    decision: "PERMISSION_CONFIRMED",
    evidenceType: "FOUNDER_ATTESTATION",
    evidenceSource: "Founder batch review of selected candidates",
    evidenceSummary: "Shared attestation: the founder engaged GARUDA-assisted delivery for all selected engagements.",
    founderAttestation: FOUNDER_ATTESTATION_REQUIRED
  };
  let batchCreated = [];
  const batchUpdateCalls = [];
  let batchUpdateManyCalled = false;
  await withStubs(
    {
      "DiscoveryCandidate.findById": async (id) => candidatesById[String(id)] || null,
      "DiscoveryCandidate.updateOne": async (filter, update) => { batchUpdateCalls.push({ filter, update }); return { modifiedCount: 1 }; },
      "DiscoveryCandidate.updateMany": async () => { batchUpdateManyCalled = true; return {}; },
      "PermissionReview.create": async (payload) => { batchCreated.push(payload); return { toJSON: () => ({ ...payload, id: `rev-${batchCreated.length}`, candidateId: String(payload.candidateId) }) }; }
    },
    async () => {
      const batch = await service.recordBatchDecisions([batchA, batchB, batchC, batchD], batchConfirm, { founderApproved: "true", actor: "founder" });
      assert.strictEqual(batch.summary.requested, 4);
      assert.strictEqual(batch.summary.confirmed, 2, "A and B confirmed");
      assert.strictEqual(batch.summary.failed, 2, "C (already resolved) and D (missing) fail individually");
      assert.strictEqual(batch.summary.prohibited, 0);
      assert.strictEqual(batch.summary.dismissed, 0);
      assert.strictEqual(batch.summary.needsInformation, 0);
      assert.strictEqual(batch.results.filter((r) => r.ok).length, 2);
      assert.strictEqual(batch.results.filter((r) => !r.ok).length, 2);
      assert.strictEqual(batchUpdateManyCalled, false, "updateMany must never be called, even in batch mode");
      assert.strictEqual(batchUpdateCalls.length, 2, "exactly two single-document updates");
      assert.deepStrictEqual(batchUpdateCalls.map((c) => String(c.filter._id)).sort(), [batchA, batchB].sort());
      assert.ok(batchUpdateCalls.every((c) => c.update.$set.earningMode === "FOUNDER_ENGAGED_GARUDA_ASSISTED"));
      assert.strictEqual(batchCreated.length, 2, "each confirmed candidate gets its OWN audit document");
      assert.ok(batchCreated.every((c) => c.decision === "PERMISSION_CONFIRMED"));
      assert.ok(batchCreated.every((c) => c.evidenceType === "FOUNDER_ATTESTATION"));
      assert.ok(batchCreated.every((c) => c.founderAttestation === FOUNDER_ATTESTATION_REQUIRED));
      assert.ok(batchCreated.every((c) => c.reviewer === "founder"));
      assert.ok(batchCreated.some((c) => String(c.candidateId) === batchA));
      assert.ok(batchCreated.some((c) => String(c.candidateId) === batchB));
      const failC = batch.results.find((r) => String(r.candidateId) === batchC);
      const failD = batch.results.find((r) => String(r.candidateId) === batchD);
      assert.ok(failC && !failC.ok && /not awaiting permission review/.test(failC.error), "per-candidate failure reason preserved");
      assert.ok(failD && !failD.ok && /not found/.test(failD.error), "missing candidate reported, batch not aborted");
    }
  );

  // -------------------------------------------------------------------------
  // CASE R — Batch list filters: source and minScore narrow the pending queue.
  // -------------------------------------------------------------------------
  await withStubs(
    {
      "DiscoveryCandidate.find": async () => [
        permissionUnknownCandidate({ _id: batchA, externalId: "ext-f1", source: "upwork", score: 75 }),
        permissionUnknownCandidate({ _id: batchB, externalId: "ext-f2", source: "remotive", score: 92 }),
        permissionUnknownCandidate({ _id: batchC, externalId: "ext-f3", source: "remotive", score: 40 })
      ],
      "PermissionReview.find": () => ({ sort: () => ({ lean: async () => [] }) })
    },
    async () => {
      const bySource = await service.listPendingReviews({ source: "remotive" });
      assert.strictEqual(bySource.length, 2, "source filter narrows the queue");
      assert.ok(bySource.every((c) => c.source === "remotive"));
      const byMinScore = await service.listPendingReviews({ minScore: 50 });
      assert.strictEqual(byMinScore.length, 2, "minScore excludes low-scoring candidates");
      const both = await service.listPendingReviews({ source: "remotive", minScore: 90 });
      assert.strictEqual(both.length, 1, "source + minScore compose");
      assert.strictEqual(both[0].score, 92);
      const capped = await service.listPendingReviews({ maxResults: 1 });
      assert.strictEqual(capped.length, 1, "maxResults caps the returned batch window");
    }
  );

  console.log("Permission review queue tests A–R passed.");
})().catch((err) => {
  console.error("Permission review queue test failed:", err);
  process.exit(1);
});