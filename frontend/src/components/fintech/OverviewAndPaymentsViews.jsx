import React, { useState, useMemo } from "react";
import { FiPlus, FiRefreshCw, FiPlay, FiShield, FiAlertCircle } from "react-icons/fi";
import {
  KpiCard,
  StatusBadge,
  DataTable,
  formatMoney,
  formatDateTime
} from "./FintechUiPrimitives";

export function ExecutiveOverviewView({
  mode,
  snapshot,
  journeyResult,
  loading,
  error,
  onNavigate,
  onRunSimAction,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const ov = snapshot?.overview || {};
  const revDash = snapshot?.dashboards?.B_garudaRevenueDashboard || {};
  const mDash = snapshot?.dashboards?.A_merchantTransactionDashboard || {};
  const whMetrics = ov.webhookMetrics || {};
  const connectors = snapshot?.integrations || [];
  const notConnectedCount = connectors.filter((c) => c.connectionStatus === "NOT_CONNECTED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {error && (
        <div className="ef-alert-box ef-alert-box--error">
          <div>
            <strong>Live Backend Unavailable / Auth Required:</strong> {error}
          </div>
        </div>
      )}

      {isSim ? (
        <div className="ef-alert-box ef-alert-box--warning">
          <div>
            <strong>SIMULATED OPERATIONAL ENVIRONMENT ACTIVE:</strong> Every merchant, payment, UTR, and invoice below carries an explicit <span className="ef-badge ef-badge--simulated">SIMULATED</span> identifier. Zero real bank APIs or customer funds are touched.
          </div>
          <button
            type="button"
            className="ef-btn ef-btn--amber ef-btn--sm"
            disabled={busyAction}
            onClick={() => onRunSimAction("reset", {})}
          >
            <FiRefreshCw /> Reset Sandbox
          </button>
        </div>
      ) : (
        <div className="ef-alert-box ef-alert-box--info">
          <div>
            <strong>AUTHENTICATED TENANT WORKSPACE:</strong> Connected directly to tenant-isolated backend state. Unconnected bank & CRM integrations remain in <code>NOT CONNECTED / AWAITING CUSTOMER ACCESS</code> state.
          </div>
        </div>
      )}

      <div className="ef-grid-4">
        <KpiCard
          label="Custodial Principal Held"
          value={formatMoney(snapshot?.zeroCustodyPrincipalHeld ?? 0, "INR")}
          subtitle="Direct Buyer -> Bank -> Merchant Principal Rail"
          badgeText="ZERO-CUSTODY LOCKED"
          badgeTone="success"
        />
        <KpiCard
          label="Verified Settled Principal"
          value={formatMoney(ov.totalSettledPrincipal ?? mDash.verifiedTransactionVolume ?? 0, "INR")}
          subtitle={`${whMetrics.settledCount || 0} confirmed settlements`}
          badgeText={isSim ? "SIMULATED" : "200 BPS BASIS"}
          badgeTone={isSim ? "simulated" : "info"}
        />
        <KpiCard
          label="Prepaid Fuel Available"
          value={formatMoney(ov.totalFuelBalance ?? revDash.prepaidCreditsAvailable ?? 0, "INR")}
          subtitle={`2.00% metered utilization: ${formatMoney(revDash.prepaidUtilization || 0, "INR")}`}
          badgeText="MODE A CREDITS"
          badgeTone="info"
        />
        <KpiCard
          label="Postpaid Commission Due"
          value={formatMoney(ov.postpaidOutstanding ?? revDash.postpaidReceivables ?? 0, "INR")}
          subtitle={`Collected: ${formatMoney(ov.paymentsReceived ?? revDash.paymentsReceived ?? 0, "INR")}`}
          badgeText="MODE B SAC 998313"
          badgeTone={Number(ov.postpaidOutstanding || 0) > 0 ? "warning" : "success"}
        />
      </div>

      <div className="ef-grid-3">
        <div className="ef-card">
          <div className="ef-card-header">
            <div>
              <div className="ef-kpi-label">Commercial Contract & Fee Engine</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: 4 }}>2.00% (200 bps) Default Rate</div>
            </div>
            <button type="button" className="ef-btn ef-btn--sm" onClick={() => onNavigate("agreements")}>
              Manage Contracts
            </button>
          </div>
          <div style={{ display: "grid", gap: 8, fontSize: "0.81rem", color: "var(--ef-text-muted)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Onboarded Merchants</span>
              <strong style={{ color: "var(--ef-text)" }}>{ov.merchantsCount ?? 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Approved Active Agreements</span>
              <strong style={{ color: "#34d399" }}>{ov.activeAgreementsCount ?? 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Server Agreement Enforcement</span>
              <strong style={{ color: "#34d399" }}>STRICT (Mandatory)</strong>
            </div>
          </div>
        </div>

        <div className="ef-card">
          <div className="ef-card-header">
            <div>
              <div className="ef-kpi-label">Webhook & Reconciliation Guard</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: 4 }}>HMAC-SHA256 & Idempotency</div>
            </div>
            <button type="button" className="ef-btn ef-btn--sm" onClick={() => onNavigate("settlements")}>
              Reconciliation
            </button>
          </div>
          <div style={{ display: "grid", gap: 8, fontSize: "0.81rem", color: "var(--ef-text-muted)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Duplicates Blocked Idempotently</span>
              <strong style={{ color: "#7dd3fc" }}>{whMetrics.duplicateEventsBlocked ?? 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Invalid HMAC Signatures Rejected</span>
              <strong style={{ color: "#fda4af" }}>{whMetrics.invalidHmacRejected ?? 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Manual Review / Mismatches</span>
              <strong style={{ color: "#fcd34d" }}>{whMetrics.failedOrManualReviewCount ?? whMetrics.manualReviewCount ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="ef-card">
          <div className="ef-card-header">
            <div>
              <div className="ef-kpi-label">Bank & CRM Connectivity</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: 4 }}>Customer Access Gate</div>
            </div>
            <button type="button" className="ef-btn ef-btn--sm" onClick={() => onNavigate("integrations")}>
              Configure
            </button>
          </div>
          <div style={{ display: "grid", gap: 8, fontSize: "0.81rem", color: "var(--ef-text-muted)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Live Connectors Not Connected</span>
              <strong style={{ color: "#fcd34d" }}>{notConnectedCount || 7} Awaiting Access</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Audit Chain Integrity</span>
              <strong style={{ color: snapshot?.audit?.chainIntegrityValid !== false ? "#34d399" : "#fda4af" }}>
                {snapshot?.audit?.chainIntegrityValid !== false ? "VERIFIED SHA-256" : "CHECK AUDIT"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Last Engine Event</span>
              <span style={{ color: "var(--ef-text)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {whMetrics.lastEventNote || (loading ? "Syncing..." : "Operational")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isSim && (
        <div className="ef-card">
          <div className="ef-card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>End-to-End Customer Demo Journey & Scenario Runner (SIMULATED Only)</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 2 }}>
                Runs complete Merchant -&gt; Payment Intent -&gt; Settlement -&gt; Reconciliation -&gt; 2.00% Fee -&gt; GST Invoice -&gt; Payment Tracking on isolated sandbox data.
              </div>
            </div>
            <button type="button" className="ef-btn ef-btn--primary ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("full_customer_journey", { amount: 1200000 })}>
              <FiPlay /> Run Full 7-Step Customer Journey (₹12L)
            </button>
          </div>

          {journeyResult?.journeySteps && (
            <div style={{ marginBottom: 14 }}>
              <div className="ef-journey-steps">
                {journeyResult.journeySteps.map((s) => (
                  <div key={s.step} className="ef-journey-step">
                    <div style={{ fontWeight: 700, color: "#34d399" }}>{s.step}</div>
                    <div className="ef-mono" style={{ fontSize: "0.7rem", color: "var(--ef-text-muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{s.ref}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="ef-btn ef-btn--primary ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("settle_prepaid_payment", { amount: 500000, rail: "RTGS" })}>
              <FiPlay /> Successful ₹5L Settlement (2% Fee)
            </button>
            <button type="button" className="ef-btn ef-btn--amber ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("mismatch_settlement", { amount: 400000 })}>
              Mismatch Settlement (₹3.5L vs ₹4L)
            </button>
            <button type="button" className="ef-btn ef-btn--danger ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("failed_settlement", { amount: 180000 })}>
              Failed / Returned Rail Event
            </button>
            <button type="button" className="ef-btn ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("duplicate_webhook", {})}>
              Replay Duplicate Webhook
            </button>
            <button type="button" className="ef-btn ef-btn--danger ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("failed_webhook", {})}>
              Invalid HMAC Tamper Block
            </button>
            <button type="button" className="ef-btn ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("generate_postpaid_invoice", { amount: 750000 })}>
              Accrue ₹7.5L Postpaid & Statement
            </button>
            <button type="button" className="ef-btn ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("refund_reversal_adjustment", {})}>
              Refund Reversal Adjustment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentOperationsView({
  mode,
  intents = [],
  merchants = [],
  loading,
  error,
  onCreatePayment,
  onRunSimAction,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [railFilter, setRailFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    merchantId: merchants[0]?.merchantId || "",
    amount: 250000,
    currency: "INR",
    selectedRail: "RTGS",
    destinationBankIban: "INICIC000104998877"
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return intents.filter((row) => {
      if (statusFilter !== "ALL" && String(row.status || "").toUpperCase() !== statusFilter) return false;
      if (railFilter !== "ALL" && String(row.selectedRail || "").toUpperCase() !== railFilter) return false;
      const day = String(row.createdAt || "").slice(0, 10);
      if (dateFrom && day && day < dateFrom) return false;
      if (dateTo && day && day > dateTo) return false;
      if (q) {
        const hay = `${row.id} ${row.merchantId} ${row.merchantLegalName} ${row.paymentReference} ${row.bankSettlementRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [intents, search, statusFilter, railFilter, dateFrom, dateTo]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const targetMerchant = merchants.find((m) => m.merchantId === form.merchantId) || merchants[0];
    if (isSim) {
      await onRunSimAction("settle_prepaid_payment", {
        merchantId: form.merchantId || targetMerchant?.merchantId || "SIM_M_BABA_01",
        amount: Number(form.amount),
        rail: form.selectedRail
      });
    } else {
      await onCreatePayment({
        merchantId: form.merchantId || targetMerchant?.merchantId,
        merchantLegalName: targetMerchant?.legalName || form.merchantId,
        destinationBankIban: form.destinationBankIban,
        amount: Number(form.amount),
        currency: form.currency,
        selectedRail: form.selectedRail
      });
    }
    setShowCreateModal(false);
  };

  return (
    <div className="ef-card">
      <div className="ef-card-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Payment Operations & Intent Orchestration</h2>
          <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
            Strictly requires an APPROVED_ACTIVE agreement (200 bps default). Principal flows directly to merchant bank accounts.
          </div>
        </div>
        <button type="button" className="ef-btn ef-btn--primary" onClick={() => setShowCreateModal(true)} disabled={busyAction}>
          <FiPlus /> {isSim ? "Simulate New Settled Payment" : "Create Payment Intent"}
        </button>
      </div>

      <div className="ef-filters">
        <input className="ef-input" style={{ minWidth: 220, flex: 1 }} placeholder="Search intent ID, merchant, UTR reference..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="ef-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Statuses</option>
          <option value="SETTLED">SETTLED</option>
          <option value="PAYMENT_INSTRUCTION_CREATED">INSTRUCTION CREATED</option>
          <option value="INITIATED">INITIATED</option>
          <option value="MANUAL_REVIEW">MANUAL REVIEW</option>
          <option value="REVERSED">REVERSED</option>
        </select>
        <select className="ef-select" value={railFilter} onChange={(e) => { setRailFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Rails</option>
          <option value="RTGS">RTGS</option>
          <option value="IMPS">IMPS</option>
          <option value="NEFT">NEFT</option>
          <option value="FEDWIRE">FEDWIRE</option>
        </select>
        <input type="date" className="ef-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
        <input type="date" className="ef-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} title="To date" />
      </div>

      <DataTable
        loading={loading}
        error={error}
        rows={pagedRows}
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setPage}
        onRowClick={(r) => onInspectRow(`Payment Intent: ${r.id}`, r)}
        columns={[
          { key: "id", label: "Intent ID", render: (r) => <span className="ef-mono" style={{ fontSize: "0.76rem", color: "#7dd3fc" }}>{r.id}</span> },
          { key: "merchantId", label: "Merchant", render: (r) => <div><div style={{ fontWeight: 600 }}>{r.merchantLegalName || r.merchantId}</div><div style={{ fontSize: "0.72rem", color: "var(--ef-text-subtle)" }}>{r.merchantId}</div></div> },
          { key: "amount", label: "Principal Amount", render: (r) => <span className="ef-num" style={{ fontWeight: 700 }}>{formatMoney(r.amount, r.currency)}</span> },
          { key: "selectedRail", label: "Rail / Mode", render: (r) => <span>{r.selectedRail} · <span style={{ color: "var(--ef-text-muted)" }}>{r.billingMode}</span></span> },
          { key: "rate", label: "2% Software Fee", render: (r) => <span className="ef-num">{formatMoney(r.saasDeduction?.feeDeducted ?? r.commissionRecord?.commissionFee ?? r.fees?.garudaSaasFee ?? (r.amount * 0.02), r.currency)}</span> },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} simulated={r.isSimulated || isSim} /> },
          { key: "createdAt", label: "Timestamp", render: (r) => <span style={{ fontSize: "0.75rem", color: "var(--ef-text-muted)" }}>{formatDateTime(r.settledAt || r.createdAt)}</span> }
        ]}
      />

      {showCreateModal && (
        <div className="ef-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <form className="ef-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>{isSim ? "Simulate Payment Intent & Settlement" : "Create Live Payment Intent"}</h3>
              {isSim && <span className="ef-badge ef-badge--simulated">SIMULATED</span>}
            </div>
            <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
              Merchant Account
              {merchants.length > 0 ? (
                <select className="ef-select" style={{ width: "100%", marginTop: 4 }} value={form.merchantId || merchants[0].merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })}>
                  {merchants.map((m) => (
                    <option key={m.merchantId} value={m.merchantId}>{m.merchantId} — {m.legalName}</option>
                  ))}
                </select>
              ) : (
                <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })} placeholder="Enter registered Merchant ID" />
              )}
            </label>
            <div className="ef-grid-2">
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Principal Amount
                <input type="number" min="1" required className="ef-input" style={{ width: "100%", marginTop: 4 }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </label>
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                Clearing Rail
                <select className="ef-select" style={{ width: "100%", marginTop: 4 }} value={form.selectedRail} onChange={(e) => setForm({ ...form, selectedRail: e.target.value })}>
                  <option value="RTGS">RTGS</option>
                  <option value="IMPS">IMPS</option>
                  <option value="NEFT">NEFT</option>
                </select>
              </label>
            </div>
            {!isSim && (
              <label style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                External Merchant Corporate Bank IBAN / Account
                <input className="ef-input" style={{ width: "100%", marginTop: 4 }} required value={form.destinationBankIban} onChange={(e) => setForm({ ...form, destinationBankIban: e.target.value })} />
              </label>
            )}
            <div className="ef-alert-box ef-alert-box--info" style={{ fontSize: "0.75rem" }}>
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}><FiShield /> Expected 200 bps fee: {formatMoney(Number(form.amount || 0) * 0.02, form.currency)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ef-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="ef-btn ef-btn--primary" disabled={busyAction}>
                {busyAction ? "Submitting..." : isSim ? "Run Simulated Settlement" : "Create Payment Intent"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function SettlementAndReconciliationView({
  mode,
  intents = [],
  webhookMetrics = {},
  loading,
  error,
  onRunSimAction,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return intents
      .map((i) => ({
        ...i,
        reconciliationOutcome: i.status === "SETTLED" ? "MATCHED_EXACT" : i.status === "MANUAL_REVIEW" ? "MANUAL_REVIEW_REQUIRED" : i.status
      }))
      .filter((r) => {
        if (statusFilter !== "ALL" && r.status !== statusFilter && r.reconciliationOutcome !== statusFilter) return false;
        if (q) {
          const hay = `${r.id} ${r.bankSettlementRef || ""} ${r.providerTxId || ""} ${r.reconciliationNotes || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [intents, statusFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ef-grid-3">
        <KpiCard label="Matched Exact Settlements" value={rows.filter((r) => r.status === "SETTLED").length} subtitle="Bank webhook confirmed & reconciled" badgeTone="success" badgeText="MATCHED" />
        <KpiCard label="Duplicate Webhooks Blocked" value={webhookMetrics.duplicateEventsBlocked ?? 0} subtitle="Nonce / event replay prevention active" badgeTone="info" badgeText="IDEMPOTENT" />
        <KpiCard label="Manual Review / Failed HMAC" value={(rows.filter((r) => r.status === "MANUAL_REVIEW").length) + (webhookMetrics.invalidHmacRejected || 0)} subtitle={`Invalid HMAC rejected: ${webhookMetrics.invalidHmacRejected ?? 0}`} badgeTone="warning" badgeText="PROTECTED" />
      </div>

      <div className="ef-card">
        <div className="ef-card-header">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Settlement & Reconciliation Verification</h2>
            <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
              Strict raw-byte HMAC signature validation, currency/amount variance gating, and idempotent settlement confirmation.
            </div>
          </div>
          {isSim && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="ef-btn ef-btn--amber ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("mismatch_settlement", { amount: 400000 })}>
                Simulate Mismatch
              </button>
              <button type="button" className="ef-btn ef-btn--danger ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("failed_settlement", { amount: 180000 })}>
                Simulate Returned Rail
              </button>
              <button type="button" className="ef-btn ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("duplicate_webhook", {})}>
                Replay Duplicate
              </button>
              <button type="button" className="ef-btn ef-btn--danger ef-btn--sm" disabled={busyAction} onClick={() => onRunSimAction("failed_webhook", {})}>
                <FiAlertCircle /> Invalid HMAC Test
              </button>
            </div>
          )}
        </div>

        <div className="ef-filters">
          <input className="ef-input" style={{ flex: 1, minWidth: 220 }} placeholder="Filter by bank UTR, provider Tx ID, intent or note..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="ef-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Reconciliation Outcomes</option>
            <option value="SETTLED">MATCHED_EXACT (SETTLED)</option>
            <option value="MANUAL_REVIEW">MANUAL_REVIEW_REQUIRED</option>
            <option value="PAYMENT_INSTRUCTION_CREATED">AWAITING SETTLEMENT</option>
          </select>
        </div>

        <DataTable
          loading={loading}
          error={error}
          rows={rows}
          onRowClick={(r) => onInspectRow(`Reconciliation Record: ${r.id}`, r)}
          columns={[
            { key: "id", label: "Payment Intent", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.id}</span> },
            { key: "bankSettlementRef", label: "Bank Settlement Ref / UTR", render: (r) => <span className="ef-mono" style={{ fontSize: "0.76rem", color: r.bankSettlementRef ? "#34d399" : "var(--ef-text-subtle)" }}>{r.bankSettlementRef || "PENDING_BANK_FEED"}</span> },
            { key: "amount", label: "Settled Principal", render: (r) => <span className="ef-num">{formatMoney(r.amount, r.currency)}</span> },
            { key: "reconciliationOutcome", label: "Recon Outcome", render: (r) => <StatusBadge value={r.reconciliationOutcome} simulated={r.isSimulated || isSim} /> },
            { key: "notes", label: "Diagnostic Notes", render: (r) => <span style={{ fontSize: "0.76rem", color: "var(--ef-text-muted)" }}>{r.reconciliationNotes || "Clean parity match"}</span> }
          ]}
        />
      </div>
    </div>
  );
}
