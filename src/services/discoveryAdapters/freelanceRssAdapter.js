const { BaseDiscoveryAdapter, plainText, detectCurrency } = require("./baseAdapter");

const DEFAULT_RSS_FEEDS = [
  {
    name: "weworkremotely",
    url: "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    defaultCompany: "WWR Client"
  },
  {
    name: "remoteok",
    url: "https://remoteok.com/remote-jobs.rss",
    defaultCompany: "RemoteOK Client"
  }
];

function parseRssXml(xmlText = "") {
  const items = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const guidMatch = itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);

    const title = titleMatch ? titleMatch[1].trim() : "";
    const link = linkMatch ? linkMatch[1].trim() : "";
    const description = descMatch ? descMatch[1].trim() : "";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
    const guid = guidMatch ? guidMatch[1].trim() : link || title;

    if (title && (link || guid)) {
      items.push({
        title,
        link,
        description,
        pubDate,
        guid
      });
    }
  }

  return items;
}

class FreelanceRssDiscoveryAdapter extends BaseDiscoveryAdapter {
  constructor(options = {}) {
    super("freelance_rss", options);
    this.feeds = options.feeds || DEFAULT_RSS_FEEDS;
  }

  async fetchRaw() {
    const allRawItems = [];

    for (const feed of this.feeds) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(feed.url, {
          headers: {
            accept: "application/rss+xml, application/xml, text/xml",
            "user-agent": "GARUDA-Global-Acquisition-Engine/2.0"
          },
          signal: controller.signal
        });
        if (res.ok) {
          const xml = await res.text();
          const items = parseRssXml(xml);
          items.forEach((it) => {
            allRawItems.push({ ...it, feedSource: feed.name, defaultCompany: feed.defaultCompany });
          });
        }
      } catch (err) {
        // Continue to other feeds if one feed fails
      } finally {
        clearTimeout(timeout);
      }
    }

    return allRawItems;
  }

  normalize(item) {
    if (!item || !item.title) return null;

    // Extract company from title format "Company: Title" or "Title at Company" if present
    let title = plainText(item.title);
    let company = item.defaultCompany || "Global Client";

    if (title.includes(" is hiring ")) {
      const parts = title.split(" is hiring ");
      company = parts[0].trim();
      title = parts[1].trim();
    } else if (title.includes(" at ")) {
      const parts = title.split(" at ");
      title = parts[0].trim();
      company = parts[1].trim();
    } else if (title.includes(": ")) {
      const parts = title.split(": ");
      company = parts[0].trim();
      title = parts.slice(1).join(": ").trim();
    }

    const description = plainText(item.description).slice(0, 10000);
    const salaryMatch = (title + " " + description).match(/(\$\d[\d,]*|\€\d[\d,]*|\£\d[\d,]*|\d+k\s*-\s*\d+k|\d+\s*k)/i);
    const salaryText = salaryMatch ? salaryMatch[0] : "";
    const currency = detectCurrency(salaryText || description);

    return {
      source: "freelance_rss",
      externalId: String(item.guid || item.link || Buffer.from(item.title).toString("base64").slice(0, 32)),
      title,
      company,
      description,
      category: "custom_software_contract",
      location: "Worldwide",
      url: String(item.link || item.guid || ""),
      sourceAttribution: `Authorized RSS (${item.feedSource || "freelance_feed"})`,
      publishedAt: item.pubDate || new Date().toISOString(),
      salaryText,
      currency,
      tags: ["software_engineering", "full_stack", "remote_contract"],
      projectType: "freelance_project",
      isDirectClientWork: true
    };
  }
}

module.exports = FreelanceRssDiscoveryAdapter;
