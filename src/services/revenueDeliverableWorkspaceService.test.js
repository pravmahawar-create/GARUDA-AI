const assert = require("assert");
const service = require("./revenueDeliverableWorkspaceService");

const mission = {
  id: "mission-1", status: "founder_approved",
  workPackages: [
    { id: "task-1", status: "planned", dependencies: [] },
    { id: "task-2", status: "planned", dependencies: ["task-1"] }
  ]
};
const ready = service.applyEventPreview(mission, "task-1", { toStatus: "ready", actor: "founder" }, null, new Date("2026-01-01T00:00:00.000Z"));
assert.strictEqual(ready.workPackages[0].status, "ready");
assert.strictEqual(ready.deliverableWorkspace.progressPercent, 0);
const started = service.applyEventPreview({ ...mission, workPackages: ready.workPackages }, "task-1", { toStatus: "in_progress", actor: "garuda" }, ready.event.eventHash);
const completed = service.applyEventPreview({ ...mission, workPackages: started.workPackages }, "task-1", { toStatus: "completed", actor: "garuda", evidence: [{ kind: "artifact", label: "Draft", reference: "workspace://mission-1/task-1/draft", sha256: "a".repeat(64) }] }, started.event.eventHash);
assert.strictEqual(completed.deliverableWorkspace.completedTasks, 1);
assert.strictEqual(completed.deliverableWorkspace.progressPercent, 50);
assert.strictEqual(completed.deliverableWorkspace.externalActionsAuthorized, false);
assert.doesNotThrow(() => service.applyEventPreview({ ...mission, workPackages: completed.workPackages }, "task-2", { toStatus: "ready", actor: "garuda" }));
assert.throws(() => service.applyEventPreview(mission, "task-2", { toStatus: "ready" }), /dependencies/);
assert.throws(() => service.applyEventPreview({ ...mission, workPackages: started.workPackages }, "task-1", { toStatus: "completed" }), /evidence/);
assert.throws(() => service.applyEventPreview({ ...mission, workPackages: started.workPackages }, "task-1", { toStatus: "completed", evidence: [{ kind: "artifact", label: "Bad hash", reference: "workspace://mission-1/task-1/bad", sha256: "not-a-hash" }] }), /SHA-256/);
assert.throws(() => service.applyEventPreview({ ...mission, workPackages: started.workPackages }, "task-1", { toStatus: "completed", evidence: [{ kind: "artifact", label: "Missing hash", reference: "workspace://mission-1/task-1/missing" }] }), /required for artifact/);
assert.throws(() => service.applyEventPreview({ ...mission, status: "ready_for_founder_review" }, "task-1", { toStatus: "ready" }), /Founder-approved/);
console.log("Revenue deliverable workspace task lifecycle validation passed.");
