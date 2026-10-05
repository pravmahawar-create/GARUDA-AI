const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml'),
  path.join(__dirname, '..', 'frontend', 'dist', 'sitemap.xml'),
  path.join(__dirname, '..', 'public', 'sitemap.xml'),
];

const newUrls = [
  { loc: "https://www.garudaos.in/starter", priority: "0.98", changefreq: "daily" },
  { loc: "https://www.garudaos.in/boilerplate", priority: "0.98", changefreq: "daily" },
  { loc: "https://www.garudaos.in/whatsapp-bot", priority: "0.98", changefreq: "daily" },
  { loc: "https://www.garudaos.in/pricing", priority: "0.95", changefreq: "weekly" },
  { loc: "https://www.garudaos.in/store", priority: "0.95", changefreq: "daily" },
  { loc: "https://www.garudaos.in/ai-automation", priority: "0.95", changefreq: "weekly" }
];

targets.forEach(targetPath => {
  if (!fs.existsSync(targetPath)) return;
  let xml = fs.readFileSync(targetPath, 'utf8');

  let added = 0;
  for (const item of newUrls) {
    if (!xml.includes(`<loc>${item.loc}</loc>`)) {
      const entry = `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>2026-09-30</lastmod>\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>\n`;
      xml = xml.replace('</urlset>', entry + '</urlset>');
      added++;
    }
  }

  fs.writeFileSync(targetPath, xml, 'utf8');
  console.log(`✔ Updated ${targetPath} (+${added} URLs)`);
});
