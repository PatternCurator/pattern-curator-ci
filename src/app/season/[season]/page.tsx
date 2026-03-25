import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import SeasonSupportingSection from "@/components/SeasonSupportingSection";
import SeasonMoodboardSection from "@/components/SeasonMoodboardSection";

export const dynamic = "force-dynamic";

type SupportingBoard = {
  id: string;
  board_type: string;
  match_value?: string | null;
  image_path?: string | null;
  context_line?: string | null;
  season?: string | null;
  sort_order?: number | null;
};

type SeasonMoodboard = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
};

type SeasonColorChip = {
  id: string;
  season: string;
  image_path: string;
  sort_order: number | null;
  hex?: string | null;
  name?: string | null;
};

function formatSeasonLabel(season: string) {
  return season.replace(/_/g, "/");
}

function publicColorChipUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/season-color-chips/${encoded}`;
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const decodedSeason = decodeURIComponent(season);

  const supabase = await supabaseServer();

  const { data: seasons } = await supabase
    .from("moodboard_supporting_boards")
    .select("season")
    .not("season", "is", null);

  const uniqueSeasons = Array.from(
    new Set((seasons ?? []).map((s) => s.season).filter(Boolean))
  ) as string[];

  const { data: boards } = await supabase
    .from("moodboard_supporting_boards")
    .select("id, board_type, match_value, image_path, context_line, season, sort_order")
    .eq("season", decodedSeason)
    .order("sort_order", { ascending: true });

  const { data: seasonMoodboards } = await supabase
    .from("moodboards")
    .select("id, slug, title, image_path, created_at")
    .eq("season", decodedSeason)
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: seasonColorChips } = await supabase
    .from("season_color_chips")
    .select("id, season, image_path, sort_order, hex, name")
    .eq("season", decodedSeason)
    .order("sort_order", { ascending: true });

  const group = (type: string, limit: number) =>
    ((boards ?? []) as SupportingBoard[])
      .filter((b) => b.board_type === type)
      .slice(0, limit);

  const cultural = group("cultural_behavior", 3);
  const color = group("color", 7);
  const print = group("print_pattern", 7);

  const moodboards = ((seasonMoodboards ?? []) as SeasonMoodboard[]).filter(
    (board) => board.slug
  );

  const colorChips = (seasonColorChips ?? []) as SeasonColorChip[];

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-16">
        <section className="space-y-5">
          <div className="space-y-2">
            <h1
              className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
              style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 300 }}
            >
              Seasonal Trend Research
            </h1>

            <p
              className="text-[13px] italic text-neutral-500"
              style={{ fontFamily: "var(--font-libre), Libre Baskerville, serif" }}
            >
              Trend-forward insights and signals that support curatorial intelligence for design.
            </p>

            <p className="max-w-3xl text-[12px] leading-[1.7] text-neutral-700">
              A visual interpretation of cultural behaviors, color combinations, global color palette and print stories
              that are shaping upcoming seasons, using curatorial intelligence to
              highlight macro trends that are inspiring and directional.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {uniqueSeasons.map((s) => (
              <Link
                key={s}
                href={`/season/${encodeURIComponent(s)}`}
                className={`inline-flex items-center border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] ${
                  s === decodedSeason
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-600"
                }`}
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                {formatSeasonLabel(s)}
              </Link>
            ))}
          </div>
        </section>

        <SeasonSupportingSection
          label="Macro"
          title="Cultural Behaviors"
          boards={cultural}
          variant="large"
        />

        <SeasonSupportingSection
          label="Color"
          title="Color Direction"
          boards={color}
          variant="small"
        />

        <SeasonSupportingSection
          label="Print + Pattern"
          title="Print Stories"
          boards={print}
          variant="small"
        />

        {colorChips.length ? (
          <section className="space-y-10 pt-2">
            <div className="space-y-2">
              <p
                className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Key Color Palette
              </p>

              <h2 className="text-xl text-neutral-900">Seasonal Palette</h2>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-6 lg:grid-cols-9">
              {colorChips.map((chip) => {
                const img = publicColorChipUrl(chip.image_path);

                return (
                  <div key={chip.id} className="space-y-2">
                    {img ? (
                      <img
                        src={img}
                        alt={chip.name ?? chip.hex ?? "Color chip"}
                        className="block w-full"
                      />
                    ) : (
                      <div className="h-14 w-full bg-neutral-100" />
                    )}

                    {chip.name ? (
                      <p className="text-xs uppercase tracking-[0.08em] text-neutral-600">
                        {chip.name}
                      </p>
                    ) : null}

                    {chip.hex ? (
                      <p
                        className="text-[11px] text-neutral-500"
                        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                      >
                        {chip.hex}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <SeasonMoodboardSection boards={moodboards} />
      </div>
    </main>
  );
}