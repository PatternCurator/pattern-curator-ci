const MARKETS = [
  "womenswear",
  "menswear",
  "interiors",
  "accessories",
  "kidswear",
  "active",
  "swim",
] as const;

export default function TrendHeader({
  q,
  season,
  market,
  color,
  printPattern,
}: {
  q: string;
  season: string;
  market: string;
  color: string;
  printPattern: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Trend</h1>
        <p className="max-w-4xl text-sm text-zinc-600">
          Pattern Curator Trend Service is evolving into a visual intelligence
          system that identifies, edits, and interprets the visual signals
          shaping possibilities for upcoming seasons.
        </p>
      </div>

      <form className="space-y-3" action="/trend">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search direction, color notes, print + pattern notes"
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {/* Season */}
          <input
            name="season"
            defaultValue={season ?? ""}
            placeholder="Season"
            className="h-9 w-40 rounded-full border border-zinc-200 bg-white px-3 text-xs outline-none"
          />

          {/* Market (calmer than pills) */}
          <div className="flex items-center">
            <input
              name="market"
              defaultValue={market ?? ""}
              placeholder="Market"
              list="market-options"
              className="h-9 w-44 rounded-full border border-zinc-200 bg-white px-3 text-xs outline-none"
            />
            <datalist id="market-options">
              {MARKETS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {/* Color */}
          <input
            name="color"
            defaultValue={color ?? ""}
            placeholder="Color"
            className="h-9 w-36 rounded-full border border-zinc-200 bg-white px-3 text-xs outline-none"
          />

          {/* Print + Pattern */}
          <input
            name="print_pattern"
            defaultValue={printPattern ?? ""}
            placeholder="Print+Pattern"
            className="h-9 w-44 rounded-full border border-zinc-200 bg-white px-3 text-xs outline-none"
          />

          <button className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-xs hover:bg-zinc-50">
            Apply
          </button>
        </div>
      </form>
    </div>
  );
}
