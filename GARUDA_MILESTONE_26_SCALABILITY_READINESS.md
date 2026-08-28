# GARUDA — SCALABILITY READINESS & CONCURRENCY BOUNDARY (MILESTONE 26)

---

## 1. Concurrency Boundaries

| Concurrency Tier | Architecture Support | Current Status | Limiting Factors |
| :--- | :---: | :---: | :--- |
| **Stage 1: Safe Current Concurrency (1–10 Active Projects)** | Node.js Event Loop + `ParallelGovernedWorkerQueue` + In-Memory/Mongo locks | **READY & TESTED** | Verified locally and in production smoke tests |
| **Stage 2: Target 100 Concurrent Projects** | Redis/BullMQ Distributed Queue + Dedicated Worker Containers + Per-Project Git Worktrees | **ARCHITECTED (Next)** | Requires external Redis broker and containerized worker pools |
| **Stage 3: Target 1,000+ Concurrent Projects** | Multi-Region Kubernetes / Fly.io Machines + Distributed RAG Sharding + LLM Multi-Provider Failover Pool | **ROADMAP** | Requires distributed cluster isolation and enterprise quota management |

---

## 2. Scalability Requirements Matrix (Stage 2 Target 100)
1. **Persistent Distributed Queue:** Replacing process-local task arrays with Redis/BullMQ so worker tasks survive Node.js container restarts.
2. **Worker & Workspace Isolation:** Each active mission allocated a clean temporary directory or isolated git branch worktree with sandboxed execution.
3. **LLM Rate-Limit Management:** Multi-key round-robin pooling across Gemini 2.5 Flash, Gemini Flash Lite, and NVIDIA NIM endpoints.
4. **Tenant Data Isolation:** Scoped collection indexing by `companyId` and `clientId`.
5. **Observability & Health Checks:** Prometheus/Grafana or Datadog metrics on worker queue depth, latency, and failure rates.
