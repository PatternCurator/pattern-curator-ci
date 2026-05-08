// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getReportDownloadUrl } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CI_MONTHLY_PRICE_ID =
  process.env.STRIPE_PRICE_ID_MONTHLY || "price_1TBH86K3OxyriLPqUl76JtCv";

const CI_ANNUAL_PRICE_ID =
  process.env.STRIPE_PRICE_ID_ANNUAL || "price_1TBH8YK3OxyriLPqWMwBuv38";

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
  if (
    typeof val === "object" &&
    "id" in (val as any) &&
    typeof (val as any).id === "string"
  ) {
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
  return (
    code === "42703" ||
    new RegExp(`column .*${colName}.* does not exist`, "i").test(msg)
  );
}

function getPlanIntervalFromPriceId(
  priceId: string | null
): "monthly" | "annual" | null {
  if (!priceId) return null;
  if (priceId === CI_MONTHLY_PRICE_ID) return "monthly";
  if (priceId === CI_ANNUAL_PRICE_ID) return "annual";
  return null;
}

function isCiPriceId(priceId: string | null): boolean {
  return priceId === CI_MONTHLY_PRICE_ID || priceId === CI_ANNUAL_PRICE_ID;
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured yet" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20" as any,
  });

  let event: Stripe.Event;

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature" },
        { status: 400 }
      );
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

    async function updateBillingByStripeIds(opts: {
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      payload: any;
    }) {
      const { stripe_customer_id, stripe_subscription_id, payload } = opts;

      let updated = false;
      let safePayload = { ...payload };

      if (stripe_customer_id) {
        let { data, error } = await supabaseAdmin
          .from("ci_billing")
          .update(safePayload)
          .eq("stripe_customer_id", stripe_customer_id)
          .select("email_normalized");

        if (error && isMissingColumnError(error, "plan_interval")) {
          const { plan_interval, ...fallbackPayload } = safePayload;
          safePayload = fallbackPayload;

          const retry = await supabaseAdmin
            .from("ci_billing")
            .update(safePayload)
            .eq("stripe_customer_id", stripe_customer_id)
            .select("email_normalized");

          data = retry.data;
          error = retry.error;
        }

        if (error) throw error;
        if (data && data.length > 0) updated = true;
      }

      if (!updated && stripe_subscription_id) {
        let { data, error } = await supabaseAdmin
          .from("ci_billing")
          .update(safePayload)
          .eq("stripe_subscription_id", stripe_subscription_id)
          .select("email_normalized");

        if (error && isMissingColumnError(error, "plan_interval")) {
          const { plan_interval, ...fallbackPayload } = safePayload;
          safePayload = fallbackPayload;

          const retry = await supabaseAdmin
            .from("ci_billing")
            .update(safePayload)
            .eq("stripe_subscription_id", stripe_subscription_id)
            .select("email_normalized");

          data = retry.data;
          error = retry.error;
        }

        if (error) throw error;
        if (data && data.length > 0) updated = true;
      }

      return updated;
    }

    async function upsertBillingByEmail(opts: {
      email_raw: string;
      email_normalized: string;
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      stripe_price_id?: string | null;
      status: string;
      cancel_at_period_end?: boolean;
      current_period_end?: string | null;
      plan_interval?: "monthly" | "annual" | null;
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
        plan_interval = null,
        meta = {},
      } = opts;

      const payload = {
        email: email_raw || email_normalized,
        email_normalized,
        status,
        stripe_customer_id: stripe_customer_id ?? null,
        stripe_subscription_id: stripe_subscription_id ?? null,
        stripe_price_id: stripe_price_id ?? null,
        plan_interval,
        cancel_at_period_end: !!cancel_at_period_end,
        current_period_end,
        updated_at: now,
        meta,
      };

      let { error } = await supabaseAdmin.from("ci_billing").upsert(payload, {
        onConflict: "email_normalized",
      });

      if (error && isMissingColumnError(error, "plan_interval")) {
        const { plan_interval: _omit, ...fallbackPayload } = payload;

        const retry = await supabaseAdmin
          .from("ci_billing")
          .upsert(fallbackPayload, {
            onConflict: "email_normalized",
          });

        error = retry.error;
      }

      if (error) throw error;
    }

    async function getEmailFromCustomerId(customerId: string | null): Promise<string> {
      if (!customerId) return "";
      try {
        const customer = await stripe.customers.retrieve(customerId);
        return normalizeEmail((customer as any)?.email);
      } catch {
        return "";
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.product_type === "report") {
          const email = normalizeEmail(pickEmailFromSession(session));
          const reportSlug = session.metadata?.report_slug || "ss-27";

          if (!email) {
            console.warn("⚠️ Report purchase completed but no email found", {
              sessionId: session.id,
              reportSlug,
            });
            break;
          }

          const { error: purchaseInsertError } = await supabaseAdmin
            .from("report_purchases")
            .insert({
              stripe_session_id: session.id,
              email,
              report_slug: reportSlug,
            });

          if (purchaseInsertError) {
            if (purchaseInsertError.code === "23505") {
              console.log("Skipping duplicate report email", {
                sessionId: session.id,
                email,
                reportSlug,
              });
              break;
            }

            console.error("❌ report purchase insert error", purchaseInsertError);
            break;
          }

          const downloadUrl = await getReportDownloadUrl("ss-27-trend-report.pdf");

          if (!downloadUrl) {
            console.error("❌ Could not create report download URL", {
              sessionId: session.id,
              reportSlug,
              email,
            });
            break;
          }

          const { sendReportEmail } = await import("@/lib/sendReportEmail");

          await sendReportEmail({
            to: email,
            downloadUrl,
          });

          console.log("📩 REPORT EMAIL SENT", {
            email,
            reportSlug,
          });

          break;
        }

        const customerId = getId(session.customer);
        const subscriptionId = getId(session.subscription);

        const emailFromSession = normalizeEmail(pickEmailFromSession(session));
        const emailFromCustomer = emailFromSession
          ? ""
          : await getEmailFromCustomerId(customerId);
        const email_normalized = emailFromSession || emailFromCustomer;

        let stripeStatus: string | null = null;
        let currentPeriodEnd: string | null = null;
        let stripePriceId: string | null =
          (typeof session.metadata?.stripe_price_id === "string" &&
            session.metadata.stripe_price_id) ||
          null;

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            stripeStatus = sub.status ?? null;
            currentPeriodEnd = toIsoFromUnixSeconds(
              (sub as any).current_period_end ?? null
            );

            stripePriceId =
              (sub.items?.data?.[0] as any)?.price?.id ??
              (sub.items?.data?.[0] as any)?.plan?.id ??
              stripePriceId;
          } catch {}
        }

        if (stripePriceId && !isCiPriceId(stripePriceId)) break;

        const statusToWrite = stripeStatus || "active";
        const planInterval = getPlanIntervalFromPriceId(stripePriceId);

        const updatePayload = {
          status: statusToWrite,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: stripePriceId,
          plan_interval: planInterval,
          cancel_at_period_end: false,
          current_period_end: currentPeriodEnd,
          updated_at: now,
          meta: {
            source: "checkout.session.completed",
            session_id: session.id,
            stripe_status: stripeStatus,
          },
        };

        let updated = false;

        try {
          updated = await updateBillingByStripeIds({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            payload: updatePayload,
          });
        } catch {}

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
            plan_interval: planInterval,
            meta: {
              source: "checkout.session.completed",
              session_id: session.id,
              stripe_status: stripeStatus,
            },
          });
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const subId = sub.id;
        const customerId = getId(sub.customer);
        const stripeStatus = sub.status;
        const normalizedStatus =
          event.type === "customer.subscription.deleted" ? "inactive" : stripeStatus;

        const stripePriceId =
          (sub.items?.data?.[0] as any)?.price?.id ??
          (sub.items?.data?.[0] as any)?.plan?.id ??
          null;

        if (stripePriceId && !isCiPriceId(stripePriceId)) break;

        const planInterval = getPlanIntervalFromPriceId(stripePriceId);

        const payload = {
          status: normalizedStatus,
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          stripe_price_id: stripePriceId,
          plan_interval: planInterval,
          cancel_at_period_end: !!sub.cancel_at_period_end,
          current_period_end: toIsoFromUnixSeconds(
            (sub as any).current_period_end ?? null
          ),
          updated_at: now,
          meta: {
            source: event.type,
            stripe_status: stripeStatus,
          },
        };

        const updated = await updateBillingByStripeIds({
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          payload,
        });

        const email_normalized = await getEmailFromCustomerId(customerId);

        if (!updated && email_normalized) {
          await upsertBillingByEmail({
            email_raw: email_normalized,
            email_normalized,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            stripe_price_id: stripePriceId,
            status: normalizedStatus,
            cancel_at_period_end: !!sub.cancel_at_period_end,
            current_period_end: payload.current_period_end,
            plan_interval: planInterval,
            meta: payload.meta,
          });
        }

        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const customerId = getId(invoice.customer);
        const subscriptionId = getId((invoice as any).subscription);

        const statusToWrite =
          event.type === "invoice.payment_succeeded" ? "active" : "past_due";

        const stripePriceId =
          (invoice.lines?.data?.[0] as any)?.price?.id ??
          (invoice.lines?.data?.[0] as any)?.plan?.id ??
          null;

        if (stripePriceId && !isCiPriceId(stripePriceId)) break;

        const planInterval = getPlanIntervalFromPriceId(stripePriceId);

        const payload = {
          status: statusToWrite,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: stripePriceId,
          plan_interval: planInterval,
          updated_at: now,
          meta: {
            source: event.type,
            invoice_id: invoice.id,
          },
        };

        const updated = await updateBillingByStripeIds({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          payload,
        });

        const email_normalized = await getEmailFromCustomerId(customerId);

        if (!updated && email_normalized) {
          await upsertBillingByEmail({
            email_raw: email_normalized,
            email_normalized,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: stripePriceId,
            status: statusToWrite,
            plan_interval: planInterval,
            meta: payload.meta,
          });
        }

        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error("❌ webhook handler error:", err?.message || err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}