# 🦅 GARUDA PAWAN ASTRA™ — TELEMETRY REPAIR PLAN
## Non-Breaking, Minimum Safe Engineering Blueprint for Complete Observability

**Audit Standard**: Supreme 100% Anti-Fabrication Law ("Show > Tell", Verified Evidence, Zero Hallucination)  
**Governance Directive**: DO NOT IMPLEMENT ANY REPAIRS. WAIT FOR EXPLICIT FOUNDER PRAVEEN APPROVAL BEFORE EXECUTION.  
**Objective**: Transition PAWAN ASTRA from an isolated black-box coding tool into a fully instrumented, truthfully observable, and Founder-visible sovereign engineering weapon.

---

## 1. THE "MINIMUM SAFE REPAIR" PRINCIPLE

To respect GARUDA's operational stability and Founder Praveen's vitality:
1. **Zero Breaking Changes**: Every existing API signature (`POST /api/pawan/execute`, `POST /api/pawan/consult`, `GET /api/pawan/history`, `POST /api/pawan/build-apk`) will remain 100% backward compatible.
2. **Zero Dependency Bloat**: Use existing Node.js built-ins (`crypto`, `events`, `fs`, `perf_hooks`) and existing project libraries (`@supabase/supabase-js`, `mongoose`).
3. **Additive Telemetry Payload**: Telemetry fields (`inferenceTelemetry`, `durationMs`, `requestId`, `provider`) will be attached to existing return objects without altering their primary data structure.
4. **Immediate Data Protection**: Eliminate the destructive test purge vulnerability before any feature work.

---

## 2. PHASED REPAIR ROADMAP

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: IMMEDIATE RELIABILITY & ROUTE CORRECTION                             │
│ 1. Fix pawanHistoryService.test.js to use an isolated temp file (stop purges) │
│ 2. Correct Express routing in astraRoutes.js (eliminate dead/masked routes)   │
│ 3. Wrap executeTask with guaranteed failure-audit capture on 500 errors        │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────────────────────┐
│ PHASE 2: INFERENCE & EXECUTION INSTRUMENTATION                                │
│ 1. Instrument callLLM() to return { provider, model, latencyMs, tokens }      │
│ 2. Propagate req.garudaContext.requestId & sessionId into AstraExecutionEngine│
│ 3. Add startTime, endTime, durationMs, and token counters to audit records    │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────────────────────┐
│ PHASE 3: EVENT NERVOUS SYSTEM & CLOUD PERSISTENCE                             │
│ 1. Define PAWAN event types in garudaEventTypes.js                            │
│ 2. Emit verified SHA-256 sealed events to garudaEventService                  │
│ 3. Wire real MongoDB & Supabase dual-tier ledger with safe idempotency        │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────────────────────┐
│ PHASE 4: FOUNDER DASHBOARD INTEGRATION & REAL-TIME STREAMING                  │
│ 1. Add Astra telemetry aggregator into founderCommandService                  │
│ 2. Expose live Astra KPI widget on High Command Center (/command-center)      │
│ 3. Implement SSE trajectory stream endpoint for PawanCodingStudio.jsx UI      │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. STEP-BY-STEP REPAIR SPECIFICATIONS

### PHASE 1: Immediate Reliability & Route Normalization

#### Step 1.1: Protect Production History from Test Wipes
- **File**: `src/services/pawanHistoryService.js` and `pawanHistoryService.test.js`
- **Change**:
  - In `pawanHistoryService.js`, support an environment or constructor override: `const DATA_FILE = process.env.PAWAN_HISTORY_FILE || path.join(...);`.
  - In `pawanHistoryService.test.js`, configure `process.env.PAWAN_HISTORY_FILE = path.join(__dirname, "../../data/test-pawan-history.jsonl");` before running tests, and ensure cleanup deletes only the test file.
  - Guard `clearHistory()` so it NEVER drops production MongoDB unless explicitly passed `{ allowProductionDrop: true }` with verified Founder authentication.

#### Step 1.2: Correct Route Masking in `src/routes/astraRoutes.js`
- **File**: `src/routes/astraRoutes.js`
- **Change**:
  - Remove dead route `router.post("/pawan/execute")` (line 125).
  - Unify `/history` routing: Ensure `router.get("/history")` queries `pawanHistoryService.getRecentHistory(limit)` with fallback to `engine.getAuditHistory(limit)`, providing a consolidated chronological view.
  - Remove the masked `router.get("/pawan/history")` at line 150.

