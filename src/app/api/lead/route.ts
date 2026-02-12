import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";

    const email_normalized = normalizeEmail(email);

    if (!email_normalized || !isValidEmail(email_normalized)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // IMPORTANT:
    // If ci_leads.email_normalized is generated, you must NOT insert into it.
    // Insert into `email` and use onConflict on email_normalized.
    const { error } = await supabaseAdmin
      .from("ci_leads")
      .upsert({ email: email_normalized }, { onConflict: "email_normalized" });

    if (error) {
      console.error("ci_leads upsert error:", error);
      return NextResponse.json({ error: "Lead save failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e?.message);
    return NextResponse.json({ error: "Lead save failed" }, { status: 500 });
  }
}
