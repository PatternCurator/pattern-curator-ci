"use client";

import { useMemo, useState } from "react";

export default function BoardInterpretation({
  boardId,
  title,
  direction,
  colorNotes,
  printPatternNotes,
  domain,
  imageUrl,
}: {
  boardId: string;
  title: string;
  direction: string;
  colorNotes: string;
  printPatternNotes: string;
  domain: string;
  imageUrl: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const basePrompt = useMemo(() => {
    // Keep it aligned with your Pattern Curator voice & no seasons.
    return `
You are Pattern Curator. Write concise editorial notes for a mood board image.

Context:
- Title: ${title}
- Domain: ${domain}
- Direction: ${direction}
- Color notes: ${colorNotes}
- Print + pattern notes: ${printPatternNotes}

Output:
- Curator notes (short, authored)
- Why this matters (practical)
- Context pulse (signals happening now)

No seasons. Not prescriptive—directional.
`.trim();
  }, [title, domain, direction, colorNotes, printPatternNotes]);

  async function runInterpretation() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "board",
          id: boardId,
          imageUrl,
          prompt: basePrompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const json = await res.json();
      // Expecting { text: "..." } or similar
      setResult(json.text ?? json.result ?? JSON.stringify(json, null, 2));
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Curator notes</div>
        <button
          onClick={runInterpretation}
          disabled={loading}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {loading ? "Working…" : "Generate"}
        </button>
      </div>

      <textarea
        value={basePrompt}
        readOnly
        className="mb-3 h-28 w-full resize-none rounded-lg border p-3 text-xs opacity-80"
      />

      {error ? (
        <div className="rounded-lg border p-3 text-sm">
          <div className="font-medium">Error</div>
          <div className="mt-1 opacity-80">{error}</div>
        </div>
      ) : null}

      {result ? (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
          {result}
        </div>
      ) : (
        <div className="text-sm opacity-70">
          Click Generate to create notes for this board.
        </div>
      )}
    </div>
  );
}
