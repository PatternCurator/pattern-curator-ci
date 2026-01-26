"use client";

import { useEffect, useMemo, useState } from "react";

type Interpretation = {
  curatorial_summary: string;
  why_it_matters: string[];
  context_pulse: string[];
};

function domainLine(domain: string | null | undefined) {
  if (!domain) return null;

  const parts = domain
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  return parts.join(" • ");
}

export default function AssetInterpretation({
  asset,
  showMeta = true,
}: {
  asset: any;
  showMeta?: boolean;
}) {

  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<Interpretation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      mode: "asset",
      asset: {
        title: asset.title ?? null,
        domain: asset.domain ?? null,
        direction: asset.direction ?? null,
        color_notes: asset.color_notes ?? null,
        print_pattern_notes: asset.print_pattern_notes ?? null,
      },
    }),
    [asset]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
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
  }, [payload]);

  const domainTopLine = domainLine(asset?.domain);

  return (
    <div className="mt-6 rounded-2xl border border-black/5 bg-white p-4">
        {/* toggle (top-right) */}
    <div className="flex justify-end">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-xs text-zinc-500 hover:text-zinc-700"
      >
        {collapsed ? "Show interpretation" : "Hide interpretation"}
      </button>
    </div>

     {!collapsed && (
  <>
    {/* prompt-style line (no verb) */}
    {showMeta && domainTopLine ? (
  <div className="mb-2 text-xs text-zinc-500 italic">
    {domainTopLine}
  </div>
) : null}


    {data ? (
      <div className="space-y-3">
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
  </>
)}

    </div>
  );
}
