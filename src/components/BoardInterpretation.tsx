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
  const [collapsed, setCollapsed] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Domain stays in prompt (AI uses it) but is NOT shown in UI
  const basePrompt = useMemo(() => {
    return `
You are Pattern Curator. Write concise editorial notes for a mood board image.

Context:
- Title: ${title}
- Domain: ${domain}
- Direction: ${direction}
- Color notes: ${colorNotes}
- Print + pattern notes: ${printPatternNotes}

Output:
- Curatorial summary (short, authored)
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
      setResult(json.text ?? json.result ?? JSON.stringify(json, null, 2));
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-black/5 bg-white p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Curatorial Intelligence Notes
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            {collapsed ? "Show interpretation" : "Hide interpretation"}
          </button>

          <button
            onClick={runInterpretation}
            disabled={loading}
            className="rounded-full border px-4 py-1.5 text-xs"
            style={{ borderColor: "#B8B9B6", color: "#707376ff" }}
          >
            {loading ? "Working…" : "Generate"}
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div className="mt-4">
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : null}

          {result ? (
            <div className="space-y-3 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {result}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">
              Click Generate to create notes for this board.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}