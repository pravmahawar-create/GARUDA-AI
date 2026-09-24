const fs = require("fs");
const path = require("path");

const jsonPath = path.resolve(__dirname, "..", "data", "leads", "us_dental_50_leads.json");
const csvPath = path.resolve(__dirname, "..", "data", "leads", "us_dental_50_leads.csv");

const leads = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const headers = ["ID", "Practice Name", "Doctor / Owner", "City", "State", "Phone", "Email", "Website", "Hook"];
const rows = leads.map(l => [
  l.id,
  `"${l.practiceName}"`,
  `"${l.doctorName}"`,
  `"${l.city}"`,
  `"${l.state}"`,
  `"${l.phone}"`,
  `"${l.email}"`,
  `"${l.website}"`,
  `"${l.hook}"`
].join(","));

fs.writeFileSync(csvPath, [headers.join(","), ...rows].join("\n"), "utf8");
console.log(`Successfully converted ${leads.length} leads to CSV: ${csvPath}`);
