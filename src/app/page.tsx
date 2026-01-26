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

  if (domain === "menswear") {
    query = query.ilike("domain", "%menswear%");
  }

  if (domain === "womenswear") {
    query = query.ilike("domain", "%womenswear%");
  }

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
      <div className="space-y-6">
        <SearchHeader q={q} mode={"curate"} />

        {!q ? (
          <div className="max-w-3xl pt-1 text-xs leading-relaxed text-zinc-500">
            <p className="mt-2">
              Curatorial Intelligence™ retrieves and prioritizes images in response
              to your prompt—while preserving Pattern Curator’s editorial sensibility
              and the integrity of a curated library. Curated intelligence meant to inspire.
            </p>
          </div>
        ) : null}

        <CurateResults q={q} assets={assets} />
      </div>
    </main>
  );
}
