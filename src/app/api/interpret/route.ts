import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lazy-init OpenAI so missing keys don't crash module init in production
function getOpenAIOrNull() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function parseDomainOptions(domainRaw: string | null | undefined): string[] {
  if (!domainRaw) return [];
  return domainRaw
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function fallbackResponse(mode: "board" | "asset", domainOptions: string[] = []) {
  // Keep shape consistent so UI can render without "server error"
  return {
    curatorial_summary:
      mode === "asset"
        ? "Interpretation is temporarily unavailable. Please try again in a moment."
        : "Curatorial interpretation is temporarily unavailable. Please try again in a moment.",
    why_it_matters: [],
    context_pulse: [],
    why_by_domain:
      mode === "asset"
        ? domainOptions.reduce<Record<string, string>>((acc, d) => {
            acc[d] = "";
            return acc;
          }, {})
        : {},
    ai_error: true, // optional signal for UI
  };
}

function safeString(x: any) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

export async function POST(req: Request) {
  // Always return JSON; never throw an unhandled error for beta stability.
  try {
    const body = await req.json().catch(() => ({} as any));

    const mode: "board" | "asset" = body?.mode === "asset" ? "asset" : "board";
    const q: string = safeString(body?.q ?? "");
    const assets = Array.isArray(body?.assets) ? body.assets : [];
    const asset = body?.asset && typeof body.asset === "object" ? body.asset : null;

    // Input validation (these are truly client errors)
    if (mode === "board") {
      if (!q || assets.length === 0) {
        return NextResponse.json({ error: "Missing query or assets" }, { status: 400 });
      }
    }
    if (mode === "asset" && !asset) {
      return NextResponse.json({ error: "Missing asset" }, { status: 400 });
    }

    const compactAssets = assets.slice(0, 9).map((a: any) => ({
      title: a?.title ?? null,
      domain: a?.domain ?? null,
      direction: a?.direction ?? null,
      color_notes: a?.color_notes ?? null,
      print_pattern_notes: a?.print_pattern_notes ?? null,
    }));

    const compactAsset =
      mode === "asset"
        ? {
            title: asset?.title ?? null,
            domain: asset?.domain ?? null,
            direction: asset?.direction ?? null,
            color_notes: asset?.color_notes ?? null,
            print_pattern_notes: asset?.print_pattern_notes ?? null,
          }
        : null;

    const domainOptions = mode === "asset" ? parseDomainOptions(compactAsset?.domain ?? null) : [];

    // If OpenAI isn't configured, do NOT 500 — return fallback 200
    const openai = getOpenAIOrNull();
    if (!openai) {
      return NextResponse.json(fallbackResponse(mode, domainOptions), { status: 200 });
    }

    const systemPrompt = `
You are Pattern Curator Curatorial Intelligence (CI).

Rules:
- Interpretation only. No forecasting. No trend-report language.
- Ground all insight in the provided metadata.
- Write for experienced creatives.
- Calm, editorial, intelligent tone.
- No taxonomy explanations.
- No repetition.
- Output valid JSON ONLY.

Return this exact JSON shape:
{
  "curatorial_summary": "3–4 sentences max.",
  "why_it_matters": ["bullet 1", "bullet 2", "bullet 3"],
  "context_pulse": ["bullet 1", "bullet 2", "bullet 3"],
  "why_by_domain": { "domain": "One sentence." }
}

Constraints:
- Bullets max ~12 words.
- why_by_domain:
  - ONLY include keys for the provided domain options (verbatim).
  - One sentence per domain (<= 22 words).
  - No bullets inside values.
- For SINGLE ASSET mode:
  - Interpret ONLY the single asset.
  - In the curatorial_summary, include ONE subtle line suggesting where this asset can be curated.
  - Use ONLY the provided domain options verbatim.
- For CURATED BOARD mode:
  - You may omit why_by_domain or return it as {}.
`.trim();

    const userPrompt =
      mode === "asset"
        ? `
MODE: SINGLE ASSET

Asset:
${JSON.stringify(compactAsset, null, 2)}

Domain options (use verbatim, do not invent):
${JSON.stringify(domainOptions, null, 2)}

Instructions:
- Write grounded interpretation of this asset only.
- Include one line in the summary suggesting curation across the domain options.
- Then create why_by_domain with one sentence per provided domain option.
`.trim()
        : `
MODE: CURATED BOARD

Search query:
"${q}"

Assets:
${JSON.stringify(compactAssets, null, 2)}

Instructions:
- Interpret the set as a cohesive curated story.
- Do not forecast.
`.trim();

    const model = process.env.OPENAI_MODEL || "gpt-4o";

    let content: string | null = null;

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" } as any,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      content = completion?.choices?.[0]?.message?.content ?? null;
    } catch (err: any) {
      // OpenAI request failed (quota/rate limit/network/etc.) → return fallback 200
      console.error("Interpret OpenAI call failed:", err?.message || err);
      return NextResponse.json(fallbackResponse(mode, domainOptions), { status: 200 });
    }

    if (!content) {
      // Model returned no content → return fallback 200
      return NextResponse.json(fallbackResponse(mode, domainOptions), { status: 200 });
    }

    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err: any) {
      console.error("Interpret JSON parse failed:", err?.message || err, { raw: cleaned });
      return NextResponse.json(fallbackResponse(mode, domainOptions), { status: 200 });
    }

    const base = {
      curatorial_summary: safeString(parsed?.curatorial_summary).trim(),
      why_it_matters: Array.isArray(parsed?.why_it_matters) ? parsed.why_it_matters.map(safeString).slice(0, 5) : [],
      context_pulse: Array.isArray(parsed?.context_pulse) ? parsed.context_pulse.map(safeString).slice(0, 5) : [],
      why_by_domain:
        parsed?.why_by_domain && typeof parsed.why_by_domain === "object" && !Array.isArray(parsed.why_by_domain)
          ? parsed.why_by_domain
          : {},
    };

    return NextResponse.json(base, { status: 200 });
  } catch (err: any) {
    // Absolute last resort: still do NOT 500 the UX path
    console.error("Interpret API fatal error:", err?.message || err);
    return NextResponse.json(
      {
        curatorial_summary: "Interpretation is temporarily unavailable. Please try again in a moment.",
        why_it_matters: [],
        context_pulse: [],
        why_by_domain: {},
        ai_error: true,
      },
      { status: 200 }
    );
  }
}
