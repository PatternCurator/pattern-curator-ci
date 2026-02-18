import Link from "next/link";
import Image from "next/image";
import CurateInterpretationClient from "./CurateInterpretationClient";

export type Asset = {
  id: string;
  title: string;
  image_path: string;
  source_url: string | null;
  source_site: string | null;
  domain: string | null;

  // Mood anchor (highest priority)
  direction: string | null;

  // Secondary signals
  color_notes: string | null;
  print_pattern_notes: string | null;
};

function publicAssetUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/assets/${encoded}`;
}

function twoWordTitle(title: string | null | undefined) {
  const t = (title ?? "").trim();
  if (!t) return "Untitled";
  return t.split(/\s+/).slice(0, 2).join(" ");
}

function normalizeText(s: string | null | undefined) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(q: string) {
  const stop = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "with",
    "for",
    "in",
    "on",
    "to",
    "of",
    "by",
    "from",
    "at",
    "is",
    "are",
  ]);

  return normalizeText(q)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !stop.has(t));
}

function countTokenHits(haystack: string, tokens: string[]) {
  if (!haystack || tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (haystack.includes(t)) hits += 1;
  }
  return hits;
}

/**
 * Curate 9 from the candidate pool.
 * Priority: mood(direction) -> color(color_notes) -> pattern(print_pattern_notes)
 *
 * KEY BETA RULE (fixes "random"):
 * - If query is compound (2+ meaningful tokens), the first 6 must be mood-aligned (direction hits > 0).
 * - Supporting assets (color/pattern-only) can only fill the last 3.
 */
function curateNine(q: string, assets: Asset[], limit = 9) {
  if (!q || tokenizeQuery(q).length === 0) return assets.slice(0, limit);

  const tokens = tokenizeQuery(q);
  const isCompound = tokens.length >= 2;

  // Score each asset
  const scored = assets.map((a) => {
    const direction = normalizeText(a.direction);
    const color = normalizeText(a.color_notes);
    const pattern = normalizeText(a.print_pattern_notes);
    const title = normalizeText(a.title);

    const moodHits = countTokenHits(direction, tokens);
    const colorHits = countTokenHits(color, tokens);
    const patternHits = countTokenHits(pattern, tokens);
    const titleHits = countTokenHits(title, tokens);

    // Weighted: mood strongest, then color, then pattern, then title
    const total =
      moodHits * 10 + // stronger than before to anchor story
      colorHits * 3 +
      patternHits * 2 +
      titleHits * 1;

    return {
      a,
      total,
      moodHits,
      colorHits,
      patternHits,
      directionKey: direction, // cohesion grouping
    };
  });

  // Sort by score desc + tie-breakers
  scored.sort((x, y) => {
    const d = y.total - x.total;
    if (d !== 0) return d;

    const md = y.moodHits - x.moodHits;
    if (md !== 0) return md;

    const cd = y.colorHits - x.colorHits;
    if (cd !== 0) return cd;

    return y.patternHits - x.patternHits;
  });

  // Separate mood-aligned vs supporting
  const moodAligned = scored.filter((s) => s.moodHits > 0);
  const supporting = scored.filter((s) => s.moodHits === 0);

  // Pick a dominant mood cluster among mood-aligned (direction text)
  let dominantDirection = "";
  if (moodAligned.length > 0) {
    const topWindow = moodAligned.slice(0, Math.min(40, moodAligned.length));
    const dirCounts = new Map<string, number>();

    for (const s of topWindow) {
      if (!s.directionKey) continue;
      // weight by moodHits so stronger direction matches dominate
      dirCounts.set(
        s.directionKey,
        (dirCounts.get(s.directionKey) ?? 0) + Math.max(1, s.moodHits)
      );
    }

    let best = 0;
    for (const [k, v] of dirCounts.entries()) {
      if (v > best) {
        best = v;
        dominantDirection = k;
      }
    }
  }

  const primaryMood = dominantDirection
    ? moodAligned.filter((s) => s.directionKey === dominantDirection)
    : moodAligned;

  const secondaryMood = dominantDirection
    ? moodAligned.filter((s) => s.directionKey !== dominantDirection)
    : [];

  const chosen: Asset[] = [];
  const chosenIds = new Set<string>();

  const take = (list: typeof scored, maxCount: number) => {
    for (const s of list) {
      if (chosen.length >= limit) break;
      if (chosenIds.has(s.a.id)) continue;
      chosen.push(s.a);
      chosenIds.add(s.a.id);
      if (maxCount > 0 && chosen.length >= maxCount) break;
    }
  };

  // --- HARD CURATION SHAPE ---
  // For compound queries, lock the first 6 to mood-aligned.
  // This is what stops "random stripes" from taking over.
  if (isCompound) {
    // 1) Fill up to 6 from primary mood cluster
    take(primaryMood, 6);

    // 2) If primary mood cluster is thin, fill remaining of the 6 from other mood-aligned
    if (chosen.length < 6) {
      // take as many as needed to reach 6
      for (const s of secondaryMood) {
        if (chosen.length >= 6) break;
        if (chosenIds.has(s.a.id)) continue;
        chosen.push(s.a);
        chosenIds.add(s.a.id);
      }
    }

    // 3) Fill remaining (up to 9) with best supporting assets (color/pattern-only)
    // These act like "supporting cast", not the story lead.
    if (chosen.length < limit) take(supporting, 0);

    // 4) Fallback: if still short, fill from overall scored
    if (chosen.length < limit) take(scored, 0);

    return chosen.slice(0, limit);
  }

  // For single-token queries, keep it a bit looser but still cohesive
  // (Mood-first still applies, but we don't hard-require 6 mood matches.)
  // 1) Bias toward a dominant mood cluster if it exists
  take(primaryMood, Math.min(7, limit));
  // 2) Fill remaining with best overall
  if (chosen.length < limit) take(scored, 0);

  return chosen.slice(0, limit);
}

export default function CurateResults({
  q,
  assets,
}: {
  q: string;
  assets: Asset[];
}) {
  if (!assets || assets.length === 0) return null;

  // Curate down to 9 (this is the only behavior change)
  const curated = q ? curateNine(q, assets, 9) : assets;


  return (
    <section className="space-y-6">
      {/* Use curated set for interpretation so story + grid match */}
      {q ? <CurateInterpretationClient q={q} assets={curated} /> : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
  {curated.map((a) => {
    const src = publicAssetUrl(a.image_path);
    const hoverLabel = (a.source_site ?? "").trim(); // <-- ONLY source_site

    return (
      <div key={a.id}>
        <Link href={`/asset/${a.id}`} className="block">
          <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-none bg-zinc-100">
            {src ? (
              <Image
                src={src}
                alt={a.title || ""}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 33vw, 20vw"
              />
            ) : null}

            {/* hover-only source_site overlay */}
            {hoverLabel ? (
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                <div className="absolute left-2 bottom-2 max-w-[90%] truncate text-[11px] leading-none text-white/90">
                  {hoverLabel}
                </div>
              </div>
            ) : null}
          </div>
        </Link>
      </div>
    );
  })}
</div>

    </section>
  );
}
