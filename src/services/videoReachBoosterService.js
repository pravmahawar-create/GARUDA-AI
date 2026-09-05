/**
 * 🦅 GARUDA Video SEO & Algorithm Reach Booster Engine
 * Solves: Reviving existing/dead videos, maximizing organic reach, and multi-platform distribution.
 * Platforms: YouTube, Instagram Reels, Facebook Video, LinkedIn.
 */

const fs = require("fs");
const path = require("path");

class VideoReachBooster {
  constructor() {
    this.growthFrameworks = {
      ctrHooks: [
        "Curiosity Gap (The secret/mistake 90% ignore)",
        "Proof & Transformation (₹X to ₹Y or Case Study)",
        "High-Volume Search Keyword (Exact term buyers type)"
      ],
      reachMultipliers: [
        "Google Search Video Key Moments Indexing (Chapters)",
        "Shorts/Reels Repurposing Funnel (Feeder traffic)",
        "Instagram DM Comment Automation ('Comment keyword for link')",
        "LinkedIn B2B Thought Leadership Repurposing"
      ]
    };
  }

  /**
   * Safely fetches video metadata (YouTube oEmbed or URL metadata) with timeout
   */
  async fetchVideoMetadata(videoUrl) {
    if (!videoUrl || typeof videoUrl !== "string") return null;
    const cleanUrl = videoUrl.trim();

    // 1. YouTube normalization (watch, youtu.be, shorts)
    const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const canonicalYtUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const oembedApi = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalYtUrl)}&format=json`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(oembedApi, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return {
            isYouTube: true,
            videoId,
            videoUrl: canonicalYtUrl,
            title: data.title || null,
            authorName: data.author_name || null,
            authorUrl: data.author_url || null,
            thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            provider: "YouTube"
          };
        }
      } catch (err) {
        // Fallback to static YouTube construct if network times out
        return {
          isYouTube: true,
          videoId,
          videoUrl: canonicalYtUrl,
          title: null,
          authorName: null,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          provider: "YouTube"
        };
      }
    }

    // 2. Generic URL fallback — extract slug as fallback title
    try {
      const parsed = new URL(cleanUrl);
      const slug = parsed.pathname.split("/").filter(Boolean).pop() || "";
      const derivedTitle = slug.replace(/[-_]/g, " ").replace(/\.\w+$/, "").trim();
      return {
        isYouTube: false,
        videoUrl: cleanUrl,
        title: derivedTitle ? derivedTitle.charAt(0).toUpperCase() + derivedTitle.slice(1) : null,
        thumbnailUrl: "https://www.garudaos.in/assets/branding/garuda_sovereign_hero.png",
        provider: parsed.hostname
      };
    } catch {
      return null;
    }
  }

  /**
   * Optimize an existing video for maximum algorithmic reach
   */
  optimizeVideo(input, metadata = null) {
    const rawTitle = input.title || metadata?.title || input.topic || "Optimized Video";
    const description = input.description || "";
    const niche = input.niche || input.industry || "Digital Marketing & Business Growth";
    const targetAudience = input.targetAudience || "Business Decision Makers";
    const currentViews = input.currentViews || 0;
    const videoDurationMinutes = input.videoDurationMinutes || 10;
    const videoUrl = input.videoUrl || input.seedVideoUrl || metadata?.videoUrl || null;
    const thumbnailUrl = metadata?.thumbnailUrl || "https://www.garudaos.in/assets/branding/garuda_sovereign_hero.png";

    // 1. Algorithmic Diagnostic
    const diagnostic = {
      currentStatus: `Video has low algorithmic velocity (approx ${currentViews} views).`,
      primaryDropoffFactors: [
        "Title lacks curiosity or specific business outcome (Low Click-Through Rate < 3%)",
        "Description lacks structured timestamps, preventing Google Search Video Highlights indexing",
        "Zero cross-pollination from short-form feeds (Shorts/Reels) to feed cold viewers into long-form",
        "Missing interactive engagement triggers (Comments are passive instead of lead-generating)"
      ],
      revivalStrategy: "Metadata Refresh + Semantic Search Re-Indexing + Shorts Traffic Feeder Funnel"
    };

    // 2. High-CTR Title Transformations
    const optimizedTitles = [
      {
        angle: "High Curiosity & Mistake Elimination",
        title: `The 1 Fatal Mistake Killing Your ${niche || "Business"} Growth in 2026 🚨`,
        whyItWorks: "Triggers loss aversion. High CTR in Browse & Suggested feeds."
      },
      {
        angle: "Real Case Study & Transformation",
        title: `How We Scaled ${niche || "Client Revenue"} from Scratch (Step-by-Step Blueprint)`,
        whyItWorks: "Provides tangible proof. Attracts serious buyers and decision-makers."
      },
      {
        angle: "High-Volume Organic Search (SEO)",
        title: `${niche || "Digital Marketing"} Masterclass 2026: Complete Strategy for ${targetAudience || "Founders"}`,
        whyItWorks: "Matches exact search queries in YouTube & Google Search."
      }
    ];

    // 3. Search-Engine Rich Description with Key Moments / Chapters
    const chapters = [
      { timestamp: "00:00", title: `Why Most ${niche || "Business"} Strategies Fail Today` },
      { timestamp: "02:15", title: "The Core Bottleneck Most People Ignore" },
      { timestamp: "05:30", title: "The 3-Step Execution Blueprint" },
      { timestamp: "08:45", title: "Live Case Study & Real Proof" },
      { timestamp: "11:20", title: "How to Implement This for Your Brand" }
    ];

    const formattedChapters = chapters.map(c => `${c.timestamp} - ${c.title}`).join("\n");

    const optimizedDescription = [
      `Looking to master ${niche || "business scaling"} in 2026? In this breakdown, we deconstruct the exact end-to-end framework to achieve consistent, high-ROI results for ${targetAudience || "businesses"}.`,
      "",
      "📌 Video Chapters (Click to Jump):",
      formattedChapters,
      "",
      "💡 Key Takeaways:",
      `• Understanding algorithmic demand in ${niche || "your industry"}.`,
      "• Avoiding the high-cost pitfalls that drain budget.",
      "• Setting up automated workflows that convert cold viewers into clients.",
      "",
      "🔗 Next Step / Scoping Portal:",
      "Audit your business workflows & get a custom architecture blueprint:",
      "👉 https://www.garudaos.in/chat?ref=yt_video_seo",
      "",
      `#${(niche || "Growth").replace(/\\s+/g, "")} #BusinessScaling #FounderGrowth #GARUDA`
    ].join("\n");

    // 4. Tags & SEO Keywords
    const tags = [
      niche,
      `${niche} strategy 2026`,
      `${niche} case study`,
      `how to scale ${niche}`,
      `${niche} for beginners`,
      `best ${niche} agency`,
      "business workflow automation",
      "performance marketing",
      "garuda ai os",
      targetAudience
    ].filter(Boolean);

    // 5. Cross-Platform Reach Multiplication Plan (Instagram, Facebook, LinkedIn)
    const crossPlatformDistribution = {
      youtubeShortsFeeder: {
        action: "Extract a 30-45s clip of the best hook (around timestamp 02:15 - 03:00).",
        captionStyle: "Bold kinetic captions (word-by-word yellow/white text).",
        cta: "Pinned comment: 'Watch the full step-by-step masterclass here: [Link to this video]'"
      },
      instagramReelsGrowthHack: {
        action: "Post the short clip as an Instagram Reel paired with high-retention audio.",
        commentTriggerBot: "Add CTA: 'Comment SCALE below and our AI bot will DM you the complete video link + free blueprint.'",
        whyItExplodesReach: "Instagram algorithm favors posts with high comment-to-view ratios. Automated DMs convert viewers into warm leads."
      },
      facebookVideoAndGroups: {
        action: "Upload native 16:9 or 1:1 video to Facebook Page & relevant Founder/Business Groups.",
        strategy: "Facebook prioritizes native video uploads over external YouTube links. Native teaser drives 10X more shares."
      },
      linkedInArticleOrCarousel: {
        action: "Convert the video transcript into a 5-slide PDF carousel or long-form post.",
        benefit: "Captures B2B executives and enterprise buyers who don't watch YouTube during work hours."
      }
    };

    return {
      success: true,
      diagnostic,
      optimizedTitles,
      optimizedDescription,
      tags,
      crossPlatformDistribution,
      thumbnailUrl,
      videoMetadata: metadata,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new VideoReachBooster();

// CLI Execution if run directly
if (require.main === module) {
  const booster = new VideoReachBooster();
  const sample = {
    title: "How to get digital marketing clients in India",
    niche: "Performance Marketing & Client Acquisition",
    targetAudience: "Agencies & Business Owners",
    currentViews: 140
  };
  console.log("=== RUNNING GARUDA VIDEO SEO & REACH BOOSTER ===");
  const res = booster.optimizeVideo(sample);
  console.log(JSON.stringify(res, null, 2));
}
