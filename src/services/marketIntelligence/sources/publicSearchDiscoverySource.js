/**
 * 🦅 GARUDA Market Intelligence — Public Search Discovery Source
 * Queries legitimate publicly accessible search endpoints for business discoveries.
 */

const https = require("https");
const BaseDiscoverySource = require("./baseDiscoverySource");

class PublicSearchDiscoverySource extends BaseDiscoverySource {
  constructor() {
    super("source_public_search", "Public Search & Web Discovery", {
      sourceType: "PUBLIC_SEARCH",
      isConfigured: true,
      rateLimitPerMin: 20
    });
  }

  async checkAvailability() {
    return new Promise((resolve) => {
      const req = https.request("https://html.duckduckgo.com/html/", {
        method: "HEAD",
        timeout: 4000,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      }, (res) => {
        resolve({
          available: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          status: res.statusCode >= 200 && res.statusCode < 400 ? "AVAILABLE" : "UNAVAILABLE"
        });
      });

      req.on("error", (err) => {
        resolve({ available: false, status: "UNAVAILABLE", error: err.message });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ available: false, status: "TIMEOUT" });
      });

      req.end();
    });
  }

  /**
   * Executes public web search query and returns structured raw results with evidence.
   */
  async executeQuery(query, options = {}) {
    const isTest = options.isTest === true || process.env.NODE_ENV === "test";
    
    // In unit testing without live network calls, return explicit mock or empty
    if (isTest && Array.isArray(options.mockResults)) {
      return {
        status: options.mockResults.length > 0 ? "SUCCESS" : "NO_VERIFIED_RESULTS",
        sourceId: this.sourceId,
        query,
        candidates: options.mockResults
      };
    }

    try {
      const results = await this.performPublicQuery(query, options.limit || 5);
      return {
        status: results.length > 0 ? "SUCCESS" : "NO_VERIFIED_RESULTS",
        sourceId: this.sourceId,
        query,
        candidates: results
      };
    } catch (err) {
      return {
        status: "SOURCE_UNAVAILABLE",
        sourceId: this.sourceId,
        query,
        error: err.message,
        candidates: []
      };
    }
  }

  performPublicQuery(query, limit = 5) {
    return new Promise((resolve, reject) => {
      const postData = `q=${encodeURIComponent(query)}&b=`;
      const req = https.request("https://html.duckduckgo.com/html/", {
        method: "POST",
        timeout: 6000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }, (res) => {
        let html = "";
        res.on("data", (chunk) => { html += chunk; });
        res.on("end", () => {
          try {
            const candidates = this.parseHtmlResults(html, limit);
            resolve(candidates);
          } catch (e) {
            resolve([]);
          }
        });
      });

      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Public search query timed out"));
      });

      req.write(postData);
      req.end();
    });
  }

  parseHtmlResults(html, limit = 5) {
    const candidates = [];
    const linkRegex = /<a[^>]*class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    while ((match = linkRegex.exec(html)) !== null && candidates.length < limit) {
      let rawUrl = match[1].trim();
      // Decode DuckDuckGo redirect if present
      if (rawUrl.includes("uddg=")) {
        try {
          const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://duckduckgo.com${rawUrl}`);
          rawUrl = decodeURIComponent(u.searchParams.get("uddg") || rawUrl);
        } catch {}
      }

      if (rawUrl.startsWith("http") && !rawUrl.includes("duckduckgo.com")) {
        try {
          const domain = new URL(rawUrl).hostname.replace(/^www\./, "");
          const nameCandidate = domain.split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          candidates.push({
            companyName: `${nameCandidate} (Discovered)`,
            sourceUrl: rawUrl,
            sourceType: "PUBLIC_SEARCH",
            snippet: "Public search result discovery",
            discoveredAt: new Date().toISOString()
          });
        } catch {}
      }
    }

    return candidates;
  }
}

module.exports = PublicSearchDiscoverySource;
