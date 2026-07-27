const https = require("https");

function fetchLiveRemotiveJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "remotive.com",
      path: "/api/remote-jobs?category=software-dev",
      method: "GET",
      headers: {
        "User-Agent": "GARUDA-Revenue-System/1.0"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.jobs || []);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function auditLiveSources() {
  console.log("=== LIVE SOURCE INTEGRITY AUDIT ===");
  try {
    const jobs = await fetchLiveRemotiveJobs();
    console.log(`[LIVE API] Fetched ${jobs.length} genuine live software-dev opportunities from Remotive API.\n`);

    const sample = jobs.slice(0, 10);
    sample.forEach((j, i) => {
      console.log(`Opportunity #${i + 1}:`);
      console.log(`  ID: ${j.id}`);
      console.log(`  Title: ${j.title}`);
      console.log(`  Company: ${j.company_name}`);
      console.log(`  URL: ${j.url}`);
      console.log(`  Category: ${j.category}`);
      console.log(`  Job Type: ${j.job_type}`);
      console.log(`  Salary: ${j.salary || "Not stated"}`);
      console.log(`  Location: ${j.candidate_required_location || "Worldwide"}`);
      console.log(`  Published: ${j.publication_date}`);
      console.log(`  Source Integrity: LIVE PUBLIC API (Remotive.com)\n`);
    });
  } catch (err) {
    console.error("[LIVE API FAIL]", err.message);
  }
}

auditLiveSources();
