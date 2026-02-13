// src/app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import { getStripeOrNull } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPriceId(plan: string) {
  if (plan === "monthly") return process.env.STRIPE_PRICE_ID_MONTHLY;
  if (plan === "annual") return process.env.STRIPE_PRICE_ID_ANNUAL;
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email : "";
    const plan = typeof body.plan === "string" ? body.plan : "monthly";

    const email_normalized = normalizeEmail(email);
    if (!email_normalized) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ✅ Deploy-first: no Stripe key required to build/deploy
    const stripe = getStripeOrNull();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured yet" }, { status: 503 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    await supabaseAdmin.from("ci_billing").upsert(
      {
        email,
        email_normalized,
        status: "pending",
        stripe_price_id: priceId,
        updated_at: now,
        meta: { plan },
      },
      { onConflict: "email_normalized" }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email_normalized,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/account?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      metadata: { email: email_normalized, plan, stripe_price_id: priceId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ checkout error:", err?.message || err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
