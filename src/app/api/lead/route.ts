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
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const email = normalizeEmail(emailRaw);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // IMPORTANT: email_normalized is GENERATED in DB; do NOT set it.
    const { error } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email }, { onConflict: "email_normalized" });

    if (error) {
      console.error("❌ ci_leads upsert error:", error);
      return NextResponse.json({ error: "Lead save failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ api/lead error:", err?.message || err);
    return NextResponse.json({ error: "Lead save failed" }, { status: 500 });
  }
}
