const fs = require("fs");
const path = require("path");

const usPath = path.resolve(__dirname, "..", "data", "leads", "us_dental_50_leads.json");
const intlPath = path.resolve(__dirname, "..", "data", "leads", "international_dental_50_leads.json");
const outJson = path.resolve(__dirname, "..", "data", "leads", "global_dental_100_leads.json");
const outCsv = path.resolve(__dirname, "..", "data", "leads", "global_dental_100_leads.csv");

const us = JSON.parse(fs.readFileSync(usPath, "utf8"));
const intl = JSON.parse(fs.readFileSync(intlPath, "utf8"));

const combined = [
  ...us.map(l => ({ ...l, country: "USA" })),
  ...intl
];

fs.writeFileSync(outJson, JSON.stringify(combined, null, 2), "utf8");

const headers = ["ID", "Country", "City", "Practice Name", "Doctor / Owner", "Phone", "Email", "Website", "Hook"];
const rows = combined.map(l => [
  l.id,
  `"${l.country}"`,
  `"${l.city}"`,
  `"${l.practiceName}"`,
  `"${l.doctorName}"`,
  `"${l.phone}"`,
  `"${l.email}"`,
  `"${l.website}"`,
  `"${l.hook}"`
].join(","));

fs.writeFileSync(outCsv, [headers.join(","), ...rows].join("\n"), "utf8");
console.log(`Master Global 100 Leads dataset generated:\n- ${outJson}\n- ${outCsv}`);
