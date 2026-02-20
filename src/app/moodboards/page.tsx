export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function MoodboardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

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

  const { data: moodboards = [], error } = await query
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) console.error("Supabase error (moodboards):", error.message);

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

      <MoodboardResults moodboards={moodboards as any} />
    </main>
  );
}