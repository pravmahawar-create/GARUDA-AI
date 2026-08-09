import React, { useEffect, useRef, useState } from "react";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#f5d76e";
const BG = "#04070a";
const PANEL = "linear-gradient(165deg, rgba(245,215,110,0.06), rgba(10,14,20,0.92))";
const BORDER = "rgba(245,215,110,0.14)";
const MUTED = "#8d95a7";
const OK = "#34d399";
const WARN = "#fbbf24";
const BAD = "#f87171";

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { credentials: "same-origin", signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function money(amount, currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR"),
      maximumFractionDigits: 0
    }).format(Number(amount || 0));
  } catch {
    return `${currency || "INR"} ${Number(amount || 0).toLocaleString("en-IN")}`;
  }
}

function statusTone(label) {
  const status = String(label || "").toLowerCase();
  if (["healthy", "ready", "paid", "won", "approved", "received", "live", "paid", "captured"].some((k) => status.includes(k))) return OK;
  if (["offline", "not configured", "failed", "error", "blocked", "rejected", "cancelled", "expired"].some((k) => status.includes(k))) return BAD;
  if (["pending", "awaiting", "submitted", "found", "identified", "test", "review", "warning"].some((k) => status.includes(k))) return WARN;
  return MUTED;
}

function StatusPill({ value }) {
  const color = value === undefined || value === null || value === "" ? MUTED : toneOf(value);
  const text = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color, fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}88` }} />
      {text}
    </span>
  );
}
function toneOf(value) {
  const v = String(value).toLowerCase();
  if (["healthy", "ready", "paid", "received", "approved", "captured", "configured", "good", "ok", "true", "active", "live"].some((k) => v === k || v.startsWith(k))) return OK;
  if (["offline", "not configured", "failed", "error", "unconfigured", "false", "invalid"].some((k) => v === k || v.includes(k))) return BAD;
  if (["pending", "awaiting", "test", "created", "found", "submitted", "checking", "mixed", "partial"].some((k) => v.includes(k))) return WARN;
  return MUTED;
}

function Card({ title, icon, children }) {
  return (
    <section style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "1.5rem 1.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
        <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: "rgba(245,215,110,0.1)", color: GOLD, fontSize: "1rem" }}>{iconFor(title)}</span>
        <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.12em", color: "#fff" }}>{title}</h3>
      </div>
      {children}
    </section>
  );
}
function iconFor(title) {
  const map = {
    "Founder authentication": "◈",
    "Backend health": "●",
    "Payment gateway": "₨",
    Opportunities: "⌾",
    "Recorded revenue": "₹",
    "Mission candidates": "▤",
    "Data integrity": "✓"
  };
  return map[title] || "·";
}

function Row({ left, right, mutedRight = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.88rem" }}>
      <span style={{ color: MUTED }}>{left}</span>
      <span style={{ color: mutedRight ? MUTED : "#e2e9ee", fontWeight: 600, textAlign: "right" }}>{right}</span>
    </div>
  );
}

function LoadingCell() {
  return <p style={{ color: MUTED, fontSize: "0.85rem" }}>Checking…</p>;
}
function ErrorCell({ message = "Unavailable" }) {
  return <p style={{ color: BAD, fontSize: "0.85rem", margin: 0 }}>Unavailable — {message}</p>;
}

function pickList(body, keys) {
  if (!body) return [];
  const direct = body.data;
  if (Array.isArray(direct)) return direct;
  if (direct && typeof direct === "object") {
    for (const key of keys) if (Array.isArray(direct[key])) return direct[key];
  }
  for (const key of keys) if (Array.isArray(body[key])) return body[key];
  return [];
}

function pickCount(body, keys) {
  if (!body) return 0;
  if (typeof body.count === "number") return body.count;
  const direct = body.data;
  if (Array.isArray(direct)) return direct.length;
  if (direct && typeof direct === "object") {
    for (const key of keys) if (Array.isArray(direct[key])) return direct[key].length;
  }
  return 0;
}

function tokenize(list) {
  return list.reduce((acc, item) => { const s = String(item.status || "unknown"); acc[s] = (acc[s] || 0) + 1; return acc; }, {});
}

export default function FounderWorkspace({ onLogout }) {
  const [snap, setSnap] = useState(initialState());
  const mounted = useRef(true);

  function initialState() {
    return {
      backend: { loading: true, data: null, error: "" },
      auth: { loading: true, data: null, error: "" },
      payment: { loading: true, data: null, error: "" },
      opportunities: { loading: true, data: null, error: "" },
      revenue: { loading: true, data: null, error: "" },
      candidates: { loading: true, data: null, error: "" },
      refreshedAt: null
    };
  }

  async function loadAll() {
    setSnap(initialState());
    const results = {};

    const tasks = {
      backend: () => fetchJson("/api/health").then((d) => d).catch((e) => ({ error: e.message })),
      auth: () => fetchJson("/api/auth/status").then((d) => d).catch((e) => ({ error: e.message })),
      payment: () => fetchJson("/api/scout/payment/bridge").then((d) => d).catch((e) => ({ error: e.message })),
      opportunities: () => fetchJson("/api/scout/opportunities").then((d) => d).catch((e) => ({ error: e.message })),
      revenue: () => fetchJson("/api/revenue").then((d) => d).catch((e) => ({ error: e.message })),
      candidates: () => fetchJson("/api/revenue/candidates").then((d) => d).catch((e) => ({ error: e.message }))
    };

    await Promise.all(Object.entries(tasks).map(async ([key, fn]) => {
      const raw = await fn();
      if (mounted.current) results[key] = raw;
    }));

    if (!mounted.current) return;

    const isErr = (raw) => Boolean(raw && (raw.error || (raw.success === false && raw.message)));
    const errOf = (raw) => (raw && (raw.error || (raw.success === false ? raw.message : ""))) || "";
    const wrap = (key, raw) => ({
      loading: false,
      data: isErr(raw) ? null : raw,
      error: isErr(raw) ? errOf(raw) : ""
    });

    setSnap({
      backend: wrap("backend", results.backend),
      auth: wrap("auth", results.auth),
      payment: wrap("payment", results.payment),
      opportunities: wrap("opportunities", results.opportunities),
      revenue: wrap("revenue", results.revenue),
      candidates: wrap("candidates", results.candidates),
      refreshedAt: new Date()
    });
  }

  useEffect(() => {
    mounted.current = true;
    loadAll();
    return () => { mounted.current = false; };
  }, []);

  const backend = snap.backend;
  const auth = snap.auth;
  const payment = snap.payment;
  const opportunities = snap.opportunities;
  const revenue = snap.revenue;
  const candidates = snap.candidates;

  const backendOk = backend.loading ? null : (backend.data && String(backend.data.status) === "healthy" || backend.data?.ok) ? "healthy" : "offline";

  const paymentMode = payment.loading ? null : (payment.data?.payment?.mode ? String(payment.data.payment.mode) : "unknown");
  const webhookReady = payment.loading ? null : (payment.data?.payment?.webhookSecretConfigured === true);

  const oppList = opportunities.data ? pickList(opportunities.data, ["opportunities"]) : [];
  const oppCount = oppList.length || pickCount(opportunities.data, ["opportunities"]);
  const oppByStatus = tokenize(oppList);

  const revList = revenue.data ? pickList(revenue.data, ["records", "data", "items"]) : [];
  const revCount = revList.length;
  const revTotal = revList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const revCurrency = revList[0]?.currency || "INR";

  const candList = candidates.data ? pickList(candidates.data, ["candidates", "data", "missions"]) : [];
  const candCount = candList.length;

  const backendPill = backend.loading ? { text: "Checking", color: MUTED } : backendOk === "healthy" ? { text: "Backend live", color: OK } : { text: "Offline", color: BAD };
  const recentOpp = oppList.slice(0, 5);
  const recentRev = revList.slice(0, 5);

  const containerStyle = {
    minHeight: "100vh",
    background: `radial-gradient(circle at 80% 0%, rgba(245,215,110,0.05), transparent 40%), ${BG}`,
    color: "#E5E9EE",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
  };

  return (
    <div style={containerStyle}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem clamp(1.25rem, 4vw, 4rem)", borderBottom: `1px solid ${BORDER}`, background: "rgba(4,7,10,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: 40, height: 40, display: "grid", placeItems: "center", overflow: "hidden", borderRadius: 10 }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.1em", color: "#fff" }}>GARUDA</span>
            <span style={{ fontSize: "0.6rem", color: GOLD, letterSpacing: "0.26em", fontWeight: 700, marginTop: "0.15rem" }}>FOUNDER CONSOLE</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <StatusPill value={backendPill.text} key={backendPill.text} />
          <button type="button" onClick={loadAll} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#d8dee6", padding: "0.45rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            Refresh
          </button>
          {onLogout && (
            <button type="button" onClick={onLogout} style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171", padding: "0.45rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: "clamp(2.5rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 4rem)", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ margin: "0 0 0.6rem", color: GOLD, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.26em" }}>FOUNDER CONSOLE — LIVE OPERATIONAL VIEW</p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.01em", color: "#fff" }}>Clean command. Only verified data.</h1>
          <p style={{ margin: "0.9rem 0 0", color: MUTED, maxWidth: 640, fontSize: "1rem", lineHeight: 1.7 }}>
            Every figure on this page is read directly from GARUDA&apos;s system of record. GARUDA shows the truth it currently has — no simulated activity, no estimated revenue, no numbers invented for appearance.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
          <Card title="Founder authentication">
            {auth.loading ? <LoadingCell /> : auth.error ? <ErrorCell message={auth.error} /> : (
              <>
                <Row left="Access control" right={auth.data.authenticated === true ? "Authenticated" : "Session check pending"} mutedRight={auth.data.authenticated !== true} />
                <Row left="Password protection" right={auth.data.mode || "—"} />
                <Row left="Session endpoint" right={auth.data.config?.sessionEndpoint ? "Configured" : "—"} mutedRight />
              </>
            )}
          </Card>

          <Card title="Backend health">
            {backend.loading ? <LoadingCell /> : backend.error ? <ErrorCell message={backend.error} /> : (
              <div>
                <Row left="Service" right={backend.data?.service || "GARUDA backend"} />
                <Row left="Status" right={backendOk === "healthy" ? "Healthy" : "Not healthy"} />
                <Row left="Database" right="MongoDB" />
                <Row left="Responded at" right={backend.data?.timestamp ? new Date(backend.data.timestamp).toLocaleTimeString() : "—"} mutedRight />
              </div>
            )}
          </Card>

          <Card title="Payment gateway">
            {payment.loading ? <LoadingCell /> : payment.error ? <ErrorCell message={payment.error} /> : (
              <div>
                <Row left="Provider" right="Razorpay" />
                <Row left="Mode" right={paymentMode === "test" ? "TEST" : paymentMode} mutedRight={paymentMode !== "live"} />
                <Row left="Configured" right={payment.data?.payment?.ready ? "Yes" : "Not configured"} mutedRight={!payment.data?.payment?.ready} />
                <Row left="Webhook" right={webhookReady ? "Verified" : "Not verified"} mutedRight={!webhookReady} />
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem", marginTop: "1.2rem" }}>
          <Card title="Pipeline · opportunities">
            {opportunities.loading ? <LoadingCell /> : opportunities.error ? <ErrorCell message={opportunities.error} /> : (
              <div>
                <Row left="Total found" right={String(oppCount)} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "0.8rem 0" }}>
                  {Object.entries(oppByStatus).map(([status, n]) => (
                    <span key={status} style={{ padding: "0.25rem 0.6rem", borderRadius: 6, background: "rgba(245,215,110,0.08)", border: `1px solid ${BORDER}`, color: "#cfd6de", fontSize: "0.72rem", fontWeight: 600 }}>
                      {status} · {n}
                    </span>
                  ))}
                </div>
                {recentOpp.length ? (
                  <div>
                    {recentOpp.map((o, i) => (
                      <Row key={i} left={o.title || o.client || "—"} right={o.status || "—"} mutedRight />
                    ))}
                  </div>
                ) : <p style={{ color: MUTED, fontSize: "0.85rem", margin: 0 }}>No opportunities on record yet.</p>}
              </div>
            )}
          </Card>

          <Card title="Recorded revenue">
            {revenue.loading ? <LoadingCell /> : revenue.error ? <ErrorCell message={revenue.error} /> : (
              <div>
                <Row left="Transactions recorded" right={String(revCount)} />
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: GOLD, margin: "0.6rem 0" }}>{money(revTotal, revCurrency)}</div>
                <p style={{ margin: 0, color: MUTED, fontSize: "0.8rem", lineHeight: 1.5 }}>
                  Total across {revCount} stored record{revCount === 1 ? "" : "s"}. Shows only verified figures; zero means nothing is recorded yet.
                </p>
                {recentRev.length ? (
                  <div style={{ marginTop: "0.8rem" }}>
                    {recentRev.map((r, i) => (
                      <Row key={i} left={r.client || "Record"} right={`${money(r.amount, r.currency)} · ${r.status || "received"}`} mutedRight />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          <Card title="Mission candidates">
            {candidates.loading ? <LoadingCell /> : candidates.error ? <ErrorCell message={candidates.error} /> : (
              <div>
                <Row left="Awaiting founder review" right={String(candCount)} />
                <p style={{ margin: "0.7rem 0 0", color: MUTED, fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Candidates represent real AI services that can be built on approval. Nothing executes without the founder&apos;s explicit decision.
                </p>
              </div>
            )}
          </Card>
        </div>

        <Card title="Data integrity">
          <p style={{ margin: 0, color: MUTED, fontSize: "0.86rem", lineHeight: 1.7 }}>
            GARUDA does not display or generate metrics it cannot source from a stored record. If a section shows “—” or “Unavailable”, that data simply is not present — it is never estimated. Payment amounts mirror the Razorpay request exactly.
          </p>
        </Card>
      </main>
    </div>
  );
}