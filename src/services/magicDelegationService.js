/**
 * 🦅 GARUDA MAGIC DELEGATION SERVICE
 * Zero-friction, zero-password client onboarding engine for YouTube & Social Channel optimization.
 * Generates branded magic links sent via Gmail SMTP / Brevo relay and WhatsApp deep-links.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const emailRelayService = require("./emailRelayService");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DELEGATIONS_FILE = path.join(DATA_DIR, "magic-delegations.jsonl");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const SUPPORTED_PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube Channel",
    icon: "🔴",
    roleNeeded: "Editor / Manager",
    portalUrl: "https://studio.youtube.com",
    instructions: "YouTube Studio > Settings > Permissions > Add 'garudaos.ai@gmail.com' as Editor.",
    marketRateMonthly: 25000,
    garudaRateMonthly: 18750,
    deliverables: "4 Long Video SEO + 20 Viral Shorts Scripts + Search Indexing"
  },
  {
    id: "instagram",
    name: "Instagram Professional",
    icon: "📸",
    roleNeeded: "Partner / Content Manager",
    portalUrl: "https://business.facebook.com/settings/people",
    instructions: "Meta Business Suite > Settings > People/Partners > Assign Content Manager.",
    marketRateMonthly: 20000,
    garudaRateMonthly: 14000,
    deliverables: "30 Kinetic Reel Hooks + Captions + Auto-DM Keyword Funnel"
  },
  {
    id: "facebook",
    name: "Facebook Page & Groups",
    icon: "👥",
    roleNeeded: "Page Access / Task Manager",
    portalUrl: "https://www.facebook.com/settings?tab=profile_access",
    instructions: "Page Settings > Professional Dashboard > Page Access > Add 'garudaos.ai@gmail.com'.",
    marketRateMonthly: 15000,
    garudaRateMonthly: 10500,
    deliverables: "Native Video Post Copies + Niche Community Discussion Sprints"
  },
  {
    id: "linkedin",
    name: "LinkedIn Company Page",
    icon: "💼",
    roleNeeded: "Content Admin",
    portalUrl: "https://www.linkedin.com/company/setup/new/",
    instructions: "LinkedIn Page > Admin Tools > Manage Admins > Add 'garudaos.ai@gmail.com' as Content Admin.",
    marketRateMonthly: 25000,
    garudaRateMonthly: 18750,
    deliverables: "8 Thought Leadership Carousels (5-Slide PDFs) + Executive Posts"
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: "🐦",
    roleNeeded: "Contributor (TweetDeck Teams)",
    portalUrl: "https://pro.x.com",
    instructions: "TweetDeck / X Pro > Accounts > Teams > Invite Contributor.",
    marketRateMonthly: 15000,
    garudaRateMonthly: 10500,
    deliverables: "Viral Discussion Threads + Quote Breakdowns + Real-Time Trend Hijacks"
  },
  {
    id: "googleSeo",
    name: "Google Video & Search SEO",
    icon: "🔍",
    roleNeeded: "Schema & Search Console",
    portalUrl: "https://search.google.com/search-console",
    instructions: "Google Search Console > Settings > Users & Permissions > Add 'garudaos.ai@gmail.com'.",
    marketRateMonthly: 30000,
    garudaRateMonthly: 21000,
    deliverables: "VideoObject JSON-LD Structured Schema + Search Moment Clips"
  }
];

function calculateOmniQuote(selectedPlatformIds = ["youtube"]) {
  const ids = Array.isArray(selectedPlatformIds) && selectedPlatformIds.length > 0 ? selectedPlatformIds : ["youtube"];
  const selected = SUPPORTED_PLATFORMS.filter((p) => ids.includes(p.id));
  const count = Math.max(1, selected.length);

  const rawMarketSum = selected.reduce((sum, p) => sum + p.marketRateMonthly, 0);

  // Client savings is 25% for 1 platform, 30% for 2-4 platforms, 32% for 5+ platforms
  // Founder keeps 70% to 75% of market price! Win-Win!
  const clientSavingsPercent = count >= 5 ? 32 : count >= 2 ? 30 : 25;
  const finalGarudaRate = Math.round(rawMarketSum * (1 - clientSavingsPercent / 100));
  const totalSavings = rawMarketSum - finalGarudaRate;
  const annualSavings = totalSavings * 12;

  return {
    platformCount: count,
    selectedPlatforms: selected,
    marketRateMonthly: rawMarketSum,
    garudaRateMonthly: finalGarudaRate,
    clientSavingsPercent,
    totalSavingsMonthly: totalSavings,
    annualSavings,
    savingsPercent: clientSavingsPercent,
    guarantee: "100% Governed AI Delivery with SHA-256 Audit Trail & 24/7 Autopilot"
  };
}

class MagicDelegationService {
  /**
   * Create a new delegation record with a secure token
   */
  createDelegation(payload = {}) {
    ensureDataDir();

    const token = crypto.randomBytes(16).toString("hex");
    const delegationId = `del_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const createdAt = new Date().toISOString();

    const delegation = {
      delegationId,
      token,
      clientName: payload.clientName || "Valued Creator / Partner",
      clientEmail: (payload.clientEmail || "").trim().toLowerCase(),
      clientPhone: (payload.clientPhone || "").trim(),
      platform: payload.platform || "youtube",
      selectedPlatforms: payload.selectedPlatforms || ["youtube", "instagram", "facebook"],
      authorizedPlatforms: payload.authorizedPlatforms || [],
      videoUrl: payload.videoUrl || "",
      videoTitle: payload.videoTitle || "Target Media Asset",
      videoThumbnail: payload.videoThumbnail || "",
      campaignId: payload.campaignId || null,
      proposedPackage: payload.proposedPackage || null,
      status: "INVITE_PENDING", // INVITE_PENDING | INVITE_SENT | OPENED | APPROVED
      createdAt,
      authorizedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      fs.appendFileSync(DELEGATIONS_FILE, JSON.stringify(delegation) + "\n", "utf8");
    } catch (err) {
      console.error("[MagicDelegation] Storage write error:", err.message);
    }

    return delegation;
  }

  /**
   * Retrieve delegation by secret token
   */
  getDelegationByToken(token) {
    ensureDataDir();
    if (!fs.existsSync(DELEGATIONS_FILE)) return null;

    try {
      const lines = fs.readFileSync(DELEGATIONS_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines.reverse()) {
        const item = JSON.parse(line);
        if (item.token === token) {
          return item;
        }
      }
    } catch (err) {
      console.error("[MagicDelegation] Read error:", err.message);
    }
    return null;
  }

  /**
   * Mark delegation as OPENED or APPROVED
   */
  updateStatus(token, newStatus, extra = {}) {
    ensureDataDir();
    if (!fs.existsSync(DELEGATIONS_FILE)) return null;

    let updatedRecord = null;
    try {
      const lines = fs.readFileSync(DELEGATIONS_FILE, "utf8").split("\n").filter(Boolean);
      const updatedLines = lines.map((line) => {
        const item = JSON.parse(line);
        if (item.token === token) {
          item.status = newStatus;
          if (newStatus === "APPROVED") {
            item.authorizedAt = new Date().toISOString();
          }
          if (extra.authorizedPlatforms) {
            item.authorizedPlatforms = extra.authorizedPlatforms;
          }
          if (newStatus === "OPENED" && item.status === "INVITE_SENT") {
            item.openedAt = new Date().toISOString();
          }
          updatedRecord = item;
          return JSON.stringify(item);
        }
        return line;
      });

      fs.writeFileSync(DELEGATIONS_FILE, updatedLines.join("\n") + "\n", "utf8");
    } catch (err) {
      console.error("[MagicDelegation] Update status error:", err.message);
    }

    return updatedRecord;
  }

  /**
   * Dispatch magic invitation email and generate WhatsApp deep link
   */
  async dispatchInvitation(delegation, hostUrl = "https://www.garudaos.in") {
    const magicUrl = `${hostUrl}/delegate?token=${delegation.token}`;
    
    // 1. Generate WhatsApp Share Text & URL
    const waText = encodeURIComponent(
      `Hello ${delegation.clientName}! 🦅 GARUDA AI has prepared an autonomous High-CTR SEO & Viral Growth blueprint for your video: "${delegation.videoTitle}".\n\nClick this 1-click secure link to review and authorize optimization without sharing any password:\n👉 ${magicUrl}\n\n100% Privacy & Zero-Password Delegation.`
    );
    const cleanPhone = (delegation.clientPhone || "").replace(/[^0-9]/g, "");
    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${waText}`
      : `https://api.whatsapp.com/send?text=${waText}`;

    // 2. Dispatch Email if email is present
    let emailResult = { attempted: false, sent: false };
    if (delegation.clientEmail) {
      emailResult.attempted = true;
      const subject = `🦅 1-Click Action: Authorize GARUDA AI to optimize "${delegation.videoTitle}"`;
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #0b0f19; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 24px 30px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border-bottom: 1px solid #334155;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #d4af37; text-transform: uppercase;">GARUDA AI • MAGIC DELEGATION PORTAL</span>
                            <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff;">Channel Growth & Video SEO Authorization</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 30px;">
                      <p style="margin: 0 0 16px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                        Hello <strong style="color: #ffffff;">${delegation.clientName}</strong>,
                      </p>
                      <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                        Your team at GARUDA has engineered a 6-platform High-CTR Algorithmic Growth package for your video:
                      </p>

                      <!-- Video Card -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; margin-bottom: 24px; padding: 16px;">
                        <tr>
                          ${delegation.videoThumbnail ? `
                            <td width="120" style="vertical-align: top; padding-right: 14px;">
                              <img src="${delegation.videoThumbnail}" alt="Thumbnail" width="120" style="border-radius: 6px; display: block;" />
                            </td>
                          ` : ""}
                          <td style="vertical-align: top;">
                            <div style="font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px;">${delegation.videoTitle}</div>
                            <div style="font-size: 12px; color: #64748b; word-break: break-all;">${delegation.videoUrl || "Direct Asset Optimization"}</div>
                            <div style="display: inline-block; margin-top: 8px; padding: 3px 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 4px; font-size: 11px; font-weight: 700; color: #38bdf8;">
                              READY FOR AUTONOMOUS DEPLOYMENT
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Zero Password Guarantee -->
                      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 14px; margin-bottom: 24px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="28" style="vertical-align: top; font-size: 18px;">🔒</td>
                            <td style="font-size: 13px; color: #a7f3d0; line-height: 1.5;">
                              <strong>100% Privacy & Zero Password Sharing:</strong> You never need to share any password. You simply review the proposed Title, Tags, and Chapters, and grant 1-click Editor permission.
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <a href="${magicUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%); color: #000000; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4);">
                              ⚡ Review & Authorize Optimization
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                        Direct link: <a href="${magicUrl}" style="color: #94a3b8;">${magicUrl}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; background: #030712; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; text-align: center;">
                      GARUDA AI Autonomous Operating System • Official Portal: https://www.garudaos.in<br>
                      Verified Founder Communication: garudaos.ai@gmail.com
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        const relayStatus = emailRelayService.getRelayConfig();
        if (relayStatus.ready) {
          const res = await emailRelayService.sendViaRelay(
            relayStatus.config,
            { to: delegation.clientEmail, subject, html: htmlBody, body: `Please open your delegation link: ${magicUrl}` }
          );
          emailResult.sent = true;
          emailResult.provider = res.relayProvider;
          emailResult.providerResponseId = res.providerResponseId;
        } else {
          emailResult.sent = false;
          emailResult.reason = "Relay not configured; WhatsApp link and direct URL generated.";
        }
      } catch (e) {
        emailResult.sent = false;
        emailResult.error = e.message;
      }
    }

    // Update status to INVITE_SENT
    this.updateStatus(delegation.token, "INVITE_SENT");

    return {
      success: true,
      magicUrl,
      whatsappUrl,
      emailResult,
      delegationToken: delegation.token
    };
  }
}

const instance = new MagicDelegationService();
instance.SUPPORTED_PLATFORMS = SUPPORTED_PLATFORMS;
instance.calculateOmniQuote = calculateOmniQuote;
module.exports = instance;
