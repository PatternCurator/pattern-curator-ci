import { NextRequest, NextResponse } from "next/server";
import { getStripeOrNull } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeOrNull();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const slug = body?.slug;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing report slug" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price: report.stripe_price_id,
          quantity: 1,
        },
      ],

      success_url: `${appUrl}/reports/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${appUrl}/reports/${report.slug}`,

      metadata: {
        product_type: "report",
        report_slug: report.slug,
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (err: any) {
    console.error("❌ report checkout error:", err);

    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}