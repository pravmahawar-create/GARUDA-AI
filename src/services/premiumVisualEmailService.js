/**
 * 🦅 GARUDA Premium Dynamic Visual Sales Email Engine
 *
 * Generates high-impact, visual-first executive sales emails tailored to each prospect's
 * specific business "Rang, Roop aur Mood" (industry, visual palette, and brand vibe):
 * - Table-based responsive HTML layout (fluid 100% with 600px max-width)
 * - Dynamic color palettes matching prospect industry & regional mood
 * - High-impact SVG concept banners & system architecture visuals (Zero broken image dependencies)
 * - Visual-first narrative: SEE -> FEEL -> UNDERSTAND -> BECOME CURIOUS -> CTA
 * - 100% Anti-Fabrication Law: Zero fake phone numbers, zero unverified emails, zero Niravi brand pollution
 * - Strict Founder identity: Praveen Mahawar, garudaos.ai@gmail.com, https://www.garudaos.in
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const PROPOSALS_DIR = path.join(DATA_DIR, "proposals");
const EMAIL_ASSETS_DIR = path.join(DATA_DIR, "creative-assets", "email");
const PREVIEWS_DIR = path.join(DATA_DIR, "creative-assets", "previews");

function ensureDirs() {
  try {
    [DATA_DIR, PROPOSALS_DIR, EMAIL_ASSETS_DIR, PREVIEWS_DIR].forEach((d) => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });
  } catch (_e) {}
}

function getBase64Image(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : "image/jpeg";
    const data = fs.readFileSync(filePath).toString("base64");
    return `data:${mime};base64,${data}`;
  }
  return null;
}

/**
 * Industry-Specific Dynamic Palettes & Moods ("Rang, Roop aur Mood")
 */
