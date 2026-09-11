const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { describe, it, before, after } = require("node:test");

const pawanHistoryService = require("./pawanHistoryService");

describe("GARUDA Pawan History Service — Persistent Dual-Tier", () => {
  const TEST_FILE = pawanHistoryService.DATA_FILE;

  before(async () => {
    // Ensure clean state before tests
    try { await pawanHistoryService.clearHistory(); } catch {}
  });

  after(async () => {
    try { await pawanHistoryService.clearHistory(); } catch {}
  });

  it("should record and retrieve consultation interaction accurately", async () => {
    await pawanHistoryService.clearHistory();
    const doc = await pawanHistoryService.recordInteraction({
      type: "consultation",
      device: "desktop",
      instruction: "Build a premium cloth billing app",
      attachmentMeta: { hasAttachment: false, mimeType: null },
      consultation: {
        reply: "Here is your action plan",
        actionPlan: "Step 1: Scaffold...",
        recommendations: ["Use dark theme"],
        suggestedInstruction: "Build cloth billing app with dark theme",
        targetFile: "public/cloth.html",
      },
    });

    assert.ok(doc.id.startsWith("pawan_int_"), "id prefix");
    assert.strictEqual(doc.type, "consultation");
    assert.strictEqual(doc.device, "desktop");
    assert.strictEqual(doc.instruction, "Build a premium cloth billing app");
    assert.ok(doc.timestamp);
    assert.ok(doc.consultation);

    const history = await pawanHistoryService.getRecentHistory(10);
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].id, doc.id);
    assert.strictEqual(history[0].consultation.reply, "Here is your action plan");
  });

  it("should record execution with SHA and file", async () => {
    await pawanHistoryService.clearHistory();
    const doc = await pawanHistoryService.recordInteraction({
      type: "execution",
      device: "mobile",
      instruction: "Fix GST calc",
      executionResult: { file: "public/cloth.html", sha256: "abc123sha", success: true },
    });
    assert.strictEqual(doc.type, "execution");
    assert.strictEqual(doc.device, "mobile");
    assert.strictEqual(doc.executionResult.file, "public/cloth.html");
    assert.strictEqual(doc.executionResult.sha256, "abc123sha");

    const history = await pawanHistoryService.getRecentHistory(5);
    assert.strictEqual(history[0].executionResult.success, true);
  });

  it("should record apk_build type", async () => {
    await pawanHistoryService.clearHistory();
    const doc = await pawanHistoryService.recordInteraction({
      type: "apk_build",
      device: "mobile",
      instruction: "APK build for cloth app",
      executionResult: { file: "cloth-billing", sha256: "shaapk123", success: true },
    });
    assert.strictEqual(doc.type, "apk_build");
    const history = await pawanHistoryService.getRecentHistory(5);
    assert.strictEqual(history[0].type, "apk_build");
  });

  it("should classify device correctly (mobile/desktop)", () => {
    const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const androidUA = "Mozilla/5.0 (Linux; Android 10; SM-G920F) AppleWebKit/537.36 Mobile";
    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0";
    const emptyUA = "";
    assert.strictEqual(pawanHistoryService.detectDevice(mobileUA), "mobile");
    assert.strictEqual(pawanHistoryService.detectDevice(androidUA), "mobile");
    assert.strictEqual(pawanHistoryService.detectDevice(desktopUA), "desktop");
    assert.strictEqual(pawanHistoryService.detectDevice(emptyUA), "desktop");
    assert.strictEqual(pawanHistoryService.detectDevice(null), "desktop");
    assert.strictEqual(pawanHistoryService.detectDevice(undefined), "desktop");
  });

  it("should return chronologically sorted records (desc) via getRecentHistory", async () => {
    await pawanHistoryService.clearHistory();
    const doc1 = await pawanHistoryService.recordInteraction({
      type: "consultation",
      instruction: "First message",
      consultation: { reply: "First reply" },
    });
    // Ensure timestamp difference
    await new Promise(r => setTimeout(r, 10));
    const doc2 = await pawanHistoryService.recordInteraction({
      type: "consultation",
      instruction: "Second message",
      consultation: { reply: "Second reply" },
    });
    await new Promise(r => setTimeout(r, 10));
    const doc3 = await pawanHistoryService.recordInteraction({
      type: "execution",
      instruction: "Third execution",
      executionResult: { file: "a.html", sha256: "sha3", success: true },
    });

    const history = await pawanHistoryService.getRecentHistory(10);
    assert.strictEqual(history.length, 3);
    // Most recent first
    assert.strictEqual(history[0].id, doc3.id);
    assert.strictEqual(history[1].id, doc2.id);
    assert.strictEqual(history[2].id, doc1.id);
    // Verify timestamps are descending
    const t0 = new Date(history[0].timestamp).getTime();
    const t1 = new Date(history[1].timestamp).getTime();
    const t2 = new Date(history[2].timestamp).getTime();
    assert.ok(t0 >= t1 && t1 >= t2, "timestamps descending");
  });

  it("should respect limit param", async () => {
    await pawanHistoryService.clearHistory();
    for (let i = 0; i < 5; i++) {
      await pawanHistoryService.recordInteraction({ type: "consultation", instruction: `msg ${i}`, consultation: { reply: `reply ${i}` } });
    }
    const limited = await pawanHistoryService.getRecentHistory(2);
    assert.strictEqual(limited.length, 2);
    const all = await pawanHistoryService.getRecentHistory(50);
    assert.strictEqual(all.length, 5);
  });

  it("should handle attachmentMeta correctly", async () => {
    await pawanHistoryService.clearHistory();
    const doc = await pawanHistoryService.recordInteraction({
      type: "consultation",
      instruction: "Check this image",
      attachmentMeta: { hasAttachment: true, mimeType: "image/png" },
      consultation: { reply: "Image analyzed" },
    });
    assert.strictEqual(doc.attachmentMeta.hasAttachment, true);
    assert.strictEqual(doc.attachmentMeta.mimeType, "image/png");
    const history = await pawanHistoryService.getRecentHistory(5);
    assert.strictEqual(history[0].attachmentMeta.mimeType, "image/png");
  });

  it("should return structured records with required fields", async () => {
    await pawanHistoryService.clearHistory();
    const doc = await pawanHistoryService.recordInteraction({
      type: "consultation",
      device: "mobile",
      instruction: "Test structure",
      consultation: { reply: "ok", actionPlan: "plan", recommendations: [], suggestedInstruction: "do x", targetFile: "public/a.html" },
    });
    const requiredFields = ["id", "timestamp", "type", "device", "instruction", "attachmentMeta", "consultation", "executionResult"];
    for (const field of requiredFields) {
      assert.ok(field in doc, `field ${field} exists`);
    }
    assert.ok(doc.id.startsWith("pawan_int_"));
    assert.ok(!isNaN(Date.parse(doc.timestamp)), "timestamp is ISO");
  });

  it("should clear history completely", async () => {
    await pawanHistoryService.recordInteraction({ type: "consultation", instruction: "temp", consultation: { reply: "temp" } });
    let history = await pawanHistoryService.getRecentHistory(10);
    assert.ok(history.length >= 1);
    await pawanHistoryService.clearHistory();
    history = await pawanHistoryService.getRecentHistory(10);
    assert.strictEqual(history.length, 0);
    // Verify file is empty or not existent content
    if (fs.existsSync(TEST_FILE)) {
      const content = fs.readFileSync(TEST_FILE, "utf8").trim();
      assert.strictEqual(content, "");
    }
  });

  it("should persist via fallback jsonl (atomic) even without Mongo", async () => {
    await pawanHistoryService.clearHistory();
    const doc = await pawanHistoryService.recordInteraction({
      type: "consultation",
      instruction: "Fallback test",
      consultation: { reply: "fallback ok" },
    });
    // Check file exists and contains doc
    assert.ok(fs.existsSync(TEST_FILE));
    const lines = fs.readFileSync(TEST_FILE, "utf8").split("\n").filter(Boolean);
    assert.strictEqual(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.strictEqual(parsed.id, doc.id);
    assert.strictEqual(parsed.instruction, "Fallback test");
  });
});
