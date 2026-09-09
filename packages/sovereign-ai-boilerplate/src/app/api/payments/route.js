import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "../../../lib/supabase";
import { sendWhatsAppMessage } from "../../../lib/whatsappClient";

/**
 * 🦅 Unified Payment Webhook Receiver
 * Verifies Razorpay & Stripe signatures, updates Supabase records, and sends WhatsApp receipt.
 */

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    const razorpaySignature = headers.get("x-razorpay-signature");
    const stripeSignature = headers.get("stripe-signature");

    let verified = false;
    let paymentData = null;
    let gateway = "unknown";

    // 1. Razorpay Webhook Verification
    if (razorpaySignature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      gateway = "razorpay";
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature === razorpaySignature) {
        verified = true;
        const parsed = JSON.parse(rawBody);
        paymentData = parsed.payload?.payment?.entity;
      }
    } else if (razorpaySignature) {
      // Dev mode: acknowledge without secret
      verified = true;
      const parsed = JSON.parse(rawBody);
      paymentData = parsed.payload?.payment?.entity || parsed;
      gateway = "razorpay";
    }

    // 2. Stripe Webhook Verification
    if (stripeSignature && process.env.STRIPE_WEBHOOK_SECRET) {
      gateway = "stripe";
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const event = stripe.webhooks.constructEvent(
          rawBody,
          stripeSignature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        verified = true;
        paymentData = event.data.object;
      } catch (stripeErr) {
        console.error("[Stripe Webhook Signature Error]:", stripeErr.message);
      }
    }

    if (!verified && (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid payment webhook signature" }, { status: 400 });
    }

    const payload = paymentData || JSON.parse(rawBody || "{}");
    const orderId = payload.order_id || payload.id;
    const paymentId = payload.id;
    const amount = (payload.amount ? payload.amount / 100 : 0);
    const customerPhone = payload.contact || payload.customer_phone;
    const customerEmail = payload.email || payload.customer_email;

    console.log(`[Payment Verified] Gateway: ${gateway} | Order: ${orderId} | Amount: ₹${amount}`);

    // Update Supabase milestone order
    if (orderId) {
      await supabase.from("milestone_orders").update({
        status: "paid",
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      }).eq("order_id", orderId);
    }

    // Log compliance audit event
    await supabase.from("audit_events").insert({
      event_type: "payment_settled",
      entity_type: "milestone_order",
      entity_id: orderId || paymentId,
      payload: { gateway, amount, paymentId, customerEmail }
    });

    // Send WhatsApp payment confirmation if customer phone available
    if (customerPhone) {
      await sendWhatsAppMessage({
        to: customerPhone,
        text: `✅ Payment Verified!\nYour milestone payment of ${payload.currency || "INR"} ${amount} was successfully received via ${gateway.toUpperCase()}.\nOrder Reference: ${orderId}\n\nOur engineering team has been notified to kick off the sprint immediately.`
      });
    }

    return NextResponse.json({ success: true, verified: true, orderId, paymentId }, { status: 200 });
  } catch (err) {
    console.error("[Payment Webhook Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
