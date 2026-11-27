import React, { useState } from "react";
import { FiPlus, FiCheckCircle, FiDownload } from "react-icons/fi";
import {
  KpiCard,
  StatusBadge,
  DataTable,
  ConfirmModal,
  formatMoney,
  formatDateTime,
  downloadTextFile
} from "./FintechUiPrimitives";

export function MerchantManagementView({
  mode,
  merchants = [],
  loading,
  error,
  onRegisterMerchant,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    merchantId: "",
    legalName: "",
    corporateBankName: "ICICI Corporate Banking",
    destinationBankIban: "",
    country: "IN",
    currency: "INR",
    preferredBillingMode: "PREPAID"
  });

  const filtered = merchants.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${m.merchantId} ${m.legalName} ${m.corporateBankName} ${m.maskedIban}`.toLowerCase().includes(q);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onRegisterMerchant(form);
    setShowModal(false);
    setForm({ merchantId: "", legalName: "", corporateBankName: "ICICI Corporate Banking", destinationBankIban: "", country: "IN", currency: "INR", preferredBillingMode: "PREPAID" });
  };

  return (
    <div className="ef-card">
      <div className="ef-card-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Merchant Management & Corporate Bank Coordinates</h2>
          <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
            Raw IBANs are masked/hashed server-side; Zero-Custody Guard rejects any GARUDA beneficiary or omnibus wallet.
          </div>
        </div>
        <button type="button" className="ef-btn ef-btn--primary" onClick={() => setShowModal(true)} disabled={busyAction}>
          <FiPlus /> {isSim ? "Simulate Merchant Onboarding" : "Register Merchant"}
        </button>
      </div>

      <div className="ef-filters">
        <input className="ef-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search merchant ID, legal name or bank..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        loading={loading}
        error={error}
        rows={filtered}
        onRowClick={(r) => onInspectRow(`Merchant Profile: ${r.legalName}`, r)}
        columns={[
          { key: "merchantId", label: "Merchant ID", render: (r) => <span className="ef-mono" style={{ color: "#7dd3fc", fontSize: "0.77rem" }}>{r.merchantId}</span> },
          { key: "legalName", label: "Corporate Entity", render: (r) => <div style={{ fontWeight: 600 }}>{r.legalName}</div> },
          { key: "bank", label: "Destination Bank (Masked)", render: (r) => <span>{r.corporateBankName} · <code className="ef-mono">{r.maskedIban || "****"}</code></span> },
          { key: "preferredBillingMode", label: "Commercial Mode", render: (r) => <StatusBadge value={r.preferredBillingMode || "PREPAID"} simulated={r.isSimulated || isSim} /> },
          { key: "kybStatus", label: "Verification / Freeze", render: (r) => <StatusBadge value={r.accountFreezeActive ? "LEGAL_REVIEW" : (r.kybStatus || r.agreementStatus || "REGISTERED")} simulated={r.isSimulated || isSim} /> }
        ]}
      />

      {showModal && (
        <div className="ef-modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="ef-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>{isSim ? "Onboard Simulated Merchant" : "Register Live Tenant Merchant"}</h3>
            {!isSim && (
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Merchant Identifier
                <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })} placeholder="e.g. m_raipur_node_01" />
              </label>
            )}
            <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
              Legal Entity Name
              <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} placeholder="Customer Corporate Entity Pvt Ltd" />
            </label>
            <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
              Corporate Settlement Bank Account / IBAN
              <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.destinationBankIban} onChange={(e) => setForm({ ...form, destinationBankIban: e.target.value })} placeholder="INICIC000104998877" />
            </label>
            <div className="ef-grid-2">
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Currency
                <select className="ef-select" style={{ width: "100%", marginTop: 4 }} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="INR">INR</option>
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Billing Mode
                <select className="ef-select" style={{ width: "100%", marginTop: 4 }} value={form.preferredBillingMode} onChange={(e) => setForm({ ...form, preferredBillingMode: e.target.value })}>
                  <option value="PREPAID">PREPAID (Fuel Tank)</option>
                  <option value="POSTPAID">POSTPAID (Daily Invoice)</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ef-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="ef-btn ef-btn--primary" disabled={busyAction}>Save Merchant</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function CommercialAgreementsView({
  mode,
  agreements = [],
  merchants = [],
  loading,
  error,
  onCreateAgreement,
  onApproveAgreement,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [confirmApproveTarget, setConfirmApproveTarget] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    merchantId: merchants[0]?.merchantId || "",
    billingMode: "POSTPAID",
    contractVersion: "MSA-2026-200BPS-V1"
  });

  const submitCreate = async (e) => {
    e.preventDefault();
    const resolvedId = form.merchantId || merchants[0]?.merchantId || "";
    const merch = merchants.find((m) => m.merchantId === resolvedId);
    await onCreateAgreement({
      merchantId: resolvedId,
      merchantLegalName: merch?.legalName || resolvedId,
      billingMode: form.billingMode,
      contractVersion: form.contractVersion,
      commissionRate: 0.02
    });
    setShowNew(false);
  };

  return (
    <div className="ef-card">
      <div className="ef-card-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Commercial Agreements & 200 bps Governance</h2>
          <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
            Default rate locked at 2.00% (200 bps). Founder authorization required for contract approval or non-default rate modification.
          </div>
        </div>
        <button type="button" className="ef-btn ef-btn--primary" onClick={() => setShowNew(true)} disabled={busyAction}>
          <FiPlus /> Draft Agreement (2.00%)
        </button>
      </div>

      <DataTable
        loading={loading}
        error={error}
        rows={agreements}
        onRowClick={(r) => onInspectRow(`Agreement: ${r.contractId}`, r)}
        columns={[
          { key: "contractId", label: "Contract ID", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.contractId}</span> },
          { key: "merchantId", label: "Merchant", render: (r) => <span>{r.merchantLegalName || r.merchantId}</span> },
          { key: "contractVersion", label: "Version", render: (r) => <span className="ef-mono" style={{ fontSize: "0.76rem" }}>{r.contractVersion}</span> },
          { key: "rate", label: "Rate", render: (r) => <span className="ef-num" style={{ fontWeight: 700 }}>{((r.commissionBps || 200) / 100).toFixed(2)}% ({r.commissionBps || 200} bps)</span> },
          { key: "billingMode", label: "Mode", render: (r) => <StatusBadge value={r.billingMode} simulated={r.isSimulated || isSim} /> },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} simulated={r.isSimulated || isSim} /> },
          {
            key: "action",
            label: "Action",
            render: (r) =>
              r.status === "PENDING_APPROVAL" ? (
                <button
                  type="button"
                  className="ef-btn ef-btn--primary ef-btn--sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmApproveTarget(r);
                  }}
                >
                  <FiCheckCircle /> Founder Approve
                </button>
              ) : (
                <span style={{ fontSize: "0.74rem", color: "var(--ef-text-subtle)" }}>{r.signedRef || "Active"}</span>
              )
          }
        ]}
      />

      <ConfirmModal
        open={Boolean(confirmApproveTarget)}
        title="Confirm Founder Agreement Approval"
        message={`Activate commercial agreement ${confirmApproveTarget?.contractId} for ${confirmApproveTarget?.merchantId} at ${((confirmApproveTarget?.commissionBps || 200) / 100).toFixed(2)}% (${confirmApproveTarget?.billingMode})? In LIVE mode, this strictly checks Platform Founder authentication.`}
        confirmLabel="Approve & Activate Agreement"
        busy={busyAction}
        onCancel={() => setConfirmApproveTarget(null)}
        onConfirm={async () => {
          const target = confirmApproveTarget;
          setConfirmApproveTarget(null);
          await onApproveAgreement(target.contractId);
        }}
      />

      {showNew && (
        <div className="ef-modal-backdrop" onClick={() => setShowNew(false)}>
          <form className="ef-modal" onClick={(e) => e.stopPropagation()} onSubmit={submitCreate}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Create Draft Commercial Agreement (2.00% / 200 bps)</h3>
            <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
              Merchant Account
              {merchants.length > 0 ? (
                <select className="ef-select" style={{ width: "100%", marginTop: 4 }} value={form.merchantId || merchants[0].merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })}>
                  {merchants.map((m) => (
                    <option key={m.merchantId} value={m.merchantId}>{m.merchantId} — {m.legalName}</option>
                  ))}
                </select>
              ) : (
                <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })} placeholder="Enter Merchant ID" />
              )}
            </label>
            <div className="ef-grid-2">
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Billing Mode
                <select className="ef-select" style={{ width: "100%", marginTop: 4 }} value={form.billingMode} onChange={(e) => setForm({ ...form, billingMode: e.target.value })}>
                  <option value="PREPAID">PREPAID</option>
                  <option value="POSTPAID">POSTPAID</option>
                </select>
              </label>
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Contract Version
                <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.contractVersion} onChange={(e) => setForm({ ...form, contractVersion: e.target.value })} />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ef-btn" onClick={() => setShowNew(false)}>Cancel</button>
              <button type="submit" className="ef-btn ef-btn--primary" disabled={busyAction}>Create Draft</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function PrepaidFuelTankView({
  mode,
  tanks = [],
  loading,
  error,
  onTopUp,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [selectedMerchant, setSelectedMerchant] = useState(tanks[0]?.merchantId || "");
  const [topUpAmt, setTopUpAmt] = useState(25000);
  const [bankReceiptId, setBankReceiptId] = useState("");
  const activeTank = tanks.find((t) => t.merchantId === (selectedMerchant || tanks[0]?.merchantId)) || tanks[0] || null;

  const submitTopUp = async (e) => {
    e.preventDefault();
    await onTopUp({
      merchantId: activeTank?.merchantId || selectedMerchant || "SIM_M_BABA_01",
      amount: Number(topUpAmt),
      bankReceiptId: bankReceiptId.trim() || undefined
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ef-grid-4">
        <KpiCard label="Opening Balance" value={formatMoney(activeTank?.openingBalance || 0, "INR")} subtitle="Advance SaaS Software Credits" />
        <KpiCard label="Credits Purchased" value={formatMoney(activeTank?.creditsPurchased || 0, "INR")} subtitle="Requires Verified Bank Receipt" badgeText="MODE A" badgeTone="info" />
        <KpiCard label="2% Utilization + Refunds" value={formatMoney(activeTank?.utilization || 0, "INR")} subtitle={`Refund credits restored: ${formatMoney(activeTank?.refundCreditsAdjusted || 0, "INR")}`} />
        <KpiCard
          label="Closing Available Balance"
          value={formatMoney(activeTank?.closingBalance || 0, "INR")}
          subtitle={activeTank?.newOrchestrationPaused ? "Paused cleanly at zero balance" : `Alert threshold: ${formatMoney(activeTank?.lowBalanceThreshold || 0, "INR")}`}
          badgeText={activeTank?.newOrchestrationPaused ? "PAUSED" : activeTank?.lowBalanceAlert ? "LOW FUEL" : "ACTIVE"}
          badgeTone={activeTank?.newOrchestrationPaused ? "danger" : activeTank?.lowBalanceAlert ? "warning" : "success"}
        />
      </div>

      <div className="ef-card">
        <div className="ef-card-header">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Prepaid SaaS Fuel Tank & Hash-Chained Credit Ledger</h2>
            <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
              Strict classification: <code>GARUDA_ADVANCE_SAAS_CONSIDERATION</code> · Never represents customer deposits or settlement principal.
            </div>
          </div>
          {tanks.length > 0 && (
            <select className="ef-select" value={activeTank?.merchantId || ""} onChange={(e) => setSelectedMerchant(e.target.value)}>
              {tanks.map((t) => (
                <option key={t.merchantId} value={t.merchantId}>{t.merchantId} (Bal: {formatMoney(t.closingBalance)})</option>
              ))}
            </select>
          )}
        </div>

        <form onSubmit={submitTopUp} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--ef-border)" }}>
          <input type="number" min="100" required className="ef-input" style={{ width: 170 }} value={topUpAmt} onChange={(e) => setTopUpAmt(e.target.value)} placeholder="Top-up INR amount" />
          {!isSim && (
            <input className="ef-input" style={{ flex: 1, minWidth: 220 }} required value={bankReceiptId} onChange={(e) => setBankReceiptId(e.target.value)} placeholder="Verified bankReceiptId (from /bank-receipts/ingest)" />
          )}
          <button type="submit" className="ef-btn ef-btn--primary" disabled={busyAction}>
            {isSim ? "Simulate Verified HMAC Top-Up" : "Credit Fuel Tank (Verified Receipt)"}
          </button>
        </form>

        <DataTable
          loading={loading}
          error={error}
          rows={(activeTank?.entries || []).slice().reverse()}
          onRowClick={(r) => onInspectRow(`Fuel Ledger Entry: ${r.entryId}`, r)}
          columns={[
            { key: "entryId", label: "Entry ID", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.entryId}</span> },
            { key: "entryType", label: "Type", render: (r) => <StatusBadge value={r.entryType} simulated={isSim} /> },
            { key: "amount", label: "Delta Amount", render: (r) => <span className="ef-num" style={{ fontWeight: 700 }}>{formatMoney((r.amountMinor || 0) / 100, "INR")}</span> },
            { key: "closing", label: "Closing Balance", render: (r) => <span className="ef-num">{formatMoney((r.closingBalanceMinor || 0) / 100, "INR")}</span> },
            { key: "bankSettlementRef", label: "Bank Ref / Invoice", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.bankSettlementRef || r.invoiceRef || "—"}</span> },
            { key: "entryHash", label: "SHA-256 Chain", render: (r) => <span className="ef-mono" style={{ fontSize: "0.72rem", color: "#34d399" }}>{String(r.entryHash || "").slice(0, 14)}…</span> }
          ]}
        />
      </div>
    </div>
  );
}

export function PostpaidReceivablesView({
  mode,
  receivables = [],
  statements = [],
  loading,
  error,
  onGenerateStatement,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [statusFilter, setStatusFilter] = useState("ALL");
  const filtered = receivables.filter((r) => statusFilter === "ALL" || r.status === statusFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ef-card">
        <div className="ef-card-header">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Postpaid 2% Commission Receivables & Signed Statements</h2>
            <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
              Strict lifecycle: ACCRUED -&gt; RECONCILED -&gt; INVOICED -&gt; PAYMENT_PENDING -&gt; PAID (+ 18% GST SAC 998313).
            </div>
          </div>
          <button type="button" className="ef-btn ef-btn--primary" disabled={busyAction} onClick={() => onGenerateStatement({ amount: 750000 })}>
            {isSim ? "Simulate ₹7.5L Accrual & Statement" : "Generate Daily Signed Statement"}
          </button>
        </div>

        <div className="ef-filters">
          <select className="ef-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Receivable States</option>
            <option value="ACCRUED">ACCRUED</option>
            <option value="RECONCILED">RECONCILED</option>
            <option value="INVOICED">INVOICED</option>
            <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
            <option value="PAID">PAID</option>
            <option value="LEGAL_REVIEW">LEGAL_REVIEW</option>
          </select>
        </div>

        <DataTable
          loading={loading}
          error={error}
          rows={filtered}
          onRowClick={(r) => onInspectRow(`Postpaid Receivable: ${r.commissionId}`, r)}
          columns={[
            { key: "commissionId", label: "Receivable ID", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.commissionId}</span> },
            { key: "transactionId", label: "Settled Tx / UTR", render: (r) => <div><div className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.transactionId}</div><div style={{ fontSize: "0.71rem", color: "var(--ef-text-subtle)" }}>{r.bankSettlementRef}</div></div> },
            { key: "eligiblePrincipalAmount", label: "Settled Principal", render: (r) => <span className="ef-num">{formatMoney(r.eligiblePrincipalAmount, r.currency)}</span> },
            { key: "commissionFee", label: "2% Fee + GST", render: (r) => <span className="ef-num">{formatMoney(r.commissionFee, r.currency)} <span style={{ color: "var(--ef-text-subtle)", fontSize: "0.72rem" }}>(+{formatMoney(r.taxAmount || 0, r.currency)})</span></span> },
            { key: "status", label: "Lifecycle State", render: (r) => <StatusBadge value={r.status} simulated={r.isSimulated || isSim} /> },
            { key: "invoiceNumber", label: "Invoice Ref", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.invoiceNumber || "PENDING"}</span> }
          ]}
        />
      </div>

      {statements.length > 0 && (
        <div className="ef-card">
          <div className="ef-card-header">
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Signed Daily Reconciliation Statements (SHA-256)</h3>
          </div>
          <DataTable
            rows={statements}
            onRowClick={(s) => onInspectRow(`Daily Statement: ${s.statementId}`, s)}
            columns={[
              { key: "statementId", label: "Statement ID", render: (s) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{s.statementId}</span> },
              { key: "statementDate", label: "Date" },
              { key: "txCount", label: "Tx Count" },
              { key: "totalPayableAmount", label: "Total Payable (Incl. GST)", render: (s) => <span className="ef-num" style={{ fontWeight: 700 }}>{formatMoney(s.totalPayableAmount, s.currency)}</span> },
              { key: "statementHash", label: "SHA-256 Digest", render: (s) => <span className="ef-mono" style={{ fontSize: "0.72rem", color: "#34d399" }}>{String(s.statementHash || "").slice(0, 16)}…</span> }
            ]}
          />
        </div>
      )}
    </div>
  );
}

export function InvoicesAndTrackingView({
  mode,
  invoices = [],
  loading,
  error,
  onVerifyInvoicePayment,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [payTarget, setPayTarget] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [bankReceiptId, setBankReceiptId] = useState("");

  const exportCsv = () => {
    const header = "environmentMode,isSimulated,invoiceNumber,merchantId,sacCode,subtotalAmount,gstAmount,totalAmount,paidAmount,outstandingAmount,status\n";
    const body = invoices.map((i) => `${mode},${isSim},${i.invoiceNumber},${i.merchantId},${i.sacCode},${i.subtotalAmount},${i.gstAmount},${i.totalAmount},${i.paidAmount},${i.outstandingAmount},${i.status}`).join("\n");
    downloadTextFile(`treasury_invoices_${mode.toLowerCase()}.csv`, header + body, "text/csv");
  };

  return (
    <div className="ef-card">
      <div className="ef-card-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Invoices & Commission Payment Tracking (SAC 998313)</h2>
          <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
            Marking any invoice PAID strictly requires a server-side authenticated bank receipt (boolean self-attestation rejected).
          </div>
        </div>
        <button type="button" className="ef-btn ef-btn--sm" onClick={exportCsv} disabled={invoices.length === 0}>
          <FiDownload /> Export CSV
        </button>
      </div>

      <DataTable
        loading={loading}
        error={error}
        rows={invoices}
        onRowClick={(r) => onInspectRow(`GST Invoice: ${r.invoiceNumber}`, r)}
        columns={[
          { key: "invoiceNumber", label: "Invoice #", render: (r) => <span className="ef-mono" style={{ color: "#7dd3fc", fontSize: "0.77rem" }}>{r.invoiceNumber}</span> },
          { key: "merchantId", label: "Merchant" },
          { key: "totalAmount", label: "Total (Incl. 18% GST)", render: (r) => <span className="ef-num" style={{ fontWeight: 700 }}>{formatMoney(r.totalAmount, r.currency)}</span> },
          { key: "paidAmount", label: "Verified Paid", render: (r) => <span className="ef-num" style={{ color: "#34d399" }}>{formatMoney(r.paidAmount, r.currency)}</span> },
          { key: "outstandingAmount", label: "Outstanding", render: (r) => <span className="ef-num" style={{ color: r.outstandingAmount > 0 ? "#fcd34d" : "#34d399" }}>{formatMoney(r.outstandingAmount, r.currency)}</span> },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} simulated={r.isSimulated || isSim} /> },
          {
            key: "pay",
            label: "Settlement Verify",
            render: (r) =>
              r.outstandingAmount > 0 ? (
                <button
                  type="button"
                  className="ef-btn ef-btn--primary ef-btn--sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPayTarget(r);
                    setPaidAmount(String(r.outstandingAmount));
                  }}
                >
                  {isSim ? "Simulate Bank Receipt Pay" : "Verify Bank Receipt"}
                </button>
              ) : (
                <span style={{ fontSize: "0.74rem", color: "#34d399" }}>Settled in full</span>
              )
          }
        ]}
      />

      {payTarget && (
        <div className="ef-modal-backdrop" onClick={() => setPayTarget(null)}>
          <form
            className="ef-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              await onVerifyInvoicePayment({
                invoiceId: payTarget.invoiceId,
                paidAmount: Number(paidAmount),
                bankReceiptId: bankReceiptId.trim() || undefined
              });
              setPayTarget(null);
              setBankReceiptId("");
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Verify Commission Payment — {payTarget.invoiceNumber}</h3>
            <div style={{ fontSize: "0.8rem", color: "var(--ef-text-muted)" }}>
              Outstanding balance: <strong style={{ color: "var(--ef-text)" }}>{formatMoney(payTarget.outstandingAmount, payTarget.currency)}</strong>
            </div>
            <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
              Payment Amount
              <input type="number" min="1" max={payTarget.outstandingAmount} required className="ef-input" style={{ width: "100%", marginTop: 4 }} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
            </label>
            {!isSim && (
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Verified Server Bank Receipt ID
                <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={bankReceiptId} onChange={(e) => setBankReceiptId(e.target.value)} placeholder="Ingested via POST /api/fintech/bank-receipts/ingest" />
              </label>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ef-btn" onClick={() => setPayTarget(null)}>Cancel</button>
              <button type="submit" className="ef-btn ef-btn--primary" disabled={busyAction}>
                {isSim ? "Ingest SIM HMAC Receipt & Pay" : "Verify Payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
