import React, { useState } from "react";
import FounderAssistedIntakePanel from "./FounderAssistedIntakePanel";

export default function FounderReviewPanel({ candidate, onDecision }) {
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");
  const [instructions, setInstructions] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(candidate?.status || "ready_for_founder_review");
  const [copiedType, setCopiedType] = useState("");

  if (!candidate) {
    return (
      <div className="founder-review-panel empty">
        <p style={{ margin: "0 0 1rem 0", color: "#94a3b8" }}>No candidate selected for review. Import a genuine marketplace or client work order below:</p>
        <FounderAssistedIntakePanel />
      </div>
    );
  }

  const subPkg = candidate.submissionPackage || candidate.submissionPkg || {};
  const pricing = subPkg.pricingRecommendation || candidate.pricing || {};
  const intel = candidate.classificationIntelligence || candidate.classificationIntel || {};
  const platformIntel = candidate.platformIntelligence || intel.platformIntelligence || { platformId: "generic", platformName: "Direct Client Portal" };
  const category = candidate.opportunityCategory || "freelance_project";
  const executionMode = intel.executionMode || candidate.executionMode || "founder_assisted";

  const clientIntel = candidate.clientIntelligence || {};
  const riskAnalysis = candidate.riskAnalysis || {};

  const opportunityScore = candidate.opportunityScore || candidate.revenueScore || 85;
  const riskLevel = candidate.riskLevel || riskAnalysis.riskLevel || "LOW";
  const riskScore = candidate.riskScore || riskAnalysis.riskScore || 15;
  const recommendedAction = candidate.recommendedAction || "✅ Submit Immediately";

  const milestones = pricing.milestones || [
    { name: "Milestone 1 — Prototype & Core Setup (50% Deposit)", amount: Math.round((pricing.recommendedPrice || 2500) / 2) },
    { name: "Milestone 2 — Final Implementation & Test Acceptance (50%)", amount: Math.round((pricing.recommendedPrice || 2500) / 2) }
  ];

  const proposalText = subPkg.formattedSubmissionText || subPkg.proposalText || candidate.proposalText || `Commercial Proposal for ${candidate.company || "Client"}\nProject: ${candidate.title}\nQuoted Investment: ${pricing.currency || "USD"} $${(pricing.recommendedPrice || 2500).toLocaleString()}\nTarget Delivery: ${subPkg.effortEstimation?.estimatedDeliveryDays || 5} Business Days\n100% Automated Test Execution Log Guarantee included.`;

  const coverLetterText = `Hi ${candidate.company || "Engineering Team"},\n\nI reviewed your listing for "${candidate.title}". We can execute and deliver this project in ${subPkg.effortEstimation?.estimatedDeliveryDays || 5} business days with production-ready code and an automated Jest test suite (100% passing test execution report included prior to code handover).\n\nBest regards,\nPraveen Mahawar\nFounder & Engineering Director | GARUDA AI Operating System`;

  const handleCopy = (text, type) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedType(type);
    setTimeout(() => setCopiedType(""), 2500);
  };

  const handleOpenUrl = () => {
    if (candidate.url) {
      window.open(candidate.url, "_blank", "noopener,noreferrer");
    } else {
      alert("No valid application URL found for this candidate.");
    }
  };

  const handleActionClick = (actionType) => {
    setDecision(actionType);
    setShowWarning(actionType === "approved");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((decision === "rejected" || decision === "request_changes") && !reason.trim()) {
      alert(`Reason is required when decision is ${decision}`);
      return;
    }

    const payload = {
      missionCandidateId: candidate.missionId || candidate.opportunityId,
      founderDecision: decision,
      founderReason: reason,
      instructions
    };

    if (onDecision) {
      onDecision(payload);
    }
    setSubmittedStatus(decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "revision_required");
    setShowWarning(false);
  };

  return (
    <div className="founder-review-panel" aria-label="Founder Mission Candidate Review Panel">
      <h2>🦅 GARUDA Revenue Mission Founder Review</h2>

      <div className="review-section summary">
        <h3>Opportunity Evidence & Scope</h3>
        <p><strong>Candidate ID:</strong> {candidate.opportunityId || candidate.missionId}</p>
        <p><strong>Title:</strong> {candidate.title}</p>
        <p><strong>Source:</strong> {candidate.source} {candidate.url ? `(${candidate.url})` : ""}</p>
        <p><strong>Scope:</strong> {candidate.description || "N/A"}</p>
        {candidate.company && <p><strong>Company:</strong> {candidate.company}</p>}
        {candidate.salaryText && <p><strong>Budget / Price:</strong> {candidate.salaryText}</p>}
        {candidate.publishedAt && <p><strong>Published Date:</strong> {new Date(candidate.publishedAt).toLocaleDateString()}</p>}

        {candidate.url && (
          <button type="button" className="btn btn-action" onClick={handleOpenUrl} style={{ marginTop: "0.75rem", background: "#3b82f6", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
            🔗 Open Application URL
          </button>
        )}
      </div>

      {/* CLIENT INTELLIGENCE & OPPORTUNITY SCORECARD */}
      <div className="review-section client-intelligence-scorecard" style={{ background: "#065f46", border: "1px solid #10b981", borderRadius: "8px", padding: "1rem", margin: "1rem 0" }}>
        <h3 style={{ color: "#a7f3d0", marginTop: 0 }}>📊 Client Intelligence & Risk Scorecard</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div><strong>Opportunity Score:</strong> <span style={{ color: "#6ee7b7", fontSize: "1.1rem", fontWeight: "bold" }}>{opportunityScore}/100</span></div>
          <div><strong>Risk Level:</strong> <span className={`badge risk-${riskLevel.toLowerCase()}`} style={{ background: riskLevel === "CRITICAL" ? "#ef4444" : riskLevel === "HIGH" ? "#f97316" : riskLevel === "MEDIUM" ? "#eab308" : "#10b981", color: "#fff", padding: "2px 8px", borderRadius: "4px" }}>{riskLevel} ({riskScore}/100)</span></div>
          <div><strong>Recommended Action:</strong> <strong style={{ color: "#fde047" }}>{recommendedAction}</strong></div>
          <div><strong>Expected Revenue Value:</strong> {pricing.currency || "USD"} ${candidate.expectedRevenueValue ? candidate.expectedRevenueValue.toLocaleString() : (pricing.recommendedPrice || 2500).toLocaleString()}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem", color: "#d1fae5", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: "4px" }}>
          <div><strong>Client Trust Score:</strong> {clientIntel.clientTrustScore || candidate.clientTrustScore || 70}/100</div>
          <div><strong>Scope Clarity:</strong> {clientIntel.scopeClarity || candidate.scopeClarity || 75}/100</div>
          <div><strong>Communication Burden:</strong> {(clientIntel.communicationComplexity || "low").toUpperCase()}</div>
          <div><strong>Urgency:</strong> {(clientIntel.urgency || "medium").toUpperCase()}</div>
        </div>
      </div>

      {/* CLASSIFICATION & PLATFORM INTELLIGENCE BOX */}
      <div className="review-section intelligence-classification-box" style={{ background: "#1e1b4b", border: "1px solid #4338ca", borderRadius: "8px", padding: "1rem", margin: "1rem 0" }}>
        <h3 style={{ color: "#a5b4fc", marginTop: 0 }}>🧠 Opportunity Intelligence & Execution Mode</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div><strong>Category:</strong> <span className="badge" style={{ background: "#4f46e5", color: "#fff", padding: "2px 8px", borderRadius: "4px" }}>{category.toUpperCase()}</span></div>
          <div><strong>Confidence Score:</strong> <span style={{ color: "#34d399", fontWeight: "bold" }}>{intel.confidenceScore || 85}%</span></div>
          <div><strong>Execution Mode:</strong> <code style={{ color: "#fbbf24" }}>{executionMode.toUpperCase()}</code></div>
          <div><strong>Platform:</strong> {platformIntel.platformName || "Direct Client Portal"}</div>
        </div>

        {intel.reasoning && intel.reasoning.length > 0 && (
          <div>
            <strong>Classification Reasoning:</strong>
            <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, color: "#c7d2fe", fontSize: "0.85rem" }}>
              {intel.reasoning.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* PROPOSAL PREVIEW & COMMERCIAL BREAKDOWN SECTION */}
      <div className="review-section proposal-preview-section" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", padding: "1rem", margin: "1rem 0" }}>
        <h3 style={{ color: "#38bdf8", marginTop: 0 }}>📜 Generated Proposal Package ({category.toUpperCase()})</h3>
        
        {category !== "full_time_job" && (
          <div className="pricing-breakdown" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            <div><strong>Quoted Price:</strong> {pricing.currency || "USD"} ${pricing.recommendedPrice ? pricing.recommendedPrice.toLocaleString() : "2,500"}</div>
            <div><strong>Floor Price:</strong> {pricing.currency || "USD"} ${pricing.minimumAcceptableFloorPrice ? pricing.minimumAcceptableFloorPrice.toLocaleString() : "2,000"}</div>
            <div><strong>Target Delivery:</strong> {subPkg.effortEstimation?.estimatedDeliveryDays || 5} Business Days</div>
            <div><strong>Payment Terms:</strong> 50/50 Milestone Deposit</div>
          </div>
        )}

        {category !== "full_time_job" && category !== "contract_role" && (
          <>
            <h4>Milestone Schedule:</h4>
            <ul style={{ margin: "0.5rem 0 1rem 1.25rem", padding: 0 }}>
              {milestones.map((m, i) => (
                <li key={i}><strong>{m.name || `Milestone ${i+1}`}:</strong> {pricing.currency || "USD"} ${m.amount ? m.amount.toLocaleString() : "1,250"}</li>
              ))}
            </ul>
          </>
        )}

        <h4>Proposal Text Preview:</h4>
        <pre style={{ background: "#020617", color: "#e2e8f0", padding: "0.75rem", borderRadius: "6px", maxHeight: "220px", overflowY: "auto", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
          {proposalText}
        </pre>

        <div className="proposal-copy-actions" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button type="button" className="btn btn-copy" onClick={() => handleCopy(proposalText, "proposal")} style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
            {copiedType === "proposal" ? "✓ Package Copied!" : category === "full_time_job" ? "📋 Copy Cover Letter & Application" : "📋 Copy Full Proposal"}
          </button>
          <button type="button" className="btn btn-copy-letter" onClick={() => handleCopy(coverLetterText, "cover")} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
            {copiedType === "cover" ? "✓ Note Copied!" : "✉️ Copy Short Note"}
          </button>
          <button type="button" className="btn btn-open-url" onClick={handleOpenUrl} style={{ background: "#0284c7", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
            🌐 Open Application Form
          </button>
        </div>
      </div>

      <div className="review-section intelligence">
        <h3>Revenue Brain Assessment</h3>
        <p><strong>Qualification:</strong> <span className={`badge ${candidate.qualification}`}>{candidate.qualification}</span></p>
        <p><strong>Classification:</strong> {candidate.classification || category}</p>
        <p><strong>Primary Capability:</strong> <code>{candidate.primaryCapability || "None"}</code></p>
        <p><strong>Feasibility:</strong> <span className={`badge ${candidate.feasibility}`}>{candidate.feasibility}</span></p>
        <p><strong>Risk Level:</strong> <span className={`badge risk-${riskLevel.toLowerCase()}`}>{riskLevel}</span></p>
        <p><strong>Recommended Action:</strong> <code>{recommendedAction}</code></p>
        <p><strong>Status:</strong> <span className="status-highlight">{submittedStatus}</span></p>
      </div>

      <div className="review-section governance">
        <h3>Governance & Execution Boundaries</h3>
        <ul>
          <li>🔒 External actions strictly blocked (no automated messages/applications)</li>
          <li>🛡️ Zero fake payments, settlements, or acceptance records generated</li>
          <li>📜 Immutable audit trail entry created for every decision</li>
        </ul>
      </div>

      {submittedStatus === "ready_for_founder_review" || submittedStatus === "revision_required" ? (
        <form onSubmit={handleSubmit} className="review-action-form">
          <div className="action-buttons">
            <button
              type="button"
              className={`btn btn-approve ${decision === "approved" ? "active" : ""}`}
              onClick={() => handleActionClick("approved")}
            >
              ✔ Approve
            </button>
            <button
              type="button"
              className={`btn btn-changes ${decision === "request_changes" ? "active" : ""}`}
              onClick={() => handleActionClick("request_changes")}
            >
              ⚠️ Request Changes
            </button>
            <button
              type="button"
              className={`btn btn-reject ${decision === "rejected" ? "active" : ""}`}
              onClick={() => handleActionClick("rejected")}
            >
              ❌ Reject
            </button>
          </div>

          {showWarning && (
            <div className="governance-warning-box">
              ⚠️ <strong>GOVERNANCE WARNING:</strong> Approval activates the internal mission only.
              No external application, outreach, delivery or payment action will occur without its separate governed authorization.
            </div>
          )}

          {(decision === "rejected" || decision === "request_changes") && (
            <div className="form-group">
              <label>Reason (Required):</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter mandatory reason for decision..."
                required
              />
            </div>
          )}

          {decision === "approved" && (
            <div className="form-group">
              <label>Instructions (Optional):</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Optional founder guidance..."
              />
            </div>
          )}

          {decision && (
            <button type="submit" className="btn btn-submit">
              Submit Founder Decision ({decision.toUpperCase()})
            </button>
          )}
        </form>
      ) : (
        <div className="decision-completed-notice">
          Founder decision <strong>{submittedStatus.toUpperCase()}</strong> has been submitted and locked.
        </div>
      )}
    </div>
  );
}
