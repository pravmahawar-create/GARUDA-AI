import React, { useState } from "react";
import FounderAssistedIntakePanel from "./FounderAssistedIntakePanel";

export default function FounderReviewPanel({ candidate, onDecision }) {
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");
  const [instructions, setInstructions] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(candidate?.status || "ready_for_founder_review");

  if (!candidate) {
    return (
      <div className="founder-review-panel empty">
        <p style={{ margin: "0 0 1rem 0", color: "#94a3b8" }}>No candidate selected for review. Import a genuine marketplace or client work order below:</p>
        <FounderAssistedIntakePanel />
      </div>
    );
  }

  const handleActionClick = (actionType) => {
    setDecision(actionType);
    if (actionType === "approved") {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
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
      </div>

      <div className="review-section intelligence">
        <h3>Revenue Brain Assessment</h3>
        <p><strong>Qualification:</strong> <span className={`badge ${candidate.qualification}`}>{candidate.qualification}</span></p>
        <p><strong>Classification:</strong> {candidate.classification}</p>
        <p><strong>Primary Capability:</strong> <code>{candidate.primaryCapability || "None"}</code></p>
        <p><strong>Secondary Capabilities:</strong> {candidate.secondaryCapabilities?.join(", ") || "None"}</p>
        <p><strong>Feasibility:</strong> <span className={`badge ${candidate.feasibility}`}>{candidate.feasibility}</span></p>
        <p><strong>Risk Level:</strong> <span className={`badge risk-${candidate.riskLevel || candidate.risk}`}>{candidate.riskLevel || candidate.risk}</span></p>
        <p><strong>Recommended Action:</strong> <code>{candidate.recommendedAction}</code></p>
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
