import React from "react";
import { FiX, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiShield } from "react-icons/fi";

export function formatMoney(amount, currency = "INR") {
  const num = Number(amount || 0);
  const symbol = currency === "USD" ? "$" : currency === "AED" ? "AED " : currency === "GBP" ? "£" : "₹";
  return `${symbol}${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(iso);
  }
}

export function downloadTextFile(filename, content, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function StatusBadge({ value, simulated = false }) {
  const raw = String(value || "UNKNOWN").toUpperCase();
  let tone = "neutral";
  if (["SETTLED", "APPROVED_ACTIVE", "PAID", "MATCHED_EXACT", "SIMULATED_VERIFIED", "REGISTERED_VERIFIED", "ACTIVE", "VALID"].includes(raw)) {
    tone = "success";
  } else if (["PAYMENT_INSTRUCTION_CREATED", "INVOICED", "RECONCILED", "CREDITED", "PREPAID", "POSTPAID"].includes(raw)) {
    tone = "info";
  } else if (["PENDING_APPROVAL", "PAYMENT_PENDING", "MANUAL_REVIEW", "MANUAL_REVIEW_REQUIRED", "ACCRUED", "SANDBOX_SIMULATION_ONLY", "SIMULATED_PENDING_AGREEMENT", "REGISTERED_PENDING_AGREEMENT"].includes(raw)) {
    tone = "warning";
  } else if (["REVERSED", "RETURNED", "OVERDUE", "LEGAL_REVIEW", "DISPUTED", "FAILED", "PAUSED"].includes(raw)) {
    tone = "danger";
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
      <span className={`ef-badge ef-badge--${tone}`}>{raw.replace(/_/g, " ")}</span>
      {simulated && <span className="ef-badge ef-badge--simulated">SIMULATED</span>}
    </span>
  );
}

export function KpiCard({ label, value, subtitle, badgeText, badgeTone = "neutral" }) {
  return (
    <div className="ef-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="ef-kpi-label">{label}</span>
        {badgeText && <span className={`ef-badge ef-badge--${badgeTone}`}>{badgeText}</span>}
      </div>
      <div className="ef-kpi-value ef-num">{value}</div>
      {subtitle && <div className="ef-kpi-sub">{subtitle}</div>}
    </div>
  );
}

export function DataTable({
  columns = [],
  rows = [],
  emptyTitle = "No records match your filters",
  emptyDescription = "Adjust your search or date filters, or create a new record.",
  loading = false,
  error = null,
  onRowClick = null,
  page = 1,
  totalPages = 1,
  totalItems = null,
  onPageChange = null
}) {
  if (loading) {
    return <div className="ef-state-box">Loading workspace data from backend...</div>;
  }
  if (error) {
    return (
      <div className="ef-alert-box ef-alert-box--error">
        <div>
          <strong>Unable to load records:</strong> {error}
        </div>
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="ef-state-box">
        <div style={{ fontWeight: 600, color: "var(--ef-text)", marginBottom: 4 }}>{emptyTitle}</div>
        <div style={{ fontSize: "0.8rem" }}>{emptyDescription}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="ef-table-wrap">
        <table className="ef-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || row.merchantId || row.contractId || row.invoiceId || row.commissionId || row.eventId || idx}
                className={onRowClick ? "ef-table-row--clickable" : ""}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : (row[c.key] ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: "0.78rem", color: "var(--ef-text-muted)" }}>
          <span>
            Page <strong style={{ color: "var(--ef-text)" }}>{page}</strong> of {totalPages}
            {totalItems !== null ? ` (${totalItems} total)` : ""}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="ef-btn ef-btn--sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <FiChevronLeft /> Prev
            </button>
            <button type="button" className="ef-btn ef-btn--sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DetailDrawer({ open, title, subtitle, simulated = false, onClose, data }) {
  if (!open || !data) return null;

  const summaryPairs = [
    { label: "Record Identifier", value: data.id || data.invoiceNumber || data.contractId || data.commissionId || data.merchantId || data.freezeId || data.eventId || data.statementId },
    { label: "Environment Scope", value: (data.isSimulated || simulated) ? "SIMULATED (Isolated Sandbox)" : "LIVE_TENANT_WORKSPACE" },
    { label: "Status", value: data.status || data.kybStatus || data.paymentStatus || data.reconciliationOutcome },
    { label: "Merchant", value: data.merchantLegalName || data.legalName || data.merchantId },
    { label: "Amount / Principal", value: data.amount !== undefined ? formatMoney(data.amount, data.currency) : data.totalAmount !== undefined ? formatMoney(data.totalAmount, data.currency) : data.eligiblePrincipalAmount !== undefined ? formatMoney(data.eligiblePrincipalAmount, data.currency) : null },
    { label: "Bank / UTR Reference", value: data.bankSettlementRef || data.orderReference || data.paymentReference || data.signedRef || data.maskedIban },
    { label: "Timestamp", value: formatDateTime(data.settledAt || data.updatedAt || data.createdAt || data.timestamp) }
  ].filter((p) => p.value !== undefined && p.value !== null && p.value !== "");

  return (
    <div className="ef-overlay" onClick={onClose}>
      <div className="ef-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--ef-border)", paddingBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h3>
              {simulated && <span className="ef-badge ef-badge--simulated">SIMULATED RECORD</span>}
            </div>
            {subtitle && <div style={{ fontSize: "0.78rem", color: "var(--ef-text-muted)", marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button type="button" className="ef-btn ef-btn--sm" onClick={onClose} aria-label="Close detail drawer">
            <FiX /> Close
          </button>
        </div>

        <div className="ef-alert-box ef-alert-box--info" style={{ fontSize: "0.75rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FiShield /> Zero-Custody Ledger Separation Active — Platform holds ₹0.00 customer/merchant principal.
          </span>
        </div>

        {summaryPairs.length > 0 && (
          <div className="ef-kv-grid">
            {summaryPairs.map((pair) => (
              <div key={pair.label} className="ef-kv-item">
                <div className="ef-kv-label">{pair.label}</div>
                <div className="ef-kv-val">{String(pair.value)}</div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="ef-kv-label" style={{ marginBottom: 6 }}>Structured Record Payload</div>
          <pre
            className="ef-mono"
            style={{
              margin: 0,
              background: "var(--ef-bg)",
              border: "1px solid var(--ef-border)",
              borderRadius: 10,
              padding: 14,
              fontSize: "0.74rem",
              color: "#cbd5e1",
              overflowX: "auto",
              lineHeight: 1.55
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = "Confirm Action", tone = "primary", onConfirm, onCancel, busy = false }) {
  if (!open) return null;
  return (
    <div className="ef-modal-backdrop" onClick={onCancel}>
      <div className="ef-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiAlertTriangle size={20} color={tone === "danger" ? "#f43f5e" : "#f59e0b"} />
          <h3 style={{ margin: 0, fontSize: "1rem" }}>{title}</h3>
        </div>
        <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--ef-text-muted)", lineHeight: 1.55 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button type="button" className="ef-btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`ef-btn ${tone === "danger" ? "ef-btn--danger" : tone === "amber" ? "ef-btn--amber" : "ef-btn--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
