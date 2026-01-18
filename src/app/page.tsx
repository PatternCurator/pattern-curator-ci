import { supabaseServer } from "@/lib/supabaseServer";
import SearchHeader from "@/components/SearchHeader";
import CurateResults from "@/components/CurateResults";
import ExploreResults from "@/components/ExploreResults";

type Mode = "curate" | "explore";

function normalizeMode(m?: string): Mode {
  return m === "explore" ? "explore" : "curate";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; mode?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const mode = normalizeMode(sp.mode);

  const supabase = await supabaseServer();

  // --- Parse query terms ---
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

  const KNOWN_DOMAINS = [
    "menswear",
    "womenswear",
    "interiors",
    "home",
    "activewear",
  ];

  const domainFromQuery = KNOWN_DOMAINS.find((d) =>
    terms.includes(d)
  );

  // --- Base query ---
  let query = supabase
    .from("assets")
    .select("*")
    .eq("status", "ready");

  // --- Domain is REQUIRED if explicitly stated ---
  if (domainFromQuery) {
    query = query.ilike("domain", `%${domainFromQuery}%`);
  }

  // --- Flexible term matching (ANY term, ANY field) ---
  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `title.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%`
      )
      .join(",");

    query = query.or(orConditions);
  }

  // --- Result count ---
  const limit = mode === "explore" ? 24 : 9;

  const { data: assets = [] } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <SearchHeader q={q} mode={mode} />

      {mode === "curate" ? (
        <CurateResults q={q} assets={assets} />
      ) : (
        <ExploreResults assets={assets} />
      )}
    </main>
  );
}
