import Link from "next/link";

const TYPES = [
  { key: "trend", label: "TREND" },
  { key: "concept", label: "CONCEPT" },
  { key: "mood", label: "MOOD" },
  { key: "color", label: "COLOR" },
  { key: "print+pattern", label: "PRINT + PATTERN" },
] as const;

// Brand greys used elsewhere in your UI
const BORDER = "#B8B9B6";
const TEXT = "#707376ff";
const FILL = "#f4f4f4";

function hrefWith(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.trim()) sp.set(k, v.trim());
  });
  const qs = sp.toString();
  return qs ? `/trend?${qs}` : "/trend";
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontStyle: "italic",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    border: `1px solid ${BORDER}`,
    color: TEXT,
    background: active ? "#eeeeee" : FILL,
  };
}

export default function TrendHeader({
  q,
  type,
  season,
  seasonOptions,
}: {
  q: string;
  type: string;
  season: string;
  seasonOptions: string[];
}) {
  const seasonMode = type === "" && !!season; // if a season is applied, keep season pills visible
  const showSeasonRow = seasonMode || type === "__season__";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Trend</h1>
        <p className="max-w-4xl text-sm text-zinc-600">
          Pattern Curator Trend Service is evolving into a visual intelligence system that identifies, edits,
          and interprets the visual signals shaping possibilities for upcoming seasons.
        </p>
      </div>

      {/* Search bar */}
      <form action="/trend" className="space-y-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search direction, color notes, print + pattern notes"
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
        />

        {/* 6 pills across */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <Link
                key={t.key}
                href={hrefWith({ q, type: t.key, season: "" })}
                className="h-9 rounded-full px-4 text-[11px] flex items-center justify-center"
                style={pillStyle(active)}
              >
                {t.label}
              </Link>
            );
          })}

          {/* SEASON pill toggles season row */}
          <Link
            href={hrefWith({ q, type: "__season__", season: "" })}
            className="h-9 rounded-full px-4 text-[11px] flex items-center justify-center"
            style={pillStyle(type === "__season__" || !!season)}
          >
            SEASON
          </Link>
        </div>

        {/* Season pills row (still pills, no dropdown) */}
        {showSeasonRow ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Clear season */}
            <Link
              href={hrefWith({ q, type: "", season: "" })}
              className="h-8 rounded-full px-4 text-[11px] flex items-center justify-center"
              style={pillStyle(!season)}
            >
              ALL
            </Link>

            {seasonOptions.map((s) => {
              const active = season === s;
              return (
                <Link
                  key={s}
                  href={hrefWith({ q, type: "", season: s })}
                  className="h-8 rounded-full px-4 text-[11px] flex items-center justify-center"
                  style={pillStyle(active)}
                >
                  {s}
                </Link>
              );
            })}
          </div>
        ) : null}
      </form>
    </div>
  );
}
