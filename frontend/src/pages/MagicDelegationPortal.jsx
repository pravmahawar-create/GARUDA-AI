import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ALL_PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube Channel",
    icon: "🔴",
    roleNeeded: "Editor",
    portalUrl: "https://studio.youtube.com",
    instructions: "YouTube Studio > Settings > Permissions > Click 'Add Permissions' > Paste 'garudaos.ai@gmail.com' > Select role 'Editor'.",
    marketRateMonthly: 25000,
    garudaRateMonthly: 18750,
    deliverables: "4 Long Video SEO + 20 High-Retention Shorts Scripts + Search Indexing"
  },
  {
    id: "instagram",
    name: "Instagram Professional",
    icon: "📸",
    roleNeeded: "Partner / Content Manager",
    portalUrl: "https://business.facebook.com/settings/people",
    instructions: "Meta Business Suite > Settings > People/Partners > Assign 'garudaos.ai@gmail.com' as Content Manager.",
    marketRateMonthly: 20000,
    garudaRateMonthly: 14000,
    deliverables: "30 Kinetic Reel Hooks + Viral Captions + Auto-DM Keyword Funnel"
  },
  {
    id: "facebook",
    name: "Facebook Page & Groups",
    icon: "👥",
    roleNeeded: "Page Task Manager",
    portalUrl: "https://www.facebook.com/settings?tab=profile_access",
    instructions: "Facebook Page Settings > Professional Dashboard > Page Access > Add 'garudaos.ai@gmail.com'.",
    marketRateMonthly: 15000,
    garudaRateMonthly: 10500,
    deliverables: "Native Video Upload Copy + B2B Community Discussion Infiltration"
  },
  {
    id: "linkedin",
    name: "LinkedIn Company Page",
    icon: "💼",
    roleNeeded: "Content Admin",
    portalUrl: "https://www.linkedin.com",
    instructions: "LinkedIn Page > Admin Tools > Manage Admins > Add 'garudaos.ai@gmail.com' as Content Admin.",
    marketRateMonthly: 25000,
    garudaRateMonthly: 18750,
    deliverables: "8 Thought Leadership 5-Slide PDF Carousels + Executive Posts"
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: "🐦",
    roleNeeded: "Contributor",
    portalUrl: "https://pro.x.com",
    instructions: "X Pro / TweetDeck > Accounts > Teams > Invite 'garudaos.ai@gmail.com' as Contributor.",
    marketRateMonthly: 15000,
    garudaRateMonthly: 10500,
    deliverables: "Viral Discussion Threads + Quote Breakdowns + Real-Time Trend Hijacks"
  },
  {
    id: "googleSeo",
    name: "Google Video & Search SEO",
    icon: "🔍",
    roleNeeded: "Search Console Access",
    portalUrl: "https://search.google.com/search-console",
    instructions: "Google Search Console > Settings > Users & Permissions > Add 'garudaos.ai@gmail.com'.",
    marketRateMonthly: 30000,
    garudaRateMonthly: 21000,
    deliverables: "VideoObject JSON-LD Structured Schema + Search Moment Clips"
  }
];

