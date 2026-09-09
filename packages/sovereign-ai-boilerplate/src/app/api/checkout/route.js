import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

/**
 * 🦅 50/50 Milestone Escrow Checkout Generator
 * Generates Razorpay Order or Stripe Checkout Session for client milestones.
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      amount = 50000, // Total project amount in INR or USD
      currency = "INR",
      customerName = "Client",
      customerEmail = "client@example.com",
      customerPhone = "",
      serviceTitle = "Full-Stack AI Automation Sprint",
      gateway = "razorpay" // 'razorpay' or 'stripe'
    } = body;

    const milestonePercentage = 50; // 50% upfront, 50% on verified completion
    const milestoneAmount = Math.round((amount * milestonePercentage) / 100);
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    let checkoutPayload = {
      orderId,
      totalAmount: amount,
      milestoneAmount,
      currency,
      milestonePercentage,
      gateway
    };

    // If Razorpay credentials exist
    if (gateway === "razorpay" && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require("razorpay");
        const instance = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const rzpOrder = await instance.orders.create({
          amount: milestoneAmount * 100, // in paise
          currency: currency.toUpperCase(),
          receipt: orderId,
          notes: {
            serviceTitle,
            milestone: "50% Upfront Kickoff",
            customerName
          }
        });

        checkoutPayload.razorpayOrderId = rzpOrder.id;
        checkoutPayload.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      } catch (rzpErr) {
        console.warn("[Checkout API] Razorpay SDK initiation fallback:", rzpErr.message);
      }
    }

    // Persist milestone order record in Supabase
    await supabase.from("milestone_orders").insert({
      order_id: checkoutPayload.razorpayOrderId || orderId,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      total_amount: amount,
      milestone_percentage: milestonePercentage,
      amount_due: milestoneAmount,
      currency,
      gateway,
      status: "pending",
      metadata: { serviceTitle, customerName }
    });

    return NextResponse.json({
      success: true,
      data: checkoutPayload,
      message: `Generated 50% milestone escrow order: ${currency} ${milestoneAmount.toLocaleString()}`
    });
  } catch (err) {
    console.error("[Checkout Route Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
