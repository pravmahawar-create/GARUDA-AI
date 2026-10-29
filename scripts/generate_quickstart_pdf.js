const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const HTML_PATH = path.resolve(__dirname, "../billing/delivery/pilot-pack/quickstart_card.html");
const PDF_PATH = path.resolve(__dirname, "../billing/delivery/pilot-pack/QuickStart_Card_Hindi.pdf");

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Inter:wght@400;600;700;800&display=swap');
  
  @page {
    size: A4;
    margin: 14mm 16mm;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', 'Tiro Devanagari Hindi', sans-serif;
    color: #111827;
    background: #ffffff;
    line-height: 1.4;
    font-size: 11pt;
  }
  
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .header h1 {
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  
  .header .badge {
    background: #0f172a;
    color: #ffffff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9pt;
    font-weight: 700;
  }
  
  .subhead {
    font-size: 10pt;
    color: #4b5563;
    font-weight: 600;
  }
  
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .step-card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 10px;
    background: #f9fafb;
  }
  
  .step-num {
    font-weight: 800;
    color: #0f172a;
    font-size: 10.5pt;
    margin-bottom: 3px;
  }
  
  .step-desc {
    font-size: 9.5pt;
    color: #374151;
  }
  
  .commands-box {
    border: 2px solid #2563eb;
    background: #eff6ff;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
  }
  
  .commands-title {
    font-weight: 800;
    color: #1e40af;
    font-size: 11pt;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .command-item {
    font-size: 9.5pt;
    color: #1e3a8a;
    margin-bottom: 4px;
    padding-left: 12px;
    position: relative;
    font-weight: 600;
  }
  
  .command-item::before {
    content: "🎙️";
    position: absolute;
    left: -4px;
    font-size: 8pt;
  }
  
  .warning-box {
    border: 1.5px solid #dc2626;
    background: #fef2f2;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 10px;
  }
  
  .warning-title {
    font-weight: 800;
    color: #991b1b;
    font-size: 9.5pt;
    margin-bottom: 2px;
  }
  
  .warning-text {
    font-size: 8.5pt;
    color: #7f1d1d;
    line-height: 1.35;
  }
  
  .footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 6px;
    font-size: 8pt;
    color: #6b7280;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>GARUDA Billing (ग़रुड़ बिलिंग)</h1>
    <div class="subhead">Loha-Cement & Building Material — 1-Page QuickStart Guide</div>
  </div>
  <div>
    <span class="badge">v1.11 Offline Release</span>
  </div>
</div>

<div class="grid">
  <div class="step-card">
    <div class="step-num">1. ऐप इंस्टॉल व शुरू करें</div>
    <div class="step-desc"><code>GARUDA_Billing_v1.11_Release.apk</code> फोन में खोलें और "Install" दबाएं। पहली बार माइक परमिशन "While using app" सेलेक्ट करें।</div>
  </div>

  <div class="step-card">
    <div class="step-num">2. दुकान प्रोफाइल सेट करें</div>
    <div class="step-desc">Settings → Companies में जाएं। अपनी दुकान का नाम, पता, मोबाइल, GSTIN (यदि है) और बैंक/UPI ID दर्ज करें ताकि बिल पर आपका पेमेंट QR कोड छप सके।</div>
  </div>

  <div class="step-card">
    <div class="step-num">3. सामान और स्टॉक जोड़ें</div>
    <div class="step-desc">Stock/Inventory स्क्रीन में अपनी सीमेंट (UltraTech, ACC) और सरिया (8mm, 10mm) का शुरुआती बैग/पीस स्टॉक और बिक्री रेट सेट करें।</div>
  </div>

  <div class="step-card">
    <div class="step-num">4. आवाज़ से बिल बनाएं (Voice)</div>
    <div class="step-desc">माइक का बटन दबाएं और सामान्य हिंदी में बोलें। ऐप ग्राहक, सामान, मात्रा और रेट अपने आप पहचानकर स्क्रीन पर भर देगा। 'Confirm' दबाएं।</div>
  </div>

  <div class="step-card">
    <div class="step-num">5. बिल PDF व UPI QR देखें</div>
    <div class="step-desc">बिल बनते ही A4 PDF तैयार हो जाता है जिसमें आपका UPI QR कोड लगा होता है। 'Share' बटन दबाकर ग्राहक के WhatsApp पर सीधा भेजें।</div>
  </div>

  <div class="step-card">
    <div class="step-num">6. स्टॉक व बैकअप सुरक्षित रखें</div>
    <div class="step-desc">बिल बनते ही स्टॉक अपने आप घट जाता है। हफ्ते में एक बार Settings → 'Backup Data' दबाकर बैकअप फाइल सुरक्षित रखें।</div>
  </div>
</div>

<div class="commands-box">
  <div class="commands-title">5 वास्तविक हिंदी वॉइस कमांड (उदाहरण)</div>
  <div class="command-item">"रमेश जी के नाम 50 बैग अल्ट्राटेक सीमेंट 390 के रेट से बिल बना दो"</div>
  <div class="command-item">"सुरेश कंस्ट्रक्शन के नाम 12 एमएम सरिया 20 पीस और 50 बैग एसीसी सीमेंट का बिल बनाओ"</div>
  <div class="command-item">"स्टॉक में 200 बैग जेके लक्ष्मी सीमेंट 380 के भाव से ऐड करो"</div>
  <div class="command-item">"एमपी 20 एबीसी 1234 गाड़ी से 100 पीस 10 एमएम सरिया स्टॉक में डालो"</div>
  <div class="command-item">"राजेश का कितना बकाया बाकी है"</div>
</div>

<div class="warning-box">
  <div class="warning-title">⚠️ अति महत्वपूर्ण सुरक्षा सूचना (पेमेंट सत्यापन व माइक सूचना)</div>
  <div class="warning-text">
    1. <strong>पेमेंट सत्यापन:</strong> बिल पर छपा हुआ UPI QR कोड ग्राहक को सीधे आपके खाते में पेमेंट करने के लिए है। QR कोड बनने का मतलब पेमेंट जमा होना नहीं है। सामान लोड करने से पहले हमेशा अपने बैंक SMS, PhonePe/GPay या साउंडबॉक्स में पैसा आने की पुष्टि करें।<br>
    2. <strong>माइक व वातावरण:</strong> यह ऐप सामान्य वातावरण के लिए डिज़ाइन किया गया है। बहुत अधिक शोर (जैसे मिक्सी या भारी मशीनों) में टचस्क्रीन द्वारा मैन्युअल बिलिंग करें। हर फोन के माइक हार्डवेयर की क्षमता अलग हो सकती है।
  </div>
</div>

<div class="footer">
  <span>प्रदाता: GARUDA OS (praveen@garudaos.in | www.garudaos.in)</span>
  <span>SHA-256 Verified: 28A57588AAFDB8B77E6E4CA415EE43724DB0AB02DB17D1A95C0F1410CFFB4EAB</span>
</div>

</body>
</html>`;

fs.writeFileSync(HTML_PATH, HTML_CONTENT, "utf8");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(HTML_CONTENT, { waitUntil: "networkidle0" });
  await page.pdf({
    path: PDF_PATH,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" }
  });
  await browser.close();
  console.log("PDF generated successfully at:", PDF_PATH);
})();