export default function MagicDelegationPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [delegation, setDelegation] = useState(null);
  const [error, setError] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);

  // Selected platforms state for multi-platform authorization
  const [selectedPlatforms, setSelectedPlatforms] = useState(["youtube"]);

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
          if (data.delegation.selectedPlatforms && data.delegation.selectedPlatforms.length > 0) {
            setSelectedPlatforms(data.delegation.selectedPlatforms);
          }
          if (data.delegation.status === "APPROVED") {
            setApproved(true);
            if (data.delegation.authorizedPlatforms && data.delegation.authorizedPlatforms.length > 0) {
              setSelectedPlatforms(data.delegation.authorizedPlatforms);
            }
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

  const togglePlatform = (id) => {
    if (approved) return;
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length === 1) return; // keep at least 1
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorizedPlatforms: selectedPlatforms })
      });
      if (res.ok) {
        setApproved(true);
        if (delegation) {
          setDelegation({
            ...delegation,
            status: "APPROVED",
            authorizedPlatforms: selectedPlatforms,
            authorizedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      alert("Error authorizing: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  // Pricing math: Client saves 30% off market price (Annual 360% of monthly fee saved), Founder keeps 70-75%!
  const chosenObjects = ALL_PLATFORMS.filter((p) => selectedPlatforms.includes(p.id));
  const rawMarketTotal = chosenObjects.reduce((acc, p) => acc + p.marketRateMonthly, 0);
  const discountPct = chosenObjects.length >= 5 ? 32 : chosenObjects.length >= 2 ? 30 : 25;
  const finalGarudaTotal = Math.round(rawMarketTotal * (1 - discountPct / 100));
  const totalSavings = rawMarketTotal - finalGarudaTotal;
  const annualSavings = totalSavings * 12;
  const savingsPct = discountPct;

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
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#d4af37", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              GARUDA AI • 1-CLICK MAGIC DELEGATION PORTAL
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", margin: "0.3rem 0 0 0", color: "#ffffff" }}>
              Multi-Channel Growth & Management Authorization
            </h1>
          </div>
          <div style={{ padding: "0.4rem 0.8rem", borderRadius: "999px", background: approved ? "rgba(16,185,129,0.15)" : "rgba(212,175,55,0.15)", border: `1px solid ${approved ? "rgba(16,185,129,0.4)" : "rgba(212,175,55,0.4)"}`, color: approved ? "#34d399" : "#fbbf24", fontSize: "0.75rem", fontWeight: "700" }}>
            {approved ? `✅ ${chosenObjects.length} PLATFORMS AUTHORIZED` : "⚡ CHOOSE PLATFORMS TO AUTHORIZE"}
          </div>
        </div>

        {/* Video / Asset Card */}
        <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
            {delegation.videoThumbnail && (
              <img src={delegation.videoThumbnail} alt="Thumbnail" style={{ width: "160px", borderRadius: "8px", border: "1px solid #334155" }} />
            )}
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.3rem" }}>
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

        {/* Zero Password Guarantee */}
        <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "10px", padding: "1.2rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ fontSize: "1.5rem" }}>🔒</div>
          <div style={{ fontSize: "0.85rem", color: "#a7f3d0", lineHeight: "1.6" }}>
            <strong style={{ color: "#ffffff" }}>100% Zero-Password Delegation Law:</strong> You never need to share any account password. Simply invite GARUDA's official verified agent email (<code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: "4px", color: "#fbbf24" }}>garudaos.ai@gmail.com</code>) as Editor or Content Manager. You can revoke access at any second with 1 click.
          </div>
        </div>

        {/* 📊 Section 1: Multi-Platform Authorization Matrix */}
        <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#d4af37", color: "#000", fontWeight: "800", display: "grid", placeItems: "center", fontSize: "0.85rem" }}>1</span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
                Select Social Media Handlers to Connect
              </h3>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              Click cards to select/deselect ({selectedPlatforms.length} selected)
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.8rem", marginBottom: "1.2rem" }}>
            {ALL_PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <div
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    cursor: approved ? "default" : "pointer",
                    background: isSelected ? "rgba(212,175,55,0.08)" : "#090d16",
                    border: isSelected ? "2px solid #d4af37" : "1px solid #1e293b",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.2rem" }}>{platform.icon}</span>
                      <strong style={{ fontSize: "0.9rem", color: "#ffffff" }}>{platform.name}</strong>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{ cursor: "pointer", accentColor: "#d4af37", width: "16px", height: "16px" }}
                    />
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "600", marginBottom: "0.3rem" }}>
                    Role: {platform.roleNeeded}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.4", marginBottom: "0.6rem" }}>
                    {platform.instructions}
                  </div>

                  {isSelected && (
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyEmail();
                        }}
                        style={{ padding: "0.3rem 0.6rem", background: copiedEmail ? "#10b981" : "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "600" }}
                      >
                        {copiedEmail ? "✓ Copied" : "📋 Copy Email"}
                      </button>
                      <a
                        href={platform.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: "0.3rem 0.6rem", background: "#334155", color: "#cbd5e1", borderRadius: "4px", fontSize: "0.7rem", textDecoration: "none", fontWeight: "600", display: "inline-flex", alignItems: "center" }}
                      >
                        ↗ Settings
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 💰 Section 2: Market Rate vs GARUDA Rate Transparency Matrix */}
        <div style={{ background: "linear-gradient(135deg, #090e1a 0%, #172033 100%)", border: "1px solid rgba(56,189,248,0.4)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.3rem" }}>💎</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#ffffff" }}>
                  Transparent Market Rate vs GARUDA AI Rate
                </h3>
                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
                  Verified cost breakdown for managing {chosenObjects.length} chosen platform{chosenObjects.length > 1 ? "s" : ""}. Zero hidden fees.
                </p>
              </div>
            </div>
            <div style={{ padding: "0.3rem 0.8rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "800" }}>
              SAVE {savingsPct}% WITH AI AUTONOMY
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "8px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>
                Traditional Human Agency Rate
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f87171", textDecoration: "line-through", margin: "0.4rem 0" }}>
                ₹{rawMarketTotal.toLocaleString("en-IN")}/mo
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                Slow turnaround (7-14 days), human fatigue, manual errors
              </div>
            </div>

            <div style={{ background: "rgba(212,175,55,0.08)", padding: "1rem", borderRadius: "8px", border: "2px solid #d4af37", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: "800", textTransform: "uppercase" }}>
                GARUDA AI Autonomous Rate
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#ffffff", margin: "0.4rem 0" }}>
                ₹{finalGarudaTotal.toLocaleString("en-IN")}<span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#94a3b8" }}>/mo</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: "700" }}>
                {discountPct > 0 ? `Includes ${discountPct}% Multi-Platform Bundle Discount!` : "Direct AI Execution"}
              </div>
            </div>

            <div style={{ background: "rgba(16,185,129,0.08)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: "700", textTransform: "uppercase" }}>
                Your Monthly Net Savings
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#34d399", margin: "0.4rem 0" }}>
                ₹{totalSavings.toLocaleString("en-IN")}/mo
              </div>
              <div style={{ fontSize: "0.7rem", color: "#a7f3d0" }}>
                ₹{annualSavings.toLocaleString("en-IN")} saved yearly (360% ROI vs traditional agency!)
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>
            ✨ <strong>Zero-Ripoff Guarantee:</strong> Every asset delivered is governed by real performance metrics and anti-fabrication standards.
          </div>
        </div>

        {/* 📝 Section 3: Review Proposed Package & Authorize Autopilot */}
        <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#d4af37", color: "#000", fontWeight: "800", display: "grid", placeItems: "center", fontSize: "0.85rem" }}>2</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>
              Authorize Autopilot for Selected Platforms
            </h3>
          </div>

          <div style={{ background: "#111827", padding: "1rem", borderRadius: "8px", border: "1px solid #1f2937", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Active Platforms in Scope:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {chosenObjects.map((p) => (
                <span key={p.id} style={{ background: "#1e293b", color: "#f8fafc", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", border: "1px solid #334155" }}>
                  {p.icon} {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleApprove}
              disabled={approving || approved}
              style={{
                padding: "1rem 2.8rem",
                background: approved 
                  ? "#10b981" 
                  : "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
                color: "#000000",
                border: "none",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "1.05rem",
                cursor: approved ? "default" : "pointer",
                boxShadow: "0 4px 20px rgba(212, 175, 55, 0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              {approving 
                ? "Authorizing..." 
                : approved 
                ? `✅ ${chosenObjects.length} Platforms Authorized & Live` 
                : `⚡ Authorize ${chosenObjects.length} Platform${chosenObjects.length > 1 ? "s" : ""} on Autopilot`}
            </button>

            {approved && (
              <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
                <div style={{ padding: "1.2rem", background: "rgba(16,185,129,0.12)", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.4)", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#34d399", fontWeight: "800", fontSize: "1rem", marginBottom: "0.4rem" }}>
                    <span>⚡</span> GARUDA Autopilot Activated & Synced
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#d1fae5", lineHeight: "1.5" }}>
                    Authorization logged in system memory for <strong>{chosenObjects.map(p => p.name).join(", ")}</strong>. Founder Praveen Mahawar has been alerted via Telegram.
                  </div>
                </div>

                {/* 2-Step Live Execution Pipeline */}
                <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "10px", padding: "1.2rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#d4af37", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.8rem" }}>
                    Live Autonomous Execution Pipeline
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem", background: "#111827", borderRadius: "6px", border: "1px solid #1f2937" }}>
                      <span style={{ fontSize: "1.1rem" }}>✅</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ffffff" }}>Step 1: Multi-Platform Scope Verified</div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{chosenObjects.length} channels assigned to GARUDA Growth Engine</div>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: "700", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: "4px" }}>LOCKED</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem", background: "#111827", borderRadius: "6px", border: "1px solid #1f2937" }}>
                      <span style={{ fontSize: "1.1rem" }}>🎬</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ffffff" }}>Step 2: 3x Vertical Shorts & Video SEO</div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>High-retention hooks, tags & Full HD vertical crops rendered</div>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: "700", background: "rgba(56,189,248,0.15)", padding: "2px 8px", borderRadius: "4px" }}>READY</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem", background: "#111827", borderRadius: "6px", border: "1px solid #1f2937" }}>
                      <span style={{ fontSize: "1.1rem" }}>⚙️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ffffff" }}>Step 3: YouTube Studio Channel Link</div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Ensure Editor access is granted to <strong>garudaos.ai@gmail.com</strong> in YouTube Studio</div>
                      </div>
                      <a href="https://studio.youtube.com" target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: "700", background: "rgba(251,191,36,0.15)", padding: "4px 8px", borderRadius: "4px", textDecoration: "none", border: "1px solid rgba(251,191,36,0.3)" }}>
                        OPEN STUDIO ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Direct Founder Contact */}
                <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <a href={`https://www.garudaos.in/chat?ref=${token}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "0.7rem 1.4rem", background: "#1e293b", color: "#d4af37", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700", textDecoration: "none", border: "1px solid #334155" }}>
                    💬 Open Real-Time Scoping Chat
                  </a>
                  <button onClick={handleCopyEmail} style={{ padding: "0.7rem 1.4rem", background: "#111827", color: "#94a3b8", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "600", border: "1px solid #1f2937", cursor: "pointer" }}>
                    {copiedEmail ? "✅ Agent Email Copied" : "📋 Copy Agent Email"}
                  </button>
                </div>
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
