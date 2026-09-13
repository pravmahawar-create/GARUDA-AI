/**
 * GARUDA Creative Engine
 *
 * Phase 6: Content khud banata hai.
 *
 * Capabilities:
 * - Email Generation: Cold emails, follow-ups
 * - Proposal Generation: Business proposals
 * - Content Creation: Blog posts, social media
 * - Report Generation: Analytics reports
 * - Pitch Deck: Investor/client pitches
 * - Marketing Copy: Ads, landing pages
 */

const brain = require("./garudaBrain");

// ──────────────────────────────────────────────────────────────────────────────
// 1. EMAIL GENERATOR — Cold emails
// ──────────────────────────────────────────────────────────────────────────────

async function generateEmail({ recipient, company, purpose, tone, proofPoints }) {
  const systemPrompt = `You are GARUDA's email writer. Generate a cold email that gets replies.

RULES:
- Subject line: specific + curiosity-driven (no "Introduction" or "Partnership")
- Opening: Reference something specific about their company
- Body: One clear problem you solve + proof point
- CTA: Low-friction (quick call, not "30-minute demo")
- Length: Under 150 words
- Tone: ${tone || "professional but human"}

NO generic templates. Every email must feel personal.`;

  const prompt = `RECIPIENT: ${recipient}
COMPANY: ${company}
PURPOSE: ${purpose}
${proofPoints ? `PROOF POINTS: ${proofPoints}` : ""}

Write a cold email that gets replies.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.7 });
  return { email: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. FOLLOW-UP GENERATOR — Follow-up emails
// ──────────────────────────────────────────────────────────────────────────────

async function generateFollowup({ originalEmail, daysSince, recipient, context }) {
  const systemPrompt = `You are GARUDA's follow-up writer. Generate a follow-up email that's not annoying.

RULES:
- Don't repeat the original email
- Add new value (insight, case study, article)
- Short and sweet (under 80 words)
- Different angle than first email
- Soft CTA (not pushy)

Days since last email: ${daysSince}`;

  const prompt = `ORIGINAL EMAIL: ${originalEmail}
DAYS SINCE: ${daysSince}
RECIPIENT: ${recipient}
${context ? `CONTEXT: ${context}` : ""}

Write a follow-up that adds value.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.6 });
  return { followup: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. PROPOSAL GENERATOR — Business proposals
// ──────────────────────────────────────────────────────────────────────────────

async function generateProposal({ client, project, requirements, budget, timeline }) {
  const systemPrompt = `You are GARUDA's proposal writer. Generate a compelling business proposal.

Structure:
1. EXECUTIVE SUMMARY (2-3 lines)
2. UNDERSTANDING OF THEIR PROBLEM
3. OUR SOLUTION (specific, not generic)
4. IMPLEMENTATION PLAN (phases with timeline)
5. INVESTMENT (pricing)
6. WHY US (differentiators)
7. NEXT STEPS

Tone: Confident but not arrogant
Length: 1-2 pages
Style: Data-driven, specific to their industry`;

  const prompt = `CLIENT: ${client}
PROJECT: ${project}
REQUIREMENTS: ${requirements}
BUDGET: ${budget || "To be discussed"}
TIMELINE: ${timeline || "Flexible"}

Write a winning proposal.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.5 });
  return { proposal: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. BLOG POST GENERATOR — Content creation
// ──────────────────────────────────────────────────────────────────────────────

async function generateBlogPost({ topic, audience, angle, length }) {
  const systemPrompt = `You are GARUDA's content writer. Generate a blog post.

Audience: ${audience || "tech-savvy business owners"}
Angle: ${angle || "practical, actionable advice"}
Length: ${length || "800-1200 words"}

Structure:
- Hook title (curiosity-driven)
- Opening story/stat
- Problem statement
- 3-5 actionable sections
- Real examples
- Conclusion with CTA

Write in a conversational, authoritative tone.`;

  const result = await brain.think(topic, { systemPrompt, temperature: 0.7 });
  return { blogPost: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. SOCIAL MEDIA CONTENT
// ──────────────────────────────────────────────────────────────────────────────

async function generateSocialContent({ platform, topic, audience, style }) {
  const systemPrompt = `You are GARUDA's social media content creator.

Platform: ${platform || "LinkedIn"}
Audience: ${audience || "business owners"}
Style: ${style || "professional, thought-leading"}

Platform-specific rules:
- LinkedIn: Hook line + story + insight + CTA (under 1300 chars)
- Twitter: Thread format, each tweet under 280 chars
- Instagram: Caption + hashtags

NO hashtag stuffing. NO generic motivational quotes.`;

  const result = await brain.think(topic, { systemPrompt, temperature: 0.7 });
  return { content: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. REPORT GENERATOR — Analytics reports
// ──────────────────────────────────────────────────────────────────────────────

async function generateReport({ data, type, audience, insights }) {
  const systemPrompt = `You are GARUDA's report generator. Create a clear, actionable report.

Type: ${type || "performance report"}
Audience: ${audience || "founder"}

Structure:
1. HEADLINE (key finding)
2. SUMMARY (3-4 bullet points)
3. DETAILED ANALYSIS (with data)
4. INSIGHTS (what the data means)
5. RECOMMENDATIONS (what to do next)
6. NEXT REVIEW DATE

Be data-driven. Highlight anomalies and trends.`;

  const prompt = `DATA: ${JSON.stringify(data)}
${insights ? `KNOWN INSIGHTS: ${insights}` : ""}

Generate the report.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.3 });
  return { report: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. PITCH DECK CONTENT
// ──────────────────────────────────────────────────────────────────────────────

async function generatePitchDeck({ company, product, audience, stage }) {
  const systemPrompt = `You are GARUDA's pitch deck writer. Create slide content.

Audience: ${audience || "investors"}
Stage: ${stage || "seed"}

Slides:
1. TITLE (Company + one-liner)
2. PROBLEM (pain point with data)
3. SOLUTION (what you do, how it works)
4. MARKET SIZE (TAM/SAM/SOM)
5. TRACTION (metrics, growth)
6. BUSINESS MODEL (how you make money)
7. TEAM (why you'll win)
8. ASK (what you need)
9. VISION (where this goes)

Keep each slide to 3-4 bullet points max.`;

  const prompt = `COMPANY: ${company}
PRODUCT: ${product}

Create pitch deck content.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.5 });
  return { pitchDeck: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. MARKETING COPY
// ──────────────────────────────────────────────────────────────────────────────

async function generateMarketingCopy({ product, audience, benefit, cta, style }) {
  const systemPrompt = `You are GARUDA's marketing copywriter.

Product: ${product}
Audience: ${audience}
Primary Benefit: ${benefit}
CTA: ${cta || "Learn More"}
Style: ${style || "conversion-focused"}

Write:
1. HEADLINE (under 10 words, benefit-driven)
2. SUBHEADLINE (expand on headline)
3. BODY (3 paragraphs: problem, solution, proof)
4. CTA BUTTON TEXT
5. SOCIAL PROOF LINE`;

  const result = await brain.think(product, { systemPrompt, temperature: 0.6 });
  return { copy: result.content, provider: result.provider };
}

module.exports = {
  generateEmail,
  generateFollowup,
  generateProposal,
  generateBlogPost,
  generateSocialContent,
  generateReport,
  generatePitchDeck,
  generateMarketingCopy
};
