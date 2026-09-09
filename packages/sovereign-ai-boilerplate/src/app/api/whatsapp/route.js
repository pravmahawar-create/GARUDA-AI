import { NextResponse } from "next/server";
import { runAITriage } from "../../../lib/aiTriage";
import { supabase } from "../../../lib/supabase";
import { sendWhatsAppBookingCTA } from "../../../lib/whatsappClient";

/**
 * WhatsApp Cloud API Webhook
 * GET: Webhook verification
 * POST: Inbound message processing & autonomous AI triage
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "garuda_sovereign_webhook_verify_token_2026";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Subscription verified successfully");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden: Verification Token Mismatch", { status: 403 });
}

export async function POST(request) {
  try {
    const payload = await request.json();

    // Verify WhatsApp standard entry structure
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const messageObj = changes?.messages?.[0];
    const contactObj = changes?.contacts?.[0];

    if (!messageObj) {
      // Event could be delivery status receipt (sent, delivered, read)
      return NextResponse.json({ status: "ignored_status_update" }, { status: 200 });
    }

    const fromPhone = messageObj.from;
    const contactName = contactObj?.profile?.name || "Valued Client";
    const textBody = messageObj.text?.body || messageObj.interactive?.button_reply?.title || "";

    console.log(`[WhatsApp Inbound] From: ${fromPhone} (${contactName}) - "${textBody}"`);

    // 1. Run AI Triage Engine
    const triage = await runAITriage({
      message: textBody,
      contactName,
      channel: "whatsapp"
    });

    // 2. Persist to Supabase triage_leads table
    const { data: leadRecord, error: leadErr } = await supabase.from("triage_leads").insert({
      phone: fromPhone,
      name: contactName,
      channel: "whatsapp",
      category: triage.category,
      urgency: triage.urgency,
      intent_summary: triage.summary,
      symptoms_or_notes: textBody,
      raw_payload: payload,
      status: "triaged"
    });

    if (leadErr) {
      console.warn("[WhatsApp Webhook] Supabase lead save note:", leadErr.message);
    }

    // 3. Dispatch automated intelligent triage response via WhatsApp
    await sendWhatsAppBookingCTA({
      to: fromPhone,
      contactName,
      triageResult: triage
    });

    return NextResponse.json({
      success: true,
      triaged: true,
      urgency: triage.urgency,
      category: triage.category
    }, { status: 200 });
  } catch (err) {
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
