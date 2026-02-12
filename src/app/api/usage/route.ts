import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FREE_LIMIT = 5;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = typeof body?.email === "string" ? body.email : "";
    const action = typeof body?.action === "string" ? body.action : "search";
    const q = typeof body?.q === "string" ? body.q : null;

    const email_normalized = normalizeEmail(email);

    if (!email_normalized || !isValidEmail(email_normalized)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Ensure lead exists (ci_leads.email_normalized may be GENERATED → write to email)
    const { error: leadErr } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email: email_normalized }, { onConflict: "email_normalized" });

    if (leadErr) {
      console.error("ci_leads upsert error:", leadErr);
      return NextResponse.json({ error: "Could not save lead" }, { status: 500 });
    }

    // Check billing status by email_normalized
    const { data: billing, error: billingErr } = await supabaseAdmin
      .from("ci_billing")
      .select("status")
      .eq("email_normalized", email_normalized)
      .maybeSingle();

    if (billingErr) {
      console.error("ci_billing read error:", billingErr);
      // don't block usage if billing read fails; treat as free
    }

    const isPaid = billing?.status === "active";

    // Paid users bypass limit (optionally still log usage)
    if (isPaid) {
      await supabaseAdmin.from("ci_usage").insert({
        email_normalized,
        action,
        q,
        meta: { paid: true },
      });

      return NextResponse.json({
        ok: true,
        paid: true,
        free_searches: { limit: FREE_LIMIT, used: 0, remaining: FREE_LIMIT },
      });
    }

    // Free users: count distinct searches by q (or just count searches)
    // If you decrement based on URL q uniqueness, keep q required for "search"
    if (action === "search" && (!q || q.trim().length === 0)) {
      return NextResponse.json({ error: "Missing q" }, { status: 400 });
    }

    // Log the event first (you can also log after computing; either is fine)
    const { error: usageInsertErr } = await supabaseAdmin.from("ci_usage").insert({
      email_normalized,
      action,
      q,
      meta: { paid: false },
    });

    if (usageInsertErr) {
      console.error("ci_usage insert error:", usageInsertErr);
      return NextResponse.json({ error: "Usage log failed" }, { status: 500 });
    }

    // Count used free searches.
    // If you want “decrement based on URL q”, count DISTINCT q for action=search.
    const { data: usedRows, error: usedErr } = await supabaseAdmin
      .from("ci_usage")
      .select("q")
      .eq("email_normalized", email_normalized)
      .eq("action", "search")
      .not("q", "is", null);

    if (usedErr) {
      console.error("ci_usage read error:", usedErr);
      return NextResponse.json({ error: "Usage read failed" }, { status: 500 });
    }

    const distinctQs = new Set((usedRows ?? []).map((r: any) => String(r.q)));
    const used = distinctQs.size;

    const remaining = Math.max(0, FREE_LIMIT - used);
    const blocked = remaining <= 0;

    return NextResponse.json({
      ok: true,
      paid: false,
      blocked,
      free_searches: { limit: FREE_LIMIT, used, remaining },
    });
  } catch (e: any) {
    console.error("usage route error:", e?.message);
    return NextResponse.json({ error: "Could not process usage" }, { status: 500 });
  }
}