const THEMES = {
  gulf_luxury_tech: {
    id: "gulf_luxury_tech",
    name: "Gulf Luxury & Enterprise AMC",
    accent: "#D4AF37", // Emirates Gold
    accentSecondary: "#10B981", // Emerald Mint
    accentMuted: "#8E793E",
    bgDark: "#06090F",
    bgCard: "#0C121D",
    bgSurface: "#121A28",
    borderColor: "#1E2B3D",
    textMuted: "#7E8C9F",
    textColor: "#CBD5E1",
    badgeBg: "rgba(212, 175, 55, 0.12)",
    badgeText: "ENTERPRISE AMC & CLOUD RESILIENCE",
    tagline: "AUTONOMOUS UPTIME • ENTERPRISE SLA GUARANTEE"
  },
  uk_creative_tech: {
    id: "uk_creative_tech",
    name: "UK Modern Digital Agency",
    accent: "#00D2FF", // Electric Cyan
    accentSecondary: "#3B82F6", // Royal Azure
    accentMuted: "#0284C7",
    bgDark: "#050B14",
    bgCard: "#0A1322",
    bgSurface: "#0E1C33",
    borderColor: "#162846",
    textMuted: "#6B7C96",
    textColor: "#C8D6E5",
    badgeBg: "rgba(0, 210, 255, 0.12)",
    badgeText: "NEXT-GEN WEB ARCHITECTURE & PERFORMANCE",
    tagline: "SUB-SECOND LOAD • HEADLESS CONVERSION ENGINES"
  },
  london_cyber_studio: {
    id: "london_cyber_studio",
    name: "London Cyber Mobile Studio",
    accent: "#818CF8", // Cyber Indigo
    accentSecondary: "#C084FC", // Neon Violet
    accentMuted: "#6366F1",
    bgDark: "#080912",
    bgCard: "#0E111F",
    bgSurface: "#15192D",
    borderColor: "#202642",
    textMuted: "#7982A1",
    textColor: "#D1D5DB",
    badgeBg: "rgba(129, 140, 248, 0.12)",
    badgeText: "INTELLIGENT MOBILE APP ENGINEERING",
    tagline: "AUTONOMOUS QA • CROSS-PLATFORM VELOCITY"
  },
  enterprise_global_tech: {
    id: "enterprise_global_tech",
    name: "Global Enterprise Transformation",
    accent: "#38BDF8", // Sky Azure
    accentSecondary: "#2563EB", // Cobalt Sapphire
    accentMuted: "#0284C7",
    bgDark: "#070C18",
    bgCard: "#0D1629",
    bgSurface: "#13213B",
    borderColor: "#1B2F52",
    textMuted: "#73849F",
    textColor: "#CBD5E1",
    badgeBg: "rgba(56, 189, 248, 0.12)",
    badgeText: "ENTERPRISE SCALE & AUTOMATED SYSTEMS",
    tagline: "HIGH-CONCURRENCY BACKENDS • GOVERNED AI AGENTS"
  },
  boutique_creative_studio: {
    id: "boutique_creative_studio",
    name: "Boutique Creative Studio",
    accent: "#E07A5F", // Warm Terracotta
    accentSecondary: "#F4F1DE", // Sandstone Cream
    accentMuted: "#C8644A",
    bgDark: "#100E0E",
    bgCard: "#191515",
    bgSurface: "#231D1C",
    borderColor: "#332A29",
    textMuted: "#968684",
    textColor: "#E5DDD8",
    badgeBg: "rgba(224, 122, 95, 0.14)",
    badgeText: "HIGH-CONVERTING DIGITAL CRAFTSMANSHIP",
    tagline: "CORE WEB VITALS • IMMERSIVE CLIENT JOURNEYS"
  },
  modern_it_cloud: {
    id: "modern_it_cloud",
    name: "Modern IT & Cloud Infrastructure",
    accent: "#F59E0B", // Solar Amber
    accentSecondary: "#FCD34D", // Electric Gold
    accentMuted: "#D97706",
    bgDark: "#090D14",
    bgCard: "#111823",
    bgSurface: "#182232",
    borderColor: "#233146",
    textMuted: "#7C8BA1",
    textColor: "#CBD5E1",
    badgeBg: "rgba(245, 158, 11, 0.14)",
    badgeText: "LEGACY MODERNIZATION & SERVERLESS TECH",
    tagline: "ZERO TECH DEBT • 99.99% SYSTEM RESILIENCE"
  },
  performance_marketing_roas: {
    id: "performance_marketing_roas",
    name: "Performance Marketing & ROAS Scaling",
    accent: "#10B981", // High-ROAS Emerald Green
    accentSecondary: "#6366F1", // Electric Cyber Indigo
    accentMuted: "#059669",
    bgDark: "#060A0E",
    bgCard: "#0B131B",
    bgSurface: "#111C28",
    borderColor: "#192B3C",
    textMuted: "#7A8F9F",
    textColor: "#CBD5E1",
    badgeBg: "rgba(16, 185, 129, 0.14)",
    badgeText: "PERFORMANCE MARKETING & PAID ACQUISITION",
    tagline: "DATA-DRIVEN ROAS • CREATIVE FUNNEL VELOCITY"
  },
  default_sovereign_gold: {
    id: "default_sovereign_gold",
    name: "Sovereign Executive Gold",
    accent: "#D9B347", // GARUDA Gold
    accentSecondary: "#60A5FA", // Electric Blue
    accentMuted: "#A3822B",
    bgDark: "#080A0E",
    bgCard: "#10141B",
    bgSurface: "#171D27",
    borderColor: "#1E232B",
    textMuted: "#7A8494",
    textColor: "#C7CCD6",
    badgeBg: "rgba(217, 179, 71, 0.12)",
    badgeText: "EXECUTIVE STRATEGIC BRIEF",
    tagline: "SOVEREIGN AI • EXECUTIVE BUSINESS SYSTEMS"
  }
};

