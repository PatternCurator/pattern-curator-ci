import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type ConceptBoard = {
  id: string;
  board_type: string;
  board_key: string | null;
  image_path: string | null;
  context_line: string | null;
  season: string | null;
  sort_order: number | null;
};

type ConceptMoodboard = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
  concept_slug: string | null;
  concept_order: number | null;
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

function formatConceptTitle(boardKey: string | null) {
  if (!boardKey) return "Concept";

  return boardKey
    .replace(/^cpt[-_]/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await supabaseServer();

  const { data: conceptBoard, error: conceptError } = await supabase
    .from("moodboard_supporting_boards")
    .select("id, board_type, board_key, image_path, context_line, season, sort_order")
    .eq("board_type", "concept")
    .eq("board_key", slug)
    .single();

  if (conceptError || !conceptBoard) return notFound();

  const { data: relatedMoodboards } = await supabase
    .from("moodboards")
    .select("id, slug, title, image_path, concept_slug, concept_order")
    .eq("concept_slug", slug)
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("concept_order", { ascending: true })
    .limit(4);

  const concept = conceptBoard as ConceptBoard;
  const moodboards = ((relatedMoodboards ?? []) as ConceptMoodboard[]).filter(
    (board) => board.slug
  );

  const conceptImg = publicSupportingBoardUrl(concept.image_path);
  const conceptTitle = formatConceptTitle(concept.board_key);

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-14">
        <section className="space-y-3">
          <div className="space-y-2">
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Concept
            </p>

            <h1 className="text-xl text-neutral-900">{conceptTitle}</h1>
          </div>

          {concept.season ? (
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/season/${encodeURIComponent(concept.season)}`}
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 underline underline-offset-4"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Back to Seasons
              </Link>
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          {conceptImg ? (
            <img
              src={conceptImg}
              alt={conceptTitle}
              className="block w-full border border-zinc-200"
            />
          ) : null}

          {concept.context_line?.trim() ? (
            <div className="w-full">
              <p className="text-sm leading-7 text-zinc-600">
                {concept.context_line.trim()}
              </p>
            </div>
          ) : null}
        </section>

        {moodboards.length ? (
          <section className="space-y-6 border-t border-neutral-200 pt-10">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Related Moodboards
              </p>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {moodboards.map((board) => {
                  const img = publicMoodboardUrl(board.image_path ?? null);

                  return (
                    <Link
                      key={board.id}
                      href={`/moodboard/${board.slug}`}
                      className="block"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={board.title ?? "Moodboard"}
                          className="block w-full transition-opacity duration-200 hover:opacity-80"
                        />
                      ) : (
                        <div className="aspect-[4/5] w-full bg-neutral-100" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/moodboards"
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 underline underline-offset-4"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                View Moodboards
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}