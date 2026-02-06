import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const FREE_SEARCHES = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email : "";
    const source = typeof body.source === "string" ? body.source : null;

    const emailNorm = normalizeEmail(email);

    if (!emailNorm || !emailNorm.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("ci_leads")
      .upsert(
        { email: emailNorm, source: source ?? undefined },
        { onConflict: "email_normalized" }
      )
      .select("id, email, email_normalized, created_at")
      .single();

    if (leadErr) {
      console.error("ci_leads upsert error:", leadErr);
      return NextResponse.json({ error: "Could not save email" }, { status: 500 });
    }

    const { count, error: countErr } = await supabaseAdmin
      .from("ci_usage")
      .select("*", { count: "exact", head: true })
      .eq("email_normalized", lead.email_normalized)
      .eq("action", "search");

    if (countErr) {
      console.error("ci_usage count error:", countErr);
      return NextResponse.json({ error: "Could not read usage" }, { status: 500 });
    }

    const used = count ?? 0;
    const remaining = Math.max(0, FREE_SEARCHES - used);

    return NextResponse.json({
      lead: {
        id: lead.id,
        email: lead.email,
        created_at: lead.created_at,
      },
      free_searches: {
        limit: FREE_SEARCHES,
        used,
        remaining,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
