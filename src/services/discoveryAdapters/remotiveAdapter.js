const { BaseDiscoveryAdapter, plainText, detectCurrency } = require("./baseAdapter");

const REMOTIVE_API = "https://remotive.com/api/remote-jobs?limit=50";

class RemotiveDiscoveryAdapter extends BaseDiscoveryAdapter {
  constructor(options = {}) {
    super("remotive", options);
    this.endpoint = options.endpoint || REMOTIVE_API;
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
      if (!res.ok) throw new Error(`Remotive returned HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data.jobs) ? data.jobs : [];
    } finally {
      clearTimeout(timeout);
    }
  }

  normalize(job) {
    if (!job || !job.id) return null;
    const salaryText = plainText(job.salary);
    const currency = detectCurrency(salaryText);

    return {
      source: "remotive",
      externalId: String(job.id),
      title: plainText(job.title),
      company: plainText(job.company_name || "Remote Employer"),
      description: plainText(job.description).slice(0, 10000),
      category: plainText(job.job_type || job.category || "software_development"),
      location: plainText(job.candidate_required_location || "Worldwide"),
      url: String(job.url || ""),
      sourceAttribution: "Remotive Public API",
      publishedAt: job.publication_date || new Date().toISOString(),
      salaryText,
      currency,
      tags: Array.isArray(job.tags) ? job.tags.map(plainText).filter(Boolean).slice(0, 15) : [],
      projectType: "freelance_contract",
      isDirectClientWork: false
    };
  }
}

module.exports = RemotiveDiscoveryAdapter;
