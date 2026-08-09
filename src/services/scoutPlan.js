const PLAN_14_DAY = [
  { day: 1, focus: "Setup the Scout pipeline", action: "Create your profile pages on Upwork and Contra (or chosen platforms). Record targets: 1 profiles.", gate: "Profile live, honest, no fake reviews" },
  { day: 2, focus: "Define the offer", action: "Pick your 3 strongest AI service categories and draft a 1-line offer each.", gate: "Offer texts truthful to your skills" },
  { day: 3, focus: "Import candidates", action: "Paste 10 listings from your chosen platforms into Scout via intake/CSV.", gate: "10 opportunities recorded as found" },
  { day: 4, focus: "Score the pipeline", action: "Run scoring for the 10 opportunities. Shortlist the top 4.", gate: "4 shortlisted with scores and reasons" },
  { day: 5, focus: "Draft proposals", action: "Generate draft proposals for the top 4 from templates and fix to each client.", gate: "4 proposals readable and specific" },
  { day: 6, focus: "Founder approve", action: "Approve the 4 drafts in Scout.", gate: "4 approved with your sign-off" },
  { day: 7, focus: "First submissions", action: "Submit to the 2 best-matching live jobs. Record submit with URL.", gate: "At least 2 submissions recorded" },
  { day: 8, focus: "Continue submissions", action: "Submit the remaining 2 approved proposals; start 5 more listings from today's scan.", gate: "Total submitted >= 4" },
  { day: 9, focus: "Affiliate channel", action: "Publish one honest comparison/tool page you already planned and add approved affiliate links with disclosure.", gate: "Disclosure present and links functional" },
  { day: 10, focus: "Reply to interviews", action: "Respond to every message within 24h. Record interviews in Scout.", gate: "All messages answered" },
  { day: 11, focus: "Follow up + improve", action: "Follow up politely once on submitted jobs. Update one proposal per feedback.", gate: "3 follow-ups sent" },
  { day: 12, focus: "Convert to paid", action: "For any interview, confirm scope, price, and deposit before work. Record won deals.", gate: "Milestone deposit structure agreed before delivery" },
  { day: 13, focus: "Deliver and collect", action: "Deliver per agreement, record acceptance and receive paid into account.", gate: "First paid recorded in Scout revenue" },
  { day: 14, focus: "Review the loop", action: "Review measures: found, shortlisted, submitted, interviews, won, revenue.", gate: "Document what worked and double down" }
];

function getPlan() {
  return {
    goal: "First $100 real online revenue in 14 days",
    currency: "USD",
    guardrails: [
      "Everything stays legal and platform-compliant: no scraping, no ToS-breaking tools, no fake reviews or fake testimonials.",
      "Truth first (GARUDA Constitution Amendment 7): never claim skills, experience, revenue, or timelines that are not real.",
      "Deposits before serious work; milestone based; never pay to apply for a job."
    ],
    days: PLAN_14_DAY
  };
}

module.exports = { PLAN_14_DAY, getPlan };