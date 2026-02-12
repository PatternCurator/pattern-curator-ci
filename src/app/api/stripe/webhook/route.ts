import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function POST(req: Request) {
  // 1) Read signature + raw body first (must be exact bytes Stripe signed)
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = Buffer.from(await req.arrayBuffer());

  // 2) Ensure env present (after reading body)
  try {
    requireEnv("STRIPE_SECRET_KEY");
    requireEnv("STRIPE_WEBHOOK_SECRET");
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (e: any) {
    console.error(e?.message);
    return NextResponse.json({ error: e?.message ?? "Missing env" }, { status: 500 });
  }

  // Safe debug (does not print full secret)
  console.log(
    "WEBHOOK_SECRET prefix:",
    (process.env.STRIPE_WEBHOOK_SECRET || "").slice(0, 12)
  );

  // 3) Verify Stripe signature
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verify failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 4) Handle events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Prefer metadata (you set this in /api/stripe/checkout)
        const metaEmail = (session.metadata?.email_normalized ?? "")
          .trim()
          .toLowerCase();

        // Fallbacks if metadata is missing
        const rawEmail =
          metaEmail ||
          session.customer_details?.email?.trim().toLowerCase() ||
          session.customer_email?.trim().toLowerCase() ||
          "";

        const email_normalized = normalizeEmail(rawEmail);

        if (!email_normalized || !isValidEmail(email_normalized)) {
          console.warn("⚠️ Missing/invalid email on checkout.session.completed:", rawEmail);
          break;
        }

        // SubscriptionId is usually present, but not always in fixtures
        let subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        // If missing, retrieve expanded session (robust fix)
        if (!subscriptionId) {
          const full = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["subscription"],
          });

          const subId =
            typeof full.subscription === "string"
              ? full.subscription
              : (full.subscription as Stripe.Subscription | null)?.id ?? null;

          subscriptionId = subId;
        }

        if (!subscriptionId) {
          console.warn("⚠️ Still missing subscriptionId after retrieve:", session.id);
          break;
        }

        // Retrieve subscription for price + period end
        // (TS in your environment doesn’t recognize current_period_end, so access safely.)
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;

        const stripe_customer_id =
          typeof sub?.customer === "string" ? (sub.customer as string) : null;

        const stripe_price_id = sub?.items?.data?.[0]?.price?.id ?? null;

        const cpe = sub?.current_period_end;
        const current_period_end =
          typeof cpe === "number" ? new Date(cpe * 1000).toISOString() : null;

        const cancel_at_period_end = !!sub?.cancel_at_period_end;

        const payload = {
          email_normalized,
          stripe_customer_id,
          stripe_subscription_id: subscriptionId,
          stripe_price_id,
          status: "active",
          current_period_end,
          cancel_at_period_end,
          meta: {
            checkout_session_id: session.id,
            mode: session.mode,
            payment_status: session.payment_status,
            source: "checkout.session.completed",
          },
        };

        const { error } = await supabaseAdmin
          .from("ci_billing")
          .upsert(payload, { onConflict: "email_normalized" });

        if (error) {
          console.error("❌ ci_billing upsert error:", error);
          return NextResponse.json({ error: "ci_billing upsert failed" }, { status: 500 });
        }

        console.log("✅ ci_billing activated:", email_normalized);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const { error } = await supabaseAdmin
          .from("ci_billing")
          .update({
            status: "inactive",
            cancel_at_period_end: true,
            current_period_end: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) {
          console.error("❌ ci_billing deactivate error:", error);
          return NextResponse.json({ error: "ci_billing deactivate failed" }, { status: 500 });
        }
        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (err: any) {
    console.error("❌ webhook handler error:", err?.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
