try { require("dotenv").config(); } catch {}
/**
 * 🦅 GARUDA AUTONOMOUS YOUTUBE DIRECT PUSH SERVICE
 * Enables 100% autonomous background video updates via official YouTube Data API v3.
 * Zero manual human copy-paste required once authorized.
 * 
 * Flow:
 * 1. 1-Time OAuth Consent generates refresh_token (stored in data/youtube-tokens.json).
 * 2. Push engine automatically exchanges refresh_token for fresh Bearer access_token.
 * 3. Directly calls Google's PUT /youtube/v3/videos to update Title, Description, Tags & Chapters.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const TOKENS_FILE = path.join(DATA_DIR, "youtube-tokens.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

class YouTubeDirectPushService {
  constructor() {
    this.clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || null;
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || null;
  }

  /**
   * Get token file path based on channel profile
   */
  getTokenFilePath(channelProfile = "garuda") {
    if (channelProfile === "praveen") {
      return path.join(DATA_DIR, "youtube-tokens-praveen.json");
    }
    return TOKENS_FILE;
  }

  /**
   * Read stored tokens from disk or process.env
   */
  getStoredTokens(channelProfile = "garuda") {
    ensureDataDir();
    const tokenFile = this.getTokenFilePath(channelProfile);
    let stored = {};
    if (fs.existsSync(tokenFile)) {
      try {
        stored = JSON.parse(fs.readFileSync(tokenFile, "utf8"));
      } catch {}
    }

    const refreshToken = stored.refreshToken || (channelProfile === "garuda" ? process.env.YOUTUBE_REFRESH_TOKEN : null) || null;
    const accessToken = stored.accessToken || (channelProfile === "garuda" ? process.env.YOUTUBE_ACCESS_TOKEN : null) || null;
    const expiresAt = stored.expiresAt || 0;

    return {
      refreshToken,
      accessToken,
      expiresAt,
      channelTitle: stored.channelTitle || (channelProfile === "praveen" ? "Praveen Mahawar" : null),
      channelId: stored.channelId || (channelProfile === "praveen" ? "UC68_XAkGvyU95T1VrTnrw0Q" : null),
      channelProfile
    };
  }

  /**
   * Save tokens to persistent storage
   */
  saveTokens(tokens, channelProfile = "garuda") {
    ensureDataDir();
    const tokenFile = this.getTokenFilePath(channelProfile);
    const current = this.getStoredTokens(channelProfile);
    const merged = { ...current, ...tokens, channelProfile, updatedAt: new Date().toISOString() };
    fs.writeFileSync(tokenFile, JSON.stringify(merged, null, 2), "utf8");
    if (tokens.refreshToken && channelProfile === "garuda") {
      process.env.YOUTUBE_REFRESH_TOKEN = tokens.refreshToken;
    }
    return merged;
  }

  /**
   * Synchronize stored tokens from MongoDB Atlas collection garuda_youtube_tokens
   */
  async syncTokensFromMongo(channelProfile = "praveen") {
    try {
      const mongoose = require("mongoose");
      const connectDB = require("../database/db");
      await connectDB();
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
        const doc = await coll.findOne({ _id: channelProfile });
        if (doc && doc.refreshToken) {
          this.saveTokens({
            refreshToken: doc.refreshToken,
            accessToken: doc.accessToken,
            expiresAt: doc.expiresAt,
            channelTitle: doc.channelTitle,
            channelId: doc.channelId
          }, channelProfile);
          return { success: true, channelTitle: doc.channelTitle, channelId: doc.channelId };
        }
      }
    } catch (e) {
      console.warn("[YouTubeDirectPush] MongoDB token sync error:", e.message);
    }
    return { success: false };
  }

  /**
   * Get YouTube integration connection status
   */
  getStatus(channelProfile = "garuda") {
    const tokens = this.getStoredTokens(channelProfile);
    const hasConfig = Boolean(this.clientId || process.env.YOUTUBE_CLIENT_ID);
    const isConnected = Boolean(tokens.refreshToken);

    return {
      connected: isConnected,
      channelProfile,
      hasClientCredentials: hasConfig,
      clientIdConfigured: Boolean(this.clientId),
      channelTitle: tokens.channelTitle || (channelProfile === "praveen" ? "Praveen Mahawar (@Praveen-Mahawar-111)" : "Authorized YouTube Channel"),
      channelId: tokens.channelId,
      instructions: !isConnected ? `Connect YouTube channel '${channelProfile}' via OAuth to enable 100% autonomous background video updates.` : "100% Autonomous AI Push Active."
    };
  }

  /**
   * Generate 1-click Google OAuth Consent URL
   */
  getAuthUrl(redirectUri = "https://www.garudaos.in/api/bot-verse/youtube/callback", channelProfile = "praveen") {
    const clientId = this.clientId || process.env.YOUTUBE_CLIENT_ID;
    if (!clientId) {
      return {
        success: false,
        error: "YOUTUBE_CLIENT_ID is not configured in .env. Please add Google Cloud OAuth Client ID."
      };
    }

    const scopes = [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/youtube.upload"
    ].join(" ");

    const state = JSON.stringify({ profile: channelProfile });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;

    return { success: true, authUrl, channelProfile };
  }

  /**
   * Handle OAuth redirect code and retrieve permanent refresh token
   */
  async handleCallback(code, redirectUri = "https://www.garudaos.in/api/bot-verse/youtube/callback", channelProfile = "praveen") {
    const clientId = this.clientId || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = this.clientSecret || process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET in environment");
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.error || "Failed to exchange OAuth code for tokens");
    }

    // Fetch verified channel identity from YouTube API
    let channelTitle = null;
    let channelId = null;
    try {
      const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      });
      if (chRes.ok) {
        const chData = await chRes.json();
        if (chData.items && chData.items[0]) {
          channelTitle = chData.items[0].snippet?.title || null;
          channelId = chData.items[0].id || null;
        }
      }
    } catch (e) {
      console.warn("[YouTubeDirectPush] Failed to fetch channel info:", e.message);
    }

    // Auto-detect profile based on channel ID if possible
    let detectedProfile = channelProfile;
    if (channelId === "UC68_XAkGvyU95T1VrTnrw0Q") {
      detectedProfile = "praveen";
    } else if (channelId === "UCA3WxFFJS0wG-oUxdcpncaw") {
      detectedProfile = "garuda";
    }

    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    this.saveTokens({
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresAt,
      channelTitle,
      channelId
    }, detectedProfile);

    return {
      success: true,
      channelProfile: detectedProfile,
      channelTitle,
      channelId,
      message: `YouTube OAuth tokens successfully connected for channel '${channelTitle || detectedProfile}' (${channelId || "verified"}).`
    };
  }

  /**
   * Get a valid, fresh access token using the stored refresh token
   */
  async getFreshAccessToken(channelProfile = "garuda") {
    const tokens = this.getStoredTokens(channelProfile);
    if (!tokens.refreshToken) {
      return null;
    }

    // Return cached token if valid for at least 3 more minutes
    if (tokens.accessToken && tokens.expiresAt > Date.now() + 180000) {
      return tokens.accessToken;
    }

    const clientId = this.clientId || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = this.clientSecret || process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("[YouTubeDirectPush] Refresh token error:", errData);
      return null;
    }

    const data = await res.json();
    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    this.saveTokens({
      accessToken: data.access_token,
      expiresAt
    }, channelProfile);

    return data.access_token;
  }

  /**
   * AUTONOMOUS 100% AI PUSH:
   * Update video Title, Description, Tags, and Category directly on YouTube via official API
   */
  async pushVideoUpdate({ videoId, title, description, tags = [], categoryId = "10" }) {
    if (!videoId) {
      return { success: false, error: "Missing videoId parameter" };
    }

    const status = this.getStatus();
    if (!status.connected) {
      return {
        success: false,
        requiresAuth: true,
        authRequired: true,
        message: "YouTube channel not yet connected via OAuth. Authorize once to enable 100% autonomous background push.",
        authUrl: this.getAuthUrl().authUrl || null
      };
    }

    const accessToken = await this.getFreshAccessToken();
    if (!accessToken) {
      return {
        success: false,
        requiresAuth: true,
        error: "Failed to obtain active YouTube API access token. Please re-authorize."
      };
    }

    // First fetch current video snippet to preserve category and existing properties
    let targetCategoryId = categoryId;
    try {
      const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        if (getData.items && getData.items[0]?.snippet) {
          targetCategoryId = getData.items[0].snippet.categoryId || categoryId;
        }
      }
    } catch {}

    // Execute the autonomous update
    const updatePayload = {
      id: videoId,
      snippet: {
        title: title.slice(0, 100), // YouTube title max 100 chars
        description: description,
        tags: Array.isArray(tags) ? tags.slice(0, 30) : [],
        categoryId: targetCategoryId
      }
    };

    const updateRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatePayload)
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return {
        success: false,
        error: updateData.error?.message || "YouTube API rejected video update",
        details: updateData.error
      };
    }

    return {
      success: true,
      mode: "100%_AUTONOMOUS_API_EXECUTION",
      videoId,
      updatedTitle: updateData.snippet?.title || title,
      updatedAt: new Date().toISOString(),
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  async uploadVideo({
    videoFilePath,
    title,
    description,
    tags = [],
    privacyStatus = "public",
    categoryId = "28",
    publishAt = null,
    channelProfile = "garuda",
    expectedChannelId = null
  }) {
    if (!videoFilePath || !fs.existsSync(videoFilePath)) {
      return { success: false, error: `Video file not found at: ${videoFilePath}` };
    }

    const status = this.getStatus(channelProfile);
    if (!status.connected) {
      return {
        success: false,
        requiresAuth: true,
        authRequired: true,
        channelProfile,
        message: `YouTube channel profile '${channelProfile}' not yet connected via OAuth. Authorize once to enable 100% autonomous background video upload.`,
        authUrl: this.getAuthUrl("https://www.garudaos.in/api/bot-verse/youtube/callback", channelProfile).authUrl || null
      };
    }

    const accessToken = await this.getFreshAccessToken(channelProfile);
    if (!accessToken) {
      return {
        success: false,
        requiresAuth: true,
        error: `Failed to obtain active YouTube API access token for profile '${channelProfile}'. Please re-authorize.`
      };
    }

    // 🛡️ SUPREME BRAND SEPARATION GUARD (Permanent Founder Mandate)
    let currentChannelId = status.channelId;
    let currentChannelTitle = status.channelTitle;
    try {
      const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (chRes.ok) {
        const chData = await chRes.json();
        if (chData.items && chData.items[0]) {
          currentChannelId = chData.items[0].id;
          currentChannelTitle = chData.items[0].snippet?.title;
        }
      }
    } catch (e) {}

    // Strict assertions:
    if (channelProfile === "praveen") {
      if (currentChannelId === "UCA3WxFFJS0wG-oUxdcpncaw") {
        throw new Error("🛑 FATAL SECURITY HALT: Target channel is GARUDA Official ('UCA3WxFFJS0wG-oUxdcpncaw')! Personal videos cannot be published to corporate channel! Aborting.");
      }
      if (expectedChannelId && currentChannelId !== expectedChannelId) {
        throw new Error(`🛑 STRICT BRAND PROTECTION: Current channel '${currentChannelTitle}' (${currentChannelId}) does NOT match Praveen's required personal channel '${expectedChannelId}'! Aborting.`);
      }
    } else if (channelProfile === "garuda") {
      if (currentChannelId === "UC68_XAkGvyU95T1VrTnrw0Q") {
        throw new Error("🛑 FATAL SECURITY HALT: Target channel is Praveen's personal channel ('UC68_XAkGvyU95T1VrTnrw0Q')! Corporate videos cannot be published to personal channel! Aborting.");
      }
    }

    const fileStats = fs.statSync(videoFilePath);
    const fileSize = fileStats.size;

    // Step 1: Initiate Resumable Upload Session
    const videoStatus = {
      privacyStatus: publishAt ? "private" : privacyStatus,
      selfDeclaredMadeForKids: false
    };
    if (publishAt) {
      videoStatus.publishAt = new Date(publishAt).toISOString();
    }

    const metadata = {
      snippet: {
        title: title.slice(0, 100),
        description: description,
        tags: Array.isArray(tags) ? tags.slice(0, 30) : [],
        categoryId: categoryId
      },
      status: videoStatus
    };

    const initRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(fileSize),
        "X-Upload-Content-Type": "video/mp4"
      },
      body: JSON.stringify(metadata)
    });

    if (!initRes.ok) {
      const errData = await initRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error?.message || "Failed to initiate YouTube resumable upload session",
        details: errData.error
      };
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      return { success: false, error: "Google API did not return resumable upload location header" };
    }

    // Step 2: Upload Video Binary Stream / Buffer
    const videoBuffer = fs.readFileSync(videoFilePath);
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(fileSize)
      },
      body: videoBuffer
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      return {
        success: false,
        error: uploadData.error?.message || "YouTube upload binary transfer failed",
        details: uploadData.error
      };
    }

    return {
      success: true,
      mode: "100%_AUTONOMOUS_API_EXECUTION",
      videoId: uploadData.id,
      title: uploadData.snippet?.title || title,
      privacyStatus: uploadData.status?.privacyStatus || privacyStatus,
      publishedAt: uploadData.snippet?.publishedAt || new Date().toISOString(),
      youtubeUrl: `https://www.youtube.com/watch?v=${uploadData.id}`,
      shortsUrl: `https://www.youtube.com/shorts/${uploadData.id}`
    };
  }

  /**
   * Post top-level comment on a video via YouTube Data API
   */
  async postComment({ videoId, commentText }) {
    if (!videoId || !commentText) {
      return { success: false, error: "Missing videoId or commentText" };
    }

    const accessToken = await this.getFreshAccessToken();
    if (!accessToken) {
      return { success: false, error: "Failed to obtain active YouTube access token" };
    }

    const payload = {
      snippet: {
        videoId: videoId,
        topLevelComment: {
          snippet: {
            textOriginal: commentText
          }
        }
      }
    };

    const res = await fetch("https://www.googleapis.com/youtube/v3/commentThreads?part=snippet", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || "Failed to post comment",
        details: data.error
      };
    }

    return {
      success: true,
      commentId: data.id,
      text: commentText,
      publishedAt: data.snippet?.topLevelComment?.snippet?.publishedAt || new Date().toISOString()
    };
  }

  /**
   * Delete a video permanently from YouTube via Data API v3
   */
  async deleteVideo(videoId) {
    if (!videoId) return { success: false, error: "Missing videoId" };
    const accessToken = await this.getFreshAccessToken();
    if (!accessToken) return { success: false, error: "Failed to obtain active YouTube access token" };

    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (res.status === 204 || res.ok) {
      return { success: true, videoId, status: "deleted" };
    }
    const errData = await res.json().catch(() => ({}));
    return { success: false, error: errData.error?.message || "Delete failed", status: res.status };
  }

  /**
   * Change video privacy status (public, unlisted, private)
   */
  async setVideoPrivacy(videoId, privacyStatus = "private") {
    if (!videoId) return { success: false, error: "Missing videoId" };
    const accessToken = await this.getFreshAccessToken();
    if (!accessToken) return { success: false, error: "Failed to obtain active YouTube access token" };

    const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(videoId)}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    if (!getRes.ok) return { success: false, error: "Could not fetch existing video metadata" };
    const getData = await getRes.json();
    const existing = getData.items?.[0];
    if (!existing) return { success: false, error: "Video not found on channel" };

    const updatePayload = {
      id: videoId,
      snippet: {
        title: existing.snippet.title,
        description: existing.snippet.description,
        categoryId: existing.snippet.categoryId
      },
      status: {
        privacyStatus: privacyStatus
      }
    };

    const putRes = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,status", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatePayload)
    });

    const putData = await putRes.json();
    if (!putRes.ok) {
      return { success: false, error: putData.error?.message || "Privacy status update failed" };
    }
    return { success: true, videoId, privacyStatus: putData.status?.privacyStatus };
  }
}

const instance = new YouTubeDirectPushService();
module.exports = instance;
