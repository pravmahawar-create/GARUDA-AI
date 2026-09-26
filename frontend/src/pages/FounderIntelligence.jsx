import { useEffect, useRef, useState } from "react";
import {
  founderIntelligenceChat,
  founderMeetingStart,
  founderMeetingSplit,
  founderListClients,
  founderCreateClient,
} from "../services/api";

const CHIP_COMMANDS = [
  { key: "1", label: "[Analyse Business]", text: "Is client ka business analyse karo — modules, automation aur scope samjhao", intentHint: "analyze" },
  { key: "2", label: "[Calculate Price]", text: "Calculate Price — 6 pages 4 features ka quote chahiye", intentHint: "pricing" },
  { key: "3", label: "[Research Market]", text: "Research Market — current GARUDA pricing aur market research chahiye", intentHint: "research" },
  { key: "4", label: "[Negotiation]", text: "Customer kam quote maang raha hai — negotiation strategy chahiye", intentHint: "negotiation" },
  { key: "5", label: "[Generate Proposal]", text: "Proposal bana do — scope aur pricing ke saath", intentHint: "proposal" },
  { key: "6", label: "[Client Memory]", text: "Returning client — pehle kya discuss hua tha?", intentHint: "client_memory" },
  { key: "7", label: "[Technical Feasibility]", text: "Margin aur break-even feasibility check karo", intentHint: "feasibility" },
  { key: "8", label: "[Meeting Mode]", action: "meeting" },
];

const MODULES = [
  "Business Analysis",
  "Pricing Intelligence",
  "Evidence System",
  "Negotiation Advisor",
  "Proposal Copilot",
  "Client Memory",
  "Meeting Mode",
  "Learning Loop",
];

const PANEL_SECTIONS = [
  "Recommendation",
  "Pricing",
  "Evidence",
  "Sources",
  "Assumptions",
  "Missing Information",
  "Risks",
  "Negotiation",
  "Next Action",
  "Client Context",
];

