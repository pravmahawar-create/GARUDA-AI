import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#f5d76e";
const BG = "#04070a";
const PANEL = "#0a0f16";
const BORDER = "rgba(245, 215, 110, 0.18)";

function formatMoney(amount, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR"),
      maximumFractionDigits: 0
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-IN")}`;
  }
}

export default function ProposalPortal() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function loadProposal() {
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${encodeURIComponent(proposalId || "")}?public=true`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Proposal not found or expired.");
      }
      setProposal(data.proposal);
      setSignerName(data.proposal.client?.name || "");
      setSignerEmail(data.proposal.client?.email || "");
    } catch (err) {
      setError(err.message || "Unable to load commercial proposal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  async function handleAcceptTerms() {
    if (!signerName.trim()) {
      setActionMessage("Please enter your name to confirm acceptance.");
      return;
    }
    try {
      setActionLoading(true);
      setActionMessage("");
      const res = await fetch(`/api/proposals/${proposalId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signerName, email: signerEmail })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to accept proposal.");
      setProposal(data.proposal);
      setActionMessage("Proposal accepted! Please proceed to deposit settlement to initialize engineering.");
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: "#9ca3af", display: "grid", placeItems: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(245,215,110,0.2)", borderTopColor: GOLD, margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
          Loading Commercial Proposal…
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: "#f7f2dc", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "Inter, sans-serif" }}>
        <div style={{ maxWidth: 480, background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", color: GOLD, marginBottom: "1rem" }}>◈</div>
          <h2 style={{ margin: "0 0 0.8rem", color: "#fff" }}>Proposal Unavailable</h2>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>{error || "The requested proposal does not exist or has expired."}</p>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: GOLD, padding: "0.7rem 1.5rem", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const p = proposal;
  const isAccepted = ["CLIENT_ACCEPTED", "DEPOSIT_PAID", "IN_EXECUTION", "DELIVERY_READY", "FINAL_ACCEPTED", "CLOSED"].includes(p.status);
  const isDepositPaid = ["DEPOSIT_PAID", "IN_EXECUTION", "DELIVERY_READY", "FINAL_ACCEPTED", "CLOSED"].includes(p.status);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f7f2dc", fontFamily: "Inter, system-ui, sans-serif", padding: "2.5rem 1.25rem" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 8, overflow: "hidden" }}>
              <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA</div>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>COMMERCIAL SOFTWARE PROPOSAL</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Proposal ID</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: GOLD, fontWeight: 700 }}>{p.proposalId}</div>
          </div>
        </div>

        {/* Project Hero Banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(245,215,110,0.08), rgba(11,15,22,0.95))", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2.5rem 2rem", marginBottom: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "inline-block", background: "rgba(245,215,110,0.12)", color: GOLD, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", padding: "0.3rem 0.8rem", borderRadius: 999, marginBottom: "1rem" }}>
            {p.capabilityMatch?.category || "CUSTOM ENGINEERING"}
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 0.8rem", color: "#fff", lineHeight: 1.25 }}>
            {p.project?.title}
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.6, margin: "0 0 1.5rem", maxWidth: 720 }}>
            Prepared for <strong style={{ color: "#fff" }}>{p.client?.name}</strong> {p.client?.organization ? `at ${p.client.organization}` : ""}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Fixed Investment</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: GOLD }}>{formatMoney(p.pricing?.totalAmount, p.pricing?.currency)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Milestone 1 Kickoff Deposit</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{formatMoney(p.pricing?.depositAmount, p.pricing?.currency)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Estimated Timeline</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#75f4ab", marginTop: "0.2rem" }}>{p.timeline?.estimatedDeliveryDays || "3-7 Days"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Status</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isDepositPaid ? "#75f4ab" : isAccepted ? GOLD : "#8d95a7", marginTop: "0.3rem" }}>
                {p.status.replace(/_/g, " ")}
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Deliverables */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.8rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: GOLD }}>◈</span> Requirements Understood
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.7, margin: 0 }}>
              {p.project?.requirements || "Custom enterprise software and AI pipeline implementation."}
            </p>
          </div>

          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.8rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#75f4ab" }}>✓</span> Scope & Deliverables
            </h3>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#9ca3af", fontSize: "0.9rem", lineHeight: 1.8 }}>
              {(p.scope?.inclusions || []).map((item, idx) => (
                <li key={idx}><span style={{ color: "#e7e9ee" }}>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Milestone Payment & Kickoff Action */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1.2rem", fontSize: "1.2rem", color: "#fff" }}>Milestone Schedule & Payment</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            {(p.milestones || []).map((m, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{m.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "#8d95a7", marginTop: "0.25rem" }}>{m.deliverableSummary}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: GOLD }}>{formatMoney(m.amount, p.pricing?.currency)}</div>
                  <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: m.status === "PAID" ? "rgba(117,244,171,0.15)" : "rgba(255,255,255,0.06)", color: m.status === "PAID" ? "#75f4ab" : "#8d95a7", fontWeight: 700 }}>
                    {m.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!isAccepted && (
            <div style={{ background: "rgba(245,215,110,0.04)", border: "1px solid rgba(245,215,110,0.2)", borderRadius: 14, padding: "1.5rem", marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 0.8rem", color: "#fff", fontSize: "1rem" }}>Accept Proposal Terms</h4>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 1rem" }}>
                By clicking accept, you authorize GARUDA to reserve engineering capacity for this deliverable based on the agreed milestones.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  style={{ flex: "1 1 220px", background: "#05070a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.75rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                />
                <input
                  type="email"
                  placeholder="Your Work Email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  style={{ flex: "1 1 220px", background: "#05070a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.75rem 1rem", color: "#fff", fontSize: "0.9rem" }}
                />
                <button
                  onClick={handleAcceptTerms}
                  disabled={actionLoading}
                  style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070a", border: "none", borderRadius: 8, padding: "0.75rem 1.8rem", fontWeight: 800, cursor: "pointer", fontSize: "0.92rem" }}
                >
                  {actionLoading ? "Processing…" : "Accept Terms & Sign"}
                </button>
              </div>
              {actionMessage && <div style={{ fontSize: "0.85rem", color: actionMessage.startsWith("Error") ? "#f87171" : "#75f4ab" }}>{actionMessage}</div>}
            </div>
          )}

          {isAccepted && !isDepositPaid && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
                Terms Accepted by {p.clientAcceptance?.signerName || p.client?.name}
              </div>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", maxWidth: 500, margin: "0 auto 1.5rem" }}>
                Pay Milestone 1 Deposit ({formatMoney(p.pricing?.depositAmount, p.pricing?.currency)}) to immediately initialize autonomous engineering.
              </p>
              <button
                onClick={() => window.open(p.paymentUrl || `https://razorpay.me/@garudaosincompany`, "_blank", "noopener,noreferrer")}
                style={{ background: "linear-gradient(135deg, #75f4ab 0%, #059669 100%)", color: "#05070a", border: "none", borderRadius: 999, padding: "1rem 2.5rem", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", boxShadow: "0 10px 30px rgba(117,244,171,0.25)" }}
              >
                Pay Kickoff Deposit ({formatMoney(p.pricing?.depositAmount, p.pricing?.currency)})
              </button>
            </div>
          )}

          {isDepositPaid && (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#75f4ab" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>Deposit Verified & Mission Active</div>
              <p style={{ color: "#9ca3af", fontSize: "0.88rem", marginTop: "0.4rem" }}>
                GARUDA Governed Execution Engine is actively building and testing your solution. You will receive milestone delivery updates directly.
              </p>
            </div>
          )}
        </div>

        {/* Footer & Integrity Notice */}
        <div style={{ textAlign: "center", color: "#5b6472", fontSize: "0.75rem", lineHeight: 1.6 }}>
          Proposal Integrity Hash: {p.scopeIntegrity || p.governance?.scopeHash || "Verified"}<br />
          GARUDA AI Operating System · Governed Autonomous Software Engineering · Founder-Supervised Delivery
        </div>
      </div>
    </div>
  );
}
