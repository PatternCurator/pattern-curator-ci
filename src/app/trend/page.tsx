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

export default async function TrendPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    season?: string;
    domain?: string;
    color?: string;
    print_pattern?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const season = (sp.season ?? "").trim();
  const domain = (sp.domain ?? "").trim();
  const color = (sp.color ?? "").trim();
  const printPattern = (sp.print_pattern ?? "").trim();

  const supabase = await supabaseServer();

  let query = supabase
    .from("boards")
    .select("id,title,slug,cover_image_path,source_site,season,domain,color_notes,print_pattern_notes,direction")
    .eq("status", "ready");

  // Filter pills
  if (season) query = query.ilike("season", `%${season}%`);
  if (domain) query = query.ilike("domain", `%${domain}%`);
  if (color) query = query.ilike("color_notes", `%${color}%`);
  if (printPattern) query = query.ilike("print_pattern_notes", `%${printPattern}%`);

  // Free-text query across CI fields
  const terms = tokenize(q);
  if (terms.length > 0) {
    const orConditions = terms
      .map(
        (t) =>
          `domain.ilike.%${t}%,season.ilike.%${t}%,direction.ilike.%${t}%,color_notes.ilike.%${t}%,print_pattern_notes.ilike.%${t}%`
      )
      .join(",");
    query = query.or(orConditions);
  }

  const { data: boards = [], error } = await query.limit(24);
  if (error) console.error("Supabase error:", error.message);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <TrendHeader
        q={q}
        season={season}
        domain={domain}
        color={color}
        printPattern={printPattern}
      />
      <TrendResults boards={boards as any} />
    </main>
  );
}
