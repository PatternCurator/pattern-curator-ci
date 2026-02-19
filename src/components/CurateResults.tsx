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
 * Curate N from the candidate pool.
 * Priority: mood(direction) -> color(color_notes) -> pattern(print_pattern_notes)
 *
 * KEY BETA RULE (fixes "random"):
 * - If query is compound (2+ meaningful tokens), the first 6 must be mood-aligned (direction hits > 0).
 * - Supporting assets (color/pattern-only) can only fill the last slots.
 */
function curateN(q: string, assets: Asset[], limit = 9) {
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
    const total = moodHits * 10 + colorHits * 3 + patternHits * 2 + titleHits * 1;

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

  if (isCompound) {
    // 1) Fill up to 6 from primary mood cluster
    take(primaryMood, Math.min(6, limit));

    // 2) If primary mood cluster is thin, fill remaining of the 6 from other mood-aligned
    if (chosen.length < Math.min(6, limit)) {
      for (const s of secondaryMood) {
        if (chosen.length >= Math.min(6, limit)) break;
        if (chosenIds.has(s.a.id)) continue;
        chosen.push(s.a);
        chosenIds.add(s.a.id);
      }
    }

    // 3) Fill remaining with best supporting assets (color/pattern-only)
    if (chosen.length < limit) take(supporting, 0);

    // 4) Fallback: if still short, fill from overall scored
    if (chosen.length < limit) take(scored, 0);

    return chosen.slice(0, limit);
  }

  // Single-token queries: mood-first but looser
  take(primaryMood, Math.min(7, limit));
  if (chosen.length < limit) take(scored, 0);

  return chosen.slice(0, limit);
}

function sourceLabel(a: Asset) {
  const s = (a.source_site ?? "").trim();
  if (s) return s;

  const u = (a.source_url ?? "").trim();
  if (!u) return "";
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function CurateResults({
  q,
  assets,
  columns = 3,
  showMeta = false,
  rounded = false,
}: {
  q: string;
  assets: Asset[];
  columns?: 2 | 3 | 4;
  showMeta?: boolean;
  rounded?: boolean;
}) {
  if (!assets || assets.length === 0) return null;

  // Keep your behavior: curate down to 9 ONLY when a query exists
  const curated = q ? curateN(q, assets, 9) : assets;

  const gridCols =
    columns === 4
      ? "grid-cols-2 md:grid-cols-4"
      : columns === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2";

  const radiusClass = rounded ? "rounded-md" : "rounded-none";

  return (
    <section className="space-y-6">
      {/* Use curated set for interpretation so story + grid match */}
      {q ? <CurateInterpretationClient q={q} assets={curated} /> : null}

      <div className={`grid ${gridCols} gap-2`}>
        {curated.map((a) => {
          const src = publicAssetUrl(a.image_path);
          const hoverLabel = sourceLabel(a);

          return (
            <div key={a.id}>
              <Link href={`/asset/${a.id}`} className="block">
                <div
                  className={`group relative aspect-[4/5] w-full overflow-hidden ${radiusClass} bg-zinc-100`}
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={a.title || ""}
                      fill
                      className="object-cover"
                      sizes={
                        columns === 4
                          ? "(max-width: 1024px) 33vw, 25vw"
                          : "(max-width: 1024px) 33vw, 20vw"
                      }
                    />
                  ) : null}

                  {/* hover-only source overlay */}
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

              {/* Title + source site (search engine feel) */}
              {showMeta ? (
                <div className="pt-2 text-xs leading-snug">
                  {a.title ? <div className="text-zinc-800">{a.title}</div> : null}
                  {hoverLabel ? <div className="text-zinc-500">{hoverLabel}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}