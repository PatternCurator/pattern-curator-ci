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
  const [preview, setPreview] = useState(false);

  async function handleGenerate() {
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setPreview(false);

    try {
      const res = await fetch("/api/application-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localStorage.getItem("pc_ci_email"),
          boardTitle,
          boardNotes,
          query,
        }),
      });

      const data = await res.json();

      if (data.preview) {
        setResult(data.text);
        setPreview(true);
      } else {
        setResult(data.text || "Error generating response.");
        setPreview(false);
      }
    } catch {
      setResult("Error generating response.");
      setPreview(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 border-t border-neutral-200 pt-6">
      <div className="space-y-3">

        <div className="text-[11px] uppercase tracking-widest text-neutral-600">
          Enter the category you want to apply this board to
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

        {/* RESULT BLOCK */}
        {result && (
          <div className="mt-6 text-sm leading-relaxed text-neutral-600">

            {/* Preview Container */}
            <div className="relative overflow-hidden">

              <div className="space-y-3">
                {result.split("\n").map((line, i) => {
                  const trimmed = line.trim();

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

                  if (!trimmed) {
                    return <div key={i} className="h-2" />;
                  }

                  return <div key={i}>{line}</div>;
                })}
              </div>

              {/* Soft fade only if preview */}
              {preview && (
                <>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent" />

                  <div className="absolute bottom-4 left-0 right-0 text-center text-neutral-500 italic text-sm">
                    Continue reading…
                  </div>
                </>
              )}
            </div>

            {/* Upgrade Section */}
            {preview && (
              <div className="pt-10 space-y-4">
                <div>
                  To access the full application insight, upgrade to a paid subscription.
                </div>

                <div className="flex gap-4 pt-2">
                  <a
                    href="/about"
                    className="text-neutral-600 underline text-xs uppercase tracking-wide"
                  >
                    View subscription details
                  </a>

                  <a
                    href="/upgrade"
                    className="border border-neutral-300 px-4 py-2 text-xs uppercase tracking-wide"
                  >
                    Upgrade
                  </a>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}