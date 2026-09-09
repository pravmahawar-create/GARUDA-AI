import { NextResponse } from "next/server";
import { runAITriage } from "../../../lib/aiTriage";
import { supabase } from "../../../lib/supabase";

/**
 * 🦅 Web & PWA 1-Tap Client Intake & Interactive Triage API
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, symptoms, category } = body;

    if (!phone && !symptoms) {
      return NextResponse.json({ error: "Missing required fields (phone or symptoms)" }, { status: 400 });
    }

    const triage = await runAITriage({
      message: symptoms || "Consultation requested",
      contactName: name,
      channel: "web_pwa"
    });

    const { data, error } = await supabase.from("triage_leads").insert({
      phone: phone || "web_anonymous",
      name: name || "Web Prospect",
      channel: "web_pwa",
      category: category || triage.category,
      urgency: triage.urgency,
      intent_summary: triage.summary,
      symptoms_or_notes: symptoms,
      status: "triaged"
    });

    return NextResponse.json({
      success: true,
      triage,
      lead: data?.[0] || null
    });
  } catch (err) {
    console.error("[Triage API Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
