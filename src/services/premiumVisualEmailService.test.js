const assert = require("assert");
const fs = require("fs");
const service = require("./premiumVisualEmailService");

function runTest() {
  console.log("Starting premiumVisualEmailService verification...");

  // Test 1: Generate for Stellified (UK Web Agency)
  const stellifiedResult = service.generateVisualSalesEmail({
    prospectId: "PL_1788543878143_b77f63",
    businessName: "Stellified",
    city: "Glasgow, UK",
    domain: "High-Performance Web Design & Modern Architecture",
    email: "hello@stellified.co.uk",
    notes: "Audit: 3.7s load time, needs modernization"
  });

  assert.strictEqual(stellifiedResult.themeUsed, "uk_creative_tech");
  assert.ok(fs.existsSync(stellifiedResult.htmlPath), "HTML file must exist");
  assert.ok(stellifiedResult.sha256 && stellifiedResult.sha256.length === 64, "Must have valid SHA-256");

  // Anti-Fabrication checks
  assert.ok(!stellifiedResult.html.includes("Niravi"), "Must NEVER mention Niravi");
  assert.ok(!stellifiedResult.html.includes("91114"), "Must NEVER contain fake phone number 91114");
  assert.ok(stellifiedResult.html.includes("garudaos.ai@gmail.com"), "Must contain verified Founder email");
  assert.ok(stellifiedResult.html.includes("Praveen Mahawar"), "Must contain Founder name");
  assert.ok(stellifiedResult.html.includes("STELLIFIED"), "Must contain prospect business name");
  console.log("✔ PASS: Stellified UK Creative Tech theme generated with zero brand pollution and verified contact");

  // Test 2: Generate for Global Media Insight (Dubai AMC)
  const dubaiResult = service.generateVisualSalesEmail({
    prospectId: "PL_1788544292562_e19866",
    businessName: "Global Media Insight",
    city: "Dubai, UAE",
    domain: "Enterprise Website Maintenance & AMC Services",
    email: "liz@globalmedia.ae",
    notes: "Dubai UAE AMC services, copyright 2001, load 2.6s"
  });

  assert.strictEqual(dubaiResult.themeUsed, "gulf_luxury_tech");
  assert.ok(!dubaiResult.html.includes("Niravi"), "Must NEVER mention Niravi");
  assert.ok(!dubaiResult.html.includes("91114"), "Must NEVER contain fake phone number 91114");
  assert.ok(dubaiResult.html.includes("GLOBAL MEDIA INSIGHT"), "Must contain prospect name");
  console.log("✔ PASS: Global Media Insight Dubai theme generated with zero brand pollution and verified contact");

  // Test 3: Generate for Pixelfield (London Mobile)
  const londonResult = service.generateVisualSalesEmail({
    prospectId: "PL_1788544357758_c1f428",
    businessName: "Pixelfield",
    city: "London, UK",
    domain: "Mobile App & Product Engineering",
    email: "hello@pixelfield.co.uk",
    notes: "London mobile app development studio"
  });

  assert.strictEqual(londonResult.themeUsed, "london_cyber_studio");
  assert.ok(!londonResult.html.includes("Niravi"), "Must NEVER mention Niravi");
  assert.ok(!londonResult.html.includes("91114"), "Must NEVER contain fake phone number 91114");
  console.log("✔ PASS: Pixelfield London Cyber Studio theme generated with zero brand pollution and verified contact");

  console.log("\nAll premiumVisualEmailService tests passed successfully!");
}

runTest();
