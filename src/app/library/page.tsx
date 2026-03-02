import Link from "next/link";
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

function clampInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, n);
}

/**
 * Deterministic PRNG for seeded shuffle
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number) {
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * ISO week seed (changes once per week).
 * Uses UTC to avoid server timezone surprises.
 * Seed is deterministic for the whole ISO week.
 */
function getIsoWeekSeedUTC(d: Date) {
  // Copy date, strip time
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  // ISO week: Thursday determines year
  const day = date.getUTCDay() || 7; // Sunday=0 -> 7
  date.setUTCDate(date.getUTCDate() + 4 - day);

  const isoYear = date.getUTCFullYear();

  // Week number: count weeks from Jan 1
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const diffDays = Math.floor((date.getTime() - yearStart.getTime()) / 86400000) + 1;
  const isoWeek = Math.ceil(diffDays / 7);

  // Compact seed like 202612 for week 12 of 2026
  return isoYear * 100 + isoWeek;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; n?: string; view?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const DEFAULT_N = 8;
  const STEP = 40;

  // Set very high so infinite scroll can include all images (500+)
  // (this keeps your existing logic intact; it will naturally stop when hasMore becomes false)
  const AUTO_CAP = 1000000;

  // Only apply progressive loading on the cover (no query)
  const n = !q ? clampInt(sp.n, DEFAULT_N) : DEFAULT_N;

  // How many we want to show on this request
  const limit = !q ? n : DEFAULT_N;

  const supabase = await supabaseServer();

  const terms = tokenize(q);

  let query = supabase.from("assets").select("*").eq("status", "ready");

  // IMPORTANT:
  // Do NOT auto-filter the domain based on typed terms like "menswear".
  // Domain is now a controlled facet (women/men/kids/home), and descriptors like
  // "menswear stripe" live in direction/color_notes/print_pattern_notes.
  // Auto-filtering domain here can zero out results before Curate scoring runs.

  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `title.ilike.%${t}%,season.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%`
      )
      .join(",");

    query = query.or(orConditions);
  }

  // Newest first (keep as-is to avoid scope creep)
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

  // WEEKLY SHUFFLE (cover feed only, not search results)
  const weekSeed = getIsoWeekSeedUTC(new Date());
  const displayAssets = !q ? seededShuffle([...safeAssets], weekSeed) : safeAssets;

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
          <CurateResults
            q={q}
            assets={displayAssets.slice(0, limit)}
            columns={4}
            showMeta
            rounded
          />

          {/* Infinite scroll (cover feed only) */}
          {allowInfinite ? (
            <InfiniteScrollN nextN={nextAutoN} hasMore={allowInfinite} />
          ) : null}

          {/* After AUTO_CAP, show MORE (only if more exist) */}
          {autoCapReached && hasMore ? (
            <div className="pt-6 flex justify-center">
              <Link
                href={`/library?n=${nextAfterCap}`}
                scroll={false}
                className="h-10 px-8 rounded-none flex items-center justify-center text-xs font-bold uppercase tracking-[0.2em]"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#707376ff",
                  background: "#f4f4f4",
                  border: "1px solid #B8B9B6",
                }}
              >
                MORE
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </EmailGate>
  );
}