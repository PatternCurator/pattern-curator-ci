import { supabaseServer } from "@/lib/supabaseServer";
import MoodboardResults from "@/components/MoodboardResults";

function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function clampInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, n);
}

export default async function MoodboardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; n?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const DEFAULT_N = 9;
  const STEP = 9;

  const isDefaultFeed = !q;

  const n = isDefaultFeed ? clampInt(sp.n, DEFAULT_N) : 120;
  const limit = isDefaultFeed ? n : 120;

  const supabase = await supabaseServer();

    let query = supabase
    .from("moodboards")
    .select(
      "id,slug,title,image_path,source_url,source_site,domain,direction,color_notes,print_pattern_notes"
    )
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("season_order", { ascending: false })
    .order("created_at", { ascending: false });
    

  const terms = tokenize(q);

  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `title.ilike.%${t}%,domain.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%,source_site.ilike.%${t}%`
      )
      .join(",");

    query = query.or(orConditions);
  }

  query = query.order("created_at", { ascending: false });

  const { data: moodboards = [], error } = await query.limit(limit + 1);

  if (error) {
    console.error("Supabase error (moodboards):", error.message);
  }

  const safeMoodboards = moodboards ?? [];

  const hasMore = isDefaultFeed && safeMoodboards.length > limit;
  const nextN = limit + STEP;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="space-y-3">
        <div
          className="text-[18px] font-bold italic uppercase tracking-widest"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#8a8a8aff",
          }}
        >
          EDITORIAL MOODBOARDS
        </div>

        <div className="max-w-2xl space-y-3 text-zinc-600">
          <p className="text-[13px] italic tracking-[0.04em] text-zinc-500">
              A simple way to explore emerging trends through curated visual direction
          </p>

          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-[1.8]">
            <li>Browse the moodboards</li>
            <li>
              Curatorial context highlights relevance and trend-forward direction
            </li>
            <li>
              Enter a query to explore application across category or market
            </li>
          </ul>
        </div>
      </div>

      {/* Search */}
      <form method="get" action="/moodboards" className="mt-8">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search boards..."
            className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />

          <button
            type="submit"
            className="shrink-0 h-[46px] px-6 text-[11px] flex items-center justify-center"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "1px solid #B8B9B6",
              color: "#707376ff",
              background: "#f4f4f4",
            }}
          >
            SEARCH
          </button>
        </div>
      </form>

      <div className="mt-8">
        <MoodboardResults moodboards={safeMoodboards.slice(0, limit) as any} />
      </div>

      {/* MORE BUTTON */}
      {isDefaultFeed && hasMore ? (
        <div className="pt-10 flex justify-center">
          <a
            href={`/moodboards?n=${nextN}`}
            className="h-10 px-8 flex items-center justify-center text-xs font-bold uppercase tracking-[0.2em]"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#707376ff",
              background: "#f4f4f4",
              border: "1px solid #B8B9B6",
            }}
          >
            MORE
          </a>
        </div>
      ) : null}
    </main>
  );
}

export const dynamic = "force-dynamic";