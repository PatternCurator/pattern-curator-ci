import { supabaseServer } from "@/lib/supabaseServer";
import TrendHeader from "@/components/TrendHeader";
import TrendResults from "@/components/TrendResults";

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

export default async function TrendPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    season?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const type = (sp.type ?? "").trim();
  const season = (sp.season ?? "").trim();

  const supabase = await supabaseServer();

  // Used to power season pills (still all pills, no dropdown)
  const { data: seasonRows = [] } = await supabase
    .from("boards")
    .select("season")
    .eq("status", "ready")
    .limit(200);

  const seasonOptions = uniq(
    (seasonRows as any[])
      .map((r) => (r?.season ?? "").toString().trim())
      .filter(Boolean)
  ).slice(0, 24);

  let query = supabase
    .from("boards")
    .select("id,title,slug,cover_image_path,source_site,season,domain,report_type,color_notes,print_pattern_notes,direction")
    .eq("status", "ready");

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

  const { data: boards = [], error } = await query.order("created_at", { ascending: false }).limit(60);
  if (error) console.error("Supabase error:", error.message);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <TrendHeader q={q} type={type} season={season} seasonOptions={seasonOptions} />
      <TrendResults boards={boards as any} />
    </main>
  );
}