#### Step 1.3: Guaranteed Failure Telemetry on Unhandled Exceptions
- **File**: `src/routes/astraRoutes.js` (Lines 72–77) & `astraExecutionEngine.js`
- **Change**:
  - Wrap `executeTask` in a `try...catch` block that unconditionally calls `this._logAudit({ taskId, success: false, error: err.message, status: "FATAL_CRASH", durationMs: ... })` before throwing or returning HTTP 500.

---

### PHASE 2: Inference & Execution Instrumentation

#### Step 2.1: Instrument `callLLM` to Capture Telemetry
- **File**: `src/services/astraCodingAgent/astraExecutionEngine.js` (Lines 289–425)
- **Change**:
  - Refactor `callLLM(prompt, options)` to return a structured completion object:
    ```javascript
    {
      text: "...",
      provider: "groq" | "gemini" | "nvidia" | "sovereign_cascade",
      model: "gemini-2.5-flash" | "llama-3.3-70b-versatile" | ...,
      latencyMs: 1420,
      tokens: {
        promptTokens: 412,
        completionTokens: 850,
        totalTokens: 1262
      },
      attempts: [
        { provider: "gemini", model: "gemini-2.5-flash", error: "RATE_LIMIT_429", latencyMs: 310 }
      ]
    }
    ```
  - For backward compatibility with callers expecting a string, support `options.rawStringOnly ? res.text : res`.

#### Step 2.2: Thread `requestId` and `sessionId` Through Execution
- **File**: `src/routes/astraRoutes.js` (Line 46) & `astraExecutionEngine.js` (Line 828)
- **Change**:
  - In `astraRoutes.js`:
    ```javascript
    const requestId = req.garudaContext?.requestId || req.headers["x-request-id"] || `REQ-${Date.now()}`;
    const sessionId = req.headers["x-session-id"] || req.body?.sessionId || null;
    const result = await engine.executeTask(instruction, {
      requestId,
      sessionId,
      targetFile,
      searchQuery,
      code,
      currentCode,
      summary,
      attachment
    });
    ```
  - In `executeTask`: Include `requestId` and `sessionId` in `trajectory`, `finalResult`, and `_logAudit`.

#### Step 2.3: Record Exact Start Time, End Time, and Duration
- **File**: `src/services/astraCodingAgent/astraExecutionEngine.js`
- **Change**:
  - `const startTime = Date.now();`
  - In `finalResult`: Attach `startedAt: new Date(startTime).toISOString()`, `completedAt: new Date().toISOString()`, `durationMs: Date.now() - startTime`.

---

### PHASE 3: Event Nervous System & Database Persistence

#### Step 3.1: Register PAWAN Event Types
- **File**: `src/services/garudaEventTypes.js`
- **Change**:
  - Add to `GARUDA_EVENT_TYPES`:
    ```javascript
    // Universe 04: PAWAN Autonomous Coding
    PAWAN_TASK_STARTED: "PAWAN_TASK_STARTED",
    PAWAN_TASK_COMPLETED: "PAWAN_TASK_COMPLETED",
    PAWAN_TASK_FAILED: "PAWAN_TASK_FAILED",
    PAWAN_SELF_HEAL_CYCLE: "PAWAN_SELF_HEAL_CYCLE",
    PAWAN_ARTIFACT_GENERATED: "PAWAN_ARTIFACT_GENERATED",
    PAWAN_ROLLBACK_TRIGGERED: "PAWAN_ROLLBACK_TRIGGERED"
    ```
  - Add to `GARUDA_ENTITY_TYPES`: `PAWAN_TASK: "pawan_task"`, `PAWAN_ARTIFACT: "pawan_artifact"`.

#### Step 3.2: Emit Nervous System Events on Execution Lifecycle
- **File**: `src/services/astraCodingAgent/astraExecutionEngine.js`
- **Change**:
  - Emit `PAWAN_TASK_STARTED` upon task receipt.
  - Emit `PAWAN_SELF_HEAL_CYCLE` when validation fails and auto-repair begins.
  - Emit `PAWAN_TASK_COMPLETED` or `PAWAN_TASK_FAILED` upon finish, sealed with SHA-256 cryptographic digest.