function resolveTheme(spec = {}) {
  if (spec.theme && THEMES[spec.theme]) return THEMES[spec.theme];

  const searchStr = `${spec.businessName || ""} ${spec.domain || ""} ${spec.email || ""} ${spec.city || ""} ${spec.notes || ""}`.toLowerCase();

  if (searchStr.includes("globalmedia") || searchStr.includes("dubai") || searchStr.includes("amc") || searchStr.includes(".ae")) {
    return THEMES.gulf_luxury_tech;
  }
  if (searchStr.includes("pixelfield") || searchStr.includes("mobile app") || searchStr.includes("london")) {
    return THEMES.london_cyber_studio;
  }
  if (searchStr.includes("stellified") || searchStr.includes(".co.uk") || searchStr.includes("outdated website")) {
    return THEMES.uk_creative_tech;
  }
  if (searchStr.includes("appinventiv") || searchStr.includes("enterprise") || searchStr.includes("hire mobile")) {
    return THEMES.enterprise_global_tech;
  }
  if (searchStr.includes("paviterjeet") || searchStr.includes("freelance") || searchStr.includes("creative")) {
    return THEMES.boutique_creative_studio;
  }
  if (searchStr.includes("meola") || searchStr.includes("performance marketing") || searchStr.includes("roas") || searchStr.includes("paid ads") || searchStr.includes("meta ads")) {
    return THEMES.performance_marketing_roas;
  }
  if (searchStr.includes("giks") || searchStr.includes("cloud") || searchStr.includes("india") || searchStr.includes("legacy")) {
    return THEMES.modern_it_cloud;
  }

  return THEMES.default_sovereign_gold;
}

/**
 * Generates an SVG concept hero diagram tailored to the prospect's brand
 */
