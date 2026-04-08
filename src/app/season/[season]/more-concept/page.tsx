import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import SeasonSupportingSection from "@/components/SeasonSupportingSection";

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

function formatSeasonLabel(season: string) {
  return season.replace(/_/g, "/");
}

export default async function SeasonMoreConceptPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const decodedSeason = decodeURIComponent(season);

  const supabase = await supabaseServer();

  const { data: boards } = await supabase
    .from("moodboard_supporting_boards")
    .select("id, board_type, match_value, image_path, context_line, season, sort_order")
    .eq("season", decodedSeason)
    .eq("board_type", "concept")
    .order("sort_order", { ascending: true });

  const allConcept = (boards ?? []) as SupportingBoard[];

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-16">
        <section className="space-y-3">
          <div className="space-y-2">
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {formatSeasonLabel(decodedSeason)}
            </p>

            <h1 className="text-xl text-neutral-900">Seasonal Concept</h1>
          </div>

          <Link
            href={`/season/${encodeURIComponent(decodedSeason)}`}
            className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 underline underline-offset-4"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            Back to Season
          </Link>
        </section>

        <SeasonSupportingSection
          label="Concept"
          title="Concept"
          boards={allConcept}
          variant="landscape"
        />
      </div>
    </main>
  );
}