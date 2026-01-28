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

function clampInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, n);
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; n?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const DEFAULT_N = 9;
  const STEP = 39;

  // Only apply progressive loading on the cover (no query)
  const n = !q ? clampInt(sp.n, DEFAULT_N) : DEFAULT_N;

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

  // Newest first
  query = query.order("created_at", { ascending: false });

  const limit = !q ? n : DEFAULT_N;

  // Ask for 1 extra row so we can reliably determine if more exist
  const { data: assets = [], error } = await query.limit(limit + 1);
  if (error) console.error("Supabase error:", error.message);

  const showMore = !q && assets.length > limit;
  const nextN = limit + STEP;

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

        <CurateResults q={q} assets={assets.slice(0, limit)} />

        {/* MORE pill only on cover page */}
        {showMore ? (
          <div className="pt-6 flex justify-center">
            <a
              href={`/?n=${nextN}`}
              className="h-12 px-10 rounded-full flex items-center justify-center text-lg font-bold italic"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#707376ff",
                background: "#f4f4f4",
                border: "1px solid #B8B9B6",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              MORE
            </a>
          </div>
        ) : null}
      </div>
    </main>
  );
}
