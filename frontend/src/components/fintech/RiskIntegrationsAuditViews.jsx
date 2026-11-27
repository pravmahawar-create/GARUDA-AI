import React, { useState } from "react";
import { FiShield, FiLock, FiDownload, FiAlertTriangle, FiCheck, FiSliders } from "react-icons/fi";
import {
  KpiCard,
  StatusBadge,
  DataTable,
  ConfirmModal,
  formatMoney,
  formatDateTime,
  downloadTextFile
} from "./FintechUiPrimitives";

export function RiskComplianceView({
  mode,
  riskData = {},
  disputes = [],
  adjustments = [],
  merchants = [],
  loading,
  error,
  onAckAlert,
  onRecordFreeze,
  onInspectRow,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [confirmFreeze, setConfirmFreeze] = useState(false);
  const alerts = riskData.alerts || [];
  const metrics = riskData.metrics || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ef-grid-3">
        <KpiCard label="Zero-Custody Principal Status" value="₹0.00 Held" subtitle="100% Bank-Direct Principal Routing" badgeText="CONSTITUTIONAL LOCK" badgeTone="success" />
        <KpiCard label="Webhook Tamper / Replay Blocks" value={(metrics.webhookFailures?.total || metrics.invalidHmacRejected || 0) + (metrics.duplicateEvents || metrics.duplicateEventsBlocked || 0)} subtitle="Fail-closed HMAC-SHA256 & nonce defense" badgeText="ARMED" badgeTone="info" />
        <KpiCard label="Active Legal / Freeze Dossiers" value={disputes.length} subtitle={`${adjustments.length} refund/reversal fee adjustments logged`} badgeText={disputes.length > 0 ? "PRESERVED" : "CLEAR"} badgeTone={disputes.length > 0 ? "warning" : "success"} />
      </div>

      <div className="ef-card">
        <div className="ef-card-header">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Risk Alerts, Account Freezes & Compliance Preservation</h2>
            <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
              Lawful freeze orders are never bypassed. Affected & unaffected settlements and GARUDA fee receivables are preserved in immutable dossiers.
            </div>
          </div>
          {isSim && (
            <button type="button" className="ef-btn ef-btn--danger ef-btn--sm" disabled={busyAction} onClick={() => setConfirmFreeze(true)}>
              <FiAlertTriangle /> Simulate Lawful Account Freeze Notice
            </button>
          )}
        </div>

        {alerts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {alerts.map((a) => (
              <div key={a.id} className="ef-alert-box ef-alert-box--warning">
                <div>
                  <strong>[{a.severity}] {a.title}</strong> — <span style={{ color: "var(--ef-text-muted)" }}>{formatDateTime(a.timestamp)}</span>
                </div>
                {!a.acknowledged && onAckAlert && (
                  <button type="button" className="ef-btn ef-btn--sm" onClick={() => onAckAlert(a.id)}>
                    <FiCheck /> Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <DataTable
          loading={loading}
          error={error}
          rows={disputes}
          emptyTitle="No freeze orders or compliance holds active"
          emptyDescription="Any bank lien, cyber freeze notice, or legal review dossier will appear here with affected/unaffected tx segregation."
          onRowClick={(r) => onInspectRow(`Compliance Freeze Dossier: ${r.freezeId}`, r)}
          columns={[
            { key: "freezeId", label: "Dossier ID", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.freezeId}</span> },
            { key: "merchantId", label: "Merchant" },
            { key: "authorityOrBank", label: "Issuing Authority / Bank" },
            { key: "orderReference", label: "Order Reference", render: (r) => <span className="ef-mono" style={{ fontSize: "0.75rem" }}>{r.orderReference}</span> },
            { key: "preservedReceivableAmount", label: "Preserved Fee Receivable", render: (r) => <span className="ef-num" style={{ fontWeight: 700 }}>{formatMoney(r.preservedReceivableAmount, "INR")}</span> },
            { key: "status", label: "Compliance State", render: (r) => <StatusBadge value="LEGAL_REVIEW" simulated={r.isSimulated || isSim} /> }
          ]}
        />
      </div>

      <ConfirmModal
        open={confirmFreeze}
        tone="danger"
        title="Confirm Simulated Account Freeze Notice"
        message={`This simulates receiving an official bank/LEA freeze notice on ${(merchants[1] || merchants[0])?.merchantId || "SIM_M_RAIPUR_02"}. Pending postpaid invoices transition to LEGAL_REVIEW with zero fund diversion.`}
        confirmLabel="Record Freeze Dossier"
        busy={busyAction}
        onCancel={() => setConfirmFreeze(false)}
        onConfirm={async () => {
          setConfirmFreeze(false);
          await onRecordFreeze({ merchantId: "SIM_M_RAIPUR_02" });
        }}
      />
    </div>
  );
}

export function IntegrationsReadinessView({
  mode,
  connectors = [],
  loading,
  error,
  onStageConfig,
  onAttemptActivate,
  busyAction
}) {
  const isSim = mode === "SIMULATED";
  const [stageTarget, setStageTarget] = useState(null);
  const [specTarget, setSpecTarget] = useState(null);
  const [fieldValues, setFieldValues] = useState({});

  const openStageModal = (connector) => {
    const init = {};
    for (const f of connector.requiredFields || []) init[f] = "";
    setFieldValues(init);
    setStageTarget(connector);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ef-alert-box ef-alert-box--warning">
        <div>
          <strong>CUSTOMER CREDENTIALS & DOCUMENTATION NOT YET SUPPLIED:</strong> Live Bank APIs (ICICI CIB, Wio UAE, Modulr UK/EU) and CRM Connectors (Zoho, Salesforce, HubSpot, Custom ERP) are strictly locked to <code>NOT CONNECTED / AWAITING CUSTOMER ACCESS</code>. Live activation remains disabled until authorized customer credentials and integration specs are provided.
        </div>
      </div>

      {loading ? (
        <div className="ef-state-box">Loading provider & CRM adapter readiness...</div>
      ) : error ? (
        <div className="ef-alert-box ef-alert-box--error"><div>{error}</div></div>
      ) : (
        <div className="ef-grid-2">
          {connectors.map((c) => {
            const isMock = c.connectionStatus === "SANDBOX_SIMULATION_ONLY";
            return (
              <div key={c.providerId} className="ef-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <span className="ef-badge ef-badge--neutral" style={{ marginBottom: 6 }}>{c.category} ADAPTER</span>
                      <h3 style={{ margin: 0, fontSize: "0.98rem" }}>{c.name}</h3>
                      <div style={{ fontSize: "0.76rem", color: "var(--ef-text-muted)", marginTop: 2 }}>{c.region}</div>
                    </div>
                    <span className={`ef-badge ${isMock ? "ef-badge--simulated" : "ef-badge--warning"}`}>
                      {isMock ? "SIMULATED SANDBOX" : "NOT CONNECTED"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", margin: "10px 0", lineHeight: 1.5 }}>
                    {c.notes}
                  </p>

                  <div style={{ fontSize: "0.74rem", padding: "8px 10px", borderRadius: 8, background: "var(--ef-bg)", border: "1px solid var(--ef-border)" }}>
                    <div style={{ fontWeight: 700, color: isMock ? "#ddd6fe" : "#fcd34d" }}>
                      {c.readinessLabel}
                    </div>
                    {c.stagedConfigSummary ? (
                      <div style={{ marginTop: 5, color: "#34d399" }}>
                        Staged non-live fields (masked): {c.stagedConfigSummary.fieldsConfigured.join(", ")}
                      </div>
                    ) : (
                      <div style={{ marginTop: 5, color: "var(--ef-text-subtle)" }}>
                        Required customer inputs: {(c.requiredFields || []).join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--ef-border)", paddingTop: 12 }}>
                  <button
                    type="button"
                    className="ef-btn ef-btn--sm"
                    onClick={() => setSpecTarget(c)}
                  >
                    Connection Requirements
                  </button>
                  <button
                    type="button"
                    className="ef-btn ef-btn--sm"
                    disabled={isSim || busyAction}
                    title={isSim ? "Switch to LIVE mode to stage server-side masked configuration" : "Stage masked setup metadata server-side"}
                    onClick={() => openStageModal(c)}
                  >
                    <FiSliders /> {isSim ? "Staging Disabled in SIM Mode" : "Stage Config Metadata"}
                  </button>
                  <button
                    type="button"
                    className="ef-btn ef-btn--sm"
                    disabled={true}
                    title="Activation blocked: NOT CONNECTED / AWAITING CUSTOMER ACCESS"
                    onClick={() => onAttemptActivate(c.providerId)}
                  >
                    <FiLock /> Activate Live (Awaiting Customer Access)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {specTarget && (
        <div className="ef-modal-backdrop" onClick={() => setSpecTarget(null)}>
          <div className="ef-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>{specTarget.name} — Integration Readiness</h3>
            <span className="ef-badge ef-badge--warning">{specTarget.readinessLabel}</span>
            <p style={{ margin: 0, fontSize: "0.81rem", color: "var(--ef-text-muted)", lineHeight: 1.5 }}>{specTarget.notes}</p>
            <div className="ef-kv-item">
              <div className="ef-kv-label">Required Customer Inputs</div>
              <div className="ef-kv-val ef-mono" style={{ fontSize: "0.76rem" }}>{(specTarget.requiredFields || []).join(", ")}</div>
            </div>
            <div className="ef-alert-box ef-alert-box--info" style={{ fontSize: "0.76rem" }}>
              Activation remains locked (`403 CUSTOMER_ACCESS_REQUIRED`) until customer supplies verified credentials, static IP allowlist, and formal onboarding sign-off.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="ef-btn ef-btn--primary" onClick={() => setSpecTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {stageTarget && (
        <div className="ef-modal-backdrop" onClick={() => setStageTarget(null)}>
          <form
            className="ef-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              await onStageConfig(stageTarget.providerId, fieldValues);
              setStageTarget(null);
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Stage Connector Metadata — {stageTarget.name}</h3>
            <div className="ef-alert-box ef-alert-box--info" style={{ fontSize: "0.75rem" }}>
              <span><FiShield /> Sensitive secrets are masked/hashed (SHA-256 + last4) server-side and are NEVER echoed in plaintext. Activation remains disabled until live customer documentation arrives.</span>
            </div>
            {(stageTarget.requiredFields || []).map((field) => {
              const isSecret = /(secret|token|key|password|cert)/i.test(field);
              return (
                <label key={field} style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
                  {field}
                  <input
                    type={isSecret ? "password" : "text"}
                    autoComplete="off"
                    className="ef-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={fieldValues[field] || ""}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field]: e.target.value })}
                    placeholder={field.toLowerCase().includes("url") ? "https://merchant.example.com/webhook" : `Enter ${field}`}
                  />
                </label>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ef-btn" onClick={() => setStageTarget(null)}>Cancel</button>
              <button type="submit" className="ef-btn ef-btn--primary" disabled={busyAction}>Stage Masked Metadata</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ReportsAndAuditView({
  mode,
  auditEntries = [],
  chainIntegrityValid = true,
  snapshot,
  loading,
  error,
  onInspectRow
}) {
  const isSim = mode === "SIMULATED";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = auditEntries.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${e.eventId} ${e.transactionId} ${e.action} ${e.actor} ${e.newState}`.toLowerCase().includes(q);
  });

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportAuditCsv = () => {
    const header = "environmentMode,isSimulated,eventId,timestamp,transactionId,actor,action,oldState,newState,chainHash\n";
    const rows = filtered.map((e) => `${mode},${isSim},${e.eventId},${e.timestamp},${e.transactionId},${e.actor},${e.action},${e.oldState},${e.newState},${e.chainHash}`).join("\n");
    downloadTextFile(`treasury_audit_chain_${mode.toLowerCase()}.csv`, header + rows, "text/csv");
  };

  const exportFullPack = () => {
    downloadTextFile(
      `treasury_accounting_evidence_${mode.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({
        exportedAt: new Date().toISOString(),
        environmentMode: mode,
        isSimulated: isSim,
        chainIntegrityValid,
        overview: snapshot?.overview || {},
        merchants: snapshot?.merchants || [],
        agreements: snapshot?.agreements || [],
        paymentIntents: snapshot?.intents || [],
        receivables: snapshot?.receivables || [],
        invoices: snapshot?.invoices || [],
        auditEntries: filtered
      }, null, 2),
      "application/json"
    );
  };

  return (
    <div className="ef-card">
      <div className="ef-card-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Reports & Cryptographic Audit History</h2>
          <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 3 }}>
            Immutable SHA-256 hash-chained log (`previousHash -&gt; chainHash`). Tampering alters the verification checksum cleanly.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatusBadge value={chainIntegrityValid ? "VALID" : "FAILED"} simulated={isSim} />
          <button type="button" className="ef-btn ef-btn--sm" onClick={exportAuditCsv} disabled={filtered.length === 0}>
            <FiDownload /> Export CSV
          </button>
          <button type="button" className="ef-btn ef-btn--primary ef-btn--sm" onClick={exportFullPack}>
            <FiDownload /> Evidence JSON Pack
          </button>
        </div>
      </div>

      <div className="ef-filters">
        <input className="ef-input" style={{ flex: 1, minWidth: 240 }} placeholder="Search event ID, transaction, action, actor..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <DataTable
        loading={loading}
        error={error}
        rows={paged}
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setPage}
        onRowClick={(r) => onInspectRow(`Audit Event: ${r.eventId}`, r)}
        columns={[
          { key: "eventId", label: "Event ID", render: (r) => <span className="ef-mono" style={{ fontSize: "0.74rem" }}>{r.eventId}</span> },
          { key: "action", label: "Action", render: (r) => <strong style={{ fontSize: "0.78rem" }}>{r.action}</strong> },
          { key: "transactionId", label: "Entity / Tx", render: (r) => <span className="ef-mono" style={{ fontSize: "0.74rem", color: "#7dd3fc" }}>{r.transactionId}</span> },
          { key: "newState", label: "Transition", render: (r) => <StatusBadge value={r.newState} simulated={r.isSimulated || isSim} /> },
          { key: "chainHash", label: "SHA-256 Chain", render: (r) => <span className="ef-mono" style={{ fontSize: "0.72rem", color: "#34d399" }}>{String(r.chainHash || "").slice(0, 16)}…</span> },
          { key: "timestamp", label: "Timestamp", render: (r) => <span style={{ fontSize: "0.74rem", color: "var(--ef-text-muted)" }}>{formatDateTime(r.timestamp)}</span> }
        ]}
      />
    </div>
  );
}