function generateConceptHeroSvg(prospectName, theme, domain) {
  const cleanName = String(prospectName || "Enterprise System").replace(/[<&"]/g, "");
  const cleanDomain = String(domain || "High-Impact Digital Architecture").replace(/[<&"]/g, "");

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 536 210" width="100%" height="auto">
    <defs>
      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bgCard}" />
        <stop offset="100%" stop-color="${theme.bgDark}" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${theme.accent}" />
        <stop offset="100%" stop-color="${theme.accentSecondary}" />
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${theme.borderColor}" stroke-width="0.5" opacity="0.6"/>
      </pattern>
    </defs>
    <rect width="536" height="210" fill="url(#heroGrad)" rx="8" />
    <rect width="536" height="210" fill="url(#grid)" rx="8" />
    
    <!-- Top Accent Bar -->
    <rect x="0" y="0" width="536" height="3" fill="url(#accentGrad)" />
    
    <!-- Glow Node Center -->
    <circle cx="268" cy="100" r="46" fill="${theme.accent}" opacity="0.08" />
    <circle cx="268" cy="100" r="32" fill="${theme.bgSurface}" stroke="${theme.accent}" stroke-width="1.5" />
    
    <!-- Left Architecture Node -->
    <circle cx="95" cy="100" r="22" fill="${theme.bgSurface}" stroke="${theme.accentSecondary}" stroke-width="1.2" />
    <text x="95" y="96" fill="${theme.textColor}" font-family="-apple-system, sans-serif" font-size="9" font-weight="700" text-anchor="middle">CURRENT</text>
    <text x="95" y="108" fill="${theme.textMuted}" font-family="-apple-system, sans-serif" font-size="8" text-anchor="middle">Baseline</text>
    
    <!-- Right Execution Node -->
    <circle cx="441" cy="100" r="22" fill="${theme.bgSurface}" stroke="${theme.accent}" stroke-width="1.2" />
    <text x="441" y="96" fill="${theme.accent}" font-family="-apple-system, sans-serif" font-size="9" font-weight="700" text-anchor="middle">OPTIMIZED</text>
    <text x="441" y="108" fill="${theme.textColor}" font-family="-apple-system, sans-serif" font-size="8" text-anchor="middle">Sovereign</text>

    <!-- Connecting Data Lines -->
    <line x1="120" y1="100" x2="232" y2="100" stroke="${theme.accentSecondary}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />
    <line x1="304" y1="100" x2="416" y2="100" stroke="${theme.accent}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8" />

    <!-- Center Icon Label -->
    <text x="268" y="97" fill="${theme.accent}" font-family="-apple-system, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">GARUDA</text>
    <text x="268" y="110" fill="${theme.textColor}" font-family="-apple-system, sans-serif" font-size="8" text-anchor="middle">ENGINE</text>

    <!-- Top Badge -->
    <rect x="24" y="18" width="160" height="18" rx="3" fill="${theme.bgSurface}" stroke="${theme.borderColor}" stroke-width="1" />
    <text x="32" y="30" fill="${theme.accent}" font-family="-apple-system, monospace" font-size="8.5" font-weight="700" letter-spacing="0.5">ARCHITECTURAL BLUEPRINT</text>

    <!-- Header Text -->
    <text x="24" y="180" fill="${theme.textColor}" font-family="-apple-system, sans-serif" font-size="13" font-weight="700">${cleanName.toUpperCase()} — DIGITAL TRANSFORMATION</text>
    <text x="24" y="195" fill="${theme.textMuted}" font-family="-apple-system, sans-serif" font-size="9.5">${cleanDomain} • Automated Real-Time Pipeline</text>

    <text x="512" y="195" fill="${theme.accent}" font-family="-apple-system, monospace" font-size="9" text-anchor="end">READY TO DEPLOY</text>
  </svg>`;

  const base64 = Buffer.from(svg.trim()).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

class PremiumVisualEmailService {
  constructor() {
    ensureDirs();
  }

  /**
   * Generates a fully dynamic, visual sales email in accordance with the Golden Rule
   */
  generateVisualSalesEmail(spec = {}) {
    ensureDirs();

    const prospectName = spec.prospectName || spec.businessName || "Executive Client";
    const city = spec.city || "Global Market";
    const domain = spec.domain || "Digital Systems & Cloud Architecture";
    const recipientEmail = spec.recipientEmail || spec.email || "";
    const prospectId = spec.prospectId || spec.id || `prospect_${Date.now()}`;
    const auditNotes = spec.auditNotes || spec.notes || "";

    const theme = resolveTheme({ ...spec, prospectName, domain, city });

    // GARUDA sovereign assets
    const logoBase64 = getBase64Image(path.join(EMAIL_ASSETS_DIR, "garuda_logo.jpg"));
    const execBase64 = getBase64Image(path.join(EMAIL_ASSETS_DIR, "garuda_system_execution.jpg"));
    const heroConceptSvg = generateConceptHeroSvg(prospectName, theme, domain);

    const subject = spec.subject || `Digital Architecture & Executive Blueprint for ${prospectName}`;
    const emailClean = (recipientEmail || "").replace(/[@.]/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const outputFilename = spec.outputFilename || `GARUDA_${prospectName.replace(/[^a-zA-Z0-9]/g, "_")}${emailClean ? `_${emailClean}` : ""}_Visual_Proposal.html`;
    const outputPath = path.join(PROPOSALS_DIR, outputFilename);

    // Dynamic capabilities based on industry theme
    const capabilities = spec.capabilities || this._getDefaultCapabilities(theme.id, prospectName);
    const workflowSteps = spec.workflowSteps || this._getDefaultWorkflow(theme.id);

    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: ${theme.bgDark};
    }
    @media only screen and (max-width: 620px) {
      table[class="email-container"], .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mobile-padding {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }
      .mobile-headline {
        font-size: 22px !important;
        line-height: 28px !important;
      }
      .mobile-subheadline {
        font-size: 11px !important;
        line-height: 16px !important;
        letter-spacing: 0.5px !important;
      }
      .mobile-sec-headline {
        font-size: 16px !important;
        line-height: 22px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${theme.bgDark}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:${theme.textColor};">

  <!-- Background Wrapper -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${theme.bgDark}; padding: 24px 0px;">
    <tr>
      <td align="center" style="padding: 0 8px;">

        <!-- Master Container (Fluid with 600px Max) -->
        <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:${theme.bgCard}; border:1px solid ${theme.borderColor}; border-radius:10px; overflow:hidden;">

          <!-- ============================================================= -->
          <!-- SECTION 01: GARUDA HERO HEADER                                -->
          <!-- ============================================================= -->
          <tr>
            <td style="background-color:${theme.bgDark}; padding: 22px 32px 18px 32px; border-bottom:1px solid ${theme.borderColor};" class="mobile-padding">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="42" valign="middle">
                    ${logoBase64 ? `<img src="${logoBase64}" width="36" height="36" alt="GARUDA" style="width:36px; height:36px; border-radius:6px;" />` : `<div style="width:36px; height:36px; background:${theme.accent}; border-radius:6px; text-align:center; line-height:36px; color:#000; font-weight:bold; font-size:16px;">G</div>`}
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <div style="color:${theme.accent}; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">GARUDA AI SYSTEMS</div>
                    <div style="color:${theme.textMuted}; font-size:9.5px; margin-top:2px; letter-spacing:0.5px; text-transform:uppercase;">${theme.tagline}</div>
                  </td>
                  <td align="right" valign="middle">
                    <a href="https://www.garudaos.in" target="_blank" style="color:${theme.accent}; font-family:monospace; font-size:11px; letter-spacing:0.5px; text-decoration:none;">garudaos.in</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Brand Accent Line -->
          <tr>
            <td style="height:2px; background-color:${theme.accent}; line-height:2px; font-size:2px;">&nbsp;</td>
          </tr>

          <!-- Hero Headline & Visual -->
          <tr>
            <td style="padding: 30px 32px 24px 32px;" class="mobile-padding">
              <div style="display:inline-block; border:1px solid ${theme.accent}; background:${theme.badgeBg}; padding:4px 10px; border-radius:3px; color:${theme.accent}; font-size:9.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px;">
                ${theme.badgeText}
              </div>

              <div class="mobile-headline" style="color:#F7F7FA; font-size:25px; line-height:32px; font-weight:700; letter-spacing:-0.5px; margin-bottom:10px;">
                A TAILORED DIGITAL INTELLIGENCE<br />ARCHITECTURE FOR<br />
                <span style="color:${theme.accent};">${prospectName.toUpperCase()}</span>
              </div>

              <div class="mobile-subheadline" style="color:${theme.textColor}; font-size:12px; font-weight:500; letter-spacing:0.6px; text-transform:uppercase; margin-bottom:20px;">
                ${domain.toUpperCase()} &bull; ${city.toUpperCase()}
              </div>

              <!-- Tailored SVG Concept Blueprint -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px; border-radius:8px; overflow:hidden; border:1px solid ${theme.borderColor};">
                <tr>
                  <td>
                    <img src="${heroConceptSvg}" width="536" alt="${prospectName} Digital Blueprint" style="width:100%; max-width:536px; height:auto; display:block;" />
                  </td>
                </tr>
              </table>
              <div style="color:${theme.textMuted}; font-size:9.5px; font-family:monospace; text-align:right; margin-bottom:22px;">
                CONCEPT SPECIFICATION &bull; PREPARED EXCLUSIVELY FOR ${prospectName.toUpperCase()}
              </div>

              <div style="border-top:1px solid ${theme.borderColor}; margin-top:8px; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 02: THE OPPORTUNITY & WORKFLOW                         -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:${theme.accent}; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                01 / THE STRATEGIC OPPORTUNITY
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:14px;">
                Accelerating Execution & Eliminating Technical Friction
              </div>

              <p style="color:${theme.textColor}; font-size:13.5px; line-height:1.6; margin:0 0 12px 0;">
                <strong style="color:#F7F7FA;">${prospectName}</strong> represents a premier entity in the ${domain} space.
              </p>
              <p style="color:${theme.textColor}; font-size:13.5px; line-height:1.6; margin:0 0 20px 0;">
                Modern clients and operational stakeholders demand instant responsiveness, high uptime, and zero-latency digital interactions. Our objective is to augment your core systems with autonomous intelligence—allowing you to execute complex workflows with complete governance and verified delivery.
              </p>

              <!-- Workflow Diagram Container -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${theme.bgDark}; border:1px solid ${theme.borderColor}; border-radius:6px; padding:14px; margin-bottom:26px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <div style="color:${theme.accent}; font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;">THE PROPOSED OPERATIONAL PIPELINE</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    ${workflowSteps.map((step, idx) => `
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                      <tr>
                        <td width="26" valign="middle" style="color:${theme.accent}; font-weight:700; font-size:11px;">0${idx + 1}</td>
                        <td style="color:#F7F7FA; font-size:12px; font-weight:600;">${step.title}</td>
                        <td align="right" style="color:${theme.textMuted}; font-size:11px;">${step.detail}</td>
                      </tr>
                    </table>
                    ${idx < workflowSteps.length - 1 ? `<div style="height:1px; background-color:${theme.borderColor}; margin-bottom:8px;"></div>` : ''}
                    `).join('')}
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid ${theme.borderColor}; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 03: DELIVERABLE CAPABILITIES                           -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:${theme.accent}; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                02 / DELIVERABLE CAPABILITIES
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:16px;">
                What GARUDA Delivers For ${prospectName}
              </div>

              ${capabilities.map((cap, idx) => `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${theme.bgDark}; border:1px solid ${theme.borderColor}; border-left:3px solid ${theme.accent}; border-radius:4px; margin-bottom:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="color:#F7F7FA; font-size:12.5px; font-weight:700; margin-bottom:3px;">0${idx + 1} &bull; ${cap.title.toUpperCase()}</div>
                    <div style="color:${theme.textMuted}; font-size:11.5px; line-height:1.5;">${cap.description}</div>
                  </td>
                </tr>
              </table>
              `).join('')}

              <div style="border-top:1px solid ${theme.borderColor}; margin-top:18px; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 04: ARCHITECTURAL PRINCIPLE                           -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:${theme.accent}; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                03 / ARCHITECTURAL PRINCIPLE
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:8px;">
                Intelligence That Understands. Systems That Execute.
              </div>

              <p style="color:${theme.textColor}; font-size:13px; line-height:1.6; margin:0 0 16px 0;">
                GARUDA is an autonomous AI Operating System engineered to connect natural communication directly with software execution, regression-tested delivery, and transparent milestone governance. Every output is physically verified and backed by cryptographic audit trails.
              </p>

              ${execBase64 ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px; border-radius:8px; overflow:hidden; border:1px solid ${theme.borderColor};">
                <tr>
                  <td>
                    <img src="${execBase64}" width="536" alt="GARUDA System Architecture" style="width:100%; max-width:536px; height:auto; display:block;" />
                  </td>
                </tr>
              </table>
              <div style="color:${theme.textMuted}; font-size:9.5px; font-family:monospace; text-align:right; margin-bottom:24px;">
                SYSTEM ARCHITECTURE &bull; NATURAL LANGUAGE INTELLIGENCE TO DETERMINISTIC EXECUTION
              </div>
              ` : ''}

              <div style="border-top:1px solid ${theme.borderColor}; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 05: EXECUTIVE CALL TO ACTION                           -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 32px 32px;" class="mobile-padding">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${theme.bgDark}; border:1.5px solid ${theme.accent}; border-radius:8px; overflow:hidden; margin-bottom:24px;">
                <tr>
                  <td style="height:3px; background-color:${theme.accent};"></td>
                </tr>
                <tr>
                  <td style="padding:22px 20px;">
                    <div style="color:${theme.accent}; font-size:11.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">
                      EXECUTIVE CALL TO ACTION
                    </div>
                    <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:19px; font-weight:700; margin-bottom:8px;">
                      Explore This Architecture Live
                    </div>
                    <p style="color:${theme.textColor}; font-size:13px; line-height:1.6; margin:0 0 18px 0;">
                      We can walk through a live interactive demonstration of this architecture tailored specifically to ${prospectName}'s workflow requirements in a 15-minute briefing.
                    </p>

                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius:4px; background-color:${theme.accent};">
                          <a href="https://www.garudaos.in/chat?ref=${prospectId}" target="_blank" style="font-size:12.5px; font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-weight:700; color:#080A0E; text-decoration:none; display:inline-block; padding:12px 24px; letter-spacing:0.5px; border-radius:4px;">
                            ENTER SCOPING ROOM &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ========================================================= -->
              <!-- SECTION 06: VERIFIED FOUNDER SIGNATURE                     -->
              <!-- ========================================================= -->
              <div style="border-top:1px solid ${theme.borderColor}; padding-top:20px;">
                <div style="color:#F7F7FA; font-size:14px; font-weight:700;">Praveen Mahawar</div>
                <div style="color:${theme.textMuted}; font-size:11.5px; margin-top:2px;">Founder & Chief Architect &bull; GARUDA AI Systems</div>
                <div style="color:${theme.accent}; font-size:11.5px; margin-top:6px; font-family:monospace;">
                  garudaos.in &nbsp;|&nbsp; garudaos.ai@gmail.com
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer Seal -->
          <tr>
            <td style="background-color:${theme.bgDark}; padding:20px 32px; border-top:1px solid ${theme.borderColor}; text-align:center;">
              <div style="color:${theme.accent}; font-size:9.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">
                GARUDA AI SYSTEMS &bull; SOVEREIGN INTELLIGENCE
              </div>
              <div style="color:${theme.textMuted}; font-size:10.5px; line-height:1.5;">
                Engineered for High-Reliability Enterprise Workflows.<br />
                This strategic architecture brief was prepared exclusively for ${prospectName}.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

    fs.writeFileSync(outputPath, html, "utf8");

    const stat = fs.statSync(outputPath);
    const checksum = crypto.createHash("sha256").update(Buffer.from(html)).digest("hex");
    const artifactId = `email_proposal_${Date.now()}_${prospectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    return {
      subject,
      html,
      htmlPath: outputPath.replace(/\\/g, "/"),
      fileSizeBytes: stat.size,
      sha256: checksum,
      artifactId,
      themeUsed: theme.id,
      recipientEmail
    };
  }

  _getDefaultCapabilities(themeId, prospectName) {
    if (themeId === "gulf_luxury_tech") {
      return [
        { title: "Autonomous AMC & 24/7 Health Monitoring", description: "Proactive automated monitors that detect latency spikes, SSL expirations, and broken links with automatic self-healing." },
        { title: "Instant WhatsApp & Web Inquiry Concierge", description: "Round-the-clock enterprise concierge handling VIP inquiries, quoting, and appointment scheduling without human wait times." },
        { title: "High-Speed Gulf Cloud Infrastructure", description: "Edge-optimized delivery ensuring sub-second page loads across the UAE and GCC region for high-value clients." },
        { title: "Zero-Downtime Migration & Backup Verification", description: "Automated daily immutable backups sealed with SHA-256 verification and seamless continuous deployments." }
      ];
    }
    if (themeId === "uk_creative_tech") {
      return [
        { title: "Next-Gen Headless Architecture Re-Engineering", description: "Modernize legacy codebases into lightning-fast Next.js/React pipelines, slashing page load times to under 600ms." },
        { title: "Automated Conversion & Lead Ingestion Engine", description: "Seamless interactive forms and dynamic client capture funnels that feed qualified prospects directly into CRM pipelines." },
        { title: "Core Web Vitals Remediation (LCP, FID, CLS)", description: "Automated AST optimization and asset minification ensuring pristine 95+ Google Lighthouse scores across mobile and desktop." },
        { title: "Continuous Automated Regression Testing", description: "Every deployment verified with automated end-to-end regression suites to prevent breaking changes in production." }
      ];
    }
    if (themeId === "london_cyber_studio") {
      return [
        { title: "Cross-Platform Mobile Pipeline Optimization", description: "Streamlined React Native and Flutter builds with automated code signing, fast lane releases, and zero build friction." },
        { title: "AI-Augmented API & Microservice Integration", description: "High-throughput, type-safe API gateways connecting mobile clients with robust cloud backends seamlessly." },
        { title: "Automated Crash Monitoring & Instant Bug Triage", description: "Intelligent error clustering and automated reproduction test suites to catch edge-case bugs before users report them." },
        { title: "Deterministic 2-Week Sprint Deliveries", description: "Governed milestone progress with 50% deposit and 50% verified delivery with complete cryptographic test evidence." }
      ];
    }
    if (themeId === "enterprise_global_tech") {
      return [
        { title: "High-Concurrency Scalable Microservices", description: "Distributed microservice architectures engineered for massive transaction volume and zero-loss failover." },
        { title: "Autonomous Multi-Agent Workflow Orchestration", description: "Coordinated autonomous AI agents that handle repetitive back-office, QA, and data synchronization workflows." },
        { title: "Zero-Trust Enterprise Security Architecture", description: "End-to-end cryptographic verification, tamper-proof audit trails, and strict role-based capability entitlement." },
        { title: "Automated SLA & Performance Dashboards", description: "Real-time executive oversight into system health, API response latencies, and operational milestones." }
      ];
    }
    if (themeId === "boutique_creative_studio") {
      return [
        { title: "Bespoke Portfolio & Client Experience Redesign", description: "Fluid, high-craft editorial web experiences that turn visitors into high-ticket client contracts." },
        { title: "Mobile-First Conversion Optimization", description: "Responsive fluid layout optimization ensuring effortless browsing and high engagement on mobile smartphones." },
        { title: "Direct Inquiry & Booking Automation", description: "Interactive client onboarding questionnaire and automated calendar scheduling built directly into the site." },
        { title: "Speed & SEO Optimization", description: "Complete technical SEO overhaul and asset optimization for instant first-contentful paint." }
      ];
    }
    if (themeId === "performance_marketing_roas") {
      return [
        { title: "Algorithmic Meta & Google Ads Scaling", description: "Advantage+ shopping architecture, custom audience segmentation, and algorithmic bid-capping to maximize Blended ROAS." },
        { title: "High-Velocity Creative Testing Engine", description: "Continuous production of high-converting video hooks, static carousels, and dynamic UGC angles to eliminate ad fatigue." },
        { title: "Frictionless Mobile Checkout & CRO", description: "Sub-second landing page optimization, frictionless Shopify/Woo checkout, and dynamic drop-off retargeting." },
        { title: "Transparent Retainer & Attribution Governance", description: "Live real-time ROAS dashboards, transparent multi-touch attribution, and structured milestone progress (50% kickoff deposit, 50% upon verified monthly delivery)." }
      ];
    }
    // modern_it_cloud & default
    return [
      { title: "Legacy Codebase Modernization", description: "Refactor legacy multi-year web stacks into high-performance modern serverless architectures without downtime." },
      { title: "Automated Cloud CI/CD Pipelines", description: "Instant automated test and deployment pipelines with git worktree isolation and cryptographic integrity." },
      { title: "Intelligent Customer Scoping Concierge", description: "24/7 AI chat interfaces that qualify inbound visitor requirements and generate structured project scopes." },
      { title: "Milestone-Governed Contract Execution", description: "Clear milestone governance: 50% kickoff advance upon proposal sign-off; 50% upon verified test-passing delivery." }
    ];
  }

  _getDefaultWorkflow(themeId) {
    if (themeId === "performance_marketing_roas") {
      return [
        { title: "AD ACCOUNT AUDIT", detail: "Pixel & event tracking audit" },
        { title: "FUNNEL RE-STRUCTURING", detail: "Creative testing & audience setup" },
        { title: "CAMPAIGN LAUNCH", detail: "Advantage+ ROAS scaling" },
        { title: "WEEKLY REPORTING", detail: "Verified ROAS & CAC metrics" }
      ];
    }
    if (themeId === "gulf_luxury_tech") {
      return [
        { title: "SYSTEM DISCOVERY", detail: "Audit & SLA mapping" },
        { title: "INFRASTRUCTURE DEPLOY", detail: "Edge cache & cloud setup" },
        { title: "AUTOMATED 24/7 AGENTS", detail: "Self-healing monitors" },
        { title: "EXECUTIVE REPORTING", detail: "Verified uptime audit" }
      ];
    }
    if (themeId === "london_cyber_studio" || themeId === "uk_creative_tech") {
      return [
        { title: "CODEBASE AUDIT", detail: "Bottleneck identification" },
        { title: "HEADLESS RE-ENGINEERING", detail: "Sub-second speed upgrade" },
        { title: "AUTOMATED REGRESSION QA", detail: "100% test pass verification" },
        { title: "PRODUCTION LAUNCH", detail: "Zero-downtime cutover" }
      ];
    }
    return [
      { title: "TECHNICAL SCOPING", detail: "Architecture & requirements" },
      { title: "SPRINT 1 KICKOFF", detail: "50% deposit & worktree lock" },
      { title: "AUTONOMOUS EXECUTION", detail: "Full test suite build" },
      { title: "VERIFIED DELIVERY", detail: "Final sign-off & settlement" }
    ];
  }
}

module.exports = new PremiumVisualEmailService();
