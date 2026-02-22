import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function clean(s: unknown, max = 6000) {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

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

    const boardTitle = clean(body.boardTitle);
    const boardNotes = clean(body.boardNotes);
    const query = clean(body.query, 200);

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildPrompt(boardTitle, boardNotes, query);

    const model = process.env.OPENAI_MODEL || "gpt-4o";
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      completion.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("APPLICATION QUERY ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}