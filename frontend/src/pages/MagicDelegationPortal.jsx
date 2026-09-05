import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function MagicDelegationPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [delegation, setDelegation] = useState(null);
  const [error, setError] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing magic delegation token. Please check your invitation link.");
      setLoading(false);
      return;
    }

    const fetchDelegation = async () => {
      try {
        const res = await fetch(`/api/bot-verse/magic-delegation/${token}`);
        if (!res.ok) {
          throw new Error("Invitation link is invalid or has expired.");
        }
        const data = await res.json();
        if (data.delegation) {
          setDelegation(data.delegation);
          if (data.delegation.status === "APPROVED") {
            setApproved(true);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDelegation();
  }, [token]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("garudaos.ai@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleApprove = async () => {
    if (!token) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/bot-verse/magic-delegation/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setApproved(true);
        if (delegation) {
          setDelegation({ ...delegation, status: "APPROVED", authorizedAt: new Date().toISOString() });
        }
      }
    } catch (err) {
      alert("Error authorizing: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#d4af37", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🦅</div>
          <div style={{ fontSize: "1rem", letterSpacing: "0.1em" }}>LOADING GARUDA DELEGATION PORTAL...</div>
        </div>
      </div>
    );
  }

  if (error || !delegation) {
    return (
      <div style={{ minHeight: "100vh", background: "#030712", display: "grid", placeItems: "center", color: "#f87171", fontFamily: "sans-serif", padding: "2rem" }}>
        <div style={{ maxWidth: "500px", background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ color: "#ffffff", marginBottom: "0.5rem" }}>Invalid Delegation Link</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: "1.6" }}>{error || "Could not retrieve delegation details."}</p>
          <a href="https://www.garudaos.in" style={{ display: "inline-block", marginTop: "1.5rem", padding: "0.6rem 1.2rem", background: "#1e293b", color: "#d4af37", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>
            Return to GARUDA Home
          </a>
        </div>
      </div>
    );
  }

  const pkg = delegation.proposedPackage || {};
  const ytPlan = pkg.youtubeApexBot || {};
  const shortsPlan = ytPlan.shortsFactory || {};

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#d4af37", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              GARUDA AI • 1-CLICK MAGIC DELEGATION PORTAL
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", margin: "0.3rem 0 0 0", color: "#ffffff" }}>
              Channel Growth & Video SEO Authorization
            </h1>
          </div>
          <div style={{ padding: "0.4rem 0.8rem", borderRadius: "999px", background: approved ? "rgba(16,185,129,0.15)" : "rgba(212,175,55,0.15)", border: `1px solid ${approved ? "rgba(16,185,129,0.4)" : "rgba(212,175,55,0.4)"}`, color: approved ? "#34d399" : "#fbbf24", fontSize: "0.75rem", fontWeight: "700" }}>
            {approved ? "✅ AUTOPILOT AUTHORIZED" : "⚡ PENDING YOUR APPROVAL"}
          </div>
        </div>

        {/* Video Card */}
        <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
            {delegation.videoThumbnail && (
              <img src={delegation.videoThumbnail} alt="Thumbnail" style={{ width: "160px", borderRadius: "8px", border: "1px solid #334155" }} />
            )}
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                Target Media Asset for Optimization
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", margin: "0 0 0.5rem 0", color: "#ffffff" }}>
                {delegation.videoTitle}
              </h2>
              {delegation.videoUrl && (
                <div style={{ fontSize: "0.8rem", color: "#64748b", wordBreak: "break-all" }}>
                  <a href={delegation.videoUrl} target="_blank" rel="noreferrer" style={{ color: "#94a3b8" }}>
                    {delegation.videoUrl} ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zero Password Notice */}
        <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "10px", padding: "1.2rem", marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ fontSize: "1.5rem" }}>🔒</div>
          <div style={{ fontSize: "0.85rem", color: "#a7f3d0", lineHeight: "1.6" }}>
            <strong style={{ color: "#ffffff" }}>100% Privacy & Zero Password Sharing Law:</strong> You never need to share any password with anyone. You simply invite GARUDA's official verified email (<code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: "4px", color: "#fbbf24" }}>garudaos.ai@gmail.com</code>) as an Editor in your YouTube Studio permissions. You retain 100% full ownership of your channel at all times.
          </div>
        </div>

        {/* Step 1: Editor Invite Box */}
        <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#d4af37", color: "#000", fontWeight: "800", display: "grid", placeItems: "center", fontSize: "0.85rem" }}>1</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
              Add GARUDA as Editor in YouTube Studio
            </h3>
          </div>

          <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.6", marginBottom: "1.2rem" }}>
            Click the button below to open your YouTube Studio Permissions page directly. Then click <strong>"Add Permissions"</strong>, paste our official email, and select role <strong>"Editor"</strong>:
          </p>

          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleCopyEmail}
              style={{
                padding: "0.7rem 1.2rem",
                background: copiedEmail ? "#10b981" : "#1e293b",
                border: "1px solid #334155",
                color: "#ffffff",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {copiedEmail ? "✅ Copied (garudaos.ai@gmail.com)" : "📋 Copy Official Email: garudaos.ai@gmail.com"}
            </button>

            <a
              href="https://studio.youtube.com"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "0.7rem 1.2rem",
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                color: "#ffffff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              ↗ Open YouTube Studio
            </a>
          </div>
        </div>

        {/* Step 2: Review Proposed SEO & Growth Package */}
        <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#d4af37", color: "#000", fontWeight: "800", display: "grid", placeItems: "center", fontSize: "0.85rem" }}>2</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
              Review Proposed SEO & Algorithmic Growth Package
            </h3>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {/* Optimized Titles */}
            <div style={{ background: "#111827", padding: "1rem", borderRadius: "8px", border: "1px solid #1f2937" }}>
              <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                High-CTR Title Proposals
              </div>
              {(ytPlan.optimizedTitles || []).map((t, idx) => (
                <div key={idx} style={{ fontSize: "0.85rem", color: "#f1f5f9", marginBottom: "0.4rem", padding: "0.4rem", background: "#0b0f19", borderRadius: "4px" }}>
                  <strong style={{ color: "#d4af37" }}>Option {idx + 1}:</strong> {t.title}
                </div>
              ))}
            </div>

            {/* Description & Tags Preview */}
            {ytPlan.tags && ytPlan.tags.length > 0 && (
              <div style={{ background: "#111827", padding: "1rem", borderRadius: "8px", border: "1px solid #1f2937" }}>
                <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Search Indexing Tags
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {ytPlan.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: "0.75rem", background: "#1e293b", color: "#cbd5e1", padding: "2px 8px", borderRadius: "4px" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Viral Shorts Hook */}
            {shortsPlan.hook_0_to_3s && (
              <div style={{ background: "#111827", padding: "1rem", borderRadius: "8px", border: "1px solid #1f2937" }}>
                <div style={{ fontSize: "0.75rem", color: "#a855f7", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Viral YouTube Shorts Hook (0-3s)
                </div>
                <div style={{ fontSize: "0.85rem", color: "#e2e8f0", fontStyle: "italic" }}>
                  "{shortsPlan.hook_0_to_3s}"
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button
              onClick={handleApprove}
              disabled={approving || approved}
              style={{
                padding: "0.9rem 2.5rem",
                background: approved 
                  ? "#10b981" 
                  : "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
                color: "#000000",
                border: "none",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "1rem",
                cursor: approved ? "default" : "pointer",
                boxShadow: "0 4px 20px rgba(212, 175, 55, 0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              {approving ? "Authorizing Autopilot..." : approved ? "✅ Autopilot Approved & Activated" : "⚡ Approve & Authorize GARUDA Autopilot"}
            </button>

            {approved && (
              <div style={{ marginTop: "0.8rem", fontSize: "0.85rem", color: "#34d399", fontWeight: "600" }}>
                🎉 Thank you! GARUDA AI has received your authorization and will autonomously deploy this optimization.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#475569", borderTop: "1px solid #1e293b", paddingTop: "1.5rem" }}>
          GARUDA AI Autonomous Operating System • Founded by Praveen Mahawar<br />
          Verified Support: <a href="mailto:garudaos.ai@gmail.com" style={{ color: "#94a3b8" }}>garudaos.ai@gmail.com</a> • Official Portal: <a href="https://www.garudaos.in" style={{ color: "#94a3b8" }}>www.garudaos.in</a>
        </div>

      </div>
    </div>
  );
}
