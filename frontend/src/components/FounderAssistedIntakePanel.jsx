import React, { useState } from "react";

export default function FounderAssistedIntakePanel({ onImportSuccess }) {
  const [formData, setFormData] = useState({
    url: "",
    source: "Upwork",
    title: "",
    description: "",
    company: "not disclosed",
    salaryText: "not stated",
    deadlineText: "not stated",
    tags: "",
    attachmentsText: ""
  });

  const [attestation, setAttestation] = useState({
    founderAccessedAuthorizedAccount: false,
    noPlaceholderData: false,
    rawTextUnmodified: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttestationChange = (e) => {
    const { name, checked } = e.target;
    setAttestation((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!attestation.founderAccessedAuthorizedAccount || !attestation.noPlaceholderData || !attestation.rawTextUnmodified) {
      setError("All three Founder Attestation confirmations are required to import an opportunity.");
      return;
    }

    setLoading(true);

    try {
      const attachments = formData.attachmentsText
        ? formData.attachmentsText.split(",").map((item) => ({ fileName: item.trim(), fileType: "document" }))
        : [];
      const tags = formData.tags ? formData.tags.split(",").map((item) => item.trim()) : [];

      const payload = {
        ...formData,
        tags,
        attachments,
        attestation
      };

      const response = await fetch("/api/discovery/founder-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-garuda-founder-approved": "true"
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to import founder-assisted opportunity");
      }

      setResult(json.data);
      if (onImportSuccess) {
        onImportSuccess(json.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="founder-assisted-intake-panel" style={{ padding: "1.5rem", border: "1px solid #3b82f6", borderRadius: "8px", background: "#0f172a", color: "#f8fafc", marginTop: "1rem" }}>
      <div style={{ padding: "0.75rem", borderRadius: "6px", background: "rgba(59, 130, 246, 0.15)", borderLeft: "4px solid #3b82f6", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#60a5fa", fontSize: "1.1rem" }}>🦅 GARUDA Founder-Assisted Opportunity Intake</h3>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 600 }}>
          “Founder-assisted intake — GARUDA has not independently verified inaccessible platform content.”
        </p>
      </div>

      {error && (
        <div style={{ background: "#7f1d1d", color: "#fca5a5", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
          ❌ <strong>Intake Rejection:</strong> {error}
        </div>
      )}

      {result ? (
        <div style={{ background: "#064e3b", color: "#a7f3d0", padding: "1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>✅ Opportunity Imported into Founder Review Pipeline</h4>
          <p style={{ margin: "0.25rem 0" }}><strong>Candidate ID:</strong> {result.candidate?.externalId}</p>
          <p style={{ margin: "0.25rem 0" }}><strong>Title:</strong> {result.candidate?.title}</p>
          <p style={{ margin: "0.25rem 0" }}><strong>Channel:</strong> <code>{result.candidate?.opportunityChannel}</code></p>
          <p style={{ margin: "0.25rem 0" }}><strong>Listing Kind:</strong> <code>{result.candidate?.verification?.listingKind}</code></p>
          <p style={{ margin: "0.25rem 0" }}><strong>Primary Capability Match:</strong> {result.reviewPackage?.capabilityMatch?.name}</p>

          {result.reviewPackage?.risks?.length > 0 && (
            <div style={{ marginTop: "0.5rem", background: "rgba(245, 158, 11, 0.2)", padding: "0.5rem", borderRadius: "4px" }}>
              <strong>⚠️ Extracted Risks / Warnings:</strong>
              <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0 }}>
                {result.reviewPackage.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setResult(null)}
            style={{ marginTop: "0.75rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Import Another Opportunity
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Original Source URL *</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://upwork.com/jobs/~0123456789"
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Platform / Source Name *</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g. Upwork, Freelancer, Direct Client"
                required
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Client Identity (or "not disclosed")</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="not disclosed"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Original Opportunity Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Build Custom Node.js REST API & Microservice Test Suite"
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Exact Description (Copied Unmodified) *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Paste exact opportunity description and requirements..."
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Budget / Price (or "not stated")</label>
              <input
                type="text"
                name="salaryText"
                value={formData.salaryText}
                onChange={handleChange}
                placeholder="not stated"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Deadline (or "not stated")</label>
              <input
                type="text"
                name="deadlineText"
                value={formData.deadlineText}
                onChange={handleChange}
                placeholder="not stated"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
              />
            </div>
          </div>

          <div style={{ padding: "0.75rem", borderRadius: "6px", background: "#1e293b", border: "1px solid #334155" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#f1f5f9" }}>📜 Mandatory Founder Attestation</h4>
            <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.85rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  name="founderAccessedAuthorizedAccount"
                  checked={attestation.founderAccessedAuthorizedAccount}
                  onChange={handleAttestationChange}
                  required
                />
                I personally accessed and viewed this listing through an authorized account.
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  name="noPlaceholderData"
                  checked={attestation.noPlaceholderData}
                  onChange={handleAttestationChange}
                  required
                />
                This listing represents genuine client work and contains no demo, fake, or placeholder data.
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  name="rawTextUnmodified"
                  checked={attestation.rawTextUnmodified}
                  onChange={handleAttestationChange}
                  required
                />
                The title, description, and terms are exact and unmodified from the original source.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: "0.75rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Processing Governance Checks..." : "Import Opportunity for Founder Review"}
          </button>
        </form>
      )}
    </div>
  );
}
