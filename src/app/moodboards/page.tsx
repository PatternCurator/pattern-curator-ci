import { supabaseServer } from "@/lib/supabaseServer";
import MoodboardResults from "@/components/MoodboardResults";
import InfiniteScrollN from "@/components/InfiniteScrollN";

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

  const DEFAULT_N = 120;
  const STEP = 40;
  const AUTO_CAP = 124; // stop infinite auto-load here (mirrors assets behavior)

  // Progressive loading only when there is no query
  const isDefaultFeed = !q;

  const n = isDefaultFeed ? clampInt(sp.n, DEFAULT_N) : DEFAULT_N;
  const limit = isDefaultFeed ? n : DEFAULT_N;

  const supabase = await supabaseServer();

  let query = supabase
    .from("moodboards")
    .select(
      "id,slug,title,image_path,source_url,source_site,domain,direction,color_notes,print_pattern_notes"
    )
    .eq("status", "ready")
    .eq("catalog_state", "current");

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

  // Ask for 1 extra row so we can reliably determine if more exist
  const { data: moodboards = [], error } = await query.limit(limit + 1);

  if (error) console.error("Supabase error (moodboards):", error.message);

  const safeMoodboards = moodboards ?? [];

  const hasMore = isDefaultFeed && safeMoodboards.length > limit;
  const autoCapReached = isDefaultFeed && limit >= AUTO_CAP;

  const nextAutoN = Math.min(limit + STEP, AUTO_CAP);
  const allowInfinite = isDefaultFeed && hasMore && !autoCapReached;

  const nextAfterCap = limit + STEP;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="space-y-2">
        <div
          className="text-[18px] font-bold italic uppercase tracking-widest"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#8a8a8aff",
          }}
        >
          MOODBOARDS
        </div>

        <p className="max-w-3xl pt-1 text-xs leading-relaxed text-zinc-500">
          A curated moodboard library — an ongoing source of color, print, and
          pattern inspiration.
        </p>
      </div>

      {/* Search bar */}
      <form method="get" action="/moodboards" className="space-y-3">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search moodboards..."
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            className="shrink-0 h-[46px] rounded-full px-6 text-[11px] flex items-center justify-center"
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

      <MoodboardResults moodboards={safeMoodboards.slice(0, limit) as any} />

      {/* Infinite scroll until AUTO_CAP */}
      {allowInfinite ? (
        <InfiniteScrollN nextN={nextAutoN} hasMore={allowInfinite} />
      ) : null}

      {/* After AUTO_CAP, show MORE (only if more exist) */}
      {isDefaultFeed && hasMore ? (
        <div className="pt-6 flex justify-center">
          <a
            href={`/moodboards?n=${nextAfterCap}`}
            className="h-10 px-8 rounded-none flex items-center justify-center text-xs font-bold uppercase tracking-[0.2em]"
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
export const revalidate = 0;