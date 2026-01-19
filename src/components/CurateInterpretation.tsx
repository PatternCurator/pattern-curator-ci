"use client";

import { useEffect, useMemo, useState } from "react";

type Interpretation = {
  board_title: string;
  curatorial_summary: string;
  why_it_matters: string[];
  context_pulse: string[];
};

export default function CurateInterpretation({
  q,
  assets,
}: {
  q: string;
  assets: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Interpretation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      q,
      assets: assets.slice(0, 9).map((a: any) => ({
        title: a.title,
        domain: a.domain,
        direction: a.direction,
        color_notes: a.color_notes,
        print_pattern_notes: a.print_pattern_notes,
      })),
    }),
    [q, assets]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!q.trim() || !assets.length) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json?.error ?? "AI generation failed.");
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) setData(json as Interpretation);
        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "AI request failed.");
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [payload, q, assets.length]);

  if (!q.trim()) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      {loading ? (
        <div className="text-sm text-zinc-500">Generating interpretation…</div>
      ) : null}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {data ? (
        <div className="space-y-3">
          <div className="text-base font-semibold">
            {data.board_title || q}
          </div>


          <div className="text-sm leading-relaxed text-zinc-700">
            {data.curatorial_summary}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Why This Matters
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {data.why_it_matters.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Context Pulse
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {data.context_pulse.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
