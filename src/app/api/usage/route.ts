// src/app/api/usage/route.ts
import { NextResponse } from "next/server";
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

    const action = typeof body.action === "string" ? body.action : "search";
    const count = typeof body.count === "number" && body.count > 0 ? body.count : 1;

    if (!email_normalized) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // keep lead updated
    const { error: leadErr } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email, email_normalized }, { onConflict: "email_normalized" });

    if (leadErr) console.error("❌ ci_leads upsert error:", leadErr);

    // billing lookup (optional for gating)
    const { data: billing, error: billingErr } = await supabaseAdmin
      .from("ci_billing")
      .select("*")
      .eq("email_normalized", email_normalized)
      .maybeSingle();

    if (billingErr) console.error("❌ ci_billing select error:", billingErr);

    // insert usage
    const now = new Date().toISOString();

    if (count === 1) {
      const { error } = await supabaseAdmin.from("ci_usage").insert({
        email,
        email_normalized,
        action,
        created_at: now,
      });

      if (error) {
        console.error("❌ ci_usage insert error:", error);
        return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
      }
    } else {
      const rows = Array.from({ length: count }, () => ({
        email,
        email_normalized,
        action,
        created_at: now,
      }));

      const { error } = await supabaseAdmin.from("ci_usage").insert(rows);

      if (error) {
        console.error("❌ ci_usage bulk insert error:", error);
        return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
      }
    }

    // count usage
    const { count: usedCount, error: usedErr } = await supabaseAdmin
      .from("ci_usage")
      .select("*", { count: "exact", head: true })
      .eq("email_normalized", email_normalized);

    if (usedErr) console.error("❌ ci_usage count error:", usedErr);

    return NextResponse.json({
      ok: true,
      email_normalized,
      used: usedCount ?? null,
      billing: billing ?? null,
    });
  } catch (err: any) {
    console.error("❌ api/usage error:", err?.message || err);
    return NextResponse.json({ error: "Usage route failed" }, { status: 500 });
  }
}
