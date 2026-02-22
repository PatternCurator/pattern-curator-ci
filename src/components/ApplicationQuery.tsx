"use client";

import { useState } from "react";

export default function ApplicationQuery({
  boardTitle,
  boardNotes,
}: {
  boardTitle?: string | null;
  boardNotes?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerate() {
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/application-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardTitle,
          boardNotes,
          query,
        }),
      });

      const data = await res.json();
      setResult(data.text || "Error generating response.");
    } catch (err) {
      setResult("Error generating response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 border-t border-neutral-200 pt-6">
      <div className="space-y-3">
        <div className="text-[11px] uppercase tracking-widest font-bold text-neutral-600">
          Enter product application query
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. swim, lounge, knit tops"
          className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none"
        />

        <button
          onClick={handleGenerate}
          className="mt-2 px-4 py-2 border border-neutral-300 text-xs uppercase tracking-wide"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {result && (
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-neutral-600">
            {result.split("\n").map((line, i) => {
              const trimmed = line.trim();

              // Handle markdown headings like ## Heading
              if (trimmed.startsWith("##")) {
                const cleanHeading = trimmed.replace(/^##+\s*/, "");

                return (
                  <div
                    key={i}
                    className="font-bold text-neutral-700 pt-4"
                  >
                    {cleanHeading}
                  </div>
                );
              }

              // Empty line spacing
              if (!trimmed) {
                return <div key={i} className="h-2" />;
              }

              return <div key={i}>{line}</div>;
            })}
          </div>
        )}
      </div>
    </section>
  );
}