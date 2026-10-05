/**
 * GARUDA Multi-Tier Client Hunt — TIER 1: EMAIL DISPATCH (4 leads)
 * Aadesh: sab 8 ko premium approach, 3-4 tier attack, unke kaam ke hisab se rates.
 * Standard: Golden Outreach & Visual Brand Identity Doctrine (AGENTS.md §2)
 * Anti-Fabrication: rates from ServiceLanding.jsx verified baseINR; URLs pre-flight PASS.
 */
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const LOG_PATH = path.join(__dirname, "..", "data", "leads", "client_hunt_dispatch_log.json");

function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function shell(palette, title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${palette.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:${palette.bg};padding:28px 10px;">
<tr><td align="center">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background:${palette.panel};border:1px solid ${palette.border};border-radius:14px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,.55);">
<tr><td style="padding:22px 28px;background:linear-gradient(135deg,${palette.grad1} 0%,${palette.grad2} 100%);border-bottom:2px solid ${palette.accent};">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${palette.accent};font-weight:700;">GARUDA OS &middot; SOVEREIGN ENGINEERING</div>
  <div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px;">${title}</div>
</td></tr>
<tr><td style="padding:26px 28px;color:${palette.text};font-size:14.5px;line-height:1.65;">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px 26px;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
  <td align="center" style="background:${palette.accent};border-radius:8px;">
    <a href="https://www.garudaos.in/chat?ref=${palette.ref}" style="display:block;padding:14px 22px;color:${palette.ctaText};font-weight:800;font-size:15px;text-decoration:none;">${palette.cta}</a>
  </td></tr></table>
  <div style="margin-top:16px;font-size:11.5px;color:#7A8699;line-height:1.6;">
    Praveen Mahawar &middot; Founder, GARUDA OS<br>
    Official: praveen@garudaos.in &middot; <a href="https://www.garudaos.in" style="color:${palette.accent};text-decoration:none;">www.garudaos.in</a><br>
    Fixed-price projects &middot; 50% milestone governance &middot; you own 100% of the code.
  </div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const P = {
  healthcare: { bg:"#05070B", panel:"#0B1220", border:"#123055", accent:"#38BDF8", ctaText:"#041018", text:"#D7E3F4", grad1:"#0A1F33", grad2:"#0F2B4A", cta:"Open Scoped Chat →", ref:"nisargacare" },
  hospitality:{ bg:"#0A0805", panel:"#14100A", border:"#3B2C12", accent:"#F5C451", ctaText:"#171104", text:"#EFE3CC", grad1:"#1C1509", grad2:"#2E220C", cta:"See Luxury Site Blueprint →", ref:"trivanta" },
  ukpartner:  { bg:"#06070D", panel:"#0B0D18", border:"#232A55", accent:"#818CF8", ctaText:"#0A0B18", text:"#DCDFF5", grad1:"#10132A", grad2:"#1B2046", cta:"Start White-Label Scope →", ref:"ukcollab" },
  enterprise: { bg:"#050810", panel:"#0A1020", border:"#1B2E5A", accent:"#60A5FA", ctaText:"#050C18", text:"#D5E1F5", grad1:"#0C1730", grad2:"#132344", cta:"Compare vs Hiring Plan →", ref:"maxval" }
};

function rateTable(rows) {
  let r = `<table role="presentation" width="100%" cellspacing="0" cellpadding="10" style="margin:16px 0;border:1px solid rgba(255,255,255,.09);border-radius:10px;overflow:hidden;">`;
  for (const [scope, price, note] of rows) {
    r += `<tr>
      <td style="background:rgba(255,255,255,.03);color:#E7EEF9;font-size:13.5px;font-weight:700;border-bottom:1px solid rgba(255,255,255,.07);">${scope}</td>
      <td align="right" style="background:rgba(255,255,255,.03);color:#7DD3FC;font-size:13.5px;font-weight:800;border-bottom:1px solid rgba(255,255,255,.07);">${price}</td>
      <td style="background:rgba(255,255,255,.03);color:#8FA3BF;font-size:12px;border-bottom:1px solid rgba(255,255,255,.07);">${note}</td>
    </tr>`;
  }
  return r + "</table>";
}

const EMAILS = [
  {
    key: "rank1_nisarga",
    to: "nisargacare1@gmail.com",
    name: "Nisarga Care Team",
    palette: P.healthcare,
    subject: "Nisarga Care redesign — WITHOUT touching your Google index (audit + fixed ₹30,000)",
    html: shell(P.healthcare, "Redesign without losing Google rankings", `
      <p>Namaste Nisarga Care team 🙏</p>
      <p>We saw your public request: <b>redesign nisargacare.com without making any changes to the Google index.</b> That exact constraint — URL-preserving migration — is our core specialty.</p>
      <p style="background:rgba(56,189,248,.08);border-left:3px solid #38BDF8;padding:12px 16px;border-radius:0 8px 8px 0;">
      <b>Free audit of your live site (3 findings):</b><br>
      1. Your &lt;title&gt; tag is a ~250-character keyword string — Google truncates at ~60, so <b>"Nisarga Care" never appears in search results</b>. On medical/YMYL sites this over-optimization can trigger demotions.<br>
      2. Homepage repeats the same keyword blocks — exactly the pattern Google's Helpful Content systems demote for healthcare.<br>
      3. Your fear (redesign = lost rankings) is solvable: <b>same URLs + 301 redirect map + Search Console monitoring</b> — every ranking, blog post and backlink stays intact.</p>
      ${rateTable([
        ["SEO-Safe Redesign (URL-preserving + 301s + GSC monitoring)", "₹30,000 (~$360)", "Fixed price · 50% milestone"],
        ["Optional: 24×7 WhatsApp AI receptionist (elder-care enquiries)", "₹20,000 (~$250)", "Answers families 24×7"]
      ])}
      <p>1989 se aapka trust — design hamara kaam. Reply here or open a scoping chat and we'll send a concrete migration plan.</p>`)
  },
  {
    key: "rank2_trivanta",
    to: "trivantahospitality@gmail.com",
    name: "Trivanta Hospitality Group",
    palette: P.hospitality,
    subject: "Trivanta Hospitality — luxury website blueprint (portfolio + fixed ₹30,000)",
    html: shell(P.hospitality, "Luxury decided in the first 2 seconds", `
      <p>Hello Trivanta Hospitality Group,</p>
      <p>You're building your online presence for <b>premium, modern, luxury hospitality</b> — we art-direct around your property's own photography with cinematic pacing, never a stock hotel template.</p>
      <p><b>Two things agencies usually miss:</b></p>
      <p>1. <b>Luxury is judged in &lt;2 seconds.</b> Typography, motion and imagery must say "5-star" before a word is read.<br>
      2. <b>Direct bookings are the profit.</b> OTA commissions run 15–25%. We embed the inquiry/booking funnel into the site so guests book YOU.</p>
      ${rateTable([
        ["Luxury website + direct inquiry/booking funnel", "₹30,000 (~$360)", "Fixed price · 50% milestone"],
        ["Optional: booking/inquiry automation + AI concierge", "₹25,000 (~$300)", "Fewer missed enquiries"]
      ])}
      <p>We ship production-grade sites in days, not months — every deploy SHA-256 verified. Reply with your property photos/brand kit and we'll send a first direction.</p>`)
  },
  {
    key: "rank4_ukjack",
    to: "socialmedia2evolve@outlook.com",
    name: "Jack",
    palette: P.ukpartner,
    subject: "Silent white-label delivery bench for your UK client projects — rates inside",
    html: shell(P.ukpartner, "Your silent delivery bench, UK hours", `
      <p>Hi Jack,</p>
      <p>Saw your post looking for a <b>UK-based freelance web developer to collaborate on upcoming client projects.</b> We run exactly that — a silent white-label bench:</p>
      <p>• <b>NDA-ready</b> — we never appear in front of your client<br>
      • <b>UK-hours overlap</b> — same-day feedback loops from India<br>
      • <b>You keep the relationship and the margin</b>; we ship design + full-stack build with deployment proof and QA evidence on every release<br>
      • <b>Team, not freelancer</b> — no disappearing mid-project</p>
      ${rateTable([
        ["Client website builds (white-label)", "from ₹30,000 (~$360 / ~£280)", "Your margin stays healthy"],
        ["SaaS MVP / web app builds", "₹50,000 (~$600)", "For bigger client scopes"]
      ])}
      <p>Let's prove it on <b>one test project first</b> — you judge the work before any commitment.</p>`)
  },
  {
    key: "rank5_maxval",
    to: "sales@maxval.com",
    name: "MaxVal — ATTN Pronojit Singh",
    palette: P.enterprise,
    subject: "ATTN Pronojit Singh — dedicated web delivery bench vs new senior hire",
    html: shell(P.enterprise, "Start this week, not in 6–8 weeks", `
      <p>Hello MaxVal team — <b>please route to Pronojit Singh, Global Head of Marketing.</b></p>
      <p>You're expanding the web team (senior web developer opening). Quick reframe before the hiring loop starts:</p>
      <p>• <b>Speed:</b> a dedicated delivery bench starts <b>this week</b> — hiring takes 6–8 weeks of sourcing<br>
      • <b>Cost shape:</b> project-based delivery scales up/down per sprint instead of carrying fixed ₹12–18L annual cost between projects<br>
      • <b>Proof:</b> cryptographic deployment evidence on every release — you always know exactly what shipped</p>
      ${rateTable([
        ["Website/product pages", "₹30,000 (~$360)", "Per project · fixed"],
        ["Business automation / internal tools", "₹25,000 (~$300)", "Per project · fixed"],
        ["Custom software builds", "₹50,000 (~$600)", "Per project · fixed"]
      ])}
      <p>We run as an invisible delivery unit for product/marketing teams — design + full-stack + QA. Worth 15 minutes to compare against your hiring plan?</p>`)
  }
];

(async () => {
  console.log("==============================================================");
  console.log("GARUDA TIER-1 EMAIL DISPATCH — CLIENT HUNT (4 leads)");
  console.log("==============================================================");
  const pass = JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  const host = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
  const port = parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10);
  const user = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
  const passw = process.env.GARUDA_EMAIL_PASS;
  if (!passw) throw new Error("Missing GARUDA_EMAIL_PASS");

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: passw } });

  for (const e of EMAILS) {
    if ((pass.dispatched || []).some(d => d.key === e.key && d.status === "SENT")) { console.log("SKIP (already sent):", e.key); continue; }
    try {
      const info = await transporter.sendMail({
        from: `"Praveen Mahawar | Founder, GARUDA-AI" <${user}>`,
        to: e.to,
        subject: e.subject,
        html: e.html,
        headers: { "X-Mailer": "GARUDA-OS-Outreach" }
      });
      const rec = { key: e.key, to: e.to, subject: e.subject, status: "SENT", messageId: info.messageId, sha256: sha256(e.html), at: new Date().toISOString() };
      pass.dispatched = pass.dispatched || [];
      pass.dispatched.push(rec);
      fs.writeFileSync(LOG_PATH, JSON.stringify(pass, null, 2));
      console.log("SENT:", e.key, "->", e.to, info.messageId);
    } catch (err) {
      const rec = { key: e.key, to: e.to, status: "FAILED", error: err.message, at: new Date().toISOString() };
      pass.dispatched = pass.dispatched || [];
      pass.dispatched.push(rec);
      fs.writeFileSync(LOG_PATH, JSON.stringify(pass, null, 2));
      console.log("FAIL:", e.key, err.message);
    }
    await new Promise(r => setTimeout(r, 45000 + Math.random() * 45000));
  }
  console.log("TIER-1 EMAIL DISPATCH COMPLETE");
})().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
