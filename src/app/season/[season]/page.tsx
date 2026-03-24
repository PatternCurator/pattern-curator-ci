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

function buildSeasonTitle(season: string) {
  return `${formatSeasonLabel(season)} Trend Research`;
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
    <main className="mx-auto max-w-[1400px] px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-24">
        <div className="flex justify-end">
          <Link
            href="/moodboards"
            className="inline-flex h-9 items-center rounded-full px-4 text-sm"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "1px solid #B8B9B6",
              color: "#707376ff",
              background: "#f4f4f4",
            }}
          >
            Back to Boards
          </Link>
        </div>

        <div className="flex flex-wrap gap-4">
          {uniqueSeasons.map((s) => (
            <Link
              key={s}
              href={`/season/${encodeURIComponent(s)}`}
              className={`inline-flex items-center rounded-full px-6 py-3 text-sm uppercase tracking-[0.12em] border ${
                s === decodedSeason
                  ? "bg-black text-white border-black"
                  : "border-zinc-300 text-zinc-600"
              }`}
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {formatSeasonLabel(s)}
            </Link>
          ))}
        </div>

        <h1 className="text-[22px] text-zinc-800">
          {buildSeasonTitle(decodedSeason)}
        </h1>

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
          <section className="space-y-10 pt-8">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Key Color Palette
              </p>
              <h2 className="text-xl text-zinc-800">Seasonal Palette</h2>
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
                      <div className="h-14 w-full bg-zinc-100" />
                    )}

                    {chip.name ? (
                      <p className="text-xs uppercase tracking-[0.08em] text-zinc-600">
                        {chip.name}
                      </p>
                    ) : null}

                    {chip.hex ? (
                      <p
                        className="text-[11px] text-zinc-500"
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