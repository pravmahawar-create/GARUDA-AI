const { BaseDiscoveryAdapter, plainText, detectCurrency } = require("./baseAdapter");

class CustomSoftwareRfpDiscoveryAdapter extends BaseDiscoveryAdapter {
  constructor(options = {}) {
    super("custom_software_rfp", options);
    this.customFeeds = options.customFeeds || [];
  }

  async fetchRaw() {
    // Collects public project RFPs from configured custom endpoints or seeds
    const items = [];
    for (const feedUrl of this.customFeeds) {
      try {
        const res = await fetch(feedUrl, { signal: AbortSignal.timeout(this.timeoutMs) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) items.push(...data);
          else if (Array.isArray(data.rfps)) items.push(...data.rfps);
        }
      } catch {}
    }
    return items;
  }

  normalize(rfp) {
    if (!rfp || !rfp.id) return null;
    const salaryText = plainText(rfp.budget || rfp.estimatedValue || "");
    const currency = detectCurrency(salaryText);

    return {
      source: "custom_software_rfp",
      externalId: String(rfp.id),
      title: plainText(rfp.title),
      company: plainText(rfp.client || rfp.organization || "Commercial Client"),
      description: plainText(rfp.description || rfp.scope).slice(0, 10000),
      category: plainText(rfp.category || "custom_ai_and_software"),
      location: plainText(rfp.location || "Global"),
      url: String(rfp.url || `https://garudaos.in/rfp/${rfp.id}`),
      sourceAttribution: "Public Commercial Technology RFP",
      publishedAt: rfp.publishedAt || new Date().toISOString(),
      salaryText,
      currency,
      tags: Array.isArray(rfp.tags) ? rfp.tags.map(plainText).filter(Boolean) : ["custom_development", "rfp"],
      projectType: "rfp",
      isDirectClientWork: true
    };
  }
}

module.exports = CustomSoftwareRfpDiscoveryAdapter;
