import { NextResponse } from "next/server";
import { getStripeOrNull } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email : "";
    const email_normalized = normalizeEmail(email);
    if (!email_normalized) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const stripe = getStripeOrNull();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured yet" }, { status: 503 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("ci_billing")
      .select("stripe_customer_id")
      .eq("email_normalized", email_normalized)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Unable to find billing record" }, { status: 500 });
    }

    const customer = data?.stripe_customer_id;
    if (!customer) {
      return NextResponse.json(
        { error: "No Stripe customer found for this email" },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${appUrl}/ci`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ portal error:", err?.message || err);
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}