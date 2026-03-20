// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: unknown) {
  const s = typeof email === "string" ? email : "";
  return s.trim().toLowerCase();
}

function toIsoFromUnixSeconds(sec: unknown) {
  return typeof sec === "number" ? new Date(sec * 1000).toISOString() : null;
}

function getId(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && "id" in (val as any) && typeof (val as any).id === "string") {
    return (val as any).id;
  }
  return null;
}

function pickEmailFromSession(session: Stripe.Checkout.Session): string {
  return (
    session.customer_details?.email ||
    session.customer_email ||
    (session.metadata?.email as string | undefined) ||
    ""
  );
}

function isMissingColumnError(err: any, colName: string) {
  const code = err?.code;
  const msg = String(err?.message || "");
  // Postgres missing column is often 42703
  return code === "42703" || new RegExp(`column .*${colName}.* does not exist`, "i").test(msg);
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured yet" }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20" as any,
  });

  let event: Stripe.Event;

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("❌ webhook signature verify failed:", err?.message || err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Helper: update existing billing rows by Stripe ids (most reliable)
    async function updateBillingByStripeIds(opts: {
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      payload: any;
    }) {
      const { stripe_customer_id, stripe_subscription_id, payload } = opts;

      let updated = false;

      if (stripe_customer_id) {
        const { data, error } = await supabaseAdmin
          .from("ci_billing")
          .update(payload)
          .eq("stripe_customer_id", stripe_customer_id)
          .select("email_normalized");

        if (error) {
          console.error("❌ ci_billing update by stripe_customer_id error:", error);
          throw error;
        }
        if (data && data.length > 0) updated = true;
      }

      if (!updated && stripe_subscription_id) {
        const { data, error } = await supabaseAdmin
          .from("ci_billing")
          .update(payload)
          .eq("stripe_subscription_id", stripe_subscription_id)
          .select("email_normalized");

        if (error) {
          console.error("❌ ci_billing update by stripe_subscription_id error:", error);
          throw error;
        }
        if (data && data.length > 0) updated = true;
      }

      return updated;
    }

    // Helper: upsert by email_normalized (fallback)
    async function upsertBillingByEmail(opts: {
      email_raw: string;
      email_normalized: string;
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      stripe_price_id?: string | null;
      status: string;
      cancel_at_period_end?: boolean;
      current_period_end?: string | null;
      meta?: any;
    }) {
      const {
        email_raw,
        email_normalized,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        status,
        cancel_at_period_end = false,
        current_period_end = null,
        meta = {},
      } = opts;

      const payload = {
        email: email_raw || email_normalized,
        email_normalized,
        status,
        stripe_customer_id: stripe_customer_id ?? null,
        stripe_subscription_id: stripe_subscription_id ?? null,
        stripe_price_id: stripe_price_id ?? null,
        cancel_at_period_end: !!cancel_at_period_end,
        current_period_end,
        updated_at: now,
        meta,
      };

      const { error } = await supabaseAdmin.from("ci_billing").upsert(payload, {
        onConflict: "email_normalized",
      });

      if (error) {
        console.error("❌ ci_billing upsert by email_normalized error:", error);
        throw error;
      }
    }

    // Helper: try to find email if missing (from Customer)
    async function getEmailFromCustomerId(customerId: string | null): Promise<string> {
      if (!customerId) return "";
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any)?.email;
        return normalizeEmail(email);
      } catch (e: any) {
        console.warn("⚠️ Could not retrieve customer email:", e?.message || e);
        return "";
      }
    }

    switch (event.type) {
      /**
       * ✅ Main checkout completion
       * - Pull subscription + customer ids
       * - If subscription exists, fetch it to get true status/period end/price
       * - Update by stripe ids if possible, else upsert by email_normalized
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId = getId(session.customer);
        const subscriptionId = getId(session.subscription);

        // Try email from session; fallback to customer lookup
        const emailFromSession = normalizeEmail(pickEmailFromSession(session));
        const emailFromCustomer = emailFromSession ? "" : await getEmailFromCustomerId(customerId);
        const email_normalized = emailFromSession || emailFromCustomer;

        // Pull plan/price (prefer subscription line item if present)
        let stripeStatus: string | null = null;
        let currentPeriodEnd: string | null = null;
        let stripePriceId: string | null =
          (typeof session.metadata?.stripe_price_id === "string" && session.metadata.stripe_price_id) ||
          null;

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            stripeStatus = sub.status ?? null;

            const currentPeriodEndSec = (sub as any).current_period_end ?? null;
            currentPeriodEnd = toIsoFromUnixSeconds(currentPeriodEndSec);

            const priceFromSub =
              (sub.items?.data?.[0] as any)?.price?.id ??
              (sub.items?.data?.[0] as any)?.plan?.id ??
              null;

            stripePriceId = priceFromSub || stripePriceId;
          } catch (e: any) {
            console.warn("⚠️ Could not retrieve subscription for checkout session:", e?.message || e);
          }
        }

        // If we still don't have email, we can only update by Stripe ids
        const statusToWrite = stripeStatus || "active"; // good default

        const updatePayload = {
          status: statusToWrite,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: stripePriceId,
          cancel_at_period_end: false,
          current_period_end: currentPeriodEnd,
          updated_at: now,
          meta: {
            source: "checkout.session.completed",
            plan: session.metadata?.plan ?? null,
            session_id: session.id,
            stripe_status: stripeStatus,
          },
        };

        // Prefer updating an existing row created earlier ("pending") via Stripe ids
        let updated = false;
        try {
          updated = await updateBillingByStripeIds({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            payload: updatePayload,
          });
        } catch {
          // updateBillingByStripeIds already logged; continue to email upsert fallback below
        }

        // If not updated, fallback to upsert by email_normalized (if we have it)
        if (!updated && email_normalized) {
          await upsertBillingByEmail({
            email_raw: emailFromSession || email_normalized,
            email_normalized,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: stripePriceId,
            status: statusToWrite,
            cancel_at_period_end: false,
            current_period_end: currentPeriodEnd,
            meta: {
              source: "checkout.session.completed",
              plan: session.metadata?.plan ?? null,
              session_id: session.id,
              stripe_status: stripeStatus,
            },
          });
        } else if (!updated && !email_normalized) {
          console.warn("⚠️ checkout.session.completed: no billing row updated (no match + no email)", {
            customerId,
            subscriptionId,
            sessionId: session.id,
          });
        }

        break;
      }

      /**
       * ✅ Subscription lifecycle
       * Add CREATED (you were missing this)
       */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const subId = sub.id;
        const customerId = getId(sub.customer);

        const stripeStatus = sub.status;
        const normalizedStatus =
          event.type === "customer.subscription.deleted" ? "inactive" : stripeStatus;

        const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

        const currentPeriodEndSec = (sub as any).current_period_end ?? null;
        const currentPeriodEnd = toIsoFromUnixSeconds(currentPeriodEndSec);

        const stripePriceId =
          (sub.items?.data?.[0] as any)?.price?.id ??
          (sub.items?.data?.[0] as any)?.plan?.id ??
          null;

        // Try to retrieve a customer email for fallback upsert
        const email_normalized = await getEmailFromCustomerId(customerId);

        const updatePayload = {
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
        };

        let updated = false;
        updated = await updateBillingByStripeIds({
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          payload: updatePayload,
        });

        if (!updated && email_normalized) {
          await upsertBillingByEmail({
            email_raw: email_normalized,
            email_normalized,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            stripe_price_id: stripePriceId,
            status: normalizedStatus,
            cancel_at_period_end: cancelAtPeriodEnd,
            current_period_end: currentPeriodEnd,
            meta: {
              source: event.type,
              stripe_status: stripeStatus,
            },
          });
        } else if (!updated) {
          console.warn("⚠️ subscription event: no billing row updated (no match + no email)", {
            customerId,
            subId,
            eventType: event.type,
          });
        }

        break;
      }

      /**
       * ✅ Payment failsafe:
       * If a $0 coupon invoice is created/succeeded, this flips status to active.
       * If payment fails, mark past_due (and your usage route can treat past_due as entitled if you keep that).
       */
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const customerId = getId(invoice.customer);
        const subscriptionId = getId((invoice as any).subscription);

        const statusToWrite = event.type === "invoice.payment_succeeded" ? "active" : "past_due";

        // Try to capture price id from invoice lines
        const stripePriceId =
          (invoice.lines?.data?.[0] as any)?.price?.id ??
          (invoice.lines?.data?.[0] as any)?.plan?.id ??
          null;

        // Try to get email for fallback upsert
        const email_normalized = await getEmailFromCustomerId(customerId);

        const payload = {
          status: statusToWrite,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: stripePriceId,
          updated_at: now,
          meta: {
            source: event.type,
            invoice_id: invoice.id,
          },
        };

        let updated = false;
        updated = await updateBillingByStripeIds({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          payload,
        });

        if (!updated && email_normalized) {
          await upsertBillingByEmail({
            email_raw: email_normalized,
            email_normalized,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: stripePriceId,
            status: statusToWrite,
            meta: {
              source: event.type,
              invoice_id: invoice.id,
            },
          });
        } else if (!updated) {
          console.warn("⚠️ invoice event: no billing row updated (no match + no email)", {
            customerId,
            subscriptionId,
            eventType: event.type,
            invoiceId: invoice.id,
          });
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