function LabelBadge({ label }) {
  if (!label) return null;
  const colors = {
    VERIFIED: ["#064e3b", "#6ee7b7"],
    PARTIAL: ["#3b2f04", "#fde047"],
    ESTIMATE: ["#1e3a8a", "#93c5fd"],
    "FOUNDER JUDGMENT": ["#3b0764", "#d8b4fe"],
    PLANNED: ["#0c4a6e", "#7dd3fc"],
    UNKNOWN: ["#1f2937", "#9ca3af"],
    BLOCKED: ["#450a0a", "#fca5a5"],
    CONTRADICTED: ["#450a0a", "#f87171"],
  };
  const [bg, fg] = colors[label] || ["#1f2937", "#cbd5e1"];
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${fg}44`, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 800, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function QuoteBlock({ quote }) {
  if (!quote?.minINR && quote?.minINR !== 0) return null;
  return (
    <div style={{ marginTop: 8, padding: "10px 12px", border: "1px #334155", borderStyle: "solid", borderRadius: 8, background: "linear-gradient(135deg,#0b1220,#101a2e)" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.6 }}>GARUDA QUOTE RANGE</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>
        ₹{(quote.minINR ?? 0).toLocaleString("en-IN")} – ₹{(quote.maxINR ?? 0).toLocaleString("en-IN")}
      </div>
      <div style={{ marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <LabelBadge label={quote.label} />
        <span style={{ fontSize: 11, color: "#64748b" }}>{quote.basis || ""}</span>
      </div>
    </div>
  );
}

function fmtVal(v) {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === "object" ? x.risk || JSON.stringify(x) : x)).join(" · ") : "—";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 150);
  return String(v).slice(0, 180);
}

function AnalysisCard({ analysis }) {
  if (!analysis) return null;
  return (
    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 6 }}>
      {Object.entries(analysis).map(([field, cell]) => (
        <div key={field} title={fmtVal(cell?.value)} style={{ border: "1px solid #1e293b", background: "#0a101c", borderRadius: 6, padding: "6px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>{field}</span>
            <LabelBadge label={cell?.label} />
          </div>
          <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 3, lineHeight: 1.35 }}>{fmtVal(cell?.value)}</div>
        </div>
      ))}
    </div>
  );
}

function PanelSection({ title, emptyText = "—", children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={styles.sectionTitle}>{title}</div>
      {children || <div style={styles.muted}>{emptyText}</div>}
    </div>
  );
}

function IntelligencePanel({ panel, label, confidence, evidence, sources, warnings, selectedClient }) {
  const pricing = panel?.pricing;
  const derived = pricing?.derived;
  return (
    <>
      <PanelSection title="Recommendation" emptyText="Command chalao — recommendation yahan aayegi.">
        {panel?.recommendation && (
          <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>
            {panel.recommendation} <LabelBadge label={label} />
            {confidence && (
              <span style={{ marginLeft: 6, fontSize: 11, color: "#64748b" }}>
                conf {confidence.score ?? "—"} · {confidence.level}
              </span>
            )}
          </div>
        )}
      </PanelSection>

      <PanelSection title="Pricing" emptyText="Pricing intent par quote + derived blocks aayenge.">
        {pricing && (
          <div style={{ fontSize: 12, color: "#cbd5e1" }}>
            {pricing.quote && (
              <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9" }}>
                ₹{(pricing.quote.minINR ?? 0).toLocaleString("en-IN")} – ₹{(pricing.quote.maxINR ?? 0).toLocaleString("en-IN")}
              </div>
            )}
            {derived?.recommendedQuote && (
              <div style={{ marginTop: 4 }}>
                Suggested: <b>₹{(derived.recommendedQuote.valueINR ?? 0).toLocaleString("en-IN")}</b>{" "}
                <LabelBadge label={derived.recommendedQuote.label} />
              </div>
            )}
            {derived?.founderFloor && (
              <div style={{ marginTop: 4 }}>
                Founder floor:{" "}
                {derived.founderFloor.valueINR != null ? (
                  <>
                    <b>₹{derived.founderFloor.valueINR.toLocaleString("en-IN")}</b> <LabelBadge label={derived.founderFloor.label} />
                  </>
                ) : (
                  <LabelBadge label="UNKNOWN" />
                )}
              </div>
            )}
            {derived?.recurring?.monthlyINR != null && (
              <div style={{ marginTop: 4 }}>
                Recurring: ₹{derived.recurring.monthlyINR.toLocaleString("en-IN")}/mo · ₹{(derived.recurring.annualINR ?? 0).toLocaleString("en-IN")}/yr{" "}
                <LabelBadge label={derived.recurring.label} />
              </div>
            )}
            <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(pricing.lineItems || []).slice(0, 4).map((li, i) => (
                <span key={i} style={{ fontSize: 10, background: "#111827", border: "1px solid #1f2937", borderRadius: 4, padding: "2px 6px", color: "#94a3b8" }}>
                  {li.name} · ₹{(li.amountINR ?? 0).toLocaleString("en-IN")}
                </span>
              ))}
            </div>
          </div>
        )}
      </PanelSection>

      <PanelSection title="Evidence" emptyText="Koi evidence nahi.">
        {(evidence || []).slice(0, 12).map((e, i) => (
          <div key={i} style={styles.evidenceRow}>
            <span style={{ fontSize: 11, color: "#cbd5e1", flex: 1 }}>{e.field}</span>
            <LabelBadge label={e.label} />
          </div>
        ))}
      </PanelSection>

      <PanelSection title="Sources" emptyText="Sources abhi nahi.">
        {(sources || []).map((s, i) => (
          <div key={i} style={styles.evidenceRow}>
            <span style={{ fontSize: 11, color: "#cbd5e1", flex: 1 }}>{s.title}</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>{s.source?.retrievedAt || s.retrievedAt || ""}</span>
          </div>
        ))}
      </PanelSection>

      <PanelSection title="Assumptions" emptyText="Koi assumption nahi.">
        {(panel?.assumptions || []).map((a, i) => (
          <div key={i} style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>• {a}</div>
        ))}
      </PanelSection>

      <PanelSection title="Missing Information" emptyText="Koi critical missing nahi.">
        {(panel?.missing || []).length === 0 && <div style={styles.muted}>None</div>}
        {(panel?.missing || []).map((m, i) => (
          <div key={i} style={{ ...styles.evidenceRow, borderColor: "#78350f" }}>
            <LabelBadge label="UNKNOWN" />
            <span style={{ fontSize: 11 }}>{m}</span>
          </div>
        ))}
      </PanelSection>

      <PanelSection title="Risks" emptyText="Koi structural risk signal nahi.">
        {(panel?.risks || []).map((r, i) => (
          <div key={i} style={{ fontSize: 11, color: "#f59e0b", lineHeight: 1.5 }}>
            ⚠ {r.risk || r} {r.label && <LabelBadge label={r.label} />}
          </div>
        ))}
        {(warnings || []).map((w, i) => (
          <div key={"w" + i} style={{ fontSize: 11, color: "#fbbf24", marginTop: 3 }}>⚠ {w}</div>
        ))}
      </PanelSection>

      <PanelSection title="Negotiation" emptyText="Negotiation intent par intel yahan aayegi.">
        {panel?.negotiation && (
          <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.55 }}>
            {panel.negotiation.closeProbability && (
              <div>
                Close probability: {panel.negotiation.closeProbability.label}{" "}
                <LabelBadge label={panel.negotiation.closeProbability.source || "UNKNOWN"} />
              </div>
            )}
            {panel.negotiation.walkAwayINR != null && <div>Walk-away: ₹{panel.negotiation.walkAwayINR.toLocaleString("en-IN")}</div>}
            {(panel.negotiation.privateGuidance || []).slice(0, 4).map((g, i) => (
              <div key={i} style={{ marginTop: 4, color: "#fca5a5" }}>• {g.guidance}</div>
            ))}
            {(panel.negotiation.unknowns || []).length > 0 && (
              <div style={{ marginTop: 4, color: "#94a3b8" }}>UNKNOWN: {(panel.negotiation.unknowns || []).join(", ")}</div>
            )}
          </div>
        )}
      </PanelSection>

      <PanelSection title="Next Action" emptyText="Action step yahan dikhega.">
        {panel?.nextAction && <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>→ {panel.nextAction}</div>}
      </PanelSection>

      <PanelSection title="Client Context" emptyText="Client select karo ya memory create karo.">
        {selectedClient && (
          <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
            <b>{selectedClient.displayName || selectedClient.clientId}</b>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{selectedClient.companyName || "—"} · {selectedClient.industry || "industry unknown"}</div>
          </div>
        )}
        {(panel?.clientContext || []).map((c) => (
          <div key={c.clientId} style={styles.evidenceRow}>
            <span style={{ fontSize: 11, color: "#cbd5e1", flex: 1 }}>{c.displayName || c.clientId}</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>{c.lastInteraction ? "history ✓" : "new"}</span>
          </div>
        ))}
      </PanelSection>
    </>
  );
}

const styles = {
  root: {
    height: "100dvh",
    maxHeight: "100dvh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(1200px 600px at 20% -10%, #0b1a33 0%, #030712 55%)",
    color: "#e2e8f0",
    position: "relative",
    WebkitTapHighlightColor: "transparent",
    overscrollBehavior: "none",
  },
  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderBottom: "1px solid #1e293b",
    background: "rgba(3,7,18,0.85)",
    backdropFilter: "blur(10px)",
    zIndex: 40,
    flexWrap: "wrap",
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "236px 1fr 348px",
    overflow: "hidden",
  },
  left: {
    borderRight: "1px solid #1e293b",
    background: "rgba(7,13,26,0.75)",
    overflowY: "auto",
    padding: "12px 10px 40px",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorY: "contain",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
  right: {
    borderLeft: "1px solid #1e293b",
    background: "rgba(7,13,26,0.85)",
    overflowY: "auto",
    padding: "12px 12px 60px",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorY: "contain",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.1,
    color: "#64748b",
    textTransform: "uppercase",
    margin: "14px 0 7px",
  },
  chip: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "#0b1220",
    border: "1px solid #1f2937",
    color: "#cbd5e1",
    borderRadius: 7,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 6,
    transition: "transform 0.16s cubic-bezier(0.16,1,0.3,1), opacity 0.16s ease, border-color 0.16s ease",
    WebkitTapHighlightColor: "transparent",
  },
  evidenceRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #1f293b",
    background: "#0a101c",
    borderRadius: 6,
    padding: "5px 8px",
    marginBottom: 5,
  },
  muted: { fontSize: 11, color: "#64748b", lineHeight: 1.5 },
  transcript: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "16px 18px",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorY: "contain",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    paddingBottom: 24,
  },
  bubbleUser: {
    background: "linear-gradient(135deg,#0e7490,#155e75)",
    border: "1px solid #164e63",
    borderRadius: "12px 12px 3px 12px",
    padding: "9px 13px",
    fontSize: 13.5,
    marginBottom: 10,
    maxWidth: "82%",
    marginLeft: "auto",
    lineHeight: 1.5,
  },
  bubbleAgent: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: "12px 12px 12px 3px",
    padding: "10px 13px",
    fontSize: 13.5,
    marginBottom: 10,
    maxWidth: "92%",
    lineHeight: 1.5,
  },
  inputBar: {
    flexShrink: 0,
    display: "flex",
    gap: 8,
    padding: "10px 14px 12px",
    borderTop: "1px solid #1e293b",
    background: "rgba(3,7,18,0.9)",
  },
  chatInput: {
    flex: 1,
    background: "#0b1220",
    border: "1px solid #1f2937",
    color: "#e2e8f0",
    borderRadius: 9,
    padding: "11px 13px",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg,#0891b2,#0e7490)",
    border: "none",
    color: "#fff",
    fontWeight: 900,
    borderRadius: 9,
    padding: "0 18px",
    fontSize: 15,
    cursor: "pointer",
    transition: "transform 0.16s cubic-bezier(0.16,1,0.3,1)",
  },
  clientSelect: {
    width: "100%",
    background: "#0b1220",
    border: "1px solid #1f2937",
    color: "#e2e8f0",
    borderRadius: 7,
    padding: "7px 8px",
    fontSize: 12,
    marginBottom: 8,
  },
};

export default function FounderIntelligence() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [panel, setPanel] = useState(null);
  const [lastEvidence, setLastEvidence] = useState([]);
  const [lastSources, setLastSources] = useState([]);
  const [lastMissing, setLastMissing] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [nextQs, setNextQs] = useState([]);
  const [meetingMode, setMeetingMode] = useState(false);
  const [meetingId, setMeetingId] = useState(null);
  const [splitView, setSplitView] = useState(null);
  const [screenSafe, setScreenSafe] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const transcriptRef = useRef(null);
  const inputRef = useRef(null);

  const selectedClient = clients.find((c) => c.clientId === selectedClientId) || null;

  useEffect(() => {
    founderListClients()
      .then((r) => setClients(r?.data?.clients || []))
      .catch(() => setClients([]));
  }, []);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  async function addClient() {
    const name = newClientName.trim();
    if (!name) return;
    try {
      const r = await founderCreateClient({ name, companyName: newClientCompany.trim() });
      const created = r?.data?.client;
      if (created?.clientId) {
        setSelectedClientId(created.clientId);
        setClients((c) => [...c, { clientId: created.clientId, displayName: created.displayName, companyName: created.companyName, industry: created.industry }]);
        setNewClientOpen(false);
        setNewClientName("");
        setNewClientCompany("");
        setMessages((m) => [...m, { role: "agent", text: `Client "${created.displayName}" memory create ho gayi.` }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "agent", text: `Client create failed: ${err.message}` }]);
    }
  }

  async function send(text, intentHint) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      let data;
      if (meetingMode && meetingId) {
        data = await founderMeetingSplit(meetingId, { text: q });
        if (data?.success) {
          setSplitView({ customerView: data.customerView, founderPrivate: data.founderPrivate });
          setLabel(data.label || null);
          setLastEvidence(data.evidence || []);
          setMessages((m) => [
            ...m,
            { role: "agent", text: "Meeting split built. Customer screen + Private panel ready.", meeting: true },
          ]);
          setBusy(false);
          return;
        }
        setMessages((m) => [
          ...m,
          { role: "agent", text: "Meeting split failed — private result suppressed (screen-share safe). Dubara try karein." },
        ]);
        return;
      }
      data = await founderIntelligenceChat({
        text: q,
        intentHint: intentHint || undefined,
        structured: selectedClientId ? { clientId: selectedClientId } : undefined,
      });
      const d = data?.data || data || {};
      setLabel(d.label || null);
      setConfidence(d.confidence || null);
      setPanel(d.panel || null);
      setLastEvidence(d.evidence || []);
      setLastSources(d.sources || []);
      setLastMissing(d.panel?.missing || d.result?.missingInputs || []);
      setWarnings(d.warnings || []);
      setNextQs(d.nextQuestions || []);
      setFatalError(null);

      let summary = null;
      let analysis = null;
      if (d.intent === "pricing" && d.result?.quote) {
        summary = { quote: d.result.quote, label: d.result.label, missing: d.result.missingInputs };
      } else if (d.intent === "analyze") {
        analysis = d.result?.analysis || null;
      } else if (d.intent === "proposal") {
        summary = d.result?.created
          ? { proposalId: d.result.proposalId, amount: d.result.proposedAmountINR, validation: d.result.validation }
          : { blocked: d.result?.reason, missing: d.result?.missingInputs };
      } else if (d.intent === "general") {
        summary = { answer: d.result?.answer };
      } else if (d.intent === "research") {
        summary = { answer: `${d.research?.findings ?? 0} findings, ${d.research?.sourceCount ?? 0} sources (label: ${d.research?.label})` };
      } else if (d.intent === "client_memory") {
        summary = d.memory?.client?.found
          ? { answer: d.memory.client.clients.map((c) => `${c.displayName || c.clientId} — ${c.lastInteraction?.summary || "no interactions"}`).join("\n") }
          : { answer: "Koi matching client memory nahi mili." };
      } else if (d.intent === "feasibility") {
        summary = d.result?.success
          ? { answer: `Calculator ${d.result.calcType} → ${JSON.stringify(d.result).slice(0, 300)}` }
          : { blocked: d.result?.reason || (d.result?.missingInputs || []).join(","), missing: d.result?.missingInputs };
      } else if (d.intent === "negotiation" || d.intent === "meeting") {
        summary = { answer: "Analysis ready — Founder panel me dekho (screen-share safe)." };
      }
      setMessages((m) => [
        ...m,
        { role: "agent", text: `Intent: ${d.intent} · label: ${d.label || "UNKNOWN"}`, summary, analysis },
      ]);
    } catch (err) {
      const msg = String(err?.message || err);
      if (/authentication required/i.test(msg)) setFatalError(msg);
      setMessages((m) => [...m, { role: "agent", text: `Error: ${msg}` }]);
      setLabel("BLOCKED");
    } finally {
      setBusy(false);
    }
  }

  async function toggleMeeting() {
    if (meetingMode) {
      setMeetingMode(false);
      setSplitView(null);
      setMeetingId(null);
      return;
    }
    try {
      const r = await founderMeetingStart({ topic: "Founder Intelligence live call" });
      const sid = r?.data?.sessionId;
      if (sid) {
        setMeetingId(sid);
        setMeetingMode(true);
        setScreenSafe(true);
        setMessages((m) => [...m, { role: "agent", text: `Meeting Mode ON (session ${sid}). Screen pe sirf customerView jayega. Screen-Safe ON.` }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "agent", text: `Meeting start failed: ${err.message}` }]);
    }
  }

  function onCommand(cmd) {
    if (cmd.action === "meeting") {
      toggleMeeting();
      return;
    }
    send(cmd.text, cmd.intentHint);
  }

  return (
    <div style={styles.root}>
      <style>{`
        html,body,#root{overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
        .fi-root *{-webkit-tap-highlight-color:transparent}
        .fi-cmd:active,.fi-chipq:active{transform:scale(0.975)}
        .fi-input:focus{border-color:#0891b2;box-shadow:0 0 0 2px rgba(8,145,178,0.25)}
        .fi-scroll::-webkit-scrollbar{width:8px;height:8px}
        .fi-scroll::-webkit-scrollbar-thumb{background:#1f2937;border-radius:8px}
        .fi-panel-toggle{display:none}
        @media (max-width:1180px){
          .fi-body{grid-template-columns:210px 1fr !important}
          .fi-right{position:fixed;top:56px;right:0;bottom:0;width:min(348px,88vw);z-index:60;transform:translateX(105%);transition:transform 0.2s cubic-bezier(0.16,1,0.3,1);box-shadow:-18px 0 40px rgba(0,0,0,0.5)}
          .fi-right.open{transform:translateX(0)}
          .fi-panel-toggle{display:inline-flex !important}
        }
        @media (max-width:760px){
          .fi-body{grid-template-columns:1fr !important;grid-template-rows:auto 1fr !important}
          .fi-left{flex-direction:row;display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;border-right:none;border-bottom:1px solid #1e293b;padding:8px 10px;overscroll-behavior-x:contain;touch-action:pan-x}
          .fi-left>div{min-width:190px;flex-shrink:0;max-height:150px;overflow-y:auto}
        }
      `}</style>

      <header style={styles.header}>
        <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.6 }}>
          🦅 GARUDA <span style={{ color: "#38bdf8" }}>FOUNDER INTELLIGENCE</span>
        </div>
        <div style={{ flex: 1 }} />
        {confidence && (
          <span style={{ fontSize: 11, color: "#64748b", border: "1px solid #1f2937", borderRadius: 5, padding: "3px 7px" }}>
            conf {confidence.score ?? "—"} · {confidence.level}
          </span>
        )}
        <LabelBadge label={label} />
        <button
          className="fi-panel-toggle"
          onClick={() => setPanelOpen((v) => !v)}
          style={{ ...styles.chip, width: "auto", display: "none", marginBottom: 0, padding: "6px 10px" }}
        >
          🧠 Panel
        </button>
        <button
          onClick={() => setScreenSafe((v) => !v)}
          style={{
            ...styles.chip,
            width: "auto",
            marginBottom: 0,
            padding: "6px 10px",
            borderColor: screenSafe ? "#14532d" : "#7f1d1d",
            color: screenSafe ? "#4ade80" : "#f87171",
          }}
        >
          {screenSafe ? "🔒 Screen-Safe ON" : "🔓 Screen-Safe OFF"}
        </button>
        <button
          onClick={toggleMeeting}
          style={{
            ...styles.chip,
            width: "auto",
            marginBottom: 0,
            padding: "6px 10px",
            borderColor: meetingMode ? "#f59e0b" : "#334155",
            color: meetingMode ? "#f59e0b" : "#cbd5e1",
          }}
        >
          {meetingMode ? "🔴 MEETING ON" : "📹 Meeting Mode"}
        </button>
      </header>

      <div className="fi-body" style={styles.body}>
        <aside className={`fi-left fi-scroll ${styles.left}`}>
          <div>
            <div style={styles.sectionTitle}>Commands</div>
            {CHIP_COMMANDS.map((c) => (
              <button key={c.key} className="fi-cmd" style={styles.chip} onClick={() => onCommand(c)} disabled={busy}>
                {c.label}
              </button>
            ))}

            <div style={styles.sectionTitle}>Client Context</div>
            <select
              className="fi-input"
              style={styles.clientSelect}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">— No client selected —</option>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.displayName || c.clientId}
                </option>
              ))}
            </select>
            {selectedClient && (
              <div style={styles.evidenceRow} title={JSON.stringify(selectedClient.chainCounts || {})}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700 }}>{selectedClient.displayName || selectedClient.clientId}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {selectedClient.companyName || "—"} · {selectedClient.industry || "—"}
                    {selectedClient.chainCounts ? ` · ${Object.values(selectedClient.chainCounts).reduce((a, b) => a + b, 0)} links` : ""}
                  </div>
                </div>
              </div>
            )}
            <button
              style={{ ...styles.chip, color: "#38bdf8", borderColor: "#164e63" }}
              onClick={() => setNewClientOpen((v) => !v)}
            >
              ＋ New Client Memory
            </button>
            {newClientOpen && (
              <div style={{ marginBottom: 8 }}>
                <input
                  className="fi-input"
                  style={{ ...styles.clientSelect, marginBottom: 5 }}
                  placeholder="Client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <input
                  className="fi-input"
                  style={{ ...styles.clientSelect, marginBottom: 5 }}
                  placeholder="Company (optional)"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                />
                <button style={{ ...styles.chip, color: "#4ade80" }} onClick={addClient}>
                  Save Client
                </button>
              </div>
            )}

            <div style={styles.sectionTitle}>Recent Clients</div>
            {clients.length === 0 && <div style={styles.muted}>No clients yet — memory adapter empty.</div>}
            {clients.slice(0, 6).map((c) => (
              <button key={c.clientId} style={{ ...styles.evidenceRow, width: "100%", cursor: "pointer" }} onClick={() => setSelectedClientId(c.clientId)}>
                <span style={{ fontSize: 11.5, color: "#cbd5e1" }}>{c.displayName || c.clientId}</span>
              </button>
            ))}

            <div style={styles.sectionTitle}>Intelligence Modules</div>
            {MODULES.map((mName) => (
              <div key={mName} style={{ ...styles.evidenceRow, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#cbd5e1", flex: 1 }}>{mName}</span>
                <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 800 }}>ACTIVE</span>
              </div>
            ))}

            <div style={styles.sectionTitle}>Rules</div>
            <div style={{ ...styles.muted, lineHeight: 1.6 }}>
              Har price ke saath source + label.<br />
              Unknown = UNKNOWN, kabhi invent nahi.<br />
              Founder private data customer screen pe kabhi nahi.
            </div>
          </div>
        </aside>

        <main style={styles.center}>
          <div className="fi-scroll" style={styles.transcript} ref={transcriptRef}>
            {messages.length === 0 && !fatalError && (
              <div style={styles.bubbleAgent}>
                Mai GARUDA Founder Intelligence hoon — GARUDA ka private Business Intelligence layer.
                <div style={{ marginTop: 6, fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
                  Business analyse → price → negotiate → propose → remember. Har output evidence-labeled.
                  Neeche commands ya direct likh kar pucho.
                </div>
              </div>
            )}
            {fatalError && (
              <div style={{ ...styles.bubbleAgent, borderColor: "#7f1d1d" }}>
                ⚠ {fatalError}
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Founder key/session required — pehle FounderLogin se login karo.
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? styles.bubbleUser : styles.bubbleAgent}>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                {m.summary?.quote && <QuoteBlock quote={{ ...m.summary.quote, label: m.summary.label }} />}
                {m.analysis && <AnalysisCard analysis={m.analysis} />}
                {m.summary?.answer && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#e2e8f0", whiteSpace: "pre-wrap" }}>{m.summary.answer}</div>
                )}
                {m.summary?.proposalId && (
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    ✅ Proposal <b>{m.summary.proposalId}</b> · ₹{m.summary.amount?.toLocaleString("en-IN")} ·{" "}
                    {m.summary.validation?.ok ? "validated" : "issues: " + m.summary.validation?.issues?.join(",")}
                  </div>
                )}
                {m.summary?.blocked && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#f59e0b" }}>
                    ⚠️ {m.summary.blocked} — missing: {(m.summary.missing || []).join(", ")}
                  </div>
                )}
              </div>
            ))}
            {busy && <div style={styles.muted}>⏳ Thinking…</div>}
          </div>

          {nextQs.length > 0 && !meetingMode && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "6px 14px 0", borderTop: "1px solid #1e293b" }}>
              {nextQs.map((q) => (
                <button
                  key={q}
                  className="fi-chipq"
                  disabled={busy}
                  onClick={() => send(q)}
                  style={{
                    background: "#0b1220",
                    border: "1px solid #164e63",
                    color: "#67e8f9",
                    borderRadius: 999,
                    padding: "5px 11px",
                    fontSize: 11.5,
                    cursor: "pointer",
                    transition: "transform 0.16s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  💡 {q}
                </button>
              ))}
            </div>
          )}

          <div style={styles.inputBar}>
            <input
              ref={inputRef}
              className="fi-input fi-cmd"
              style={styles.chatInput}
              value={input}
              disabled={busy}
              placeholder={meetingMode ? "Meeting — customer ya founder ka sawaal…" : selectedClient ? `${selectedClient.displayName} context — founder request…` : "Founder request likho…"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="fi-cmd" style={{ ...styles.sendBtn, opacity: busy ? 0.5 : 1 }} onClick={() => send()} disabled={busy}>
              ➤
            </button>
          </div>
        </main>

        <aside className={`fi-right fi-scroll ${styles.right} ${panelOpen ? "open" : ""}`}>
          {meetingMode && splitView ? (
            <>
              <div style={styles.sectionTitle}>🖥 Customer Screen (safe)</div>
              <div style={{ border: "1px solid #14532d", background: "#071410", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 13, color: "#bbf7d0" }}>{splitView.customerView?.customerGreeting}</div>
                <div style={{ fontSize: 13 }}>{splitView.customerView?.publicAnswer}</div>
                {splitView.customerView?.understanding?.business && (
                  <div style={{ fontSize: 11.5, color: "#86efac", marginTop: 6 }}>
                    Samjha: <b>{fmtVal(splitView.customerView.understanding.business.value)}</b>
                  </div>
                )}
                {splitView.customerView?.publicQuote && (
                  <div style={{ fontWeight: 800, fontSize: 17, marginTop: 6 }}>
                    ₹{splitView.customerView.publicQuote.minINR?.toLocaleString("en-IN")} – ₹
                    {splitView.customerView.publicQuote.maxINR?.toLocaleString("en-IN")}
                  </div>
                )}
                <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <LabelBadge label={splitView.customerView?.publicQuote?.label || "VERIFIED"} />
                  {splitView.customerView?.nextQuestion && (
                    <span style={{ fontSize: 11, color: "#67e8f9" }}>Next Q: {splitView.customerView.nextQuestion}</span>
                  )}
                </div>
              </div>

              <div style={styles.sectionTitle}>
                🔒 Founder Private {screenSafe ? "(hidden — Screen-Safe)" : ""}
              </div>
              {screenSafe ? (
                <div style={{ border: "1px solid #334155", borderRadius: 8, padding: 10, background: "#0b1220" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Screen-Safe ON — private panel screen share me nahi dikhega. Sirf tab OFF karo jab share band ho.
                  </div>
                </div>
              ) : (
                <div style={{ border: "1px solid #7f1d1d", background: "linear-gradient(135deg,#1a0b0b,#231010)", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, color: "#fca5a5" }}>
                    Floor:{" "}
                    {splitView.founderPrivate?.internalFloor != null
                      ? `₹${splitView.founderPrivate.internalFloor.toLocaleString("en-IN")}`
                      : "UNKNOWN (no verified cost/margin)"}{" "}
                    <LabelBadge label={splitView.founderPrivate?.marginGuidance?.label || (splitView.founderPrivate?.internalFloor != null ? "FOUNDER JUDGMENT" : "UNKNOWN")} />
                  </div>
                  {(splitView.founderPrivate?.privateGuidance || []).map((g, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#fecaca", marginTop: 6 }}>• {g.guidance}</div>
                  ))}
                  {splitView.founderPrivate?.riskAlerts?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: "#fbbf24" }}>
                      ⚠ Risks: {splitView.founderPrivate.riskAlerts.slice(0, 3).join(" | ")}
                    </div>
                  )}
                  {splitView.founderPrivate?.pricingGuidance && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: "#fecaca" }}>
                      Guidance: {splitView.founderPrivate.pricingGuidance.recommendedQuote?.valueINR
                        ? `quote ₹${splitView.founderPrivate.pricingGuidance.recommendedQuote.valueINR.toLocaleString("en-IN")} (mid)`
                        : splitView.founderPrivate.pricingGuidance.note || "—"}
                    </div>
                  )}
                  {splitView.founderPrivate?.nextQuestionSuggestion && (
                    <div style={{ marginTop: 6, fontSize: 11.5, color: "#67e8f9" }}>
                      Next Q: {splitView.founderPrivate.nextQuestionSuggestion}
                    </div>
                  )}
                  {splitView.founderPrivate?.analysis && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#fca5a5" }}>
                      Complexity: {splitView.founderPrivate.analysis.technicalComplexity?.value?.complexity || "—"} ·{" "}
                      Missing: {(splitView.founderPrivate.analysis.missingInformation?.value || []).length} field(s)
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={panelOpen ? "open" : ""}>
              <IntelligencePanel
                panel={panel}
                label={label}
                confidence={confidence}
                evidence={lastEvidence}
                sources={lastSources}
                warnings={warnings}
                selectedClient={selectedClient}
              />
              <div style={styles.sectionTitle}>Missing Inputs</div>
              {lastMissing.length === 0 ? (
                <div style={styles.muted}>None</div>
              ) : (
                lastMissing.map((m, i) => (
                  <div key={i} style={{ ...styles.evidenceRow, borderColor: "#78350f" }}>
                    <LabelBadge label="UNKNOWN" />
                    <span style={{ fontSize: 11 }}>{m}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
