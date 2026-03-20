// src/app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import { getStripeOrNull } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Plan = "monthly" | "annual";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidPlan(plan: string): plan is Plan {
  return plan === "monthly" || plan === "annual";
}

function getPriceId(plan: Plan) {
  if (plan === "monthly") return process.env.STRIPE_PRICE_ID_MONTHLY || null;
  if (plan === "annual") return process.env.STRIPE_PRICE_ID_ANNUAL || null;
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
    const rawPlan = typeof body.plan === "string" ? body.plan : "monthly";

    const email_normalized = normalizeEmail(email);
    if (!email_normalized) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidPlan(rawPlan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan: Plan = rawPlan;
    const priceId = getPriceId(plan);

    if (!priceId) {
      console.error("❌ Missing Stripe price id for plan:", plan, {
        monthly: process.env.STRIPE_PRICE_ID_MONTHLY || null,
        annual: process.env.STRIPE_PRICE_ID_ANNUAL || null,
      });

      return NextResponse.json(
        { error: "Stripe price is not configured for this plan" },
        { status: 500 }
      );
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

    console.log("checkout debug", {
      email: email_normalized,
      plan,
      selectedPriceId: priceId,
      monthlyPriceId: process.env.STRIPE_PRICE_ID_MONTHLY || null,
      annualPriceId: process.env.STRIPE_PRICE_ID_ANNUAL || null,
      appUrl,
    });

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

    // 2) Ensure we have a Stripe customer id
    if (!stripeCustomerId) {
      const existing = await stripe.customers.list({
        email: email_normalized,
        limit: 10,
      });

      let picked: string | null = null;

      for (const customer of existing.data) {
        const subsForCustomer = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 10,
        });

        const hasBlocked = subsForCustomer.data.some((sub) =>
          BLOCKED_SUB_STATUSES.has(sub.status)
        );

        if (hasBlocked) {
          picked = customer.id;
          break;
        }
      }

      if (picked) {
        stripeCustomerId = picked;
      } else if (existing.data?.[0]?.id) {
        stripeCustomerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: email_normalized,
          metadata: { email: email_normalized },
        });
        stripeCustomerId = created.id;
      }

      const { error: upsertErr } = await supabaseAdmin.from("ci_billing").upsert(
        {
          email: email_normalized,
          email_normalized,
          stripe_customer_id: stripeCustomerId,
          status: "pending",
          stripe_price_id: priceId,
          updated_at: now,
          meta: { plan },
        },
        { onConflict: "email_normalized" }
      );

      if (upsertErr) {
        console.error("❌ ci_billing upsert error:", upsertErr.message);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
      }
    } else {
      const { error: upsertErr } = await supabaseAdmin.from("ci_billing").upsert(
        {
          email: email_normalized,
          email_normalized,
          stripe_customer_id: stripeCustomerId,
          status: "pending",
          stripe_price_id: priceId,
          updated_at: now,
          meta: { plan },
        },
        { onConflict: "email_normalized" }
      );

      if (upsertErr) {
        console.error("❌ ci_billing upsert error:", upsertErr.message);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
      }
    }

    // 3) Hard stop: block if this customer already has a subscription
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId!,
      status: "all",
      limit: 10,
    });

    const hasBlockedSub = subs.data.some((sub) =>
      BLOCKED_SUB_STATUSES.has(sub.status)
    );

    if (hasBlockedSub) {
      return NextResponse.json(
        {
          error:
            "You already have a subscription or active trial for this email. Please manage your subscription instead.",
          code: "already_subscribed",
        },
        { status: 409 }
      );
    }

    // 4) Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId!,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        email: email_normalized,
        plan,
        stripe_price_id: priceId,
      },
    });

    if (!session.url) {
      console.error("❌ Stripe checkout session created without URL");
      return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ checkout error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}