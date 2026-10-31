# 🦅 GARUDA PAWAN ASTRA™ — MEMORY ARCHITECTURE REPORT

**Document ID:** GARUDA-MEM-ARCH-001  
**Authoritative Location:** `D:\GARUDA-AI\PAWAN_MEMORY_ARCHITECTURE_REPORT.md`  
**System:** 5-Tier Memory Intelligence System (`pawanMemoryService.js`)  
**Date:** November 1, 2026  
**Status:** IMPLEMENTED, BENCHMARKED & VERIFIED  

---

## 1. 5-TIER MEMORY TAXONOMY

PAWAN ASTRA has been equipped with a persistent 5-tier memory model:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PAWAN ASTRA 5-TIER MEMORY MODEL                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. SHORT-TERM WORKING MEMORY                                            │
│    Active session state, current file, user goals, in-memory cache      │
│    (Session-scoped Map + data/pawan-memory-store.json)                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. LONG-TERM PERSISTENT MEMORY                                          │
│    Founder directives, permanent architectural constraints, preferences │
│    Auto-harvested from conversations + explicit storePersistentMemory() │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. EPISODIC MEMORY                                                      │
│    Specific execution history: tasks, problems, solutions, outcomes     │
│    (data/pawan-episodes.jsonl)                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. SEMANTIC MEMORY                                                      │
│    Structured knowledge: tech stack, project architecture, facts        │
│    TF-IDF token matching + phrase bonus + recency weighting            │
├─────────────────────────────────────────────────────────────────────────┤
│ 5. PROCEDURAL MEMORY                                                    │
│    Reusable repair workflows, successful validation sequences, anti-    │
│    patterns (data/memory/pawan-lessons.jsonl)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CONVERSATION INTENT HARVESTING

Whenever Founder Praveen or a user interacts via `/api/pawan/consult` or `/api/pawan/execute`:
1. The conversation turn is recorded into persistent memory via `storeConversationTurn()`.
2. The `_harvestDirectives()` engine scans the incoming text for permanent decisions and Founder mandates:
   - Directives: *"Use MongoDB with replicaSet"*, *"Always use Tailwind"*, *"Never use external font CDNs"*, *"Remember this for project X"*.
3. Matching instructions are automatically upgraded to `FOUNDER_INSTRUCTION` (Importance: 9) in the persistent store, eliminating the need for Founder Praveen to repeat instructions in future sessions.

---

## 3. CONTEXT-AWARE RETRIEVAL ENGINE (RAG)

Before generating code or answering architectural questions:
1. `retrieveContext({ query, projectId, limit, minImportance })` searches all persistent and semantic memories.
2. **Relevance Scoring Algorithm:**
   - **Token Overlap:** +3 points per matching keyword.
   - **Exact Phrase Match:** +8 points bonus for exact phrase containment.
   - **Project Exact Match:** +4 points for matching `projectId`.
   - **Founder Directive Priority:** +5 points for `FOUNDER_INSTRUCTION`.
   - **Recency Decay:** +3 points (<24h), +1 point (<7d).
   - **Importance Weighting:** `importance * 0.5`.
3. **Prompt Addendum:** Top-scoring memories are synthesized into a structured context prompt block:
   ```
   RELEVANT PERSISTENT MEMORY & FOUNDER INSTRUCTIONS:
   • [FOUNDER_INSTRUCTION | Project: project-phoenix-core] Always configure MongoDB with replicaSet rs0 and connection timeout 5000ms
   (Apply these verified requirements and constraints without requiring the user to repeat them.)
   ```

---

## 4. MULTI-PROJECT ISOLATION & SECURITY

- **Project Boundary Enforcement:** Memories tagged with `projectId: "project-a"` are strictly isolated and never leaked to `project-b`, unless explicitly marked `isGlobal: true` (e.g. global Founder governance rules).
- **Secret Sanitization:** All text ingested or retrieved passes through `sanitizeSecrets()` and `sanitizeObject()`. Gemini API keys (`AIzaSy...`), Groq keys (`gsk_...`), NVIDIA keys (`nvapi-...`), Cerebras keys (`csk-...`), passwords, and bearer tokens are automatically replaced with `[REDACTED]`.

---

## 5. CROSS-SESSION VERIFICATION EVIDENCE (TESTS A THROUGH F)

The mandatory cross-session protocol was executed via `src/services/pawanMemory.test.js`:

| Step | Test Objective | Observed Behavior | Verification Status |
|:---|:---|:---|:---:|
| **Test A** | Store unique instruction in Session 1 | Stored: *"Always configure MongoDB with replicaSet rs0 and connection timeout 5000ms"* for `project-phoenix-core` | **PASSED** (ID: `mem_p_1730404...`) |
| **Test B** | Close and terminate Session 1 | `clearWorkingMemory("sess_active_1001")` executed; working state purged | **PASSED** (Null return confirmed) |
| **Test C** | Spawn genuinely new Session 2 | `setWorkingMemory("sess_active_2002")` initialized with blank context | **PASSED** (New isolated session) |
| **Test D** | Recall instruction in Session 2 | Queried: *"How should we configure MongoDB for this project?"* | **PASSED** (1 match returned) |
| **Test E** | Match retrieved against original | Retrieved content matches verbatim: *"Always configure MongoDB with replicaSet rs0..."* | **PASSED** (Exact match) |
| **Test F** | Verify retrieval after service reload | Spawned fresh instance `new PawanMemoryService()`; queried disk store | **PASSED** (Verified from disk) |

**Conclusion:** PAWAN ASTRA retains verified cross-session memory without degradation.
