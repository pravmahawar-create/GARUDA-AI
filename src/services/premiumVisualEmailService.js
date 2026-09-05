/**
 * 🦅 GARUDA Premium Visual Sales Email Engine
 *
 * Generates high-impact, visual-first executive sales emails:
 * - Table-based responsive HTML layout (fluid 100% with 600px max-width)
 * - Deep Graphite (#080A0E) & Dark Obsidian (#10141B) background
 * - Metallic Gold (#D9B347) typography and structural rules
 * - Embedded high-resolution generated visual assets (Niravi Concept, Mobile UI, System Architecture)
 * - Visual-first narrative: SEE -> FEEL -> UNDERSTAND -> BECOME CURIOUS -> CTA
 * - Strictly grounded in verified prospect evidence (Niravi Jaipur)
 * - Clean fallbacks for universal email client compatibility (Desktop & Mobile)
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

class PremiumVisualEmailService {
  constructor() {
    ensureDirs();
  }

  /**
   * Builds the comprehensive, visual-first Boom Email for a verified prospect.
   * @param {Object} spec
   * @returns {Object} { subject, html, htmlPath, imageAssets, pdfAttachment, artifactId, sha256 }
   */
  generateVisualSalesEmail(spec = {}) {
    ensureDirs();

    const prospectName = spec.prospectName || "Niravi Jaipur";
    const city = spec.city || "Jaipur, Rajasthan";
    const domain = spec.domain || "Boutique Garden Hotel";
    const pdfFilename = spec.pdfFilename || `GARUDA_Niravi_Jaipur_Executive_Proposal.pdf`;

    // Resolve Image Assets
    const logoBase64 = getBase64Image(path.join(EMAIL_ASSETS_DIR, "garuda_logo.jpg"));
    const heroBase64 = getBase64Image(path.join(EMAIL_ASSETS_DIR, "niravi_concept_hero.jpg"));
    const uiBase64 = getBase64Image(path.join(EMAIL_ASSETS_DIR, "niravi_reservation_ui.jpg"));
    const execBase64 = getBase64Image(path.join(EMAIL_ASSETS_DIR, "garuda_system_execution.jpg"));

    const subject = `A digital reservation concept for ${prospectName}`;
    const outputFilename = `GARUDA_${prospectName.replace(/[^a-zA-Z0-9]/g, "_")}_Visual_Boom_Email.html`;
    const outputPath = path.join(PROPOSALS_DIR, outputFilename);

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
      background-color: #080A0E;
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
      .mobile-step-title {
        font-size: 11px !important;
      }
      .mobile-step-detail {
        font-size: 10px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#080A0E; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#C7CCD6;">

  <!-- Background Wrapper -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080A0E; padding: 24px 0px;">
    <tr>
      <td align="center" style="padding: 0 8px;">

        <!-- Master Container (Fluid with 600px Max) -->
        <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:#10141B; border:1px solid #1E232B; border-radius:10px; overflow:hidden;">

          <!-- ============================================================= -->
          <!-- SECTION 01: GARUDA HERO HEADER                                -->
          <!-- ============================================================= -->
          <tr>
            <td style="background-color:#0D1016; padding: 24px 32px 18px 32px; border-bottom:1px solid #202630;" class="mobile-padding">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="46" valign="middle">
                    ${logoBase64 ? `<img src="${logoBase64}" width="38" height="38" alt="GARUDA Logo" style="width:38px; height:38px; border-radius:6px;" />` : ''}
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <div style="color:#D9B347; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">GARUDA AI SYSTEMS</div>
                    <div style="color:#7A8494; font-size:9.5px; margin-top:2px; letter-spacing:0.5px; text-transform:uppercase;">SOVEREIGN AI &bull; EXECUTIVE BUSINESS SYSTEMS</div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="color:#D9B347; font-family:monospace; font-size:11px; letter-spacing:0.5px;">garudaos.in</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold Accent Line -->
          <tr>
            <td style="height:2px; background-color:#D9B347; line-height:2px; font-size:2px;">&nbsp;</td>
          </tr>

          <!-- Hero Headline & Visual -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;" class="mobile-padding">
              <div style="display:inline-block; border:1px solid #D9B347; padding:4px 10px; border-radius:3px; color:#D9B347; font-size:9.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px;">
                EXECUTIVE STRATEGIC BRIEF
              </div>

              <div class="mobile-headline" style="color:#F7F7FA; font-size:26px; line-height:32px; font-weight:700; letter-spacing:-0.5px; margin-bottom:10px;">
                A DIGITAL INTELLIGENCE<br />CONCEPT FOR<br />
                <span style="color:#D9B347;">${prospectName.toUpperCase()}</span>
              </div>

              <div class="mobile-subheadline" style="color:#C7CCD6; font-size:12px; font-weight:500; letter-spacing:0.6px; text-transform:uppercase; margin-bottom:22px;">
                DIRECT RESERVATIONS &bull; INTELLIGENT GUEST EXPERIENCE
              </div>

              <!-- Hero Hospitality Visual -->
              ${heroBase64 ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px; border-radius:8px; overflow:hidden; border:1px solid #262D38;">
                <tr>
                  <td>
                    <img src="${heroBase64}" width="536" alt="Niravi Jaipur Garden Concept" style="width:100%; max-width:536px; height:auto; display:block;" />
                  </td>
                </tr>
              </table>
              <div style="color:#636D7E; font-size:9.5px; font-family:monospace; text-align:right; margin-bottom:26px;">
                CONCEPT VISUALIZATION &bull; NIRAVI JAIPUR BOUTIQUE GARDEN HOTEL
              </div>
              ` : ''}

              <div style="border-top:1px solid #1D232D; margin-top:8px; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 02: THE OPPORTUNITY                                  -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:#D9B347; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                01 / THE OPPORTUNITY
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:14px;">
                Capturing High-Value Direct Guests
              </div>

              <p style="color:#C7CCD6; font-size:13.5px; line-height:1.6; margin:0 0 12px 0;">
                <strong style="color:#F7F7FA;">Niravi Jaipur</strong> offers a distinctive, owner-operated boutique garden experience in Jaipur.
              </p>
              <p style="color:#C7CCD6; font-size:13.5px; line-height:1.6; margin:0 0 20px 0;">
                While aggregators generate high-level discovery, your most valuable and sustainable guest relationships are built when travelers connect with your property directly. Today, direct travelers inquiring via email or telephone must wait for manual availability checks and payment coordination.
              </p>

              <!-- Workflow Diagram Container -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0D12; border:1px solid #222834; border-radius:6px; padding:14px; margin-bottom:26px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <div style="color:#D9B347; font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;">THE PROPOSED DIRECT WORKFLOW</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <!-- Step 1 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                      <tr>
                        <td width="26" valign="middle" style="color:#D9B347; font-weight:700; font-size:11px;">01</td>
                        <td class="mobile-step-title" style="color:#F7F7FA; font-size:12px; font-weight:600;">GUEST DISCOVERY</td>
                        <td class="mobile-step-detail" align="right" style="color:#7A8494; font-size:11px;">Website / Search</td>
                      </tr>
                    </table>
                    <div style="height:1px; background-color:#161C26; margin-bottom:8px;"></div>
                    <!-- Step 2 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                      <tr>
                        <td width="26" valign="middle" style="color:#D9B347; font-weight:700; font-size:11px;">02</td>
                        <td class="mobile-step-title" style="color:#F7F7FA; font-size:12px; font-weight:600;">ROOM SELECTION</td>
                        <td class="mobile-step-detail" align="right" style="color:#7A8494; font-size:11px;">Suites &amp; rates</td>
                      </tr>
                    </table>
                    <div style="height:1px; background-color:#161C26; margin-bottom:8px;"></div>
                    <!-- Step 3 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                      <tr>
                        <td width="26" valign="middle" style="color:#D9B347; font-weight:700; font-size:11px;">03</td>
                        <td class="mobile-step-title" style="color:#F7F7FA; font-size:12px; font-weight:600;">INSTANT AVAILABILITY</td>
                        <td class="mobile-step-detail" align="right" style="color:#7A8494; font-size:11px;">Date validation</td>
                      </tr>
                    </table>
                    <div style="height:1px; background-color:#161C26; margin-bottom:8px;"></div>
                    <!-- Step 4 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                      <tr>
                        <td width="26" valign="middle" style="color:#D9B347; font-weight:700; font-size:11px;">04</td>
                        <td class="mobile-step-title" style="color:#F7F7FA; font-size:12px; font-weight:600;">ADVANCE DEPOSIT</td>
                        <td class="mobile-step-detail" align="right" style="color:#7A8494; font-size:11px;">Direct UPI / Card</td>
                      </tr>
                    </table>
                    <div style="height:1px; background-color:#161C26; margin-bottom:8px;"></div>
                    <!-- Step 5 -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="26" valign="middle" style="color:#D9B347; font-weight:700; font-size:11px;">05</td>
                        <td class="mobile-step-title" style="color:#F7F7FA; font-size:12px; font-weight:600;">IMMEDIATE CONFIRMATION</td>
                        <td class="mobile-step-detail" align="right" style="color:#7A8494; font-size:11px;">Voucher &amp; staff alert</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #1D232D; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 03: THE GARUDA EXPERIENCE (MOBILE UI VISUAL)         -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:#D9B347; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                02 / THE PROPOSED EXPERIENCE
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:12px;">
                Direct Mobile Reservation for Niravi Jaipur
              </div>

              <p style="color:#C7CCD6; font-size:13.5px; line-height:1.6; margin:0 0 16px 0;">
                A clean, mobile-first booking interface that allows guests to select dates, view garden suite details, and pay advance deposits directly into your bank account in under 60 seconds.
              </p>

              <!-- Mobile UI Concept Render -->
              ${uiBase64 ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px; border-radius:8px; overflow:hidden; border:1px solid #262D38;">
                <tr>
                  <td>
                    <img src="${uiBase64}" width="536" alt="Niravi Direct Reservation Mobile UI" style="width:100%; max-width:536px; height:auto; display:block;" />
                  </td>
                </tr>
              </table>
              <div style="color:#636D7E; font-size:9.5px; font-family:monospace; text-align:right; margin-bottom:26px;">
                PROPOSED EXPERIENCE &bull; DIRECT MOBILE RESERVATION INTERFACE MOCKUP
              </div>
              ` : ''}

              <div style="border-top:1px solid #1D232D; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 04: WHAT GARUDA CAN BUILD                             -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:#D9B347; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                03 / DELIVERABLE CAPABILITIES
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:16px;">
                What GARUDA Can Build For You
              </div>

              <!-- 4 Visual Capability Cards (Stacked) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0D12; border:1px solid #202632; border-left:3px solid #D9B347; border-radius:4px; margin-bottom:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="color:#F7F7FA; font-size:12.5px; font-weight:700; margin-bottom:3px;">01 &bull; DIRECT DIGITAL RESERVATION ENGINE</div>
                    <div style="color:#9CA3AF; font-size:11.5px; line-height:1.5;">Clean, mobile-first booking interface embedded on your website. Guests select dates, view room photos, and review transparent rates.</div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0D12; border:1px solid #202632; border-left:3px solid #D9B347; border-radius:4px; margin-bottom:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="color:#F7F7FA; font-size:12.5px; font-weight:700; margin-bottom:3px;">02 &bull; 24/7 WHATSAPP INQUIRY CONCIERGE</div>
                    <div style="color:#9CA3AF; font-size:11.5px; line-height:1.5;">Automated assistant on WhatsApp that answers guest questions about garden amenities, event space, check-in policies, and directions.</div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0D12; border:1px solid #202632; border-left:3px solid #D9B347; border-radius:4px; margin-bottom:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="color:#F7F7FA; font-size:12.5px; font-weight:700; margin-bottom:3px;">03 &bull; INSTANT ADVANCE DEPOSIT SETTLEMENT</div>
                    <div style="color:#9CA3AF; font-size:11.5px; line-height:1.5;">Direct payment processing supporting UPI (Google Pay, PhonePe, Paytm) and Cards. Advance deposits settle straight into Niravi's bank account.</div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0D12; border:1px solid #202632; border-left:3px solid #D9B347; border-radius:4px; margin-bottom:22px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="color:#F7F7FA; font-size:12.5px; font-weight:700; margin-bottom:3px;">04 &bull; AUTOMATED BOOKING VOUCHERS &amp; STAFF ALERTS</div>
                    <div style="color:#9CA3AF; font-size:11.5px; line-height:1.5;">Branded digital reservation vouchers sent to guests via WhatsApp/Email, with immediate booking alerts routed to Niravi's front desk.</div>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #1D232D; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 05: GARUDA IDENTITY & EXECUTION VISUAL                -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 26px 32px;" class="mobile-padding">
              <div style="color:#D9B347; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">
                04 / ARCHITECTURAL PRINCIPLE
              </div>
              <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:18px; font-weight:600; margin-bottom:8px;">
                Intelligence That Understands.<br />Systems That Execute.
              </div>

              <p style="color:#C7CCD6; font-size:13px; line-height:1.6; margin:0 0 16px 0;">
                GARUDA is not a generic conversational chatbot. It is a governed business operating system that connects customer communication with transactional execution—verifying room dates, processing direct banking settlements, and delivering physical verified receipts.
              </p>

              <!-- Architecture Execution Visual -->
              ${execBase64 ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px; border-radius:8px; overflow:hidden; border:1px solid #262D38;">
                <tr>
                  <td>
                    <img src="${execBase64}" width="536" alt="GARUDA Intelligence to Execution Architecture" style="width:100%; max-width:536px; height:auto; display:block;" />
                  </td>
                </tr>
              </table>
              <div style="color:#636D7E; font-size:9.5px; font-family:monospace; text-align:right; margin-bottom:26px;">
                SYSTEM ARCHITECTURE &bull; NATURAL LANGUAGE INTELLIGENCE TO DIRECT BANK SETTLEMENT
              </div>
              ` : ''}

              <div style="border-top:1px solid #1D232D; margin-bottom:24px;"></div>
            </td>
          </tr>

          <!-- ============================================================= -->
          <!-- SECTION 06: BOOM CALL TO ACTION                               -->
          <!-- ============================================================= -->
          <tr>
            <td style="padding: 0 32px 32px 32px;" class="mobile-padding">
              <!-- Callout Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080A0E; border:1.5px solid #D9B347; border-radius:8px; overflow:hidden; margin-bottom:24px;">
                <tr>
                  <td style="height:3px; background-color:#D9B347;"></td>
                </tr>
                <tr>
                  <td style="padding:22px 20px;">
                    <div style="color:#D9B347; font-size:11.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">
                      EXECUTIVE CALL TO ACTION
                    </div>
                    <div class="mobile-sec-headline" style="color:#F7F7FA; font-size:19px; font-weight:700; margin-bottom:8px;">
                      Ready To See It In Action?
                    </div>
                    <p style="color:#C7CCD6; font-size:13px; line-height:1.6; margin:0 0 18px 0;">
                      We can demonstrate this direct booking and WhatsApp concierge workflow in a focused 15-minute session scheduled at your convenience.
                    </p>

                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius:4px; background-color:#D9B347;">
                          <a href="https://www.garudaos.in/chat?ref=niravi_jaipur" target="_blank" style="font-size:12.5px; font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-weight:700; color:#080A0E; text-decoration:none; display:inline-block; padding:12px 24px; letter-spacing:0.5px; border-radius:4px;">
                            EXPERIENCE THE CONCEPT &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0E1219; border:1px solid #242A36; border-radius:6px; margin-bottom:26px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="34" valign="middle">
                          <div style="width:26px; height:26px; border:1px solid #D9B347; border-radius:4px; text-align:center; line-height:24px; color:#D9B347; font-size:10px; font-weight:bold;">PDF</div>
                        </td>
                        <td valign="middle" style="padding-left:10px;">
                          <div style="color:#F7F7FA; font-size:12.5px; font-weight:600;">${pdfFilename}</div>
                          <div style="color:#7A8494; font-size:10.5px;">Attached 5-page strategic concept brief with complete architectural specification</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ========================================================= -->
              <!-- SECTION 07: FOUNDER SIGNATURE                             -->
              <!-- ========================================================= -->
              <div style="border-top:1px solid #1E242E; padding-top:20px;">
                <div style="color:#F7F7FA; font-size:14px; font-weight:700;">Praveen Mahawar</div>
                <div style="color:#7A8494; font-size:11.5px; margin-top:2px;">Founder &bull; GARUDA AI Systems</div>
                <div style="color:#D9B347; font-size:11.5px; margin-top:6px; font-family:monospace;">
                  garudaos.in &nbsp;|&nbsp; praveen@garudaos.in &nbsp;|&nbsp; +91 91114 55577
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer Seal -->
          <tr>
            <td style="background-color:#080A0E; padding:20px 32px; border-top:1px solid #1A1F27; text-align:center;">
              <div style="color:#D9B347; font-size:9.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">
                GARUDA AI SYSTEMS
              </div>
              <div style="color:#7A8494; font-size:10.5px; line-height:1.5;">
                SOVEREIGN INTELLIGENCE. BUILT FOR BUSINESS.<br />
                This strategic brief was prepared exclusively for ${prospectName}
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
    const artifactId = `email_boom_${Date.now()}_${prospectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    return {
      subject,
      html,
      htmlPath: outputPath.replace(/\\/g, "/"),
      fileSizeBytes: stat.size,
      sha256: checksum,
      artifactId,
      pdfAttachment: pdfFilename,
      imageAssets: [
        "niravi_concept_hero.jpg",
        "niravi_reservation_ui.jpg",
        "garuda_system_execution.jpg",
        "garuda_logo.jpg"
      ]
    };
  }
}

module.exports = new PremiumVisualEmailService();
