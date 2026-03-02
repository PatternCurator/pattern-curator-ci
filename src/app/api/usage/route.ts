import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
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

// ✅ actions that should count toward the free limit
const COUNTED_ACTIONS = new Set([
  "search",
  "view_board",
  "view_moodboard",
  "view_asset",
  "view_post",
]);

function normalizeAction(raw: any) {
  const a = typeof raw === "string" ? raw.trim() : "";
  return a || "search";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const emailRaw = typeof body.email === "string" ? body.email : "";
    const email_normalized = normalizeEmail(emailRaw);

    const action = normalizeAction(body.action);

    const count =
      typeof body.count === "number" && Number.isFinite(body.count) && body.count > 0
        ? Math.floor(body.count)
        : 1;

    if (!email_normalized || !email_normalized.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const FREE_SEARCH_LIMIT = Number(process.env.FREE_SEARCH_LIMIT ?? "5");

    // ✅ IMPORTANT: your route expects ADMIN_EMAIL_ALLOWLIST (exact name)
    // Example: ADMIN_EMAIL_ALLOWLIST="kristine@patterncurator.com,kristine.r.go@gmail.com"
    const envAllowlist = parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);

    // ✅ Failsafe fallback (so you can’t get locked out even if env var is missing/misnamed)
    const fallbackAllowlist = ["kristine@patterncurator.com", "kristine.r.go@gmail.com"];

    const adminAllowlist = Array.from(new Set([...envAllowlist, ...fallbackAllowlist]));
    const is_admin = adminAllowlist.includes(email_normalized);

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Keep lead updated (best-effort). NOTE: ci_leads.email_normalized is GENERATED -> do NOT write it.
    const { error: leadErr } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email: email_normalized }, { onConflict: "email_normalized" });

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

    // ✅ Admins OR active subscribers are unlimited
    const is_unlimited = is_admin || is_subscriber;

    function usageRow(customAction?: string) {
      return {
        email_normalized,
        action: customAction ?? action,
        created_at: now,
      };
    }

    async function computeFreeUsesCounted() {
      // ✅ count ALL actions that should consume free credits
      const { count: usedCount, error: usedErr } = await supabaseAdmin
        .from("ci_usage")
        .select("*", { count: "exact", head: true })
        .eq("email_normalized", email_normalized)
        .in("action", Array.from(COUNTED_ACTIONS));

      if (usedErr) console.error("❌ ci_usage count error:", usedErr);

      const used = usedCount ?? 0;
      const remaining = Math.max(0, FREE_SEARCH_LIMIT - used);
      return { used, remaining };
    }

    // ✅ Unlimited users: always unlocked
    function unlimitedResponse() {
      const payload: any = {
        ok: true,
        email_normalized,
        is_admin,
        is_subscriber,
        is_unlimited: true,
        billing_status,

        is_unlocked: true,
        limitReached: false,
        requires_subscription: false,

        free_searches: {
          limit: FREE_SEARCH_LIMIT,
          used: 0,
          remaining: 999999,
        },
      };

      if (process.env.NODE_ENV !== "production") {
        payload._debug = {
          envAllowlist,
          fallbackAllowlist,
          finalAllowlist: adminAllowlist,
          matchedEmail: email_normalized,
          is_admin,
        };
      }

      return NextResponse.json(payload);
    }

    // ✅ STATUS: do NOT insert anything.
    if (action === "status") {
      if (is_unlimited) return unlimitedResponse();

      const { used, remaining } = await computeFreeUsesCounted();
      const limitReached = remaining <= 0;

      const payload: any = {
        ok: true,
        email_normalized,
        is_admin,
        is_subscriber,
        is_unlimited: false,
        billing_status,

        is_unlocked: !limitReached,
        limitReached,
        requires_subscription: limitReached,

        free_searches: {
          limit: FREE_SEARCH_LIMIT,
          used,
          remaining,
        },
      };

      if (process.env.NODE_ENV !== "production") {
        payload._debug = {
          envAllowlist,
          fallbackAllowlist,
          finalAllowlist: adminAllowlist,
          matchedEmail: email_normalized,
          is_admin,
        };
      }

      return NextResponse.json(payload);
    }

    // ✅ If action is not counted, just log it (optional analytics) and return current entitlement
    if (!COUNTED_ACTIONS.has(action)) {
      const rows = Array.from({ length: count }, () => usageRow(action));
      const { error } = await supabaseAdmin.from("ci_usage").insert(rows);

      if (error) {
        console.error("❌ ci_usage insert error:", error);
        return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
      }

      if (is_unlimited) return unlimitedResponse();

      const { used, remaining } = await computeFreeUsesCounted();
      const limitReached = remaining <= 0;

      return NextResponse.json({
        ok: true,
        email_normalized,
        is_admin,
        is_subscriber,
        is_unlimited: false,
        billing_status,

        is_unlocked: !limitReached,
        limitReached,
        requires_subscription: limitReached,

        free_searches: {
          limit: FREE_SEARCH_LIMIT,
          used,
          remaining,
        },
      });
    }

    // ✅ UNLIMITED USERS: optionally log counted actions (subscribers) but always unlocked
    if (is_unlimited) {
      // Recommended: do not insert admin usage (keeps logs clean)
      // Keep subscriber logging if you want analytics:
      if (!is_admin) {
        const rows = Array.from({ length: count }, () => usageRow(action));
        const { error } = await supabaseAdmin.from("ci_usage").insert(rows);

        if (error) {
          console.error("❌ ci_usage insert error:", error);
          return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
        }
      }

      return unlimitedResponse();
    }

    // ✅ FREE USERS: enforce cap for ANY counted action (search + view_*)
    const { count: usedBefore, error: usedErr } = await supabaseAdmin
      .from("ci_usage")
      .select("*", { count: "exact", head: true })
      .eq("email_normalized", email_normalized)
      .in("action", Array.from(COUNTED_ACTIONS));

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

          is_unlocked: false,
          limitReached: true,
          requires_subscription: true,

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

    // Insert the counted action (search OR view_*)
    const rows = Array.from({ length: toInsert }, () => usageRow(action));
    const { error: insertErr } = await supabaseAdmin.from("ci_usage").insert(rows);

    if (insertErr) {
      console.error("❌ ci_usage insert error:", insertErr);
      return NextResponse.json({ error: "Usage insert failed" }, { status: 500 });
    }

    const usedAfter = used + toInsert;
    const remainingAfter = Math.max(0, FREE_SEARCH_LIMIT - usedAfter);
    const limitReached = remainingAfter <= 0;

    return NextResponse.json({
      ok: true,
      email_normalized,
      is_admin,
      is_subscriber,
      is_unlimited: false,
      billing_status,

      is_unlocked: true,
      limitReached,
      requires_subscription: limitReached,

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