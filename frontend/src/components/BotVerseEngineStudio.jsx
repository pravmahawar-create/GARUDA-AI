import React, { useState, useEffect } from "react";

const PRESETS = [
  {
    label: "🛍️ D2C Performance Marketing",
    topic: "Scaling Indian D2C Brands from ₹10L to ₹1Cr/Month with AI Lead Funnels",
    niche: "Performance Marketing & Meta Ads",
    aud: "Indian D2C Brands & E-commerce Founders",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    label: "🏢 Luxury Real Estate",
    topic: "Automated WhatsApp Bot Qualification for ₹1Cr+ Luxury Apartments",
    niche: "Real Estate Digital Growth",
    aud: "Real Estate Developers & Top Brokers",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    label: "🏥 Clinic & Doctor Leads",
    topic: "High-ROI Patient Acquisition Funnel for Dental & Cosmetology Clinics",
    niche: "Healthcare Lead Generation",
    aud: "Clinic Owners & Doctors",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    label: "💻 B2B SaaS & Tech",
    topic: "Why Traditional Demo Forms Are Dead: The Instant Conversational Scoping Engine",
    niche: "B2B SaaS Growth & Custom AI",
    aud: "Tech Founders & Agency Owners",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
];

export default function BotVerseEngineStudio() {
  const [topic, setTopic] = useState("Scaling Indian B2B Agencies with AI Performance Marketing");
  const [industry, setIndustry] = useState("Performance Marketing & Client Acquisition");
  const [audience, setAudience] = useState("Indian D2C Brands & Agency Founders");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(null);

  // Load existing campaigns from backend
  const loadCampaigns = async () => {
    try {
      const res = await fetch("/api/bot-verse/campaigns");
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns) {
          setCampaigns(data.campaigns);
          if (data.campaigns.length > 0 && !activeCampaign) {
            setActiveCampaign(data.campaigns[0]);
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Live URL inspection and oEmbed fetch
  useEffect(() => {
    const candidate = (videoUrl || "").trim() || (/^https?:\/\//i.test((topic || "").trim()) ? topic.trim() : "");
    if (!candidate || !/^https?:\/\//i.test(candidate)) {
      setPreviewMeta(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bot-verse/oembed?url=${encodeURIComponent(candidate)}`);
        if (res.ok && active) {
          const data = await res.json();
          if (data.metadata) {
            setPreviewMeta(data.metadata);
            if (data.metadata.title && /^https?:\/\//i.test(topic.trim())) {
              setTopic(data.metadata.title);
            }
          }
        }
      } catch {}
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [videoUrl, topic]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === "object" ? JSON.stringify(text, null, 2) : text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleLaunch = async (isRevival = false) => {
    setLoading(true);
    setActionNotice({ type: "info", text: "Deploying 6-platform BOT-VERSE campaign..." });

    try {
      const isUrlInput = /^https?:\/\//i.test(topic.trim()) || Boolean(videoUrl.trim());
      const endpoint = (isRevival || isUrlInput) && (videoUrl || topic) ? "/api/bot-verse/revive-video" : "/api/bot-verse/generate";
      const payload = {
        topic: topic,
        industry: industry,
        niche: industry,
        targetAudience: audience,
        videoUrl: videoUrl || (isUrlInput ? topic : null)
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.campaign) {
        setActiveCampaign(data.campaign);
        setCampaigns((prev) => [data.campaign, ...(prev || []).filter((c) => c.campaignId !== data.campaign.campaignId)]);
        setActionNotice({
          type: "success",
          text: `BOT-VERSE 6-Platform Pack Generated! SHA-256: ${data.campaign.sha256Evidence.slice(0, 12)}...`
        });
      } else {
        setActionNotice({ type: "error", text: data.error || "Failed generating Bot-Verse pack" });
      }
    } catch (e) {
      setActionNotice({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = (preset) => {
    setTopic(preset.topic);
    setIndustry(preset.niche);
    setAudience(preset.aud);
    if (preset.sampleUrl) setVideoUrl(preset.sampleUrl);
  };

  return (
    <div>
      {/* Notice Banner */}
      {actionNotice && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            marginBottom: "1.2rem",
            fontSize: "0.85rem",
            fontWeight: "500",
            background: actionNotice.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${actionNotice.type === "success" ? "#10b981" : "#ef4444"}`,
            color: actionNotice.type === "success" ? "#34d399" : "#f87171",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>{actionNotice.text}</span>
          <button onClick={() => setActionNotice(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}

      {/* Control Box */}
      <div style={{ background: "#0b1329", border: "1px solid #1e293b", borderRadius: "10px", padding: "1.4rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.8rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🎯</span>
              <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "#f8fafc" }}>Configure Bot-Verse Mission</span>
              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", background: "rgba(168,85,247,0.2)", color: "#c084fc", borderRadius: "999px", border: "1px solid rgba(168,85,247,0.4)", fontWeight: "700" }}>
                6 PLATFORMS AT ONCE
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.3rem" }}>
              Paste ANY YouTube video link to revive its reach, OR enter a topic to launch from scratch.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                setTopic("High-ROI Client Acquisition Blueprint 2026");
              }}
              style={{
                padding: "0.4rem 0.8rem",
                background: "#090d16",
                border: "1px solid #38bdf8",
                color: "#38bdf8",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              🔗 Paste Sample YouTube Link
            </button>
          </div>
        </div>

        {/* Quick Industry Presets */}
        <div style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: "600" }}>
            QUICK REVENUE PRESETS (CLICK TO AUTOFILL):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleFillSample(p)}
                style={{
                  padding: "0.35rem 0.75rem",
                  background: "#090d16",
                  border: "1px solid #334155",
                  color: "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Fields Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", marginBottom: "0.3rem" }}>
              1. TOPIC / CONTENT THEME (OR PASTE LINK HERE)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Scaling Indian B2B Agencies or paste YouTube link"
              style={{ width: "100%", padding: "0.65rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", marginBottom: "0.3rem" }}>
              2. SEED VIDEO URL (OPTIONAL FOR DEAD VIDEO REVIVAL)
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=your_video_id"
              style={{ width: "100%", padding: "0.65rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", marginBottom: "0.3rem" }}>
              3. TARGET INDUSTRY / NICHE
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Performance Marketing & Client Acquisition"
              style={{ width: "100%", padding: "0.65rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", marginBottom: "0.3rem" }}>
              4. TARGET AUDIENCE
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Indian D2C Brands & Agency Founders"
              style={{ width: "100%", padding: "0.65rem 0.8rem", background: "#020617", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Real-time Link Detection Banner */}
        {previewMeta && (
          <div style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px", padding: "0.8rem 1rem", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            {previewMeta.thumbnailUrl && (
              <img src={previewMeta.thumbnailUrl} alt="Thumbnail Preview" style={{ width: "80px", height: "45px", objectFit: "cover", borderRadius: "4px" }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase" }}>
                ✓ {previewMeta.provider || "Video"} Link Detected & Verified
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f8fafc", marginTop: "0.1rem" }}>
                {previewMeta.title || "Authentic Video Found"}
              </div>
              {previewMeta.authorName && (
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  Channel / Creator: {previewMeta.authorName}
                </div>
              )}
            </div>
            <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: "#020617", color: "#34d399", borderRadius: "4px", border: "1px solid #10b981" }}>
              Ready for Revival
            </span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
          <button
            onClick={() => handleLaunch(Boolean(videoUrl || previewMeta))}
            disabled={loading}
            style={{
              padding: "0.75rem 1.8rem",
              background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              cursor: loading ? "wait" : "pointer",
              fontSize: "0.95rem",
              fontWeight: "800",
              boxShadow: "0 4px 18px rgba(168,85,247,0.35)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {loading ? "⚡ Generating 6-Bot Pack..." : previewMeta || videoUrl ? "🔄 Revive & Distribute Video Across 6 Platforms" : "⚡ Launch Omni-Channel Bot-Verse"}
          </button>
        </div>
      </div>

      {/* Campaign Selector History Chips */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>Saved Campaigns:</span>
          {campaigns.map((c) => (
            <button
              key={c.campaignId}
              onClick={() => setActiveCampaign(c)}
              style={{
                padding: "0.35rem 0.8rem",
                background: activeCampaign?.campaignId === c.campaignId ? "#1e293b" : "#090d16",
                border: activeCampaign?.campaignId === c.campaignId ? "1px solid #a855f7" : "1px solid #1e293b",
                color: activeCampaign?.campaignId === c.campaignId ? "#f8fafc" : "#94a3b8",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontWeight: activeCampaign?.campaignId === c.campaignId ? "700" : "500"
              }}
            >
              {c.topic.slice(0, 32)}...
            </button>
          ))}
        </div>
      )}

      {/* 6-Bot Interactive Display Cards */}
      {activeCampaign ? (
        <div>
          {/* Active Campaign Header */}
          <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "8px", padding: "0.8rem 1.2rem", marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Active Mission: </span>
              <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#f8fafc" }}>{activeCampaign.topic}</span>
              <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "0.5rem" }}>({activeCampaign.campaignId})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#d4af37", fontFamily: "monospace", background: "#020617", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(212,175,55,0.3)" }}>
                SHA-256: {activeCampaign.sha256Evidence?.slice(0, 16)}...
              </span>
              <button
                onClick={() => handleCopy(JSON.stringify(activeCampaign, null, 2), "blueprint")}
                style={{ padding: "0.35rem 0.8rem", background: "#1e293b", border: "1px solid #334155", color: "#38bdf8", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
              >
                {copiedKey === "blueprint" ? "✓ Copied" : "📋 Export JSON"}
              </button>
            </div>
          </div>

          {/* Grid of 6 Bot Engines */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.2rem" }}>
            {/* Bot 1: YouTube Apex Bot */}
            <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔴</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>YouTube Apex Bot</span>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: "4px", fontWeight: "700" }}>
                  SEARCH & SHORTS
                </span>
              </div>

              {/* Title Variants */}
              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>
                  3 High-CTR Title Hooks:
                </div>
                {activeCampaign.bots?.youtubeApexBot?.optimizedTitles?.map((t, idx) => (
                  <div key={idx} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.5rem 0.7rem", marginBottom: "0.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "#f8fafc", fontWeight: "600" }}>{t.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{t.type} • {t.psychology}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(t.title, `yt_title_${idx}`)}
                      style={{ background: "#1e293b", border: "none", color: "#38bdf8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", marginLeft: "0.5rem", whiteSpace: "nowrap" }}
                    >
                      {copiedKey === `yt_title_${idx}` ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Google Video Chapters */}
              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>
                    Google Search Chapters (Key Moments):
                  </span>
                  <button
                    onClick={() => handleCopy(activeCampaign.bots?.youtubeApexBot?.seoChapters?.map((c) => `${c.timestamp} - ${c.title}`).join("\n"), "yt_chapters")}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                  >
                    {copiedKey === "yt_chapters" ? "✓ Copied" : "Copy Chapters"}
                  </button>
                </div>
                <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.5rem 0.7rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                  {activeCampaign.bots?.youtubeApexBot?.seoChapters?.map((c, idx) => (
                    <div key={idx} style={{ marginBottom: "0.2rem" }}>
                      <span style={{ color: "#38bdf8", fontWeight: "700", marginRight: "0.4rem" }}>{c.timestamp}</span>
                      <span>{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shorts Script */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>
                    45s Shorts Factory Script:
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(activeCampaign.bots?.youtubeApexBot?.shortsFactory, null, 2), "yt_shorts")}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                  >
                    {copiedKey === "yt_shorts" ? "✓ Copied" : "Copy Script"}
                  </button>
                </div>
                <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#e2e8f0" }}>
                  <div style={{ color: "#fbbf24", fontWeight: "700" }}>Hook: "{activeCampaign.bots?.youtubeApexBot?.shortsFactory?.hook_0_to_3s}"</div>
                  <div style={{ color: "#94a3b8", marginTop: "0.3rem" }}>Story: "{activeCampaign.bots?.youtubeApexBot?.shortsFactory?.story_3_to_25s}"</div>
                  <div style={{ color: "#34d399", marginTop: "0.3rem", fontWeight: "600" }}>CTA: "{activeCampaign.bots?.youtubeApexBot?.shortsFactory?.cta_25_to_35s}"</div>
                </div>
              </div>
            </div>

            {/* Bot 2: Instagram Viral Bot */}
            <div style={{ background: "#0f172a", border: "1px solid rgba(236,72,153,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>📸</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Instagram Viral Bot</span>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(236,72,153,0.15)", color: "#f472b6", borderRadius: "4px", fontWeight: "700" }}>
                  REELS & AUTO-DM
                </span>
              </div>

              <div style={{ marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Reel Cut Timestamp: </span>
                <span style={{ fontSize: "0.8rem", color: "#f472b6", fontWeight: "600" }}>
                  {activeCampaign.bots?.instagramViralBot?.reelCutTimestamp}
                </span>
              </div>

              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Kinetic Reel Caption:</span>
                  <button
                    onClick={() => handleCopy(activeCampaign.bots?.instagramViralBot?.caption, "ig_caption")}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                  >
                    {copiedKey === "ig_caption" ? "✓ Copied" : "Copy Caption"}
                  </button>
                </div>
                <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1", margin: 0, whiteSpace: "pre-wrap" }}>
                  {activeCampaign.bots?.instagramViralBot?.caption}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Automated DM Trigger Flow:
                </div>
                <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem" }}>
                  <div style={{ color: "#38bdf8", fontWeight: "700" }}>Trigger Keyword: "{activeCampaign.bots?.instagramViralBot?.automatedDmTrigger?.keyword}"</div>
                  <div style={{ color: "#94a3b8", marginTop: "0.3rem", lineHeight: "1.4" }}>
                    Instant DM Response: <span style={{ color: "#f8fafc" }}>{activeCampaign.bots?.instagramViralBot?.automatedDmTrigger?.dmResponseText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bot 3: Facebook Omni Bot */}
            <div style={{ background: "#0f172a", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌐</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Facebook Omni Bot</span>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(59,130,246,0.15)", color: "#60a5fa", borderRadius: "4px", fontWeight: "700" }}>
                  NATIVE SYNDICATION
                </span>
              </div>

              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>Target Community Groups:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {activeCampaign.bots?.facebookOmniBot?.communityDiscussionPrompt?.targetGroups?.map((g, idx) => (
                    <span key={idx} style={{ background: "#020617", border: "1px solid #1e293b", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", color: "#93c5fd" }}>
                      👥 {g}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Community Value Snippet:</span>
                  <button
                    onClick={() => handleCopy(activeCampaign.bots?.facebookOmniBot?.communityDiscussionPrompt?.valueSnippet, "fb_copy")}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                  >
                    {copiedKey === "fb_copy" ? "✓ Copied" : "Copy Snippet"}
                  </button>
                </div>
                <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1", margin: 0, whiteSpace: "pre-wrap" }}>
                  {activeCampaign.bots?.facebookOmniBot?.communityDiscussionPrompt?.valueSnippet}
                </pre>
              </div>
            </div>

            {/* Bot 4: LinkedIn Executive Bot */}
            <div style={{ background: "#0f172a", border: "1px solid rgba(14,165,233,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>💼</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>LinkedIn Executive Bot</span>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(14,165,233,0.15)", color: "#38bdf8", borderRadius: "4px", fontWeight: "700" }}>
                  PDF CAROUSEL & POST
                </span>
              </div>

              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.3rem" }}>5-Slide PDF Carousel Deck:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {activeCampaign.bots?.linkedInExecutiveBot?.carouselSlideDeck?.map((s) => (
                    <div key={s.slideNumber} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "4px", padding: "0.4rem 0.6rem", display: "flex", gap: "0.6rem", fontSize: "0.75rem" }}>
                      <span style={{ color: "#38bdf8", fontWeight: "700" }}>#{s.slideNumber}</span>
                      <div>
                        <div style={{ color: "#f8fafc", fontWeight: "600" }}>{s.title}</div>
                        <div style={{ color: "#94a3b8", fontSize: "0.7rem" }}>{s.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Executive Thought Leadership Post:</span>
                  <button
                    onClick={() => handleCopy(activeCampaign.bots?.linkedInExecutiveBot?.executivePostText, "li_post")}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                  >
                    {copiedKey === "li_post" ? "✓ Copied" : "Copy Post"}
                  </button>
                </div>
                <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#cbd5e1", margin: 0, whiteSpace: "pre-wrap" }}>
                  {activeCampaign.bots?.linkedInExecutiveBot?.executivePostText}
                </pre>
              </div>
            </div>

            {/* Bot 5: Google Semantic Video SEO Bot */}
            <div style={{ background: "#0f172a", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔍</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Google Semantic SEO Bot</span>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(16,185,129,0.15)", color: "#34d399", borderRadius: "4px", fontWeight: "700" }}>
                  SCHEMA & CLIPS
                </span>
              </div>

              <div style={{ marginBottom: "0.8rem", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: "1.4" }}>
                Google Search indexes structured <code>VideoObject</code> schema. This enables key moments jump clips directly on Google search results!
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>JSON-LD Schema:</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(activeCampaign.bots?.googleSemanticSeoBot?.jsonLdSchema, null, 2), "seo_schema")}
                    style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.7rem", cursor: "pointer" }}
                  >
                    {copiedKey === "seo_schema" ? "✓ Copied" : "Copy Schema"}
                  </button>
                </div>
                <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", padding: "0.6rem", fontSize: "0.7rem", color: "#34d399", margin: 0, maxHeight: "180px", overflowY: "auto", fontFamily: "monospace" }}>
                  {JSON.stringify(activeCampaign.bots?.googleSemanticSeoBot?.jsonLdSchema, null, 2)}
                </pre>
              </div>
            </div>

            {/* Bot 6: Unified Conversion Bridge */}
            <div style={{ background: "#0f172a", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "10px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.6rem", marginBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "#f8fafc" }}>Unified Conversion Bridge</span>
                </div>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", borderRadius: "4px", fontWeight: "700" }}>
                  TRACKABLE FUNNEL
                </span>
              </div>

              <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginBottom: "0.8rem" }}>
                Every click across all 5 platforms routes directly into trackable Founder scoping chat URLs:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
                {Object.entries(activeCampaign.bots?.unifiedConversionBridge?.channelRouting || {}).map(([ch, url]) => (
                  <div key={ch} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "4px", padding: "0.4rem 0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#d4af37", textTransform: "capitalize", fontWeight: "700" }}>{ch}: </span>
                      <span style={{ color: "#38bdf8", wordBreak: "break-all" }}>{url}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(url, `conv_${ch}`)}
                      style={{ background: "#1e293b", border: "none", color: "#38bdf8", padding: "0.15rem 0.4rem", borderRadius: "3px", fontSize: "0.65rem", cursor: "pointer", marginLeft: "0.5rem" }}
                    >
                      {copiedKey === `conv_${ch}` ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: "1px solid #1e293b", fontSize: "0.7rem", color: "#94a3b8" }}>
                Verified Official Email: <span style={{ color: "#f8fafc" }}>garudaos.ai@gmail.com</span> • Zero fake data law.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "3rem", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#64748b" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌌</div>
          <div style={{ fontWeight: "600", color: "#94a3b8" }}>No Active Bot-Verse Mission Selected</div>
          <div style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
            Paste ANY YouTube link above or click a preset to launch your 6-platform pack.
          </div>
        </div>
      )}
    </div>
  );
}
