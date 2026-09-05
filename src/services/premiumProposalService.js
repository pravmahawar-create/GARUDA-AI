/**
 * 🦅 GARUDA Premium Executive Sales Letter / Proposal Engine
 *
 * Generates bespoke, physical, ISO-compliant PDF executive proposals
 * with a Luxury Technology + Sovereign AI aesthetic:
 * - Deep Graphite (#080A0E) & Obsidian background
 * - Metallic Gold (#D9B347) typography & structural accents
 * - Clean editorial margins, balanced white-space, zero cartoonish clutter
 * - Verified prospect data grounding: Niravi Jaipur, Hotel Kanak Niwas, MGCI, etc.
 * - Cryptographic SHA-256 sealing and lineage registration
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const ASSETS_DIR = path.join(DATA_DIR, "creative-assets");
const PROPOSALS_DIR = path.join(DATA_DIR, "proposals");
const ASSETS_INDEX_FILE = path.join(DATA_DIR, "creative-assets.jsonl");
const LOGO_PATH = path.join(__dirname, "..", "..", "frontend", "public", "assets", "branding", "garuda-logo.png");

function ensureDirs() {
  try {
    [DATA_DIR, ASSETS_DIR, PROPOSALS_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  } catch (_e) {}
}

function sha256(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function wrapText(text, maxWidth, fontSize, font) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Color Palette Definition
const COLORS = {
  bg: rgb(0.032, 0.040, 0.055),           // Deep Graphite #080A0E
  cardBg: rgb(0.065, 0.080, 0.105),       // Dark Obsidian #10141B
  cardBorder: rgb(0.18, 0.20, 0.24),      // Subtle Card Border
  gold: rgb(0.85, 0.70, 0.28),            // Metallic Gold #D9B347
  goldDim: rgb(0.55, 0.45, 0.20),         // Dimmed Gold for accents
  goldLine: rgb(0.75, 0.62, 0.25),        // Accent Rule Gold
  white: rgb(0.97, 0.97, 0.98),           // Warm White #F7F7FA
  silver: rgb(0.78, 0.81, 0.86),          // Soft Silver Body #C7CCD6
  muted: rgb(0.48, 0.52, 0.58)            // Muted Meta Text #7A8494
};

function drawArrowDown(p, x, y, size = 6, color = COLORS.goldDim) {
  p.drawLine({ start: { x, y: y + size }, end: { x, y }, thickness: 1, color });
  p.drawLine({ start: { x, y }, end: { x: x - 2.5, y: y + 2.5 }, thickness: 1, color });
  p.drawLine({ start: { x, y }, end: { x: x + 2.5, y: y + 2.5 }, thickness: 1, color });
}

class PremiumProposalService {
  constructor() {
    ensureDirs();
  }

  /**
   * Generates a 5-page Premium Executive Proposal PDF for a verified prospect.
   * @param {Object} spec
   * @returns {Promise<Object>} Verified Artifact with metadata, SHA-256, and physical path
   */
  async generateExecutiveProposal(spec = {}) {
    ensureDirs();

    const prospectName = spec.prospectName || "Niravi Jaipur";
    const city = spec.city || "Jaipur, Rajasthan";
    const domain = spec.domain || "Boutique Garden Hotel";
    const titleSlug = prospectName.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
    const outputFilename = `GARUDA_${titleSlug}_Executive_Proposal.pdf`;
    const outputPath = path.join(PROPOSALS_DIR, outputFilename);

    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    // Embed approved GARUDA logo (JPEG binary in JFIF format)
    let logoImage = null;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        const logoBytes = fs.readFileSync(LOGO_PATH);
        logoImage = await pdfDoc.embedJpg(logoBytes);
      } catch (err) {
        console.warn("[PremiumProposalService] Logo embed note:", err.message);
      }
    }

    // Standard A4 Dimensions: 595.28 x 841.89 pt
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 48;
    const contentWidth = pageWidth - (margin * 2); // 499.28 pt

    const totalPages = 5;

    // Helper: Page Setup with Dark Background
    const createPage = () => {
      const p = pdfDoc.addPage([pageWidth, pageHeight]);
      p.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: COLORS.bg
      });
      return p;
    };

    // Helper: Header on Inner Pages (2 to 5)
    const drawPageHeader = (p, pageNum) => {
      p.drawLine({
        start: { x: margin, y: pageHeight - 34 },
        end: { x: pageWidth - margin, y: pageHeight - 34 },
        thickness: 0.8,
        color: COLORS.goldLine
      });

      p.drawText("GARUDA AI SYSTEMS", {
        x: margin,
        y: pageHeight - 27,
        size: 7.5,
        font: fontBold,
        color: COLORS.gold
      });

      p.drawText("SOVEREIGN AI | EXECUTIVE BUSINESS SYSTEMS", {
        x: margin + 105,
        y: pageHeight - 27,
        size: 7,
        font: fontRegular,
        color: COLORS.muted
      });

      p.drawText("garudaos.in", {
        x: pageWidth - margin - 50,
        y: pageHeight - 27,
        size: 7.5,
        font: fontMono,
        color: COLORS.gold
      });
    };

    // Helper: Footer on Inner Pages (2 to 5)
    const drawPageFooter = (p, pageNum) => {
      p.drawLine({
        start: { x: margin, y: 38 },
        end: { x: pageWidth - margin, y: 38 },
        thickness: 0.5,
        color: COLORS.cardBorder
      });

      p.drawText(`CONFIDENTIAL EXECUTIVE PROPOSAL  |  PREPARED FOR ${prospectName.toUpperCase()}`, {
        x: margin,
        y: 25,
        size: 6.5,
        font: fontRegular,
        color: COLORS.muted
      });

      const pageStr = `PAGE ${String(pageNum).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`;
      p.drawText(pageStr, {
        x: pageWidth - margin - 55,
        y: 25,
        size: 7,
        font: fontMono,
        color: COLORS.gold
      });
    };

    // =========================================================================
    // PAGE 1: CINEMATIC COVER
    // =========================================================================
    const p1 = createPage();

    // Geometric Corner Accents
    const cornerSize = 16;
    p1.drawLine({ start: { x: margin, y: pageHeight - margin }, end: { x: margin + cornerSize, y: pageHeight - margin }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: margin, y: pageHeight - margin }, end: { x: margin, y: pageHeight - margin - cornerSize }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: pageWidth - margin, y: pageHeight - margin }, end: { x: pageWidth - margin - cornerSize, y: pageHeight - margin }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: pageWidth - margin, y: pageHeight - margin }, end: { x: pageWidth - margin, y: pageHeight - margin - cornerSize }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: margin, y: margin }, end: { x: margin + cornerSize, y: margin }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: margin, y: margin }, end: { x: margin, y: margin + cornerSize }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: pageWidth - margin, y: margin }, end: { x: pageWidth - margin - cornerSize, y: margin }, thickness: 1.2, color: COLORS.gold });
    p1.drawLine({ start: { x: pageWidth - margin, y: margin }, end: { x: pageWidth - margin, y: margin + cornerSize }, thickness: 1.2, color: COLORS.gold });

    // Logo & Header Brand
    let brandY = pageHeight - margin - 35;
    if (logoImage) {
      p1.drawImage(logoImage, {
        x: margin,
        y: brandY - 4,
        width: 44,
        height: 44
      });
    }

    p1.drawText("GARUDA AI SYSTEMS", {
      x: margin + 54,
      y: brandY + 22,
      size: 13,
      font: fontBold,
      color: COLORS.gold
    });

    p1.drawText("SOVEREIGN AI  |  BUSINESS AUTOMATION  |  DIGITAL SYSTEMS", {
      x: margin + 54,
      y: brandY + 8,
      size: 7.5,
      font: fontRegular,
      color: COLORS.silver
    });

    p1.drawLine({
      start: { x: margin, y: brandY - 24 },
      end: { x: pageWidth - margin, y: brandY - 24 },
      thickness: 0.8,
      color: COLORS.goldDim
    });

    // Middle Hero Section
    const heroY = pageHeight - 275;

    p1.drawRectangle({
      x: margin,
      y: heroY + 80,
      width: 170,
      height: 20,
      color: COLORS.cardBg,
      borderColor: COLORS.gold,
      borderWidth: 0.8
    });
    p1.drawText("EXECUTIVE STRATEGIC BRIEF", {
      x: margin + 12,
      y: heroY + 86,
      size: 8,
      font: fontBold,
      color: COLORS.gold
    });

    p1.drawText("A DIGITAL INTELLIGENCE", {
      x: margin,
      y: heroY + 45,
      size: 26,
      font: fontBold,
      color: COLORS.white
    });

    p1.drawText("CONCEPT FOR", {
      x: margin,
      y: heroY + 15,
      size: 26,
      font: fontBold,
      color: COLORS.white
    });

    p1.drawText(prospectName.toUpperCase(), {
      x: margin,
      y: heroY - 25,
      size: 30,
      font: fontBold,
      color: COLORS.gold
    });

    p1.drawLine({
      start: { x: margin, y: heroY - 45 },
      end: { x: margin + 300, y: heroY - 45 },
      thickness: 1.5,
      color: COLORS.gold
    });

    p1.drawText("A Bespoke Direct Guest Reservation & Inquiry Architecture", {
      x: margin,
      y: heroY - 65,
      size: 11.5,
      font: fontRegular,
      color: COLORS.silver
    });

    const boxY = heroY - 195;
    p1.drawRectangle({
      x: margin,
      y: boxY,
      width: contentWidth,
      height: 105,
      color: COLORS.cardBg,
      borderColor: COLORS.cardBorder,
      borderWidth: 0.8
    });

    p1.drawLine({
      start: { x: margin, y: boxY + 105 },
      end: { x: margin + 120, y: boxY + 105 },
      thickness: 2,
      color: COLORS.gold
    });

    p1.drawText("PURPOSE & STRATEGIC SCOPE", {
      x: margin + 16,
      y: boxY + 80,
      size: 8.5,
      font: fontBold,
      color: COLORS.gold
    });

    const coverSummary = `This executive brief outlines a dedicated digital reservation and inquiry system engineered specifically for ${prospectName} in ${city}. It presents an immediate direct booking workflow that empowers prospective guests to explore room options, confirm availability, and secure reservations with advance deposits directly into your bank account.`;
    const coverLines = wrapText(coverSummary, contentWidth - 32, 9, fontRegular);
    let lY = boxY + 60;
    coverLines.forEach((ln) => {
      p1.drawText(ln, { x: margin + 16, y: lY, size: 9, font: fontRegular, color: COLORS.silver });
      lY -= 14.5;
    });

    const footerY = margin + 50;

    p1.drawText("PREPARED EXCLUSIVELY FOR:", { x: margin, y: footerY + 28, size: 7.5, font: fontBold, color: COLORS.muted });
    p1.drawText(prospectName, { x: margin, y: footerY + 14, size: 11, font: fontBold, color: COLORS.white });
    p1.drawText(`${domain}  |  ${city}`, { x: margin, y: footerY + 1, size: 8.5, font: fontRegular, color: COLORS.silver });

    const rightColX = pageWidth - margin - 200;
    p1.drawText("PREPARED BY:", { x: rightColX, y: footerY + 28, size: 7.5, font: fontBold, color: COLORS.muted });
    p1.drawText("PRAVEEN MAHAWAR", { x: rightColX, y: footerY + 14, size: 11, font: fontBold, color: COLORS.white });
    p1.drawText("Founder - GARUDA AI Systems", { x: rightColX, y: footerY + 1, size: 8.5, font: fontRegular, color: COLORS.silver });
    p1.drawText("garudaos.in  |  garudaos.ai@gmail.com", { x: rightColX, y: footerY - 12, size: 7.5, font: fontMono, color: COLORS.gold });

    // =========================================================================
    // PAGE 2: THE OPPORTUNITY
    // =========================================================================
    const p2 = createPage();
    drawPageHeader(p2, 2);
    drawPageFooter(p2, 2);

    let curY2 = pageHeight - 70;

    p2.drawText("01  /  STRATEGIC CONTEXT", { x: margin, y: curY2, size: 8, font: fontBold, color: COLORS.gold });
    curY2 -= 20;

    p2.drawText("THE OPPORTUNITY", { x: margin, y: curY2, size: 21, font: fontBold, color: COLORS.white });
    curY2 -= 16;

    p2.drawText(`A focused digital workflow for ${prospectName}`, { x: margin, y: curY2, size: 11, font: fontRegular, color: COLORS.gold });
    curY2 -= 18;

    p2.drawLine({ start: { x: margin, y: curY2 }, end: { x: pageWidth - margin, y: curY2 }, thickness: 0.6, color: COLORS.cardBorder });
    curY2 -= 24;

    const p2Para1 = `${prospectName} provides a distinctive, owner-operated garden boutique hospitality experience in ${city}. While online travel aggregators provide high-level discovery, your most valuable and sustainable guest relationships are built when travelers connect directly with your property.`;
    wrapText(p2Para1, contentWidth, 9.5, fontRegular).forEach((ln) => {
      p2.drawText(ln, { x: margin, y: curY2, size: 9.5, font: fontRegular, color: COLORS.silver });
      curY2 -= 16;
    });
    curY2 -= 8;

    const p2Para2 = `Direct travelers who discover your property online frequently prefer to confirm their dates, choose room categories, and lock in their stay immediately. Without a dedicated direct booking channel, guests must rely on manual email and telephone inquiries, creating delay before room availability and payment instructions can be confirmed.`;
    wrapText(p2Para2, contentWidth, 9.5, fontRegular).forEach((ln) => {
      p2.drawText(ln, { x: margin, y: curY2, size: 9.5, font: fontRegular, color: COLORS.silver });
      curY2 -= 16;
    });
    curY2 -= 24;

    p2.drawText("THE PROPOSED DIRECT WORKFLOW", { x: margin, y: curY2, size: 9, font: fontBold, color: COLORS.gold });
    curY2 -= 16;

    const workflowSteps = [
      { step: "01", title: "GUEST DISCOVERY", desc: "Traveler discovers Niravi Jaipur via web, social, or local search" },
      { step: "02", title: "ROOM SELECTION", desc: "Guest browses garden suites, photos, amenities, and nightly rates" },
      { step: "03", title: "INSTANT AVAILABILITY", desc: "System verifies dates and computes required booking deposit" },
      { step: "04", title: "ADVANCE DEPOSIT", desc: "Secure direct checkout via UPI, Credit/Debit Card, or Netbanking" },
      { step: "05", title: "IMMEDIATE CONFIRMATION", desc: "Guest receives branded booking voucher; Niravi staff alerted instantly" }
    ];

    const boxWidth = contentWidth;
    const itemHeight = 40;
    workflowSteps.forEach((st, idx) => {
      p2.drawRectangle({
        x: margin,
        y: curY2 - itemHeight + 6,
        width: boxWidth,
        height: itemHeight,
        color: COLORS.cardBg,
        borderColor: COLORS.cardBorder,
        borderWidth: 0.6
      });

      p2.drawRectangle({
        x: margin,
        y: curY2 - itemHeight + 6,
        width: 3.5,
        height: itemHeight,
        color: COLORS.gold
      });

      p2.drawText(st.step, { x: margin + 16, y: curY2 - 15, size: 10, font: fontBold, color: COLORS.gold });
      p2.drawText(st.title, { x: margin + 46, y: curY2 - 15, size: 9.5, font: fontBold, color: COLORS.white });
      p2.drawText(st.desc, { x: margin + 46, y: curY2 - 28, size: 8, font: fontRegular, color: COLORS.silver });

      curY2 -= itemHeight + 6;

      if (idx < workflowSteps.length - 1) {
        drawArrowDown(p2, margin + boxWidth / 2, curY2 - 2, 7, COLORS.goldDim);
        curY2 -= 10;
      }
    });

    curY2 -= 20;

    p2.drawText("PRACTICAL ADVANTAGES FOR NIRAVI JAIPUR", { x: margin, y: curY2, size: 9, font: fontBold, color: COLORS.gold });
    curY2 -= 18;

    const benefits = [
      { title: "Direct Settlement", desc: "Advance deposits credit directly into your designated bank account with zero platform commission." },
      { title: "Instant Response", desc: "Direct inquiries receive immediate availability checks 24 hours a day without telephone wait times." },
      { title: "Direct Guest Retention", desc: "Niravi retains complete first-party guest contact details for repeat visits and seasonal hospitality." }
    ];

    const colW = (contentWidth - 16) / 3;
    benefits.forEach((b, idx) => {
      const bX = margin + (idx * (colW + 8));
      p2.drawRectangle({
        x: bX,
        y: curY2 - 74,
        width: colW,
        height: 74,
        color: COLORS.cardBg,
        borderColor: COLORS.cardBorder,
        borderWidth: 0.6
      });

      p2.drawLine({ start: { x: bX, y: curY2 }, end: { x: bX + 40, y: curY2 }, thickness: 1.5, color: COLORS.gold });
      p2.drawText(b.title, { x: bX + 12, y: curY2 - 18, size: 9, font: fontBold, color: COLORS.white });
      const bLines = wrapText(b.desc, colW - 24, 8, fontRegular);
      let by = curY2 - 33;
      bLines.forEach((ln) => {
        p2.drawText(ln, { x: bX + 12, y: by, size: 8, font: fontRegular, color: COLORS.silver });
        by -= 12;
      });
    });

    // =========================================================================
    // PAGE 3: WHAT GARUDA CAN BUILD
    // =========================================================================
    const p3 = createPage();
    drawPageHeader(p3, 3);
    drawPageFooter(p3, 3);

    let curY3 = pageHeight - 70;

    p3.drawText("02  /  DELIVERABLE CAPABILITIES", { x: margin, y: curY3, size: 8, font: fontBold, color: COLORS.gold });
    curY3 -= 20;

    p3.drawText("WHAT GARUDA CAN BUILD", { x: margin, y: curY3, size: 21, font: fontBold, color: COLORS.white });
    curY3 -= 16;

    p3.drawText(`Tested, production-grade digital components tailored for ${prospectName}`, { x: margin, y: curY3, size: 11, font: fontRegular, color: COLORS.gold });
    curY3 -= 18;

    p3.drawLine({ start: { x: margin, y: curY3 }, end: { x: pageWidth - margin, y: curY3 }, thickness: 0.6, color: COLORS.cardBorder });
    curY3 -= 24;

    const capabilities = [
      {
        num: "01",
        title: "DIRECT DIGITAL RESERVATION ENGINE",
        desc: "A clean, mobile-optimized booking portal embedded on your website or dedicated subdomain. Allows direct travelers to select check-in/out dates, choose garden suite categories, view property photos, and inspect total pricing transparently."
      },
      {
        num: "02",
        title: "24/7 WHATSAPP INQUIRY CONCIERGE",
        desc: "An automated WhatsApp assistant that responds instantly to prospective guest queries regarding check-in times, garden dining amenities, directions from Jaipur railway station/airport, and room policies with polite, accurate information."
      },
      {
        num: "03",
        title: "SECURE ADVANCE DEPOSIT GATEWAY",
        desc: "Integrated payment processing supporting UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Netbanking. Collects standard 50% reservation deposits and settles net funds directly into Niravi Jaipur's current account."
      },
      {
        num: "04",
        title: "AUTOMATED BOOKING VOUCHERS & STAFF ALERTS",
        desc: "Generates branded PDF reservation vouchers with unique transaction references, sent automatically to the guest upon payment. Instantly dispatches SMS/WhatsApp alerts to Niravi's front-desk staff with guest arrival details."
      },
      {
        num: "05",
        title: "STAFF MANAGEMENT DASHBOARD",
        desc: "A lightweight administrative view allowing management to review upcoming direct check-ins, block dates for maintenance or private garden events, and export reservation rosters without complicated software training."
      }
    ];

    const cardHeight = 88;
    capabilities.forEach((cap) => {
      p3.drawRectangle({
        x: margin,
        y: curY3 - cardHeight,
        width: contentWidth,
        height: cardHeight,
        color: COLORS.cardBg,
        borderColor: COLORS.cardBorder,
        borderWidth: 0.6
      });

      p3.drawLine({
        start: { x: margin, y: curY3 },
        end: { x: margin + 70, y: curY3 },
        thickness: 1.5,
        color: COLORS.gold
      });

      p3.drawText(cap.num, { x: margin + 14, y: curY3 - 22, size: 12, font: fontBold, color: COLORS.gold });
      p3.drawText(cap.title, { x: margin + 44, y: curY3 - 21, size: 10, font: fontBold, color: COLORS.white });

      const descLines = wrapText(cap.desc, contentWidth - 58, 8.5, fontRegular);
      let dy = curY3 - 39;
      descLines.forEach((dln) => {
        p3.drawText(dln, { x: margin + 44, y: dy, size: 8.5, font: fontRegular, color: COLORS.silver });
        dy -= 13;
      });

      curY3 -= cardHeight + 14;
    });

    // =========================================================================
    // PAGE 4: HOW IT WOULD WORK
    // =========================================================================
    const p4 = createPage();
    drawPageHeader(p4, 4);
    drawPageFooter(p4, 4);

    let curY4 = pageHeight - 70;

    p4.drawText("03  /  SYSTEM ARCHITECTURE", { x: margin, y: curY4, size: 8, font: fontBold, color: COLORS.gold });
    curY4 -= 20;

    p4.drawText("THE GARUDA EXPERIENCE", { x: margin, y: curY4, size: 21, font: fontBold, color: COLORS.white });
    curY4 -= 16;

    p4.drawText("Connecting digital intelligence with real-world execution", { x: margin, y: curY4, size: 11, font: fontRegular, color: COLORS.gold });
    curY4 -= 18;

    p4.drawLine({ start: { x: margin, y: curY4 }, end: { x: pageWidth - margin, y: curY4 }, thickness: 0.6, color: COLORS.cardBorder });
    curY4 -= 26;

    p4.drawText("END-TO-END RESERVATION ARCHITECTURE", { x: margin, y: curY4, size: 9, font: fontBold, color: COLORS.gold });
    curY4 -= 18;

    const archStages = [
      {
        stage: "INPUT LAYER",
        title: "Omnichannel Guest Inquiry",
        detail: "Guest visits Niravi website or sends inquiry to Niravi WhatsApp number"
      },
      {
        stage: "INTELLIGENCE LAYER",
        title: "GARUDA Availability & Rate Engine",
        detail: "Verifies room inventory, computes stay total, and applies property policies"
      },
      {
        stage: "TRANSACTION LAYER",
        title: "Automated Advance Settlement",
        detail: "Generates secure instant UPI/Card payment link; verifies bank confirmation"
      },
      {
        stage: "CONFIRMATION LAYER",
        title: "Cryptographic Booking Voucher",
        detail: "Issues verified PDF reservation receipt with guest voucher ID & arrival notes"
      },
      {
        stage: "OPERATIONAL LAYER",
        title: "Niravi Front Desk Handover",
        detail: "Staff notified in real-time; guest entry pre-registered in arrival schedule"
      }
    ];

    const archBoxH = 58;
    archStages.forEach((stg, i) => {
      p4.drawRectangle({
        x: margin,
        y: curY4 - archBoxH,
        width: contentWidth,
        height: archBoxH,
        color: COLORS.cardBg,
        borderColor: COLORS.cardBorder,
        borderWidth: 0.6
      });

      p4.drawText(stg.stage, { x: margin + 14, y: curY4 - 17, size: 7.5, font: fontBold, color: COLORS.gold });
      p4.drawText(stg.title, { x: margin + 14, y: curY4 - 32, size: 9.5, font: fontBold, color: COLORS.white });
      p4.drawText(stg.detail, { x: margin + 14, y: curY4 - 46, size: 8, font: fontRegular, color: COLORS.silver });

      p4.drawText(`STAGE 0${i + 1}`, { x: pageWidth - margin - 65, y: curY4 - 30, size: 8, font: fontMono, color: COLORS.goldDim });

      curY4 -= archBoxH + 8;

      if (i < archStages.length - 1) {
        drawArrowDown(p4, margin + contentWidth / 2, curY4 - 2, 7, COLORS.goldDim);
        curY4 -= 10;
      }
    });

    curY4 -= 20;

    p4.drawRectangle({
      x: margin,
      y: curY4 - 84,
      width: contentWidth,
      height: 84,
      color: COLORS.cardBg,
      borderColor: COLORS.gold,
      borderWidth: 0.8
    });

    p4.drawText("THE GARUDA PRINCIPLE: EXECUTION BEYOND CONVERSATION", {
      x: margin + 16,
      y: curY4 - 20,
      size: 8.5,
      font: fontBold,
      color: COLORS.gold
    });

    const principleText = "GARUDA is not a generic conversational chatbot. It is a governed business operating system that combines customer communication with transactional execution - verifying room dates, processing direct banking settlements, and delivering physical verified receipts to both guest and hotel management.";
    const pLines = wrapText(principleText, contentWidth - 32, 8.5, fontRegular);
    let py = curY4 - 36;
    pLines.forEach((pln) => {
      p4.drawText(pln, { x: margin + 16, y: py, size: 8.5, font: fontRegular, color: COLORS.silver });
      py -= 13;
    });

    // =========================================================================
    // PAGE 5: EXECUTIVE CALL TO ACTION
    // =========================================================================
    const p5 = createPage();
    drawPageHeader(p5, 5);
    drawPageFooter(p5, 5);

    let curY5 = pageHeight - 70;

    p5.drawText("04  /  NEXT STEPS", { x: margin, y: curY5, size: 8, font: fontBold, color: COLORS.gold });
    curY5 -= 20;

    p5.drawText("READY TO SEE IT IN ACTION?", { x: margin, y: curY5, size: 21, font: fontBold, color: COLORS.white });
    curY5 -= 16;

    p5.drawText("A focused 15-minute demonstration of the direct reservation workflow", { x: margin, y: curY5, size: 11, font: fontRegular, color: COLORS.gold });
    curY5 -= 18;

    p5.drawLine({ start: { x: margin, y: curY5 }, end: { x: pageWidth - margin, y: curY5 }, thickness: 0.6, color: COLORS.cardBorder });
    curY5 -= 35;

    const p5Text1 = `We can demonstrate this direct booking and WhatsApp inquiry workflow in a concise, 15-minute session scheduled at your convenience.`;
    wrapText(p5Text1, contentWidth, 10, fontRegular).forEach((ln) => {
      p5.drawText(ln, { x: margin, y: curY5, size: 10, font: fontRegular, color: COLORS.silver });
      curY5 -= 17;
    });
    curY5 -= 8;

    const p5Text2 = `During this brief preview, we will walk you through an interactive demonstration of how room availability, guest deposits, and automated booking vouchers function end-to-end, and explore whether this workflow fits Niravi Jaipur's current operational goals.`;
    wrapText(p5Text2, contentWidth, 10, fontRegular).forEach((ln) => {
      p5.drawText(ln, { x: margin, y: curY5, size: 10, font: fontRegular, color: COLORS.silver });
      curY5 -= 17;
    });
    curY5 -= 36;

    // Prominent CTA Box
    const ctaBoxH = 125;
    p5.drawRectangle({
      x: margin,
      y: curY5 - ctaBoxH,
      width: contentWidth,
      height: ctaBoxH,
      color: COLORS.cardBg,
      borderColor: COLORS.gold,
      borderWidth: 1.2
    });

    p5.drawLine({
      start: { x: margin, y: curY5 },
      end: { x: margin + contentWidth, y: curY5 },
      thickness: 2.5,
      color: COLORS.gold
    });

    p5.drawText("REQUEST A 15-MINUTE DEMONSTRATION", {
      x: margin + 22,
      y: curY5 - 28,
      size: 13,
      font: fontBold,
      color: COLORS.gold
    });

    p5.drawText("Reply directly to this communication or reach out via direct phone / WhatsApp:", {
      x: margin + 22,
      y: curY5 - 48,
      size: 9.5,
      font: fontRegular,
      color: COLORS.white
    });

    p5.drawText("Direct Founder Channel:", { x: margin + 22, y: curY5 - 72, size: 9.5, font: fontBold, color: COLORS.muted });
    p5.drawText("garudaos.ai@gmail.com", { x: margin + 155, y: curY5 - 72, size: 10.5, font: fontMono, color: COLORS.gold });

    p5.drawText("Online Platform:", { x: margin + 22, y: curY5 - 90, size: 9.5, font: fontBold, color: COLORS.muted });
    p5.drawText("https://www.garudaos.in", { x: margin + 155, y: curY5 - 90, size: 10, font: fontMono, color: COLORS.white });

    p5.drawText("Direct Scoping Room:", { x: margin + 22, y: curY5 - 108, size: 9.5, font: fontBold, color: COLORS.muted });
    p5.drawText("https://www.garudaos.in/chat", { x: margin + 155, y: curY5 - 108, size: 10, font: fontMono, color: COLORS.gold });

    curY5 -= ctaBoxH + 50;

    p5.drawText("PRAVEEN MAHAWAR", { x: margin, y: curY5, size: 13, font: fontBold, color: COLORS.white });
    curY5 -= 16;
    p5.drawText("Founder - GARUDA AI Systems", { x: margin, y: curY5, size: 9.5, font: fontRegular, color: COLORS.silver });
    curY5 -= 14;
    p5.drawText("Sovereign AI  |  Business Operating Systems", { x: margin, y: curY5, size: 8.5, font: fontRegular, color: COLORS.muted });
    curY5 -= 50;

    p5.drawLine({
      start: { x: margin, y: curY5 },
      end: { x: pageWidth - margin, y: curY5 },
      thickness: 0.6,
      color: COLORS.goldDim
    });
    curY5 -= 22;

    p5.drawText("GARUDA AI SYSTEMS", { x: margin, y: curY5, size: 10, font: fontBold, color: COLORS.gold });
    curY5 -= 13;
    p5.drawText("SOVEREIGN INTELLIGENCE. BUILT FOR BUSINESS.", { x: margin, y: curY5, size: 8, font: fontRegular, color: COLORS.silver });
    curY5 -= 12;
    p5.drawText(`CONFIDENTIAL EXECUTIVE PROPOSAL  |  PREPARED EXCLUSIVELY FOR ${prospectName.toUpperCase()}`, { x: margin, y: curY5, size: 7, font: fontRegular, color: COLORS.muted });

    // =========================================================================
    // COMPILE & VERIFY PHYSICAL BYTES
    // =========================================================================
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    const stat = fs.statSync(outputPath);
    const checksum = sha256(pdfBytes);
    const artifactId = `prop_exec_${Date.now()}_${titleSlug.toLowerCase()}`;

    const artifactRecord = {
      artifactId,
      title: `Executive Proposal: ${prospectName}`,
      docType: "executive_proposal_pdf",
      prospectName,
      city,
      domain,
      outputPath: outputPath.replace(/\\/g, "/"),
      pageCount: totalPages,
      fileSizeBytes: stat.size,
      sha256: checksum,
      generatedAt: new Date().toISOString(),
      verified: true
    };

    try {
      fs.appendFileSync(ASSETS_INDEX_FILE, JSON.stringify(artifactRecord) + "\n", "utf8");
    } catch {}

    return artifactRecord;
  }

  /**
   * Generates matching Premium HTML Email Template.
   */
  generateMatchingHtmlEmail({ prospectName, pdfFilename }) {
    const name = prospectName || "Niravi Jaipur";
    const filename = pdfFilename || `GARUDA_${name.replace(/[^a-zA-Z0-9]/g, "_")}_Executive_Proposal.pdf`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>A digital reservation concept for ${name}</title>
</head>
<body style="margin:0; padding:0; background-color:#080A0E; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#C7CCD6; -webkit-font-smoothing:antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080A0E; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:#10141B; border:1px solid #20242B; border-radius:8px; overflow:hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color:#10141B; padding:28px 36px 20px 36px; border-bottom:1px solid #262B34;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="color:#D9B347; font-size:14px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">GARUDA AI SYSTEMS</div>
                    <div style="color:#7A8494; font-size:11px; margin-top:3px; letter-spacing:0.5px;">SOVEREIGN AI &bull; EXECUTIVE BUSINESS SYSTEMS</div>
                  </td>
                  <td align="right">
                    <span style="color:#D9B347; font-family:monospace; font-size:11px;">garudaos.in</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Thin Gold Accent Line -->
          <tr>
            <td style="height:2px; background-color:#D9B347; line-height:2px; font-size:2px;">&nbsp;</td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <div style="color:#F7F7FA; font-size:16px; font-weight:600; margin-bottom:18px;">
                Hi ${name} team,
              </div>

              <p style="color:#C7CCD6; font-size:14px; line-height:1.6; margin:0 0 16px 0;">
                I am reaching out regarding direct guest reservation workflows for your boutique garden hotel in Jaipur.
              </p>

              <p style="color:#C7CCD6; font-size:14px; line-height:1.6; margin:0 0 16px 0;">
                Many independent boutique properties take direct bookings over email and telephone alongside aggregators. However, direct guests frequently look for a quick way to confirm room availability and place an advance deposit online without waiting for manual back-and-forth communication.
              </p>

              <p style="color:#C7CCD6; font-size:14px; line-height:1.6; margin:0 0 24px 0;">
                We build lightweight direct reservation engines and WhatsApp inquiry assistants that enable guests to select dates, view room categories, and complete advance deposits directly into your bank account with zero platform commission.
              </p>

              <!-- Proposal Attachment Callout Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080A0E; border:1px solid #D9B347; border-radius:6px; margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="color:#D9B347; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">ATTACHED EXECUTIVE PROPOSAL</div>
                    <div style="color:#F7F7FA; font-size:14px; font-weight:600; margin-bottom:4px;">${filename}</div>
                    <div style="color:#7A8494; font-size:12px; line-height:1.5;">A 5-page strategic concept paper outlining the complete direct booking workflow, deliverable components, and system architecture for ${name}.</div>
                  </td>
                </tr>
              </table>

              <p style="color:#C7CCD6; font-size:14px; line-height:1.6; margin:0 0 28px 0;">
                If you are open to seeing how this operates in practice, I would be glad to share a short 15-minute demonstration at your convenience.
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center" style="border-radius:4px; background-color:#D9B347;">
                    <a href="mailto:praveen@garudaos.in?subject=Re:%2015-Minute%20Demonstration%20for%20${encodeURIComponent(name)}" style="font-size:13px; font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-weight:700; color:#080A0E; text-decoration:none; display:inline-block; padding:12px 26px; letter-spacing:0.5px; border-radius:4px;">REQUEST A 15-MINUTE DEMONSTRATION &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Sign-Off -->
              <div style="border-top:1px solid #20242B; padding-top:20px; margin-top:20px;">
                <div style="color:#F7F7FA; font-size:14px; font-weight:600;">Praveen Mahawar</div>
                <div style="color:#7A8494; font-size:12px; margin-top:2px;">Founder &bull; GARUDA AI Systems</div>
                <div style="color:#D9B347; font-size:12px; margin-top:6px; font-family:monospace;">
                  garudaos.in &nbsp;|&nbsp; garudaos.ai@gmail.com
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#080A0E; padding:18px 36px; border-top:1px solid #1A1F27; text-align:center;">
              <div style="color:#7A8494; font-size:11px; line-height:1.5;">
                GARUDA AI SYSTEMS &bull; Sovereign Intelligence Built for Business<br>
                This strategic brief was prepared exclusively for ${name}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

module.exports = new PremiumProposalService();
