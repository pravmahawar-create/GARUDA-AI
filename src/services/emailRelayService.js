// Email relay over HTTP (port 443). Render free web services block outbound
// SMTP ports 25/465/587, and Gmail throttles rapid connections from cloud
// egress IPs. A provider HTTP API (Brevo/Resend/SendGrid) runs on 443, which
// is NOT blocked and does NOT carry the same burst-throttle behaviour.
//
// Config (env):
//   GARUDA_EMAIL_RELAY_PROVIDER = "brevo" | "resend" | "sendgrid"
//   GARUDA_EMAIL_RELAY_KEY       = provider API key
//   GARUDA_EMAIL_FROM            = sender email (defaults to GARUDA_EMAIL_USER)
//   GARUDA_EMAIL_FROM_NAME       = sender display name
//
// Falls back to nothing when unconfigured; callers decide fallback.

const RELAY_PROVIDERS = ["brevo", "resend", "sendgrid"];

function isRelayConfigured(env = process.env) {
  const provider = String(env.GARUDA_EMAIL_RELAY_PROVIDER || "").trim().toLowerCase();
  const key = String(env.GARUDA_EMAIL_RELAY_KEY || "").trim();
  return RELAY_PROVIDERS.includes(provider) && Boolean(key);
}

function getRelayConfig(env = process.env) {
  const provider = String(env.GARUDA_EMAIL_RELAY_PROVIDER || "").trim().toLowerCase();
  const key = String(env.GARUDA_EMAIL_RELAY_KEY || "").trim();
  const from = String(env.GARUDA_EMAIL_FROM || env.GARUDA_EMAIL_USER || "").trim();
  const fromName = String(env.GARUDA_EMAIL_FROM_NAME || "GARUDA AI Operating System").trim();
  if (!RELAY_PROVIDERS.includes(provider) || !key) {
    return { ready: false, config: null };
  }
  return { ready: true, config: { provider, key, from, fromName } };
}

function buildPayload(provider, config, mail) {
  const from = config.from ? (config.fromName ? { name: config.fromName, email: config.from } : config.from) : config.fromName;
  const to = mail.to;
  const subject = String(mail.subject || "");
  const text = String(mail.body || "");
  const html = mail.html ? String(mail.html) : null;
  if (provider === "brevo") {
    const body = {
      sender: { email: config.from, name: config.fromName },
      to: [{ email: to }],
      subject,
      textContent: text
    };
    if (html) body.htmlContent = html;
    return {
      url: "https://api.brevo.com/v3/smtp/email",
      headers: { "api-key": config.key, "Content-Type": "application/json", Accept: "application/json" },
      body
    };
  }
  if (provider === "resend") {
    const body = {
      from: from && from.email ? `${from.name} <${from.email}>` : config.from,
      to: [to],
      subject,
      text: text
    };
    if (html) body.html = html;
    return {
      url: "https://api.resend.com/emails",
      headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
      body
    };
  }
  // sendgrid
  const content = [];
  if (text) content.push({ type: "text/plain", value: text });
  if (html) content.push({ type: "text/html", value: html });
  if (content.length === 0) content.push({ type: "text/plain", value: "" });
  return {
    url: "https://api.sendgrid.com/v3/mail/send",
    headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: {
      personalizations: [{ to: [{ email: to }] }],
      from: from && from.email ? { email: from.email, name: from.name } : { email: config.from },
      subject,
      content
    }
  };
}

async function sendViaRelay(config, mail, options = {}) {
  const { url, headers, body } = buildPayload(config.provider, config, mail);
  const timeoutMs = Number(options.timeoutMs) || 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`Relay ${config.provider} HTTP ${res.status}: ${JSON.stringify(payload)}`);
      err.statusCode = res.status;
      throw err;
    }
    const providerResponseId = String(
      (payload && (payload.id || payload.messageId || payload.message_id)) || `RELAY_ACCEPTED_${res.status}`
    );
    return { accepted: true, providerResponseId, relayProvider: config.provider };
  } catch (err) {
    if (err && err.name === "AbortError") {
      const timeoutErr = new Error(`Relay ${config.provider} request timed out (${timeoutMs}ms)`);
      timeoutErr.cause = err;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  RELAY_PROVIDERS,
  isRelayConfigured,
  getRelayConfig,
  sendViaRelay
};