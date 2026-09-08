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
   * Read stored tokens from disk or process.env
   */
  getStoredTokens() {
    ensureDataDir();
    let stored = {};
    if (fs.existsSync(TOKENS_FILE)) {
      try {
        stored = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
      } catch {}
    }

    const refreshToken = stored.refreshToken || process.env.YOUTUBE_REFRESH_TOKEN || null;
    const accessToken = stored.accessToken || process.env.YOUTUBE_ACCESS_TOKEN || null;
    const expiresAt = stored.expiresAt || 0;

    return {
      refreshToken,
      accessToken,
      expiresAt,
      channelTitle: stored.channelTitle || null,
      channelId: stored.channelId || null
    };
  }

  /**
   * Save tokens to persistent storage
   */
  saveTokens(tokens) {
    ensureDataDir();
    const current = this.getStoredTokens();
    const merged = { ...current, ...tokens, updatedAt: new Date().toISOString() };
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(merged, null, 2), "utf8");
    if (tokens.refreshToken) {
      process.env.YOUTUBE_REFRESH_TOKEN = tokens.refreshToken;
    }
    return merged;
  }

  /**
   * Get YouTube integration connection status
   */
  getStatus() {
    const tokens = this.getStoredTokens();
    const hasConfig = Boolean(this.clientId || process.env.YOUTUBE_CLIENT_ID);
    const isConnected = Boolean(tokens.refreshToken);

    return {
      connected: isConnected,
      hasClientCredentials: hasConfig,
      clientIdConfigured: Boolean(this.clientId),
      channelTitle: tokens.channelTitle || "Authorized YouTube Channel",
      channelId: tokens.channelId,
      instructions: !isConnected ? "Connect your YouTube channel once via OAuth to enable 100% autonomous background video updates." : "100% Autonomous AI Push Active."
    };
  }

  /**
   * Generate 1-click Google OAuth Consent URL
   */
  getAuthUrl(redirectUri = "https://www.garudaos.in/api/bot-verse/youtube/callback") {
    const clientId = this.clientId || process.env.YOUTUBE_CLIENT_ID;
    if (!clientId) {
      return {
        success: false,
        error: "YOUTUBE_CLIENT_ID is not configured in .env. Please add Google Cloud OAuth Client ID."
      };
    }

    const scopes = [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return { success: true, authUrl };
  }

  /**
   * Handle OAuth redirect code and retrieve permanent refresh token
   */
  async handleCallback(code, redirectUri = "https://www.garudaos.in/api/bot-verse/youtube/callback") {
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

    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    this.saveTokens({
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresAt
    });

    return { success: true, message: "YouTube OAuth tokens successfully connected for autonomous push." };
  }

  /**
   * Get a valid, fresh access token using the stored refresh token
   */
  async getFreshAccessToken() {
    const tokens = this.getStoredTokens();
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
    });

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

  /**
   * AUTONOMOUS 100% AI VIDEO UPLOADER:
   * Uploads an MP4 video file directly to YouTube via official Resumable Upload API
   */
  async uploadVideo({ videoFilePath, title, description, tags = [], privacyStatus = "public", categoryId = "28" }) {
    if (!videoFilePath || !fs.existsSync(videoFilePath)) {
      return { success: false, error: `Video file not found at: ${videoFilePath}` };
    }

    const status = this.getStatus();
    if (!status.connected) {
      return {
        success: false,
        requiresAuth: true,
        authRequired: true,
        message: "YouTube channel not yet connected via OAuth. Authorize once to enable 100% autonomous background video upload.",
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

    const fileStats = fs.statSync(videoFilePath);
    const fileSize = fileStats.size;

    // Step 1: Initiate Resumable Upload Session
    const metadata = {
      snippet: {
        title: title.slice(0, 100),
        description: description,
        tags: Array.isArray(tags) ? tags.slice(0, 30) : [],
        categoryId: categoryId
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false
      }
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
}

const instance = new YouTubeDirectPushService();
module.exports = instance;
