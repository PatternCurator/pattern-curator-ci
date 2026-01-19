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

function detectDomain(terms: string[]) {
  const s = new Set(terms);

  const mens =
    s.has("menswear") ||
    s.has("mens") ||
    s.has("men") ||
    s.has("men's") ||
    (s.has("mens") && s.has("wear"));

  const womens =
    s.has("womenswear") ||
    s.has("womens") ||
    s.has("women") ||
    s.has("women's") ||
    (s.has("womens") && s.has("wear"));

  if (mens) return "menswear";
  if (womens) return "womenswear";
  return null;
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
  const domain = detectDomain(terms);

  let query = supabase.from("assets").select("*").eq("status", "ready");

  // ✅ DOMAIN ELIGIBILITY (INCLUSIVE):
// If user explicitly says menswear → include assets eligible for menswear
// Do NOT exclude crossover assets (many are menswear + womenswear)
if (domain === "menswear") {
  query = query.ilike("domain", "%menswear%");
}

// If user explicitly says womenswear → include assets eligible for womenswear
// Do NOT exclude crossover assets
if (domain === "womenswear") {
  query = query.ilike("domain", "%womenswear%");
}


  // ✅ Broad recall across all controlled fields
  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `title.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%`
      )
      .join(",");

    query = query.or(orConditions);
  }

  const { data: assets = [], error } = await query.limit(9);
  if (error) console.error("Supabase error:", error.message);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <SearchHeader q={q} mode={"curate"} />
      <CurateResults q={q} assets={assets} />
    </main>
  );
}
