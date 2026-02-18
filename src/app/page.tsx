import EmailGate from "@/components/EmailGate";
import { supabaseServer } from "@/lib/supabaseServer";
import { SearchHeader } from "@/components/SearchHeader";
import CurateResults from "@/components/CurateResults";
import InfiniteScrollN from "@/components/InfiniteScrollN";

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
  searchParams?: Promise<{ q?: string; n?: string; view?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const DEFAULT_N = 9;
  const STEP = 39;
  const AUTO_CAP = 126; // stop infinite auto-load here

  // Only apply progressive loading on the cover (no query)
  const n = !q ? clampInt(sp.n, DEFAULT_N) : DEFAULT_N;

  // How many we want to show on this request
  const limit = !q ? n : DEFAULT_N;

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

  // Ask for 1 extra row so we can reliably determine if more exist
  const { data: assets = [], error } = await query.limit(limit + 1);
  if (error) console.error("Supabase error:", error.message);

  const safeAssets = assets ?? [];

  // Is there more available beyond what we are currently showing?
  const hasMore = !q && safeAssets.length > limit;

  // Stop auto-loading at AUTO_CAP, then require user click MORE
  const autoCapReached = !q && limit >= AUTO_CAP;

  // Next n for infinite scroll, capped to AUTO_CAP
  const nextAutoN = Math.min(limit + STEP, AUTO_CAP);
  const allowInfinite = !q && hasMore && !autoCapReached;

  // Next n after cap (MORE continues beyond cap)
  const nextAfterCap = limit + STEP;

  return (
    <EmailGate source="ci-home">
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="space-y-6">
          {/* LIBRARY title */}
          <div
            className="text-[18px] font-bold italic uppercase tracking-widest"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#8a8a8aff",
            }}
          >
            LIBRARY
          </div>

          {!q ? (
            <div className="max-w-3xl pt-1 text-xs leading-relaxed text-zinc-500">
              <p className="mt-2">
                Curatorial Intelligence™ retrieves and prioritizes images in response to
                your prompt—while preserving Pattern Curator’s editorial sensibility and
                the integrity of a curated library. Curated intelligence meant to inspire.
              </p>
            </div>
          ) : null}

          <SearchHeader q={q} mode={"curate"} />

          {/* IMPORTANT: pass the first `limit` rows only */}
          <CurateResults q={q} assets={safeAssets.slice(0, limit)} />

          {/* Infinite scroll until AUTO_CAP */}
          {allowInfinite ? (
            <InfiniteScrollN nextN={nextAutoN} hasMore={allowInfinite} />
          ) : null}

          {/* After AUTO_CAP, show MORE (only if more exist) */}
          {autoCapReached && hasMore ? (
            <div className="pt-6 flex justify-center">
              <a
                href={`/?n=${nextAfterCap}`}
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
        </div>
      </main>
    </EmailGate>
  );
}
