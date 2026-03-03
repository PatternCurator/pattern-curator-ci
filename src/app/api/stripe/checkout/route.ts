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

// We block these to prevent double free-month + double renewals.
const BLOCKED_SUB_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
]);

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

    const stripe = getStripeOrNull();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured yet" },
        { status: 503 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    // 1) Load existing billing row so we can reuse stripe_customer_id if present
    const { data: billingRow, error: billingErr } = await supabaseAdmin
      .from("ci_billing")
      .select("stripe_customer_id")
      .eq("email_normalized", email_normalized)
      .maybeSingle();

    if (billingErr) {
      console.error("❌ ci_billing lookup error:", billingErr.message);
      return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }

    let stripeCustomerId: string | null =
      (billingRow?.stripe_customer_id as string | null) ?? null;

    // 2) Ensure we have a Stripe customer id (prefer the one that already has a subscription)
    if (!stripeCustomerId) {
      const existing = await stripe.customers.list({
        email: email_normalized,
        limit: 10,
      });

      // If multiple customers share the same email, pick the one that already has a blocked subscription.
      let picked: string | null = null;

      for (const c of existing.data) {
        const subsForCustomer = await stripe.subscriptions.list({
          customer: c.id,
          status: "all",
          limit: 10,
        });

        const hasBlocked = subsForCustomer.data.some((s) =>
          BLOCKED_SUB_STATUSES.has(s.status)
        );

        if (hasBlocked) {
          picked = c.id;
          break;
        }
      }

      if (picked) {
        stripeCustomerId = picked;
      } else if (existing.data?.[0]?.id) {
        // No subscription found — fall back to first customer by email
        stripeCustomerId = existing.data[0].id;
      } else {
        // No customer at all — create one
        const created = await stripe.customers.create({
          email: email_normalized,
          metadata: { email: email_normalized },
        });
        stripeCustomerId = created.id;
      }

      // Persist so future checkouts always reuse this customer
      await supabaseAdmin.from("ci_billing").upsert(
        {
          email,
          email_normalized,
          stripe_customer_id: stripeCustomerId,
          status: "pending",
          stripe_price_id: priceId,
          updated_at: now,
          meta: { plan },
        },
        { onConflict: "email_normalized" }
      );
    } else {
      // Keep your existing behavior
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
    }

    // 3) Hard stop: block if this customer already has a subscription (including trialing)
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId!,
      status: "all",
      limit: 10,
    });

    const hasBlockedSub = subs.data.some((s) =>
      BLOCKED_SUB_STATUSES.has(s.status)
    );

    if (hasBlockedSub) {
      return NextResponse.json(
        {
          error:
            "You already have a subscription (or active trial) for this email. Please manage your subscription instead.",
          code: "already_subscribed",
        },
        { status: 409 }
      );
    }

    // 4) Create Checkout Session using the Customer id (NOT customer_email)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId!,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/`,
      metadata: { email: email_normalized, plan, stripe_price_id: priceId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ checkout error:", err?.message || err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}