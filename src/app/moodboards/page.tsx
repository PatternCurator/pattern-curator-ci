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

export const dynamic = "force-dynamic";

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
    .order("board_order", { ascending: true });

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


  const { data: moodboards = [], error } = await query.limit(limit + 1);

  if (error) {
    console.error("Supabase error (moodboards):", error.message);
  }

  const safeMoodboards = moodboards ?? [];

  const hasMore = isDefaultFeed && safeMoodboards.length > limit;
  const nextN = limit + STEP;

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1
              className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
              style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 300 }}
            >
              Editorial Moodboards
            </h1>

            <p
              className="text-[13px] italic text-neutral-500"
              style={{ fontFamily: "var(--font-libre), Libre Baskerville, serif" }}
            >
              A simple way to explore emerging trends through curated visual direction
            </p>

            <p className="max-w-3xl text-[12px] leading-[1.7] text-neutral-700">
              Browse through the moodboards, curatorial context highlights nuance and
              trend-forward seasonal direction, introduced by asking how to explore
              application by specific category or market.
            </p>
          </div>
        </section>

        <form method="get" action="/moodboards" className="mt-6">
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search boards..."
              className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none"
            />

            <button
              type="submit"
              className="shrink-0 h-[46px] px-6 text-[11px] uppercase tracking-[0.12em] border border-neutral-300 text-neutral-600 bg-white"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-8">
          <MoodboardResults moodboards={safeMoodboards.slice(0, limit) as any} />
        </div>

        {isDefaultFeed && hasMore ? (
          <div className="pt-10 flex justify-center">
            <a
              href={`/moodboards?n=${nextN}`}
              className="h-10 px-8 flex items-center justify-center text-[11px] uppercase tracking-[0.12em] border border-neutral-300 text-neutral-600 bg-white"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              More
            </a>
          </div>
        ) : null}
      </div>
    </main>
  );
}