/**
 * 🦅 GARUDA Sovereign WhatsApp Cloud API Client
 * Sends direct WhatsApp responses, booking links, and 50/50 payment escrow requests.
 */

const WHATSAPP_API_VERSION = "v20.0";

export async function sendWhatsAppMessage({ to, text }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn(`[WhatsApp Client (Simulated)] Message to ${to}: "${text}"`);
    return { success: true, simulated: true, recipient: to, text };
  }

  const cleanTo = String(to).replace(/\D/g, "");
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { preview_url: true, body: text }
      })
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err) {
    console.error(`[WhatsApp Client Error] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function sendWhatsAppBookingCTA({ to, contactName, triageResult }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingLink = `${appUrl}?intake=${encodeURIComponent(to)}&name=${encodeURIComponent(contactName || "")}`;
  
  const text = `${triageResult.draftReply}\n\n👉 Complete 1-Tap Intake & Book Slot:\n${bookingLink}`;
  return sendWhatsAppMessage({ to, text });
}
