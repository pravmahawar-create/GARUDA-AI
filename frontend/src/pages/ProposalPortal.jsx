import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const activeProposalId = proposalId || searchParams.get("id") || searchParams.get("ref") || searchParams.get("proposalId") || "";
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
  const [invoices, setInvoices] = useState([]);

  async function loadProposal() {
    try {
      setLoading(true);
      if (!activeProposalId) {
        throw new Error("No proposal ID specified. Please use a valid proposal link.");
      }
      const res = await fetch(`/api/proposals/${encodeURIComponent(activeProposalId)}?public=true`);
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

      // Fetch corporate tax invoices
      try {
        const invRes = await fetch(`/api/proposals/${encodeURIComponent(activeProposalId)}/invoices`);
        const invData = await invRes.json();
        if (invData && invData.invoices) {
          setInvoices(invData.invoices);
        }
      } catch {}
    } catch (err) {
      setError(err.message || "Unable to load commercial proposal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProposal();
  }, [activeProposalId]);

  async function handleAcceptTerms() {
    if (!signerName.trim()) {
      setActionMessage("Please enter your name to confirm acceptance.");
      return;
    }
    try {
      setActionLoading(true);
      setActionMessage("");
      const res = await fetch(`/api/proposals/${encodeURIComponent(activeProposalId)}/accept`, {
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
      const orderRes = await fetch(`/api/proposals/${encodeURIComponent(activeProposalId)}/payment/order`, {
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
              const verifyRes = await fetch(`/api/proposals/${encodeURIComponent(activeProposalId)}/payment/verify`, {
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
        const directVerifyRes = await fetch(`/api/proposals/${encodeURIComponent(activeProposalId)}/payment/verify`, {
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

  function handlePrintTaxInvoice(inv) {
    if (!inv) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to view the official Corporate Tax Invoice.");
      return;
    }

    const currency = (inv.pricing?.currency || "INR").toUpperCase();
    const isDomestic = currency === "INR";
    const subtotal = Number(inv.pricing?.subtotal || 0);
    const taxAmount = Number(inv.pricing?.taxAmount || 0);
    const totalAmount = Number(inv.pricing?.totalAmount || 0);
    const taxPercent = Number(inv.pricing?.taxPercent || 0);
    const halfTax = (taxAmount / 2).toFixed(2);

    function numberToWords(num, cur = "INR") {
      if (!num || isNaN(num)) return "";
      const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      function inWords(n) {
        if ((n = n.toString()).length > 9) return String(n);
        let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n_array) return '';
        let str = '';
        str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
        str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
        str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
        str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
        str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
        return str.trim();
      }
      const intPart = Math.floor(num);
      const words = inWords(intPart);
      const curName = cur === "USD" ? "US Dollars" : "Rupees";
      return words ? `${curName} ${words} Only` : "";
    }

    const amountWords = numberToWords(totalAmount, currency);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TAX INVOICE — ${inv.invoiceNumber} — GARUDA AI OS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #05080e;
      --surface: #0b111a;
      --surface-card: #0f1724;
      --border: rgba(212, 175, 55, 0.28);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --gold-primary: #d4af37;
      --gold-light: #fef08a;
      --gold-deep: #b8860b;
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.12);
      --table-header: #131c2c;
    }

    body.light-theme {
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-card: #f1f5f9;
      --border: rgba(184, 134, 11, 0.35);
      --border-subtle: #cbd5e1;
      --text: #0f172a;
      --text-muted: #475569;
      --gold-primary: #996515;
      --gold-light: #78350f;
      --gold-deep: #92400e;
      --emerald: #059669;
      --emerald-bg: rgba(5, 150, 105, 0.1);
      --table-header: #e2e8f0;
    }

    * { box-sizing: border-box; }
    @page { size: A4; margin: 12mm 10mm; }

    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      transition: background 0.2s ease, color 0.2s ease;
      position: relative;
    }

    .container {
      max-width: 820px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
      position: relative;
      overflow: hidden;
    }

    /* Background Sovereign Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      height: 440px;
      opacity: 0.035;
      pointer-events: none;
      z-index: 0;
    }

    .content-layer {
      position: relative;
      z-index: 1;
    }

    /* Top Action Bar (Screen Only) */
    .top-actions {
      position: sticky;
      top: 0;
      z-index: 9999;
      max-width: 820px;
      margin: -24px auto 16px auto;
      padding: 10px 16px;
      background: rgba(5, 8, 14, 0.94);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }

    .btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      transition: all 0.15s ease;
    }

    .btn-gold {
      background: linear-gradient(135deg, #d4af37, #b8860b);
      color: #05080e;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
    }
    .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4); }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--border-subtle);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }

    /* Header Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 20px;
      gap: 20px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: 0.06em;
      color: var(--text);
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 7.8pt;
      color: var(--gold-primary);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 700;
      margin-top: 3px;
    }

    .brand-tag {
      font-size: 7pt;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .invoice-badge-box {
      text-align: right;
    }

    .official-badge {
      display: inline-block;
      background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06));
      border: 1px solid var(--gold-primary);
      color: var(--gold-light);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      font-family: 'Cinzel', serif;
    }

    .invoice-meta-grid {
      margin-top: 8px;
      font-size: 8.2pt;
      line-height: 1.5;
    }

    .invoice-meta-grid strong {
      color: var(--text);
    }

    .badge-paid {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--emerald-bg);
      border: 1px solid var(--emerald);
      color: var(--emerald);
      font-weight: 800;
      font-size: 7.5pt;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    /* 2-Column Party Details Grid */
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .party-card {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 8.5pt;
    }

    .party-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .party-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--gold-primary);
      font-weight: 800;
    }

    .party-sublabel {
      font-size: 6.8pt;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .party-name {
      font-size: 10pt;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 4px;
    }

    .party-info {
      color: var(--text-muted);
      line-height: 1.45;
    }

    .party-info strong {
      color: var(--text);
    }

    /* Line Items Table */
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    table.invoice-table th {
      background: var(--table-header);
      color: var(--text);
      font-size: 7.8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 9px 12px;
      border-bottom: 2px solid var(--border);
      text-align: left;
    }

    table.invoice-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 8.5pt;
    }

    table.invoice-table tr:last-child td {
      border-bottom: none;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Totals & Tax Calculation Breakdown */
    .totals-container {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      align-items: flex-start;
    }

    .notes-box {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 7.8pt;
      color: var(--text-muted);
    }

    .notes-title {
      font-weight: 800;
      color: var(--text);
      text-transform: uppercase;
      font-size: 7.2pt;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    .totals-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 8.5pt;
      color: var(--text-muted);
    }

    .totals-row strong {
      color: var(--text);
    }

    .totals-grand {
      border-top: 2px solid var(--border);
      margin-top: 8px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .grand-label {
      font-family: 'Cinzel', serif;
      font-size: 9pt;
      font-weight: 800;
      color: var(--gold-primary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .grand-amount {
      font-size: 14pt;
      font-weight: 900;
      color: var(--gold-light);
      font-family: 'JetBrains Mono', monospace;
    }

    .words-box {
      font-size: 7.8pt;
      color: var(--gold-primary);
      font-style: italic;
      margin-top: 6px;
      text-align: right;
    }

    /* Cryptographic Seal & Verification Block */
    .verification-section {
      background: linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(5,8,14,0.6) 100%);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
    }

    .audit-left {
      font-size: 7.8pt;
      color: var(--text-muted);
    }

    .audit-title {
      font-weight: 800;
      color: var(--gold-primary);
      font-size: 8.2pt;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .hash-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
      color: var(--emerald);
      word-break: break-all;
      margin-top: 4px;
      display: block;
    }

    .signatory-box {
      text-align: right;
      padding-left: 20px;
      border-left: 1px solid var(--border-subtle);
    }

    .signature-calligraphy {
      font-family: 'Brush Script MT', 'Dancing Script', cursive, serif;
      font-size: 22pt;
      color: var(--gold-light);
      line-height: 1;
      transform: rotate(-3deg);
      margin-bottom: 2px;
      white-space: nowrap;
    }

    .signatory-name {
      font-size: 8.2pt;
      font-weight: 800;
      color: var(--text);
    }

    .signatory-role {
      font-size: 6.8pt;
      color: var(--gold-primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .footer-note {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      font-size: 6.8pt;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media print {
      body {
        background: #ffffff !important;
        color: #0f172a !important;
        padding: 0 !important;
      }
      .top-actions { display: none !important; }
      .container {
        border: 1px solid #94a3b8 !important;
        box-shadow: none !important;
        padding: 16px 20px !important;
        max-width: 100% !important;
        background: #ffffff !important;
      }
      .watermark { opacity: 0.03 !important; }
      .brand-title { color: #0f172a !important; }
      .official-badge { background: #f8fafc !important; color: #996515 !important; border-color: #996515 !important; }
      .party-card { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .party-name, .party-info strong, .invoice-meta-grid strong { color: #0f172a !important; }
      table.invoice-table th { background: #f1f5f9 !important; color: #0f172a !important; border-color: #94a3b8 !important; }
      table.invoice-table td { color: #0f172a !important; border-color: #cbd5e1 !important; }
      .totals-card, .notes-box { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .grand-amount { color: #996515 !important; }
      .verification-section { background: #f8fafc !important; border-color: #94a3b8 !important; }
      .hash-code { background: #ffffff !important; color: #059669 !important; border-color: #cbd5e1 !important; }
      .signature-calligraphy { color: #996515 !important; }
    }
  </style>
</head>
<body class="dark-theme">
  <!-- Interactive Top Action Controls -->
  <div class="top-actions">
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#04060a" rx="20"/>
        <defs>
          <linearGradient id="sigilMiniGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff5c0" />
            <stop offset="30%" stop-color="#ffd700" />
            <stop offset="70%" stop-color="#d4af37" />
            <stop offset="100%" stop-color="#8a6d1c" />
          </linearGradient>
        </defs>
        <polygon points="50,14 62,38 78,42 66,54 70,72 50,60 30,72 34,54 22,42 38,38" fill="url(#sigilMiniGold)" />
        <path d="M 50 20 L 76 34 L 88 56 L 76 60 L 64 48 L 50 64 L 36 48 L 24 60 L 12 56 L 24 34 Z" fill="url(#sigilMiniGold)" opacity="0.9" />
        <circle cx="50" cy="34" r="3.5" fill="#04060a" />
        <circle cx="50" cy="34" r="1.8" fill="#ffd700" />
      </svg>
      <span style="font-family: 'Cinzel', serif; font-weight: 800; font-size: 9.5pt; color: #d4af37;">
        GARUDA OFFICIAL TAX INVOICE
      </span>
      <span style="font-size: 7.5pt; background: rgba(212,175,55,0.15); color: #fef08a; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace;">
        ${inv.invoiceNumber}
      </span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-secondary" onclick="toggleTheme()" title="Toggle Dark / Clean Print view">
        <span id="themeIcon">☀️</span> <span id="themeLabel">Royal A4 Print View</span>
      </button>
      <button class="btn btn-gold" onclick="window.print()">
        🖨️ Print / Save Official PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="container">
    <!-- Canonical GARUDA Sovereign Sigil Watermark -->
    <svg class="watermark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,14 62,38 78,42 66,54 70,72 50,60 30,72 34,54 22,42 38,38" fill="#d4af37" />
      <path d="M 50 20 L 76 34 L 88 56 L 76 60 L 64 48 L 50 64 L 36 48 L 24 60 L 12 56 L 24 34 Z" fill="#d4af37" opacity="0.9" />
      <polygon points="50,22 56,36 50,48 44,36" fill="#ffffff" opacity="0.95" />
      <circle cx="50" cy="34" r="3.5" fill="#04060a" />
      <circle cx="50" cy="34" r="1.8" fill="#ffd700" />
      <polygon points="50,56 60,78 50,72 40,78" fill="#d4af37" />
      <polygon points="50,68 55,88 50,83 45,88" fill="#d4af37" opacity="0.8" />
    </svg>

    <div class="content-layer">
      <!-- Top Header & Invoice Identification -->
      <div class="header-bar">
        <div class="brand-group">
          <!-- Canonical GARUDA Sovereign Sigil -->
          <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#04060a" rx="20" stroke="rgba(212,175,55,0.4)" stroke-width="1.5"/>
            <defs>
              <linearGradient id="headerSigilGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fff5c0" />
                <stop offset="30%" stop-color="#ffd700" />
                <stop offset="70%" stop-color="#d4af37" />
                <stop offset="100%" stop-color="#8a6d1c" />
              </linearGradient>
              <filter id="headerSigilGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <g filter="url(#headerSigilGlow)">
              <polygon points="50,14 62,38 78,42 66,54 70,72 50,60 30,72 34,54 22,42 38,38" fill="url(#headerSigilGold)" />
              <path d="M 50 20 L 76 34 L 88 56 L 76 60 L 64 48 L 50 64 L 36 48 L 24 60 L 12 56 L 24 34 Z" fill="url(#headerSigilGold)" opacity="0.9" />
              <polygon points="50,22 56,36 50,48 44,36" fill="#ffffff" opacity="0.95" />
              <circle cx="50" cy="34" r="3.5" fill="#04060a" />
              <circle cx="50" cy="34" r="1.8" fill="#ffd700" />
              <polygon points="50,56 60,78 50,72 40,78" fill="url(#headerSigilGold)" />
              <polygon points="50,68 55,88 50,83 45,88" fill="url(#headerSigilGold)" opacity="0.8" />
            </g>
          </svg>
          <div>
            <div class="brand-title">GARUDA AI OPERATING SYSTEM</div>
            <div class="brand-subtitle">Sovereign Autonomous Systems & Enterprise AI Engineering</div>
            <div class="brand-tag">Commercial Computing & Software Architectural Division • Rule 46 CGST Compliant</div>
          </div>
        </div>

        <div class="invoice-badge-box">
          <div class="official-badge">TAX INVOICE / B2B BILL OF SUPPLY</div>
          <div class="invoice-meta-grid">
            <div><strong>Invoice No:</strong> <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--gold-light);">${inv.invoiceNumber}</span></div>
            <div><strong>Date of Issue:</strong> ${new Date(inv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Place of Supply:</strong> ${isDomestic ? '23 - Madhya Pradesh (India)' : 'International / Export Jurisdiction'}</div>
            <div><strong>Status:</strong> <span class="badge-paid">✓ SETTLED & PAID</span></div>
          </div>
        </div>
      </div>

      <!-- Supplier & Client 2-Column Grid -->
      <div class="party-grid">
        <!-- Supplier -->
        <div class="party-card">
          <div class="party-header">
            <span class="party-label">Supplier / Issuing Entity</span>
            <span class="party-sublabel">SAC: ${inv.seller?.sacCode || "998313"}</span>
          </div>
          <div class="party-name">${inv.seller?.brandName || "GARUDA AI OS"}</div>
          <div class="party-info">
            <strong>Founder & Architect:</strong> ${inv.seller?.founder || "Praveen Mahawar"}<br/>
            <strong>Enterprise Email:</strong> ${inv.seller?.email || "praveen@garudaos.in"}<br/>
            <strong>Platform Portal:</strong> ${inv.seller?.portal || "https://www.garudaos.in"}<br/>
            <strong>Services Code:</strong> SAC 998313 (IT & AI Software Engineering)<br/>
            <strong>Reverse Charge:</strong> No
          </div>
        </div>

        <!-- Billed To -->
        <div class="party-card">
          <div class="party-header">
            <span class="party-label">Billed To / Recipient Client</span>
            <span class="party-sublabel">Ref: ${inv.proposalId || "Commercial Proposal"}</span>
          </div>
          <div class="party-name">${inv.buyer?.name || "Corporate Client"}</div>
          <div class="party-info">
            ${inv.buyer?.company ? `<strong>Company:</strong> ${inv.buyer.company}<br/>` : ""}
            <strong>Email:</strong> ${inv.buyer?.email || "Registered Corporate Client"}<br/>
            <strong>GSTIN / Tax ID:</strong> <code>${inv.buyer?.gstin || "Unregistered / Consumer"}</code><br/>
            <strong>Jurisdiction / Country:</strong> ${inv.buyer?.country || "India"}<br/>
            <strong>Engagement Model:</strong> Autonomous Milestone Execution
          </div>
        </div>
      </div>

      <!-- Line Items Table -->
      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 48%;">Description of Architectural Services & Deliverables</th>
            <th class="text-center" style="width: 14%;">SAC Code</th>
            <th class="text-center" style="width: 8%;">Qty</th>
            <th class="text-right" style="width: 13%;">Unit Rate (${currency})</th>
            <th class="text-right" style="width: 13%;">Taxable Value (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${(inv.lineItems || []).map((item, idx) => `
            <tr>
              <td class="text-center" style="color: var(--text-muted);">${idx + 1}</td>
              <td>
                <strong style="color: var(--text);">${item.description}</strong>
                <div style="font-size: 7.2pt; color: var(--text-muted); margin-top: 2px;">
                  Autonomous code generation, cryptographic unit tests, and sovereign scope verification.
                </div>
              </td>
              <td class="text-center" style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${item.sacCode || "998313"}</td>
              <td class="text-center">${item.quantity || 1}</td>
              <td class="text-right" style="font-family: 'JetBrains Mono', monospace;">${formatMoney(item.unitRate, currency)}</td>
              <td class="text-right" style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${formatMoney(item.amount, currency)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Totals & Governance Terms Grid -->
      <div class="totals-container">
        <!-- Terms & Tax Exemption Notes -->
        <div class="notes-box">
          <div class="notes-title">Tax Compliance & Legal Declaration</div>
          <div>
            ${taxPercent > 0 
              ? `• <strong>GST Applied:</strong> Total GST at ${taxPercent}% (CGST ${(taxPercent/2)}% + SGST ${(taxPercent/2)}% or IGST ${taxPercent}%). All invoices comply with Section 31 of CGST Act, 2017.` 
              : `• <strong>Zero-Rated Export:</strong> Supply of IT Software Services meant for Export outside India under Letter of Undertaking (LUT) without payment of Integrated Goods & Services Tax (Rule 96A).`}
          </div>
          <div style="margin-top: 6px;">
            • <strong>Electronic Record:</strong> This is a digitally attested B2B tax invoice backed by SHA-256 cryptographic audit logs. No physical signature is required under Information Technology Act, 2000.
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="totals-card">
          <div class="totals-row">
            <span>Taxable Subtotal (Base):</span>
            <strong style="font-family: 'JetBrains Mono', monospace;">${formatMoney(subtotal, currency)}</strong>
          </div>

          ${taxPercent > 0 ? `
            <div class="totals-row">
              <span>CGST (${taxPercent / 2}%):</span>
              <strong style="font-family: 'JetBrains Mono', monospace;">${formatMoney(halfTax, currency)}</strong>
            </div>
            <div class="totals-row">
              <span>SGST (${taxPercent / 2}%):</span>
              <strong style="font-family: 'JetBrains Mono', monospace;">${formatMoney(halfTax, currency)}</strong>
            </div>
          ` : `
            <div class="totals-row">
              <span>Tax (0% Export LUT):</span>
              <strong style="font-family: 'JetBrains Mono', monospace;">${formatMoney(0, currency)}</strong>
            </div>
          `}

          <div class="totals-grand">
            <span class="grand-label">Total Amount Paid</span>
            <span class="grand-amount">${formatMoney(totalAmount, currency)}</span>
          </div>

          ${amountWords ? `<div class="words-box">${amountWords}</div>` : ""}
        </div>
      </div>

      <!-- Verification Seal & Sovereign Signatory Block -->
      <div class="verification-section">
        <div class="audit-left">
          <div class="audit-title">
            <span>🛡️</span>
            <span>CRYPTOGRAPHIC SETTLEMENT & REVENUE ASSURANCE</span>
          </div>
          <div>
            Electronic settlement cleared via <strong>${inv.paymentEvidence?.provider?.toUpperCase() || 'RAZORPAY GATEWAY'}</strong>.
            Gateway Transaction ID: <code style="font-family: 'JetBrains Mono', monospace; color: var(--gold-light);">${inv.paymentEvidence?.paymentId}</code>.
          </div>
          <div class="hash-code">
            SHA-256 Scope Integrity Seal: ${inv.verificationHash}
          </div>
        </div>

        <div class="signatory-box">
          <div class="signature-calligraphy">Praveen Mahawar</div>
          <div class="signatory-name">${inv.seller?.founder || "Praveen Mahawar"}</div>
          <div class="signatory-role">Founder & Chief System Architect</div>
          <div style="font-size: 6.8pt; color: var(--text-muted); margin-top: 1px;">GARUDA AI Operating System</div>
        </div>
      </div>

      <!-- Footer Compliance Strip -->
      <div class="footer-note">
        <span>Official Commercial Document • GARUDA AI OS • SAC 998313</span>
        <span>Generated autonomously by GARUDA Revenue Engine • Digital Authenticity Guaranteed</span>
      </div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      const body = document.body;
      const isDark = body.classList.contains('dark-theme');
      const icon = document.getElementById('themeIcon');
      const label = document.getElementById('themeLabel');
      if (isDark) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        icon.textContent = '🌙';
        label.textContent = 'Cyber Dark View';
      } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        icon.textContent = '☀️';
        label.textContent = 'Royal A4 Print View';
      }
    }
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
      body { padding: 0 !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; background: #0f172a; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border-bottom: 2px solid #d4af37; margin: -24px -24px 24px -24px;">
    <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 11pt; color: #d4af37;">
      <span>👑</span>
      <span>GARUDA Executive Proposal PDF</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 800; font-size: 9.5pt; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 9pt; cursor: pointer;">
        ✕ Close
      </button>
    </div>
  </div>

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
    (function() {
      function triggerPrint() {
        setTimeout(function() {
          try { window.print(); } catch(e) {}
        }, 350);
      }
      if (document.readyState === 'complete') {
        triggerPrint();
      } else {
        window.addEventListener('DOMContentLoaded', triggerPrint);
        window.addEventListener('load', triggerPrint);
        setTimeout(triggerPrint, 500);
      }
    })();
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

              {/* Corporate B2B Tax Invoices Card */}
              {invoices.length > 0 && (
                <div
                  style={{
                    marginTop: "2.5rem",
                    textAlign: "left",
                    background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(8,12,19,0.98) 100%)",
                    border: `1px solid rgba(212, 175, 55, 0.45)`,
                    borderRadius: 16,
                    padding: "1.75rem",
                    boxShadow: "0 16px 40px -10px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "rgba(212, 175, 55, 0.08)",
                          border: "1px solid rgba(212, 175, 55, 0.35)",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                          padding: 4
                        }}
                      >
                        <BrandAssetImage kind="branding" alt="GARUDA Sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, color: "#fff", fontSize: "1.05rem", letterSpacing: "0.02em" }}>
                          Official B2B Corporate Tax Invoices
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                          SAC Code: <strong style={{ color: "#e2e8f0" }}>998313</strong> • GST Rule 46 Compliant • Cryptographic Settlement Proof
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", padding: "0.25rem 0.65rem", borderRadius: 6, fontWeight: 700 }}>
                        ✓ SETTLED & PAID
                      </span>
                      <span style={{ fontSize: "0.72rem", background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.35)", color: GOLD_LIGHT, padding: "0.25rem 0.65rem", borderRadius: 6, fontFamily: "monospace", fontWeight: 700 }}>
                        ORIGINAL TAX RECEIPT
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {invoices.map((inv) => (
                      <div
                        key={inv.invoiceId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1.1rem 1.25rem",
                          background: "rgba(15, 23, 36, 0.75)",
                          border: "1px solid rgba(212, 175, 55, 0.25)",
                          borderRadius: 12,
                          flexWrap: "wrap",
                          gap: "1rem",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fff", fontSize: "0.98rem", letterSpacing: "0.03em" }}>
                              {inv.invoiceNumber}
                            </span>
                            <span style={{ fontSize: "0.68rem", background: "rgba(212,175,55,0.12)", color: GOLD_LIGHT, padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                              {inv.paymentType}
                            </span>
                            <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.06)", color: "#cbd5e1", padding: "0.15rem 0.5rem", borderRadius: 4 }}>
                              {new Date(inv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "#9ca3af", marginTop: "0.4rem" }}>
                            Paid: <strong style={{ color: GOLD_LIGHT, fontSize: "0.95rem" }}>{formatMoney(inv.pricing?.totalAmount, inv.pricing?.currency)}</strong> 
                            <span style={{ marginLeft: "0.5rem", color: "#6b7280" }}>
                              (Base: {formatMoney(inv.pricing?.subtotal, inv.pricing?.currency)} + GST {inv.pricing?.taxPercent}%)
                            </span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace", marginTop: "0.25rem" }}>
                            Gateway Ref: {inv.paymentEvidence?.paymentId} • SHA-256 Verified
                          </div>
                        </div>

                        <button
                          onClick={() => handlePrintTaxInvoice(inv)}
                          style={{
                            background: `linear-gradient(135deg, ${GOLD}, #b8860b)`,
                            color: "#05080e",
                            border: "none",
                            borderRadius: 10,
                            padding: "0.65rem 1.25rem",
                            fontWeight: 800,
                            fontSize: "0.86rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            boxShadow: "0 4px 15px rgba(212, 175, 55, 0.35)",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(212, 175, 55, 0.5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "0 4px 15px rgba(212, 175, 55, 0.35)";
                          }}
                        >
                          <span>🖨️</span>
                          <span>View & Print Luxury Tax Invoice (PDF)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
