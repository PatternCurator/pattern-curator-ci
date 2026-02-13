// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toIsoFromUnixSeconds(sec: unknown) {
  return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Deploy-first: Stripe not configured yet
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured yet" }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" as any });

  let event: Stripe.Event;

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("❌ webhook signature verify failed:", err?.message || err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const emailRaw =
          session.customer_details?.email ||
          session.customer_email ||
          session.metadata?.email ||
          "";

        const email_normalized = normalizeEmail(emailRaw);

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        const customerId = typeof session.customer === "string" ? session.customer : null;

        const priceId =
          (typeof session.metadata?.stripe_price_id === "string" && session.metadata.stripe_price_id) ||
          null;

        if (!email_normalized) break;

        const { error } = await supabaseAdmin.from("ci_billing").upsert(
          {
            email: emailRaw || email_normalized,
            email_normalized,
            status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            cancel_at_period_end: false,
            current_period_end: null,
            updated_at: now,
            meta: {
              source: "checkout.session.completed",
              plan: session.metadata?.plan ?? null,
              session_id: session.id,
            },
          },
          { onConflict: "email_normalized" }
        );

        if (error) {
          console.error("❌ ci_billing upsert error:", error);
          return NextResponse.json({ error: "ci_billing upsert failed" }, { status: 500 });
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const subId = sub.id;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;

        // Stripe status is like: active, trialing, canceled, unpaid, etc.
        const stripeStatus = sub.status;
        const normalizedStatus =
          event.type === "customer.subscription.deleted" ? "inactive" : stripeStatus;

        const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

        // ✅ Period end: prefer subscription item (most reliable), fallback to any if present
        const itemPeriodEndSec =
          (sub.items?.data?.[0] as any)?.current_period_end ??
          (sub as any)?.current_period_end ??
          null;

        const currentPeriodEnd = toIsoFromUnixSeconds(itemPeriodEndSec);

        // ✅ Price id: prefer price.id, fallback plan.id
        const stripePriceId =
          (sub.items?.data?.[0] as any)?.price?.id ??
          (sub.items?.data?.[0] as any)?.plan?.id ??
          null;

        const { error } = await supabaseAdmin
          .from("ci_billing")
          .update({
            status: normalizedStatus,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            stripe_price_id: stripePriceId,
            cancel_at_period_end: cancelAtPeriodEnd,
            current_period_end: currentPeriodEnd,
            updated_at: now,
            meta: {
              source: event.type,
              stripe_status: stripeStatus,
            },
          })
          .eq("stripe_subscription_id", subId);

        if (error) {
          console.error("❌ ci_billing update error:", error);
          return NextResponse.json({ error: "ci_billing update failed" }, { status: 500 });
        }

        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error("❌ webhook handler error:", err?.message || err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
