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

async function getCustomerEmail(stripe: Stripe, customerId: string | null) {
  if (!customerId) return "";
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !("deleted" in customer) && typeof customer.email === "string") {
      return customer.email;
    }
  } catch (e) {
    console.error("❌ failed to retrieve customer email:", e);
  }
  return "";
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

        const email = normalizeEmail(emailRaw);
        const email_normalized = email;

        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const customerId = typeof session.customer === "string" ? session.customer : null;

        const priceId =
          (typeof session.metadata?.stripe_price_id === "string" && session.metadata.stripe_price_id) ||
          null;

        if (!email_normalized) break;

        // IMPORTANT: email_normalized is GENERATED in DB; do NOT set it.
        const { error } = await supabaseAdmin.from("ci_billing").upsert(
          {
            email,
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

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const subId = sub.id;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;

        const emailRaw = await getCustomerEmail(stripe, customerId);
        const email = normalizeEmail(emailRaw);
        const email_normalized = email;

        if (!email_normalized) {
          console.warn("⚠️ subscription event missing customer email; cannot upsert by email_normalized", {
            type: event.type,
            subId,
            customerId,
          });
          break;
        }

        const stripeStatus = sub.status ?? null;
        const status = event.type === "customer.subscription.deleted" ? "inactive" : stripeStatus;

        const cancelAtPeriodEnd = !!sub.cancel_at_period_end;
        const currentPeriodEnd = toIsoFromUnixSeconds(sub.current_period_end ?? null);

        const stripePriceId =
          (sub.items?.data?.[0] as any)?.price?.id ??
          (sub.items?.data?.[0] as any)?.plan?.id ??
          null;

        const { error } = await supabaseAdmin.from("ci_billing").upsert(
          {
            email,
            status,
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
          },
          { onConflict: "email_normalized" }
        );

        if (error) {
          console.error("❌ ci_billing upsert error (sub event):", error);
          return NextResponse.json({ error: "ci_billing upsert failed" }, { status: 500 });
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
