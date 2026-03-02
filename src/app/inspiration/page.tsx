import { supabaseServer } from "@/lib/supabaseServer";
import TrendHeader from "@/components/TrendHeader";
import TrendResults from "@/components/TrendResults";
import InfiniteScrollN from "@/components/InfiniteScrollN";

function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function uniq(list: string[]) {
  return Array.from(new Set(list));
}

function clampInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, n);
}

export default async function InspirationPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    season?: string;
    n?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const type = (sp.type ?? "").trim();
  const season = (sp.season ?? "").trim();

  const DEFAULT_N = 60;
  const STEP = 40;
  const AUTO_CAP = DEFAULT_N; // disable infinite auto-load (MORE only)

  // Progressive loading only when there is no query and no pills selected
  const isDefaultFeed = !q && !type && !season;

  const n = isDefaultFeed ? clampInt(sp.n, DEFAULT_N) : DEFAULT_N;
  const limit = isDefaultFeed ? n : DEFAULT_N;

  const supabase = await supabaseServer();

  // Used to power season pills (limit to CURRENT boards)
  const { data: seasonRows = [] } = await supabase
    .from("boards")
    .select("season,season_order")
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .neq("report_type", "mood") // exclude mood from Inspiration season options
    .order("season_order", { ascending: false })
    .limit(200);

  const seasonOptions = uniq(
    (seasonRows as any[])
      .map((r) => (r?.season ?? "").toString().trim())
      .filter(Boolean)
  ).slice(0, 24);

  let query = supabase
    .from("boards")
    .select(
      "id,title,slug,cover_image_path,source_site,season,season_order,domain,report_type,color_notes,print_pattern_notes,direction"
    )
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .neq("report_type", "mood"); // exclude mood from Inspiration feed

  // Pill filters
  if (type) query = query.eq("report_type", type);
  if (season) query = query.ilike("season", `%${season}%`);

  // Free-text query across CI fields
  const terms = tokenize(q);
  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `title.ilike.%${t}%,domain.ilike.%${t}%,season.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%`
      )
      .join(",");
    query = query.or(orConditions);
  }

  // Order (same as you had)
  query = query
    .order("season_order", { ascending: false })
    .order("created_at", { ascending: false });

  // Ask for 1 extra row so we can reliably determine if more exist
  const { data: boards = [], error } = await query.limit(limit + 1);

  if (error) console.error("Supabase error:", error.message);

  const safeBoards = boards ?? [];

  const hasMore = isDefaultFeed && safeBoards.length > limit;
  const autoCapReached = isDefaultFeed && limit >= AUTO_CAP;

  const nextAutoN = Math.min(limit + STEP, AUTO_CAP);
  const allowInfinite = isDefaultFeed && hasMore && !autoCapReached;

  const nextAfterCap = limit + STEP;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <TrendHeader
        q={q}
        type={type}
        season={season}
        seasonOptions={seasonOptions}
        mode="inspiration"
        titleLabel="INSPIRATION"
      />

      <TrendResults boards={safeBoards.slice(0, limit) as any} />

      {/* Infinite scroll until AUTO_CAP */}
      {allowInfinite ? (
        <InfiniteScrollN nextN={nextAutoN} hasMore={allowInfinite} />
      ) : null}

      {/* After AUTO_CAP, show MORE (only if more exist) */}
      {isDefaultFeed && hasMore ? (
        <div className="pt-6 flex justify-center">
          <a
            href={`/inspiration?n=${nextAfterCap}`}
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
