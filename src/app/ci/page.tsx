import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type Moodboard = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
};

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export default async function CiLandingPage() {
  const supabase = await supabaseServer();

  const { data: boards = [], error } = await supabase
    .from("moodboards")
    .select("id,slug,title,image_path")
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("created_at", { ascending: false })
    .limit(7);

  if (error) {
    console.error("Supabase error (ci landing moodboards):", error.message);
  }

  const featuredBoard = boards[0] ?? null;
  const previewBoards = boards.slice(1, 7);
  const featuredImg = publicMoodboardUrl(featuredBoard?.image_path ?? null);

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-12">
        {/* Hero */}
        <section className="space-y-8 text-center">
          <Link href="/ci" className="block leading-tight">
            <div
              className="text-[24px] italic"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
                color: "#8a8a8aff",
              }}
            >
              Pattern Curator
            </div>
          </Link>

          <h1
            className="text-[36px] uppercase tracking-[0.14em] text-neutral-900 sm:text-[50px]"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 300,
            }}
          >
            Curatorial Intelligence
          </h1>

            <p className="mx-auto max-w-2xl text-[16px] leading-[1.8] text-neutral-600">
              Curatorial Intelligence™ pairs curated visual discovery with AI interpretation —
              turning visual exploration into clear design direction.
            </p>
        </section>

        {/* Featured Board */}
        <section className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            {featuredBoard?.slug && featuredImg ? (
              <Link href={`/moodboard/${featuredBoard.slug}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={featuredImg}
                    alt={featuredBoard.title ?? "Featured board"}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    priority
                  />
                </div>
              </Link>
            ) : (
              <div className="aspect-[4/5] w-full bg-zinc-100" />
            )}
          </div>

          <div className="space-y-5 lg:col-span-5 lg:pt-8">
            <div
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Featured Board
            </div>

            <h2
              className="text-[30px] leading-[1.25] text-neutral-900"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              {featuredBoard?.title ?? "Latest Editorial Moodboard"}
            </h2>

            <div
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Seasonal Direction
            </div>

            <p
              className="max-w-md text-[24px] leading-[1.6] text-neutral-800"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              Softened resort palettes, heritage stripes, and a return to
              relaxed refinement.
            </p>

            {featuredBoard?.slug ? (
              <Link
                href={`/moodboard/${featuredBoard.slug}`}
                className="inline-flex items-center border border-neutral-300 px-5 py-3 text-[12px] uppercase tracking-[0.16em] text-neutral-700"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                View Board
              </Link>
            ) : null}
          </div>
        </section>

        {/* Curatorial Intelligence excerpt */}
        <section className="mt-20 border-t border-neutral-200 pt-10">
          <div className="max-w-3xl space-y-4">
            <div
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Curatorial Intelligence
            </div>

            <p
              className="text-[24px] leading-[1.7] text-neutral-800"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              A selective reading of color, print, and cultural direction —
              connecting visual signals to broader creative context.
            </p>
          </div>
        </section>

        {/* Boards preview */}
        <section className="mt-20 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Editorial Moodboards
            </div>

            <Link
              href="/moodboards"
              className="inline-flex border border-neutral-300 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-neutral-700"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Explore Boards
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3">
            {previewBoards.map((board) => {
              const img = publicMoodboardUrl(board.image_path);

              return (
                <Link
                  key={board.id}
                  href={board.slug ? `/moodboard/${board.slug}` : "/moodboards"}
                  className="block"
                >
                  <div className="group relative aspect-[4/5] w-full overflow-hidden bg-zinc-100">
                    {img ? (
                      <Image
                        src={img}
                        alt={board.title ?? "Moodboard"}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 22vw, 50vw"
                      />
                    ) : null}

                    {board.title ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100">
                        <div className="mx-4 w-[calc(100%-2rem)] bg-white/70 px-4 py-3 text-center backdrop-blur-sm">
                          <div
                            className="text-[14px] font-bold uppercase"
                            style={{
                              fontFamily: "Arial, Helvetica, sans-serif",
                              letterSpacing: "0.12em",
                              color: "#5f6368",
                            }}
                          >
                            {board.title}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Advisory bridge */}
        <section className="mt-20 border-t border-neutral-200 pt-10">
          <div className="max-w-3xl space-y-4">
            <div
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Apply Curatorial Intelligence
            </div>

            <p
              className="text-[24px] leading-[1.7] text-neutral-800"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              Pattern Curator offers one-on-one advisory for brands and creative
              teams seeking deeper direction through color, print, and concept
              development.
            </p>

            <div>
              <a
                href="https://www.patterncurator.com/contact"
                className="inline-flex items-center border border-neutral-300 px-5 py-3 text-[12px] uppercase tracking-[0.16em] text-neutral-700"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                Advisory Inquiry
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}