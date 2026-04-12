import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const BRAND_GREY = "#5f6368";
const PREVIEW_SEASON = "SS27";

type SupportingBoard = {
  id: string;
  board_type: string;
  board_key?: string | null;
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
  color_notes?: string | null;
  print_pattern_notes?: string | null;
};

type SeasonColorChip = {
  id: string;
  season: string;
  image_path: string;
  sort_order: number | null;
  hex?: string | null;
  name?: string | null;
};

function publicSupportingBoardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboard-supporting-boards/${encoded}`;
}

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

function publicColorChipUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/season-color-chips/${encoded}`;
}

function firstLine(text?: string | null) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const match = clean.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0].trim() : clean;
}

function previewLines(text?: string | null) {
  const clean = text?.replace(/\s+/g, " ").trim() ?? "";
  if (!clean) {
    return [
      "Curatorial Intelligence adds editorial interpretation to visual direction,",
      "connecting mood, materiality, and context into a clearer design read.",
    ];
  }

  const parts = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.slice(0, 2);
}

export default async function PreviewPage() {
  const supabase = await supabaseServer();

  const { data: boards } = await supabase
    .from("moodboard_supporting_boards")
    .select("id, board_type, board_key, match_value, image_path, context_line, season, sort_order")
    .eq("season", PREVIEW_SEASON)
    .order("sort_order", { ascending: true });

  const { data: seasonMoodboards } = await supabase
    .from("moodboards")
    .select("id, slug, title, image_path, color_notes, print_pattern_notes, created_at")
    .eq("season", PREVIEW_SEASON)
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: seasonColorChips } = await supabase
    .from("season_color_chips")
    .select("id, season, image_path, sort_order, hex, name")
    .eq("season", PREVIEW_SEASON)
    .order("sort_order", { ascending: true })
    .limit(5);

  const allBoards = (boards ?? []) as SupportingBoard[];
  const moodboards = (seasonMoodboards ?? []) as SeasonMoodboard[];
  const colorChips = (seasonColorChips ?? []) as SeasonColorChip[];

  const group = (type: string) => allBoards.filter((b) => b.board_type === type);

  const cultural = group("cultural_behavior")[0] ?? null;
  const conceptBoards = group("concept").slice(0, 2);
  const colorBoard = group("color")[0] ?? null;
  const printBoards = group("print_pattern").slice(0, 2);
  const featuredMoodboard = moodboards[0] ?? null;

  const notePreview = previewLines(
    featuredMoodboard?.color_notes || featuredMoodboard?.print_pattern_notes || null
  );

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-16">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1
              className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontWeight: 300,
              }}
            >
              Preview
            </h1>

            <p
              className="text-[14px] italic text-neutral-500"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              A guided look into the Curatorial Intelligence framework
            </p>
          </div>

          <div className="max-w-4xl space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
              This preview offers a focused look at how CI moves through cultural
              behavior, concept, color, print and pattern, and editorial
              interpretation.
            </p>

            <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
              Full membership includes access to complete boards, Curatorial
              Intelligence notes, extracted palette information, and Application
              Query across the platform.
            </p>
          </div>
        </section>

        {cultural ? (
          <section className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Macro
              </p>
              <h2 className="text-xl text-zinc-800">Cultural Behaviors</h2>
              {cultural.context_line ? (
                <p className="max-w-3xl text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
                  {firstLine(cultural.context_line)}
                </p>
              ) : null}
            </div>

            <div className="max-w-[320px]">
  {publicSupportingBoardUrl(cultural.image_path ?? null) ? (
    <img
      src={publicSupportingBoardUrl(cultural.image_path ?? null) ?? ""}
      alt="Cultural Behaviors"
      className="block w-full"
    />
  ) : null}
</div>
          </section>
        ) : null}

        {conceptBoards.length ? (
          <section className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Concept
              </p>
              <h2 className="text-xl text-zinc-800">Concept</h2>
              <p className="max-w-3xl text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
                Concept boards begin to gather broader cultural shifts into a more
                focused visual direction.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {conceptBoards.map((board) => {
                const img = publicSupportingBoardUrl(board.image_path ?? null);

                return (
                  <div key={board.id} className="space-y-3">
                    {img ? (
                      <img
                        src={img}
                        alt="Concept board"
                        className="block aspect-[4/3] w-full border border-zinc-200 object-cover"
                      />
                    ) : null}

                    {board.context_line ? (
                      <p className="text-xs leading-5 text-zinc-500">
                        {firstLine(board.context_line)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {(colorBoard || printBoards.length || colorChips.length) ? (
          <section className="max-w-4xl space-y-8">
            <div className="space-y-2">
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Color, Print + Pattern
              </p>
              <h2 className="text-xl text-zinc-800">Color, Print + Pattern</h2>
              <p className="max-w-3xl text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
                This layer connects directional color with print, motif, and
                surface expression.
              </p>
            </div>

            {colorChips.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-5">
                {colorChips.map((chip) => {
                  const img = publicColorChipUrl(chip.image_path);

                  return (
                    <div key={chip.id} className="space-y-2">
                      {img ? (
                        <img
                          src={img}
                          alt={chip.name ?? chip.hex ?? "Color chip"}
                          className="block w-full border border-neutral-200"
                        />
                      ) : (
                        <div className="h-16 w-full border border-neutral-200 bg-neutral-100" />
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
            ) : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[colorBoard, ...printBoards].filter(Boolean).map((board) => {
                const item = board as SupportingBoard;
                const img = publicSupportingBoardUrl(item.image_path ?? null);

                return (
                  <div key={item.id} className="space-y-3">
                    {img ? (
                      <img
                        src={img}
                        alt={item.board_type === "color" ? "Color board" : "Print and Pattern board"}
                        className="block w-full border border-zinc-200"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {featuredMoodboard ? (
          <section className="max-w-5xl space-y-8">
            <div className="space-y-2">
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Curatorial Intelligence
              </p>
              <h2 className="text-xl text-zinc-800">Curatorial Intelligence</h2>
              <p className="max-w-3xl text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
                CI pairs visual direction with interpretation and application,
                helping translate research into clearer design thinking.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <div>
                {publicMoodboardUrl(featuredMoodboard.image_path ?? null) ? (
                  <img
                    src={publicMoodboardUrl(featuredMoodboard.image_path ?? null) ?? ""}
                    alt={featuredMoodboard.title ?? "Moodboard"}
                    className="block w-full"
                  />
                ) : null}
              </div>

              <div className="space-y-4 bg-white p-5">
                <div className="space-y-2">
                  <p
  className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
  style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
>
  Curatorial Intelligence Note
</p>

<div className="relative overflow-hidden">
  <div className="space-y-3">
    <p className="text-sm leading-7 text-neutral-600">
      Each mood board includes curatorial context that helps explain why the
      direction is relevant right now—connecting cultural movement, visual
      shifts, and emerging design relevance.
    </p>

    <p className="text-sm leading-7 text-neutral-600">
      The note layer helps translate what you are seeing into clearer design
      thinking, so the research feels more applicable to real creative work.
    </p>

    <p className="text-sm leading-7 text-neutral-400">
      Full interpretation available with membership.
    </p>
  </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <p
  className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
  style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
>
  Application Query
</p>

<p className="mt-3 text-sm leading-7 text-neutral-600">
  Ask how the mood board can apply to your current project, customer, or
  product category. This helps turn visual direction into something more
  specific and usable for what you are actively creating.
</p>

<div className="mt-4 border border-neutral-300 px-4 py-3 text-sm text-neutral-400">
  How can this direction apply to my current category?
</div>

                  <div className="mt-3 inline-flex border border-neutral-300 px-5 py-3 text-sm text-neutral-400">
                    Unlock to use
                  </div>

                  <div className="mt-4 space-y-2">
  <div className="h-3 w-full bg-neutral-100" />
  <div className="h-3 w-full bg-neutral-100" />
  <div className="h-3 w-4/5 bg-neutral-100" />
  <div className="h-3 w-3/5 bg-neutral-100" />
</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="max-w-4xl space-y-5 border-t border-neutral-200 pt-10">
          <div className="space-y-3">
            <h2
              className="text-[15px] font-bold uppercase tracking-wide"
              style={{ color: BRAND_GREY }}
            >
              Full Access
            </h2>

            <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
              Subscribe to access full boards, complete Curatorial Intelligence
              notes, palette information, and Application Query throughout CI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
  <Link
    href="/pricing"
    className="inline-flex h-12 min-w-[180px] items-center justify-center border border-neutral-900 bg-neutral-900 px-8 text-[15px] text-white"
  >
    Subscribe
  </Link>

  <Link
    href="/ci"
    className="inline-flex h-12 min-w-[180px] items-center justify-center border border-neutral-300 px-8 text-[15px] text-neutral-900"
  >
    Back to CI Home
  </Link>
</div>
        </section>
      </div>
    </main>
  );
}