import { NextResponse } from "next/server";
import { getStripeOrNull } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const stripe = getStripeOrNull();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    // 👉 REPLACE THIS WITH YOUR STRIPE PRICE ID
    const REPORT_PRICE_ID = process.env.STRIPE_REPORT_PRICE_ID;

    if (!REPORT_PRICE_ID) {
      return NextResponse.json(
        { error: "Missing STRIPE_REPORT_PRICE_ID" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: REPORT_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/reports/success`,
      cancel_url: `${appUrl}/reports`,
      metadata: {
        product_type: "report",
        report_slug: "ss-27",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ report checkout error:", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}