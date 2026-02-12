import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

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

    const emailNorm = normalizeEmail(email);
    if (!emailNorm || !emailNorm.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const successUrl = `${siteUrl}/?checkout=success`;
    const cancelUrl = `${siteUrl}/?checkout=cancel`;

    // Ensure lead exists
    await supabaseAdmin.from("ci_leads").upsert({ email: emailNorm }, { onConflict: "email_normalized" });

    // Look for existing billing row
    const { data: billing } = await supabaseAdmin
      .from("ci_billing")
      .select("email_normalized, stripe_customer_id")
      .eq("email_normalized", emailNorm)
      .maybeSingle();

    // Create or reuse customer
    let customerId = billing?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: emailNorm,
        metadata: { product: "patterncurator-ci" },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("ci_billing")
        .upsert(
          {
            email_normalized: emailNorm,
            stripe_customer_id: customerId,
            status: "none",
          },
          { onConflict: "email_normalized" }
        );
    }

    // Create Checkout session (subscription)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: false,
      customer_update: { address: "auto" }, // optional
      metadata: {
        email_normalized: emailNorm,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

