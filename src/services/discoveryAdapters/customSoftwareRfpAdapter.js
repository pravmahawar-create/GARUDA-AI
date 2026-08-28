const { BaseDiscoveryAdapter, plainText, detectCurrency } = require("./baseAdapter");

class CustomSoftwareRfpDiscoveryAdapter extends BaseDiscoveryAdapter {
  constructor(options = {}) {
    super("custom_software_rfp", options);
    this.customFeeds = options.customFeeds || [];
    this.inMemoryRfps = options.inMemoryRfps || [];
  }

  registerRfp(rfp) {
    if (rfp && (rfp.id || rfp.externalId)) {
      this.inMemoryRfps.push(rfp);
    }
  }

  async fetchRaw() {
    // Collects public project RFPs from configured custom endpoints or seeds
    const items = [...this.inMemoryRfps];
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
    if (!rfp || (!rfp.id && !rfp.externalId)) return null;
    const salaryText = plainText(rfp.budget || rfp.estimatedValue || rfp.salaryText || "");
    const currency = detectCurrency(salaryText);

    return {
      source: "custom_software_rfp",
      externalId: String(rfp.id || rfp.externalId),
      title: plainText(rfp.title),
      company: plainText(rfp.client || rfp.organization || rfp.company || "Commercial Client"),
      description: plainText(rfp.description || rfp.scope || "").slice(0, 10000),
      category: plainText(rfp.category || "custom_ai_and_software"),
      location: plainText(rfp.location || "Global"),
      url: String(rfp.url || `https://garudaos.in/rfp/${rfp.id || rfp.externalId}`),
      contactEmail: rfp.contactEmail || null,
      contactType: rfp.contactType || (rfp.contactEmail ? "DIRECT_BUSINESS_PROJECT_CONTACT" : "PROCUREMENT_RFP_CONTACT"),
      sourceAttribution: "Public Commercial Technology RFP",
      publishedAt: rfp.publishedAt || new Date().toISOString(),
      salaryText,
      currency,
      tags: Array.isArray(rfp.tags) ? rfp.tags.map(plainText).filter(Boolean) : ["custom_development", "rfp"],
      projectType: "rfp",
      isDirectClientWork: true,
      isDirectClientRfp: true
    };
  }
}

module.exports = CustomSoftwareRfpDiscoveryAdapter;