#### Step 3.3: Idempotent Dual-Tier History Persistence
- **File**: `src/services/pawanHistoryService.js`
- **Change**:
  - Use `idempotencyKey: data.requestId || data.taskId` to prevent duplicate history records.
  - Save unified records containing both high-level interaction metadata and deep execution trajectory.

---

### PHASE 4: Founder Dashboard & Real-Time Streaming

#### Step 4.1: Integrate Astra Telemetry into `founderCommandService`
- **File**: `src/services/founderCommandService.js`
- **Change**:
  - In `getCommandCenterSnapshot()`, add an `astraCoding` block:
    ```javascript
    astraCoding: {
      status: "online",
      totalTasks: 68,
      successRate: "94.1%",
      avgDurationMs: 8420,
      activeProviders: ["groq", "gemini"],
      selfHealSuccessRate: "100%",
      lastTask: {
        taskId: "ASTRA-...",
        file: "public/lead_intelligence_live_e2e.html",
        timestamp: "...",
        success: true
      }
    }
    ```

#### Step 4.2: Add Live Astra Telemetry Card to High Command Center
- **File**: `frontend/src/pages/HighCommandCenter.jsx`
- **Change**:
  - Add a dedicated "PAWAN Coding Engine" telemetry tile displaying real-time task counts, success rate, latest SHA-256 seal, and link to `/pawan`.

#### Step 4.3: Real-Time Trajectory Streaming (SSE)
- **File**: `src/routes/astraRoutes.js` & `frontend/src/pages/PawanCodingStudio.jsx`
- **Change**:
  - Create endpoint: `GET /api/pawan/execute/stream?taskId=...` (or support chunked transfer encoding on `POST /api/pawan/execute`).
  - As the ReAct loop progresses (`INSPECTION` -> `LLM_SYNTHESIS` -> `PATCH_APPLIED` -> `VALIDATING` -> `SELF_HEALING`), stream events to the client so Founder Praveen sees the live thoughts and actions of the agent as they happen.

---

## 4. DATA CONTRACT SPECIFICATION (AFTER REPAIR)

The unified execution telemetry contract returned to the client and logged to storage:

```json
{
  "taskId": "ASTRA-1793380000000-xyz123",
  "requestId": "req_01hz987654321",
  "sessionId": "sess_founder_cockpit_01",
  "success": true,
  "file": "public/app.html",
  "startedAt": "2026-11-01T01:00:00.000Z",
  "completedAt": "2026-11-01T01:00:06.420Z",
  "durationMs": 6420,
  "inferenceTelemetry": {
    "provider": "google-gemini",
    "model": "gemini-2.5-flash",
    "latencyMs": 2840,
    "tokens": {
      "promptTokens": 540,
      "completionTokens": 1820,
      "totalTokens": 2360
    },
    "attemptsCount": 1,
    "failovers": []
  },
  "validation": {
    "valid": true,
    "exitCode": 0,
    "engine": "html-script-deep-validator",
    "sha256": "403662866bee7dd59ff0b5c190735bc2526a87163413a8e403490e93510b67bb",
    "stderr": ""
  },
  "healCyclesRun": 1,
  "rollbackExecuted": false,
  "trajectory": [
    { "step": "INSPECTION", "timestamp": "...", "instruction": "..." },
    { "step": "PATCH_APPLIED", "file": "public/app.html", "method": "full_content" },
    { "step": "VALIDATION_FAILED", "cycle": 1, "stderr": "SyntaxError: Unterminated template..." },
    { "step": "SELF_HEAL_PATCH_APPLIED", "cycle": 1, "summary": "Fixed template literal" },
    { "step": "VERIFIED_CLEAN", "sha256": "..." }
  ]
}
```

---

## 5. MIGRATION & SAFETY GUARDS

1. **Rollback Snapshot Preservation**: The existing snapshot engine (`preSnapshot`) in `astraExecutionEngine.js` will remain untouched to protect repositories from corruption.
2. **Graceful Fallback on Missing Keys**: If Supabase or MongoDB is offline, telemetry continues writing synchronously to `data/astra/audit-trail.jsonl` and `data/pawan-history.jsonl` without dropping events.
3. **Audit Rotation Guard**: Implement an automated file cap (e.g. maximum 5,000 records or 50MB per file) that archives older records into `data/astra/archive/` without data loss.

---

*Certified under GARUDA Sovereign Engineering Governance.*  
**Founder & Supreme Authority**: Praveen Mahawar  
**Prepared by**: Antigravity Autonomous Lead System
