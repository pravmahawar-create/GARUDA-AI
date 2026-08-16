import React, { useState } from "react";
import { MUTED, GREEN, RED } from "./format";

export default function SettingsView() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      setResult({ ok: false, message: "Current and new password are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResult({ ok: false, message: "New passwords do not match." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth/manage-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && (data.success || data.authenticated)) {
        setResult({ ok: true, message: "Founder password updated." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setResult({ ok: false, message: data.message || "Password change failed." });
      }
    } catch (error) {
      setResult({ ok: false, message: error.message || "Password change failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>FOUNDER CONTROLS</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Settings</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Only currently supported Founder security functionality is exposed. No fake settings.
        </p>
      </div>

      <div className="fd-card">
        <p className="fd-eyebrow" style={{ margin: 0 }}>SECURITY</p>
        <h3 className="fd-heading" style={{ margin: "0.1rem 0 0.9rem", fontSize: "1rem" }}>Change Founder password</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            style={{ width: "100%", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.85rem" }}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            style={{ width: "100%", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.85rem" }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            style={{ width: "100%", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "#0f1622", color: "#eef1f6", fontSize: "0.85rem" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={changePassword}
            style={{ padding: "0.6rem", borderRadius: 10, fontWeight: 800, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #d4af37, #f5d76e)", color: "#0a0d13" }}
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: "0.9rem", border: `1px solid ${result.ok ? "rgba(117,244,171,0.4)" : "rgba(248,113,113,0.4)"}`, background: result.ok ? "rgba(117,244,171,0.06)" : "rgba(248,113,113,0.08)", borderRadius: 10, padding: "0.75rem 0.9rem", fontSize: "0.83rem", color: result.ok ? GREEN : RED }}>
            {result.message}
          </div>
        )}

        <p style={{ margin: "1rem 0 0", fontSize: "0.74rem", color: MUTED, lineHeight: 1.5 }}>
          Governance and connector credentials are managed through the governed revenue connectors, not exposed here.
        </p>
      </div>
    </div>
  );
}