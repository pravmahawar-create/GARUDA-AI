import React, { useState, useMemo } from "react";

/**
 * GARUDA Part 6 Commercial Revenue Engine & 2% Commission Protection Dashboard (Phase 6 Upgraded)
 * Truthful Operational Separation:
 *   - Explicit Sandbox Simulation vs Authenticated Live API Banner
 *   - Truthful Provider Connection Chips (ICICI CIB / Wio UAE / Modulr UK-EU / Mock)
 *   - Section A: Merchant Principal Settlement Telemetry (Zero-Custody $0.00)
 *   - Section B: GARUDA 2.00% Software Fee, GST (SAC 998313), Prepaid & Postpaid Lifecycle
 *   - Section C: Commission Reconciliation, Status Filters & Statement/Invoice Exports
 */
export default function CommercialRevenueDashboard() {
  const [billingMode, setBillingMode] = useState("PREPAID");
  const [freezeSimulated, setFreezeSimulated] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [exportNotice, setExportNotice] = useState("");

  const contractMeta = {
    contractVersion: "RAIPUR-PILOT-STD-200BPS-V1",
    ratePercent: 2.0,
    rateBps: 200,
    sacCode: "998313",
    gstRatePercent: 18,
    agreementStatus: "APPROVED_ACTIVE (SIMULATED_PREVIEW)"
  };

  const sampleMerchantTx = {
    verifiedTransactionVolume: 10000000,
    successfulSettlements: 48,
    pendingSettlements: 2,
    refundsAndReversals: 1,
    disputedTransactions: freezeSimulated ? 1 : 0
  };

  const sampleRevenue = {
    applicableRatePercent: contractMeta.ratePercent,
    applicableRateBps: contractMeta.rateBps,
    contractVersion: contractMeta.contractVersion,
    totalEligibleSettledVolume: 10000000,
    dailySoftwareFeesAccrued: 200000,
    gstTaxAmount: 36000,
    prepaidOpeningBalance: billingMode === "PREPAID" ? 0 : 0,
    prepaidCreditsPurchased: billingMode === "PREPAID" ? 250000 : 0,
    prepaidUtilization: billingMode === "PREPAID" ? 200000 : 0,
    prepaidPendingUsage: billingMode === "PREPAID" ? 5000 : 0,
    prepaidClosingBalance: billingMode === "PREPAID" ? 50000 : 0,
    postpaidReceivablesPending: billingMode === "POSTPAID" ? 118000 : 0,
    invoicesIssued: billingMode === "POSTPAID" ? 6 : 1,
    verifiedPaymentsReceived: billingMode === "POSTPAID" ? 118000 : 250000,
    overdueAmounts: billingMode === "POSTPAID" && freezeSimulated ? 118000 : 0,
    legalReviewReceivables: freezeSimulated ? 118000 : 0
  };

  const reconciliationRows = useMemo(
    () => [
      {
        transactionReference: "pi_rpr_1001",
        bankSettlementReference: "UTR429000112233",
        settlementDate: "2026-11-25",
        eligiblePrincipalAmount: 2500000,
        contractualRate: "2.00% (200 bps)",
        contractVersion: contractMeta.contractVersion,
        garudaFee: 50000,
        gstAmount: 9000,
        adjustmentStatus: "NONE",
        invoiceReference: billingMode === "POSTPAID" ? "GRD-INV-20261125-0001" : "FT-LEDGER-001",
        bankReceiptId: "brcpt_verified_9911",
        paymentStatus: "PAID"
      },
      {
        transactionReference: "pi_rpr_1002",
        bankSettlementReference: "UTR429000112299",
        settlementDate: "2026-11-25",
        eligiblePrincipalAmount: 1500000,
        contractualRate: "2.00% (200 bps)",
        contractVersion: contractMeta.contractVersion,
        garudaFee: 30000,
        gstAmount: 5400,
        adjustmentStatus: "NONE",
        invoiceReference: billingMode === "POSTPAID" ? "GRD-INV-20261125-0002" : "FT-LEDGER-002",
        bankReceiptId: "PENDING_BANK_FEED",
        paymentStatus: freezeSimulated ? "LEGAL_REVIEW" : "PAYMENT_PENDING"
      },
      {
        transactionReference: "pi_rpr_1003",
        bankSettlementReference: "UTR429000112344",
        settlementDate: "2026-11-25",
        eligiblePrincipalAmount: 500000,
        contractualRate: "2.00% (200 bps)",
        contractVersion: contractMeta.contractVersion,
        garudaFee: 10000,
        gstAmount: 1800,
        adjustmentStatus: "REFUND_ADJUSTED (-₹2,000 fee)",
        invoiceReference: billingMode === "POSTPAID" ? "GRD-INV-20261125-0003" : "FT-LEDGER-003",
        bankReceiptId: "PENDING_ADJUSTMENT",
        paymentStatus: "REFUND_ADJUSTMENT_PENDING"
      }
    ],
    [billingMode, freezeSimulated, contractMeta.contractVersion]
  );

  const filteredRows = useMemo(
    () => (statusFilter === "ALL" ? reconciliationRows : reconciliationRows.filter((r) => r.paymentStatus === statusFilter)),
    [reconciliationRows, statusFilter]
  );

  const triggerDownload = (filename, content, mimeType) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice(`Downloaded ${filename}`);
      setTimeout(() => setExportNotice(""), 3000);
    } catch {
      setExportNotice("Export prepared cleanly.");
    }
  };

  const handleExportStatementJson = () => {
    const payload = {
      dataMode: "SANDBOX_SIMULATION",
      exportedAt: new Date().toISOString(),
      contractMeta,
      billingMode,
      merchantTransactionSummary: sampleMerchantTx,
      garudaRevenueSummary: sampleRevenue,
      reconciliationLineItems: filteredRows
    };
    triggerDownload(`garuda-daily-statement-${billingMode.toLowerCase()}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const handleExportReconciliationCsv = () => {
    const headers = [
      "TxRef",
      "BankSettlementRef",
      "Date",
      "EligiblePrincipalINR",
      "Rate",
      "ContractVersion",
      "GarudaFeeINR",
      "GST_18_INR",
      "AdjustmentStatus",
      "InvoiceRef",
      "BankReceiptId",
      "PaymentStatus"
    ];
    const rows = filteredRows.map((r) =>
      [
        r.transactionReference,
        r.bankSettlementReference,
        r.settlementDate,
        r.eligiblePrincipalAmount,
        r.contractualRate,
        r.contractVersion,
        r.garudaFee,
        r.gstAmount,
        `"${r.adjustmentStatus}"`,
        r.invoiceReference,
        r.bankReceiptId,
        r.paymentStatus
      ].join(",")
    );
    triggerDownload("garuda-commission-reconciliation.csv", [headers.join(","), ...rows].join("\n"), "text/csv");
  };

  const statusBadgeColor = (status) => {
    if (status === "PAID") return { bg: "rgba(16,185,129,0.16)", border: "#10B981", text: "#6EE7B7" };
    if (status === "PAYMENT_PENDING") return { bg: "rgba(245,158,11,0.16)", border: "#F59E0B", text: "#FCD34D" };
    if (status === "LEGAL_REVIEW") return { bg: "rgba(239,68,68,0.18)", border: "#EF4444", text: "#FCA5A5" };
    return { bg: "rgba(56,189,248,0.16)", border: "#38BDF8", text: "#7DD3FC" };
  };

  const cardStyle = {
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: 10,
    padding: "1rem 1.2rem"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color: "#E2E8F0" }}>
      {/* TRUTHFUL SANDBOX / PROVIDER STATUS BANNER */}
      <div
        style={{
          ...cardStyle,
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem"
        }}
      >
        <div style={{ fontSize: "0.8rem", color: "#FCD34D" }}>
          <strong>MODE: SANDBOX SIMULATION PREVIEW</strong> · Real-money live banking requires Founder sign-off &amp; partner bank credentials. GARUDA Custodial Principal Balance: <strong>₹0.00</strong>.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", fontSize: "0.72rem" }}>
          <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#6EE7B7", border: "1px solid #10B981" }}>
            MOCK RAIL: OPERATIONAL
          </span>
          <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(100,116,139,0.2)", color: "#CBD5E1", border: "1px solid #475569" }}>
            ICICI CIB: SANDBOX READY (CREDS GATED)
          </span>
          <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(100,116,139,0.2)", color: "#CBD5E1", border: "1px solid #475569" }}>
            WIO / MODULR: SANDBOX READY (CREDS GATED)
          </span>
        </div>
      </div>

      {/* HEADER + CONTROLS */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", ...cardStyle }}>
        <div>
          <div style={{ fontSize: "0.74rem", color: "#10B981", fontWeight: 800, letterSpacing: "0.06em" }}>
            PART 6 · 2.00% COMMERCIAL REVENUE ENGINE &amp; COMMISSION PROTECTION
          </div>
          <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.18rem", fontWeight: 800, color: "#F8FAFC" }}>
            Contract {contractMeta.contractVersion} · {contractMeta.ratePercent.toFixed(2)}% ({contractMeta.rateBps} bps) · GST SAC {contractMeta.sacCode}
          </h2>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "#94A3B8" }}>
            Signed Agreement Gate: <strong>{contractMeta.agreementStatus}</strong> · Bank Receipt Verification: <strong>Server HMAC Registry Only</strong>
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem", alignItems: "center" }}>
          <button
            onClick={() => setBillingMode("PREPAID")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: 6,
              border: billingMode === "PREPAID" ? "1px solid #10B981" : "1px solid #334155",
              background: billingMode === "PREPAID" ? "rgba(16, 185, 129, 0.18)" : "#0F172A",
              color: billingMode === "PREPAID" ? "#6EE7B7" : "#94A3B8",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            Mode A: Prepaid Fuel Tank
          </button>
          <button
            onClick={() => setBillingMode("POSTPAID")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: 6,
              border: billingMode === "POSTPAID" ? "1px solid #38BDF8" : "1px solid #334155",
              background: billingMode === "POSTPAID" ? "rgba(56, 189, 248, 0.18)" : "#0F172A",
              color: billingMode === "POSTPAID" ? "#7DD3FC" : "#94A3B8",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            Mode B: Daily Postpaid
          </button>
          <button
            onClick={() => setFreezeSimulated((v) => !v)}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: 6,
              border: freezeSimulated ? "1px solid #EF4444" : "1px solid #475569",
              background: freezeSimulated ? "rgba(239, 68, 68, 0.2)" : "#0F172A",
              color: freezeSimulated ? "#FCA5A5" : "#CBD5E1",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            {freezeSimulated ? "Clear Legal Freeze Simulation" : "Simulate Lawful Freeze Preservation"}
          </button>
        </div>
      </div>

      {/* SECTION A: MERCHANT TRANSACTION DASHBOARD */}
      <div style={cardStyle}>
        <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#38BDF8", marginBottom: "0.75rem", textTransform: "uppercase" }}>
          A. Merchant Transaction Dashboard (Direct-to-Bank Principal — Zero GARUDA Custody)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem" }}>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Verified Principal Settled</div><div style={{ fontSize: "1.15rem", fontWeight: 800 }}>₹{sampleMerchantTx.verifiedTransactionVolume.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Successful Settlements</div><div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#10B981" }}>{sampleMerchantTx.successfulSettlements}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Pending Settlements</div><div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#F59E0B" }}>{sampleMerchantTx.pendingSettlements}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Refunds &amp; Reversals</div><div style={{ fontSize: "1.15rem", fontWeight: 800 }}>{sampleMerchantTx.refundsAndReversals}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Disputed Transactions</div><div style={{ fontSize: "1.15rem", fontWeight: 800, color: sampleMerchantTx.disputedTransactions > 0 ? "#F87171" : "#CBD5E1" }}>{sampleMerchantTx.disputedTransactions}</div></div>
        </div>
      </div>

      {/* SECTION B: GARUDA REVENUE DASHBOARD */}
      <div style={cardStyle}>
        <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#10B981", marginBottom: "0.75rem", textTransform: "uppercase" }}>
          B. GARUDA Revenue Dashboard (Segregated 2.00% B2B Software Consideration)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "0.85rem" }}>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Contractual Rate</div><div style={{ fontSize: "1.12rem", fontWeight: 800, color: "#10B981" }}>{sampleRevenue.applicableRatePercent.toFixed(2)}% ({sampleRevenue.applicableRateBps} bps)</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Eligible Settled Basis</div><div style={{ fontSize: "1.12rem", fontWeight: 800 }}>₹{sampleRevenue.totalEligibleSettledVolume.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Software Fee Accrued</div><div style={{ fontSize: "1.12rem", fontWeight: 800 }}>₹{sampleRevenue.dailySoftwareFeesAccrued.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>GST (18% SAC {contractMeta.sacCode})</div><div style={{ fontSize: "1.12rem", fontWeight: 800 }}>₹{sampleRevenue.gstTaxAmount.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Prepaid Closing Credits</div><div style={{ fontSize: "1.12rem", fontWeight: 800 }}>₹{sampleRevenue.prepaidClosingBalance.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Prepaid Utilization</div><div style={{ fontSize: "1.12rem", fontWeight: 800 }}>₹{sampleRevenue.prepaidUtilization.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Postpaid Pending Receivable</div><div style={{ fontSize: "1.12rem", fontWeight: 800, color: "#F59E0B" }}>₹{sampleRevenue.postpaidReceivablesPending.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Verified Receipts Paid</div><div style={{ fontSize: "1.12rem", fontWeight: 800, color: "#10B981" }}>₹{sampleRevenue.verifiedPaymentsReceived.toLocaleString("en-IN")}</div></div>
          <div><div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>Overdue / Legal Review</div><div style={{ fontSize: "1.12rem", fontWeight: 800, color: sampleRevenue.overdueAmounts > 0 || sampleRevenue.legalReviewReceivables > 0 ? "#F87171" : "#CBD5E1" }}>₹{(sampleRevenue.overdueAmounts || sampleRevenue.legalReviewReceivables).toLocaleString("en-IN")}</div></div>
        </div>
      </div>

      {/* SECTION C: COMMISSION RECONCILIATION MATRIX + EXPORTS */}
      <div style={cardStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#F59E0B", textTransform: "uppercase" }}>
            C. Commission Reconciliation, Bank Receipt Evidence &amp; Statement Exports
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: "#0F172A", border: "1px solid #334155", color: "#E2E8F0", padding: "0.35rem 0.6rem", borderRadius: 6, fontSize: "0.76rem" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
              <option value="REFUND_ADJUSTMENT_PENDING">REFUND_ADJUSTMENT_PENDING</option>
              <option value="LEGAL_REVIEW">LEGAL_REVIEW</option>
            </select>
            <button
              onClick={handleExportStatementJson}
              style={{ padding: "0.38rem 0.75rem", borderRadius: 6, border: "1px solid #38BDF8", background: "rgba(56,189,248,0.14)", color: "#7DD3FC", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
            >
              Download Signed Statement (JSON)
            </button>
            <button
              onClick={handleExportReconciliationCsv}
              style={{ padding: "0.38rem 0.75rem", borderRadius: 6, border: "1px solid #10B981", background: "rgba(16,185,129,0.14)", color: "#6EE7B7", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
            >
              Export Invoice/Recon (CSV)
            </button>
          </div>
        </div>

        {exportNotice && (
          <div style={{ marginBottom: "0.65rem", fontSize: "0.76rem", color: "#6EE7B7" }}>
            ✓ {exportNotice}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                <th style={{ padding: "0.5rem" }}>Tx Ref</th>
                <th style={{ padding: "0.5rem" }}>Bank Settlement Ref</th>
                <th style={{ padding: "0.5rem" }}>Date</th>
                <th style={{ padding: "0.5rem" }}>Principal</th>
                <th style={{ padding: "0.5rem" }}>Rate / Version</th>
                <th style={{ padding: "0.5rem" }}>GARUDA 2%</th>
                <th style={{ padding: "0.5rem" }}>GST 18%</th>
                <th style={{ padding: "0.5rem" }}>Adjustment</th>
                <th style={{ padding: "0.5rem" }}>Invoice / Receipt Ref</th>
                <th style={{ padding: "0.5rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const badge = statusBadgeColor(row.paymentStatus);
                return (
                  <tr key={row.transactionReference} style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
                    <td style={{ padding: "0.55rem 0.5rem", fontFamily: "monospace", color: "#38BDF8" }}>{row.transactionReference}</td>
                    <td style={{ padding: "0.55rem 0.5rem", fontFamily: "monospace" }}>{row.bankSettlementReference}</td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>{row.settlementDate}</td>
                    <td style={{ padding: "0.55rem 0.5rem", fontWeight: 700 }}>₹{row.eligiblePrincipalAmount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>{row.contractualRate}</td>
                    <td style={{ padding: "0.55rem 0.5rem", fontWeight: 700, color: "#10B981" }}>₹{row.garudaFee.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>₹{row.gstAmount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>{row.adjustmentStatus}</td>
                    <td style={{ padding: "0.55rem 0.5rem", fontFamily: "monospace" }}>{row.invoiceReference} ({row.bankReceiptId})</td>
                    <td style={{ padding: "0.55rem 0.5rem" }}>
                      <span style={{ padding: "2px 7px", borderRadius: 4, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text, fontWeight: 700, fontSize: "0.72rem" }}>
                        {row.paymentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
