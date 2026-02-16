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

type Mode = "inspiration" | "archive";

function basePath(mode: Mode) {
  return mode === "archive" ? "/archive" : "/inspiration";
}

function hrefWith(mode: Mode, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.trim()) sp.set(k, v.trim());
  });
  const qs = sp.toString();
  const base = basePath(mode);
  return qs ? `${base}?${qs}` : base;
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
  mode = "inspiration",
  titleLabel,
  subtext,
}: {
  q: string;
  type: string;
  season: string;
  seasonOptions: string[];
  mode?: Mode;
  titleLabel?: string; // e.g. INSPIRATION / ARCHIVE
  subtext?: string;
}) {
  const seasonMode = type === "" && !!season; // if a season is applied, keep season pills visible
  const showSeasonRow = seasonMode || type === "__season__";

  const title = titleLabel ?? (mode === "archive" ? "ARCHIVE" : "INSPIRATION");
  const description =
    subtext ??
    (mode === "archive"
      ? "Curated inspiration of past seasons through the Pattern Curator lens."
      : "Pattern Curator Trend Service is evolving into a visual intelligence system that identifies, edits, and interprets the visual signals shaping possibilities for upcoming seasons.");

  return (
    <div className="space-y-4">
      {/* PAGE TITLE + BACK LINK (consistent placement) */}
      <div className="space-y-2">
        <div
          className="text-[18px] font-bold italic uppercase tracking-widest"
          style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#8a8a8aff",
      }}
>
  {title}
</div>

        <p className="max-w-3xl pt-1 text-xs leading-relaxed text-zinc-500">
          {description}
        </p>

        
      </div>

      {/* Search bar */}
      <form action={basePath(mode)} className="space-y-3">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search inspiration..."
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            className="shrink-0 h-[46px] rounded-full px-6 text-[11px] flex items-center justify-center"
            style={pillStyle(false)}
          >
            SEARCH
          </button>
        </div>

        {/* 6 pills across */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <Link
                key={t.key}
                href={hrefWith(mode, { q, type: t.key, season: "" })}
                className="h-9 rounded-full px-4 text-[11px] flex items-center justify-center"
                style={pillStyle(active)}
              >
                {t.label}
              </Link>
            );
          })}

          {/* SEASON pill toggles season row */}
          <Link
            href={hrefWith(mode, { q, type: "__season__", season: "" })}
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
              href={hrefWith(mode, { q, type: "", season: "" })}
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
                  href={hrefWith(mode, { q, type: "", season: s })}
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
