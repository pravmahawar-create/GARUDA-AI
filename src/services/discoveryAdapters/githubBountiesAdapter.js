const { BaseDiscoveryAdapter, plainText, detectCurrency } = require("./baseAdapter");

const ALGORA_BOUNTIES_API = "https://algora.io/api/bounties?limit=30";

class GitHubBountiesDiscoveryAdapter extends BaseDiscoveryAdapter {
  constructor(options = {}) {
    super("github_bounties", options);
    this.endpoint = options.endpoint || ALGORA_BOUNTIES_API;
  }

  async fetchRaw() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.endpoint, {
        headers: {
          accept: "application/json",
          "user-agent": "GARUDA-Global-Acquisition-Engine/2.0"
        },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Bounties API returned HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data.items || data.bounties || data) ? (data.items || data.bounties || data) : [];
    } catch (err) {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  normalize(bounty) {
    if (!bounty) return null;
    const rawId = bounty.id || bounty.issue_id || (bounty.issue && bounty.issue.id);
    if (!rawId) return null;

    const title = plainText(bounty.title || (bounty.issue && bounty.issue.title) || "Open Source Software Bounty");
    const org = plainText(bounty.org_name || (bounty.issue && bounty.issue.repo_name) || "Open Source Maintainer");
    const description = plainText(bounty.description || (bounty.issue && bounty.issue.body) || title).slice(0, 8000);
    const amountVal = bounty.reward_amount || bounty.amount || bounty.value || 0;
    const currency = bounty.currency || "USD";
    const salaryText = amountVal ? `${currency} ${amountVal}` : "";

    return {
      source: "github_bounties",
      externalId: String(rawId),
      title,
      company: org,
      description,
      category: "software_engineering_bounty",
      location: "Worldwide",
      url: String(bounty.url || (bounty.issue && bounty.issue.url) || `https://github.com/bounties/${rawId}`),
      sourceAttribution: "Open Developer Bounties Protocol",
      publishedAt: bounty.created_at || new Date().toISOString(),
      salaryText,
      currency,
      tags: ["developer_bounty", "open_source", "verified_deliverable"],
      projectType: "bounty",
      isDirectClientWork: true
    };
  }
}

module.exports = GitHubBountiesDiscoveryAdapter;
