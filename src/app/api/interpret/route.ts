import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseDomainOptions(domainRaw: string | null | undefined): string[] {
  if (!domainRaw) return [];
  return domainRaw
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const mode: "board" | "asset" =
      body?.mode === "asset" ? "asset" : "board";

    /* ----------------------------
       BOARD MODE (existing behavior)
    ----------------------------- */
    const q: string = (body?.q ?? "").toString();
    const assets = Array.isArray(body?.assets) ? body.assets : [];

    /* ----------------------------
       SINGLE ASSET MODE
    ----------------------------- */
    const asset =
      body?.asset && typeof body.asset === "object" ? body.asset : null;

    if (mode === "board") {
      if (!q || assets.length === 0) {
        return NextResponse.json(
          { error: "Missing query or assets" },
          { status: 400 }
        );
      }
    }

    if (mode === "asset" && !asset) {
      return NextResponse.json(
        { error: "Missing asset" },
        { status: 400 }
      );
    }

    const compactAssets = assets.slice(0, 9).map((a: any) => ({
      title: a.title,
      domain: a.domain,
      direction: a.direction,
      color_notes: a.color_notes,
      print_pattern_notes: a.print_pattern_notes,
    }));

    const compactAsset =
      mode === "asset"
        ? {
            title: asset.title ?? null,
            domain: asset.domain ?? null,
            direction: asset.direction ?? null,
            color_notes: asset.color_notes ?? null,
            print_pattern_notes: asset.print_pattern_notes ?? null,
          }
        : null;

    const domainOptions =
      mode === "asset"
        ? parseDomainOptions(compactAsset?.domain ?? null)
        : [];

    /* ----------------------------
       PROMPT (Pattern Curator CI)
    ----------------------------- */
    const systemPrompt = `
You are Pattern Curator Curatorial Intelligence (CI).
- For BOARD mode only, generate a short board_title (2 words max, Pattern Curator voice).
- For SINGLE ASSET mode, do NOT generate a title.

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
  "context_pulse": ["bullet 1", "bullet 2", "bullet 3"]
}

Constraints:
- Bullets max ~12 words.
- For SINGLE ASSET mode:
  - Interpret ONLY the single asset.
  - In the curatorial_summary, include ONE subtle line suggesting where this asset can be curated.
  - Use ONLY the provided domain options verbatim.
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

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" } as any,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content =
      completion?.choices?.[0]?.message?.content ?? null;

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from model" },
        { status: 500 }
      );
    }

    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from model", raw: cleaned },
        { status: 500 }
      );
    }

    const base = {
  curatorial_summary: String(parsed?.curatorial_summary ?? "").trim(),
  why_it_matters: Array.isArray(parsed?.why_it_matters)
    ? parsed.why_it_matters.map(String).slice(0, 5)
    : [],
  context_pulse: Array.isArray(parsed?.context_pulse)
    ? parsed.context_pulse.map(String).slice(0, 5)
    : [],
};

// ✅ Board mode ONLY: restore board_title
if (mode === "board") {
  return NextResponse.json({
    board_title: String(parsed?.board_title ?? "").trim(),
    ...base,
  });
}

// ✅ Asset mode: NO title
return NextResponse.json(base);

  } catch (err: any) {
    console.error("Interpret API error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
