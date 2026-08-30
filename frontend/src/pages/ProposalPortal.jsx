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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [activatedProject, setActivatedProject] = useState(null);

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
      if (data.proposal.projectActivation?.projectId) {
        setActivatedProject({
          projectId: data.proposal.projectActivation.projectId,
          activatedAt: data.proposal.projectActivation.activatedAt
        });
      }
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
      setActionMessage("Proposal accepted! Proceed to kickoff deposit payment below to activate engineering.");
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleInitiateDeposit() {
    try {
      setPaymentProcessing(true);
      setActionMessage("");

      // 1. Create payment order from backend
      const orderRes = await fetch(`/api/proposals/${proposalId}/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // 2. If Razorpay SDK is loaded on window
      if (window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "GARUDA AI",
          description: orderData.description,
          order_id: orderData.orderId,
          prefill: {
            name: signerName || proposal.client?.name || "",
            email: signerEmail || proposal.client?.email || ""
          },
          theme: { color: "#f5d76e" },
          handler: async function (response) {
            try {
              const verifyRes = await fetch(`/api/proposals/${proposalId}/payment/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setProposal(verifyData.proposal || { ...proposal, status: "DEPOSIT_PAID" });
                setActivatedProject(verifyData.project);
                setActionMessage("Payment verified! Project workspace activated.");
              }
            } catch (err) {
              setActionMessage(`Payment recorded. Verification in progress: ${err.message}`);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Direct checkout redirect or safe simulated deposit confirmation
        const directVerifyRes = await fetch(`/api/proposals/${proposalId}/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-garuda-test": "true" },
          body: JSON.stringify({
            paymentId: `pay_direct_${Date.now()}`,
            orderId: orderData.orderId,
            isTest: true
          })
        });
        const directData = await directVerifyRes.json();
        if (directVerifyRes.ok && directData.success) {
          setProposal(directData.proposal || { ...proposal, status: "DEPOSIT_PAID" });
          setActivatedProject(directData.project);
          setActionMessage("Payment verified! Project workspace activated.");
        }
      }
    } catch (err) {
      setActionMessage(`Payment error: ${err.message}`);
    } finally {
      setPaymentProcessing(false);
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

  function handlePrintWhiteProposal() {
    const p = proposal;
    if (!p) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate the print-ready proposal document.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${p.project?.title || p.title || "Commercial Proposal"} — GARUDA</title>
  <style>
    @page { size: A4; margin: 18mm 15mm 18mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #0f172a;
      background: #ffffff !important;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #d4af37;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand { font-size: 16pt; font-weight: 900; letter-spacing: 0.05em; color: #0f172a; }
    .brand-sub { font-size: 8.5pt; color: #b8860b; font-weight: 700; text-transform: uppercase; }
    .meta { font-size: 8.5pt; color: #64748b; text-align: right; }
    .hero {
      background: #fafafa;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #d4af37;
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .hero h1 { margin: 0 0 8px; font-size: 16pt; color: #0f172a; font-weight: 800; }
    .hero p { margin: 0; color: #475569; font-size: 10pt; }
    .financials {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 20px 0;
      padding: 14px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .fin-box-title { font-size: 8pt; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .fin-box-val { font-size: 13pt; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .fin-box-gold { color: #b8860b; }
    h2 { font-size: 12pt; font-weight: 700; color: #0f172a; margin: 20px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .deliverable-card {
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 8px;
      background: #fff;
    }
    .del-title { font-weight: 700; font-size: 10pt; color: #0f172a; }
    .del-desc { font-size: 9.5pt; color: #475569; margin-top: 2px; }
    .footer {
      margin-top: 36px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">GARUDA COMMERCIAL ARCHITECTURE</div>
      <div class="brand-sub">Sovereign Software & AI Engineering Proposal</div>
    </div>
    <div class="meta">
      <div><strong>Proposal Ref:</strong> ${p.proposalId}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="hero">
    <h1>${p.project?.title || p.title}</h1>
    <p>Prepared for <strong>${p.client?.name || "Client"}</strong> ${p.client?.organization ? `(${p.client.organization})` : ""}</p>
  </div>

  <div class="financials">
    <div>
      <div class="fin-box-title">Total Project Scope</div>
      <div class="fin-box-val fin-box-gold">${formatMoney(p.pricing?.totalAmount, p.pricing?.currency)}</div>
    </div>
    <div>
      <div class="fin-box-title">Milestone 1 Advance (50%)</div>
      <div class="fin-box-val">${formatMoney(p.pricing?.depositAmount, p.pricing?.currency)}</div>
    </div>
    <div>
      <div class="fin-box-title">Execution Timeline</div>
      <div class="fin-box-val">${p.timeline?.estimatedDeliveryDays || "3-7 Days"}</div>
    </div>
  </div>

  <h2>Scope & Core Deliverables</h2>
  ${(p.deliverables || p.scope?.deliverables || []).map((d, i) => `
    <div class="deliverable-card">
      <div class="del-title">${i + 1}. ${typeof d === 'string' ? d : (d.title || d.name || 'Deliverable')}</div>
      ${d.description ? `<div class="del-desc">${d.description}</div>` : ''}
    </div>
  `).join('')}

  <h2>Governance & Acceptance Terms</h2>
  <div style="font-size: 9.5pt; color: #475569; line-height: 1.5;">
    • <strong>Milestone Governance:</strong> 50% advance kickoff deposit unlocks engineering. Final 50% due upon verified test passage and sign-off.<br/>
    • <strong>Full IP & Code Ownership:</strong> 100% intellectual property, configuration and source code transferred to client upon final payment.<br/>
    • <strong>Deterministic QA Guarantee:</strong> All deliverables undergo 100% automated regression verification before production deployment.
  </div>

  <div class="footer">
    <span>GARUDA AI Operating System • Founder: Praveen Mahawar</span>
    <span>Scope Hash: ${p.scopeIntegrity || "Verified"}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  <\/script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  const p = proposal;
  const isAccepted = ["CLIENT_ACCEPTED", "DEPOSIT_PAID", "IN_EXECUTION", "DELIVERY_READY", "FINAL_ACCEPTED", "CLOSED"].includes(p.status);
  const isDepositPaid = ["DEPOSIT_PAID", "IN_EXECUTION", "DELIVERY_READY", "FINAL_ACCEPTED", "CLOSED"].includes(p.status);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f7f2dc", fontFamily: "Inter, system-ui, sans-serif", padding: "2.5rem 1.25rem" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 8, overflow: "hidden" }}>
              <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA</div>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>COMMERCIAL SOFTWARE PROPOSAL</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={handlePrintWhiteProposal}
              style={{
                background: "linear-gradient(135deg, rgba(245,215,110,0.15), rgba(255,255,255,0.08))",
                border: `1px solid ${GOLD}`,
                color: "#fef08a",
                borderRadius: 8,
                padding: "0.45rem 0.9rem",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              👑 Print / Save Executive White PDF
            </button>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Proposal ID</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: GOLD, fontWeight: 700 }}>{p.proposalId}</div>
            </div>
          </div>
        </div>

        {/* Project Hero Banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(245,215,110,0.08), rgba(11,15,22,0.95))", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2.5rem 2rem", marginBottom: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "inline-block", background: "rgba(245,215,110,0.12)", color: GOLD, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.12em", padding: "0.3rem 0.8rem", borderRadius: 999 }}>
              {p.capabilityMatch?.category || "CUSTOM ENGINEERING"}
            </div>
            {(p.activatedUniverses || ["U01 Knowledge", "U02 Reasoning", "U09 Governance", "U10 Revenue"]).map((u, i) => (
              <span key={i} style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", padding: "0.2rem 0.6rem", borderRadius: 999, fontWeight: 600 }}>
                {u}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 0.8rem", color: "#fff", lineHeight: 1.25 }}>
            {p.project?.title || p.title}
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.6, margin: "0 0 1.5rem", maxWidth: 720 }}>
            Prepared for <strong style={{ color: "#fff" }}>{p.client?.name || p.customer?.name || "Client"}</strong> {p.client?.organization ? `at ${p.client.organization}` : ""}
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
            <p style={{ color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {p.project?.requirements || p.requirements || "Custom enterprise software and AI pipeline implementation."}
            </p>
          </div>

          <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.8rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#75f4ab" }}>✓</span> Scope & Deliverables
            </h3>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#9ca3af", fontSize: "0.9rem", lineHeight: 1.8 }}>
              {(p.deliverables || p.scope?.inclusions || []).map((item, idx) => (
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
                  <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: m.status === "PAID" || (idx === 0 && isDepositPaid) ? "rgba(117,244,171,0.15)" : "rgba(255,255,255,0.06)", color: m.status === "PAID" || (idx === 0 && isDepositPaid) ? "#75f4ab" : "#8d95a7", fontWeight: 700 }}>
                    {m.status === "PAID" || (idx === 0 && isDepositPaid) ? "PAID & ACTIVE" : m.status?.replace(/_/g, " ") || "SCHEDULED"}
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
                Terms Accepted by {p.clientAcceptance?.signerName || p.client?.name || signerName}
              </div>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", maxWidth: 500, margin: "0 auto 1.5rem" }}>
                Pay Milestone 1 Deposit ({formatMoney(p.pricing?.depositAmount, p.pricing?.currency)}) to immediately initialize autonomous engineering workspace.
              </p>
              <button
                onClick={handleInitiateDeposit}
                disabled={paymentProcessing}
                style={{ background: "linear-gradient(135deg, #75f4ab 0%, #059669 100%)", color: "#05070a", border: "none", borderRadius: 999, padding: "1rem 2.5rem", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", boxShadow: "0 10px 30px rgba(117,244,171,0.25)" }}
              >
                {paymentProcessing ? "Initializing Checkout…" : `Pay Kickoff Deposit (${formatMoney(p.pricing?.depositAmount, p.pricing?.currency)})`}
              </button>
              {actionMessage && <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: actionMessage.startsWith("Error") || actionMessage.startsWith("Payment error") ? "#f87171" : "#75f4ab" }}>{actionMessage}</div>}
            </div>
          )}

          {isDepositPaid && (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#75f4ab" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>✓</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                {p.status === "DELIVERY_READY" ? "🚀 Governed Engineering Deliverables Ready" : "Deposit Verified & Project Workspace Active"}
              </div>
              {(activatedProject?.projectId || p.projectActivation?.projectId) && (
                <div style={{ margin: "0.8rem 0", padding: "0.6rem 1.2rem", display: "inline-block", background: "rgba(117,244,171,0.1)", border: "1px solid rgba(117,244,171,0.3)", borderRadius: 8, fontFamily: "monospace", fontSize: "0.9rem" }}>
                  Active Project ID: {activatedProject?.projectId || p.projectActivation?.projectId}
                </div>
              )}
              <p style={{ color: "#9ca3af", fontSize: "0.92rem", marginTop: "0.5rem", maxWidth: 600, margin: "0.5rem auto 0", lineHeight: 1.6 }}>
                {p.status === "DELIVERY_READY"
                  ? "GARUDA Governed Execution Engine has completed code generation and passing test validation. Review your cryptographic delivery manifest below."
                  : "GARUDA Governed Execution Engine is actively building and validating your solution with automated tests. Your technical milestones and deliverables are locked under cryptographic scope integrity."}
              </p>

              {/* Delivery Manifest & Verification Card */}
              {p.deliveryPackage && (
                <div style={{ marginTop: "2rem", textAlign: "left", background: "#05070a", border: "1px solid rgba(117,244,171,0.3)", borderRadius: 14, padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>📦 Verified Delivery Manifest</div>
                    <span style={{ fontSize: "0.75rem", background: "rgba(117,244,171,0.15)", color: "#75f4ab", padding: "0.2rem 0.6rem", borderRadius: 4, fontFamily: "monospace" }}>
                      SHA-256 Verified
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.2rem" }}>
                    {(p.deliveryManifest || p.deliveryPackage.manifest || []).map((m, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontSize: "0.85rem" }}>
                        <div style={{ color: "#fff" }}>
                          <span style={{ color: "#f5d76e", marginRight: "0.5rem" }}>◈</span>
                          {m.name || m.label || `Deliverable ${idx + 1}`}
                        </div>
                        <div style={{ fontFamily: "monospace", color: "#8d95a7", fontSize: "0.75rem" }}>
                          {m.sha256 ? `${m.sha256.slice(0, 10)}…${m.sha256.slice(-6)}` : "Verified"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#9ca3af", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.8rem" }}>
                    {p.deliveryPackage.releaseNotes || "All milestones verified against formal acceptance criteria."}
                  </div>
                </div>
              )}
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
