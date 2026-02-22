import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPrompt(boardTitle: string, notes: string, query: string) {
  return `
You are Pattern Curator CI.

Translate the following direction into the specified product application.

BOARD TITLE:
${boardTitle}

CURATORIAL NOTES:
${notes}

PRODUCT APPLICATION QUERY:
${query}

Return markdown using ONLY these sections:

## Direction Translation
## Color Strategy
## Print and Surface Application
## Fabric and Construction
## Assortment Strategy
## Commercial Read

Be concise. Strategic. Specific.
Avoid generic language.
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const emailRaw = typeof body.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    const boardTitle =
      typeof body.boardTitle === "string" ? body.boardTitle : "";
    const boardNotes =
      typeof body.boardNotes === "string" ? body.boardNotes : "";
    const query =
      typeof body.query === "string" ? body.query.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Missing query" },
        { status: 400 }
      );
    }

    // ------------------------------
    // ADMIN + BILLING CHECK
    // ------------------------------

    const supabaseAdmin = getSupabaseAdmin();

    const adminAllowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const is_admin = adminAllowlist.includes(email);

    const { data: billing } = await supabaseAdmin
      .from("ci_billing")
      .select("status")
      .eq("email_normalized", email)
      .maybeSingle();

    const billing_status = billing?.status ?? null;
    const is_subscriber =
      billing_status === "active" || billing_status === "trialing";

    const is_unlocked = is_admin || is_subscriber;

    // ------------------------------
    // OPENAI GENERATION
    // ------------------------------

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const prompt = buildPrompt(boardTitle, boardNotes, query);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Pattern Curator CI. Write in a restrained, editorial, strategic tone.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const text =
      completion.choices?.[0]?.message?.content ||
      "No response generated.";

    // ------------------------------
    // PREVIEW LOGIC FOR FREE USERS
    // ------------------------------

    if (!is_unlocked) {
      const previewMatch = text.match(
        /## Direction Translation([\s\S]*?)## Print and Surface Application/i
      );

      const preview = previewMatch
        ? previewMatch[0].trim()
        : text.slice(0, 600);

      return NextResponse.json({
        text: preview,
        preview: true,
      });
    }

    // ------------------------------
    // FULL RESPONSE FOR PAID
    // ------------------------------

    return NextResponse.json({
      text,
      preview: false,
    });
  } catch (err: any) {
    console.error("APPLICATION QUERY ERROR:", err?.message || err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}