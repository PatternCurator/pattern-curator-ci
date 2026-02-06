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
    const action = typeof body.action === "string" ? body.action : "search";
    const q = typeof body.q === "string" ? body.q : null;
    const anonId = typeof body.anon_id === "string" ? body.anon_id : null;
    const meta = typeof body.meta === "object" && body.meta ? body.meta : null;

    const emailNorm = normalizeEmail(email);

    if (!emailNorm || !emailNorm.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // (Optional but helpful): ensure lead exists
    const { error: leadErr } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email: emailNorm }, { onConflict: "email_normalized" });

    if (leadErr) {
      console.error("ci_leads upsert error:", leadErr);
      return NextResponse.json({ error: "Could not validate email" }, { status: 500 });
    }

    // Count used searches
    const { count, error: countErr } = await supabaseAdmin
      .from("ci_usage")
      .select("*", { count: "exact", head: true })
      .eq("email_normalized", emailNorm)
      .eq("action", "search");

    if (countErr) {
      console.error("ci_usage count error:", countErr);
      return NextResponse.json({ error: "Could not read usage" }, { status: 500 });
    }

    const used = count ?? 0;
    const remaining = Math.max(0, FREE_SEARCHES - used);

    if (remaining <= 0) {
      return NextResponse.json(
        {
          free_searches: { limit: FREE_SEARCHES, used, remaining: 0 },
          error: "Free search limit reached",
        },
        { status: 402 }
      );
    }

    // Log this usage
    const { error: insErr } = await supabaseAdmin.from("ci_usage").insert({
      email_normalized: emailNorm,
      anon_id: anonId ?? undefined,
      action,
      q: q ?? undefined,
      meta: meta ?? undefined,
    });

    if (insErr) {
      console.error("ci_usage insert error:", insErr);
      return NextResponse.json({ error: "Could not log usage" }, { status: 500 });
    }

    const usedAfter = used + 1;
    const remainingAfter = Math.max(0, FREE_SEARCHES - usedAfter);

    return NextResponse.json({
      free_searches: { limit: FREE_SEARCHES, used: usedAfter, remaining: remainingAfter },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

