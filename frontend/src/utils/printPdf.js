/**
 * 👑 GARUDA Ultra-Luxury Executive White PDF & Print Engine
 * Converts markdown text or structured documents into a pure white (#ffffff),
 * deep charcoal (#0f172a), royal gold (#b8860b) print layout.
 */

export function formatMarkdownForPrint(md) {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Headings
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Bold & Code
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bullets
  html = html.replace(/^[\*\-\•]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => `<ul>${match}</ul>`);

  // Paragraphs
  const paragraphs = html.split(/\n\n+/);
  return paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<blockquote')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');
}

export function openPristineWhitePdf(data, idx = 0, defaultTitle = "GARUDA Document") {
  let text = "";
  let title = defaultTitle;

  if (typeof data === "string") {
    text = data;
  } else if (data && typeof data === "object") {
    if (data.title) title = data.title;
    const parts = [];
    if (data.subtitle) parts.push(`### ${data.subtitle}\n`);
    if (Array.isArray(data.sections)) {
      for (const sec of data.sections) {
        if (sec.heading) parts.push(`## ${sec.heading}\n`);
        if (sec.content) parts.push(`${sec.content}\n`);
        if (sec.body) parts.push(`${sec.body}\n`);
      }
    } else if (data.content) {
      parts.push(data.content);
    }
    text = parts.join("\n");
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups in your browser to open the Executive White PDF view.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} (Executive White PDF)</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #0f172a;
      background: #ffffff !important;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #d4af37;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 8.5pt;
      color: #b8860b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta {
      font-size: 8.5pt;
      color: #64748b;
      text-align: right;
    }
    h1 { font-size: 16pt; font-weight: 800; color: #0f172a; margin: 20px 0 10px; }
    h2 { font-size: 13pt; font-weight: 700; color: #0f172a; margin: 18px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h3 { font-size: 11pt; font-weight: 700; color: #1e293b; margin: 14px 0 6px; }
    p { margin: 0 0 10px; color: #334155; }
    ul { margin: 0 0 12px; padding-left: 22px; color: #334155; }
    li { margin-bottom: 4px; }
    code { font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-size: 9pt; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; color: #0f172a; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 9pt; line-height: 1.45; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #d4af37; margin: 0 0 12px; padding: 6px 14px; background: #fafafa; color: #475569; font-style: italic; }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0 !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; background: #0f172a; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border-bottom: 2px solid #d4af37; margin: -24px -24px 24px -24px;">
    <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 11pt; color: #d4af37;">
      <span>👑</span>
      <span>GARUDA Executive White PDF</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 800; font-size: 9.5pt; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 9pt; cursor: pointer;">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="brand">GARUDA EXECUTIVE ARCHITECTURE</div>
      <div class="brand-sub">Sovereign Intelligence & High-Fidelity Deliverable</div>
    </div>
    <div class="meta">
      <div><strong>Document:</strong> ${title}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="content">
    ${formatMarkdownForPrint(text)}
  </div>

  <div class="footer">
    <span>GARUDA AI Operating System • Founder: Praveen Mahawar</span>
    <span>Document ID: GARUDA-DOC-${idx + 1}-${Date.now().toString(36).toUpperCase()}</span>
  </div>

  <script>
    (function() {
      function triggerPrint() {
        setTimeout(function() {
          try { window.print(); } catch(e) {}
        }, 350);
      }
      if (document.readyState === 'complete') {
        triggerPrint();
      } else {
        window.addEventListener('DOMContentLoaded', triggerPrint);
        window.addEventListener('load', triggerPrint);
        setTimeout(triggerPrint, 500);
      }
    })();
  <\/script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
