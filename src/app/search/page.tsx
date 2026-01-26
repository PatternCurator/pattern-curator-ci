import { supabaseServer } from "@/lib/supabaseServer";
import SearchHeader from "@/components/SearchHeader";
import CurateResults from "@/components/CurateResults";

function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function contains(hay: string | null | undefined, needle: string) {
  if (!hay) return false;
  return hay.toLowerCase().includes(needle);
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const supabase = await supabaseServer();
  const terms = tokenize(q);

  let query = supabase.from("assets").select("*").eq("status", "ready");

  // ✅ Broad recall across CI fields (INCLUDES domain)
  // (No title matching; no hard domain filtering)
  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `domain.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%`
      )
      .join(",");

    query = query.or(orConditions);
  }

  // Pull a larger candidate set, then rank locally
  const { data: raw = [], error } = await query.limit(80);
  if (error) console.error("Supabase error:", error.message);

  // ✅ Ranking: Domain > Direction > Color > Print
  const ranked = raw
    .map((a: any) => {
      let score = 0;

      for (const t of terms) {
        if (contains(a.domain, t)) score += 40; // highest priority
        if (contains(a.direction, t)) score += 30;
        if (contains(a.color_notes, t)) score += 20;
        if (contains(a.print_pattern_notes, t)) score += 10;
      }

      return { ...a, __score: score };
    })
    .sort((x: any, y: any) => (y.__score ?? 0) - (x.__score ?? 0));

  const assets = ranked.slice(0, 9);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <SearchHeader q={q} mode={"curate"} />
      <CurateResults q={q} assets={assets} />
    </main>
  );
}
