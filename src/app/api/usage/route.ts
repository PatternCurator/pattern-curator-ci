import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseAllowlist(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isActiveBillingStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const emailRaw = typeof body.email === "string" ? body.email : "";
    const email = normalizeEmail(emailRaw);
    const email_normalized = email;

    const action = typeof body.action === "string" ? body.action : "search";
    const count = typeof body.count === "number" && body.count > 0 ? body.count : 1;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const FREE_SEARCH_LIMIT = Number(process.env.FREE_SEARCH_LIMIT ?? "5");
    const adminAllowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
    const is_admin = adminAllowlist.includes(email_normalized);

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Keep lead updated (IMPORTANT: ci_leads.email_normalized is GENERATED -> do NOT write it)
    const { error: leadErr } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email }, { onConflict: "email_normalized" });

    if (leadErr) console.error("❌ ci_leads upsert error:", leadErr);

    // Billing lookup (entitlement)
    const { data: billing, error: billingErr } = await supabaseAdmin
      .from("ci_billing")
      .select("status")
      .eq("email_normalized", email_normalized)
      .maybeSingle();

    if (billingErr) console.error("❌ ci_billing select error:", billingErr);

    const billing_status = billing?.status ?? null;
    const is_subscriber = isActiveBillingStatus(billing_status);
    const is_unlimited = is_admin || is_subscriber;

    function usageRow(customAction?: string) {
      return {
        email_normalized,
        action: customAction ?? action,
        created_at: now,
      };
    }

    // Non-search action: log and return
    if (action !== "search") {
      const rows = Array.from({ length: count }, () => usageRow());
      const { error } = await supabaseAdmin.from("ci_usage").insert(rows);

      if (error) {
        console.error("❌ ci_usage insert error:", error);
        return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        email_normalized,
        is_admin,
        is_subscriber,
        is_unlimited,
        billing_status,
        free_searches: {
          limit: FREE_SEARCH_LIMIT,
          used: 0,
          remaining: FREE_SEARCH_LIMIT,
        },
      });
    }

    // Unlimited: log but do not enforce
    if (is_unlimited) {
      const rows = Array.from({ length: count }, () => usageRow("search"));
      const { error } = await supabaseAdmin.from("ci_usage").insert(rows);

      if (error) {
        console.error("❌ ci_usage insert error:", error);
        return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        email_normalized,
        is_admin,
        is_subscriber,
        is_unlimited: true,
        billing_status,
        free_searches: {
          limit: FREE_SEARCH_LIMIT,
          used: null,
          remaining: null,
        },
      });
    }

    // Enforce limit: count searches used
    const { count: usedBefore, error: usedErr } = await supabaseAdmin
      .from("ci_usage")
      .select("*", { count: "exact", head: true })
      .eq("email_normalized", email_normalized)
      .eq("action", "search");

    if (usedErr) console.error("❌ ci_usage count error:", usedErr);

    const used = usedBefore ?? 0;

    if (used >= FREE_SEARCH_LIMIT) {
      return NextResponse.json(
        {
          ok: true,
          email_normalized,
          is_admin,
          is_subscriber,
          is_unlimited: false,
          billing_status,
          free_searches: {
            limit: FREE_SEARCH_LIMIT,
            used,
            remaining: 0,
          },
        },
        { status: 402 }
      );
    }

    const remainingBefore = Math.max(0, FREE_SEARCH_LIMIT - used);
    const toInsert = Math.min(count, remainingBefore);

    const rows = Array.from({ length: toInsert }, () => usageRow("search"));
    const { error: insertErr } = await supabaseAdmin.from("ci_usage").insert(rows);

    if (insertErr) {
      console.error("❌ ci_usage insert error:", insertErr);
      return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
    }

    const usedAfter = used + toInsert;
    const remainingAfter = Math.max(0, FREE_SEARCH_LIMIT - usedAfter);

    return NextResponse.json({
      ok: true,
      email_normalized,
      is_admin,
      is_subscriber,
      is_unlimited: false,
      billing_status,
      free_searches: {
        limit: FREE_SEARCH_LIMIT,
        used: usedAfter,
        remaining: remainingAfter,
      },
    });
  } catch (err: any) {
    console.error("❌ api/usage error:", err?.message || err);
    return NextResponse.json({ error: "Usage route failed" }, { status: 500 });
  }
}