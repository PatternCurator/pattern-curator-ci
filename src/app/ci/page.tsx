import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type Moodboard = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
  domain: string | null;
  direction: string | null;
  color_notes: string | null;
  print_pattern_notes: string | null;
};

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function firstSentence(text: string | null | undefined) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return null;

  const match = clean.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0].trim() : clean;
}

async function getFeaturedBoardAiSentence(board: Moodboard | null) {
  if (!board) {
    return "Curatorial context highlights the broader context behind this featured moodboard.";
  }

  try {
    const appUrl = getAppUrl();

    const res = await fetch(`${appUrl}/api/interpret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        mode: "asset",
        asset: {
          title: board.title,
          domain: board.domain,
          direction: board.direction,
          color_notes: board.color_notes,
          print_pattern_notes: board.print_pattern_notes,
        },
      }),
    });

    if (!res.ok) {
      return "Curatorial context highlights the broader context behind this featured moodboard.";
    }

    const data = await res.json();
    const summary = firstSentence(data?.curatorial_summary);

    return (
      summary ||
      "Curatorial context  highlights the broader context behind this featured moodboard."
    );
  } catch (error) {
    console.error("Failed to load featured board AI interpretation:", error);
    return "Curatorial context  highlights the broader context behind this featured moodboard.";
  }
}

export default async function CiLandingPage() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("moodboards")
    .select("id,slug,title,image_path,domain,direction,color_notes,print_pattern_notes")
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Supabase error (ci landing moodboards):", error.message);
  }

  const boards: Moodboard[] = data ?? [];

  // stable 7-day rotation based on UTC calendar days
  const now = new Date();
  const utcDayNumber = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      (1000 * 60 * 60 * 24)
  );
  const rotationWindow = Math.floor(utcDayNumber / 7);
  const featuredIndex = boards.length > 0 ? rotationWindow % boards.length : 0;

  const featuredBoard = boards[featuredIndex] ?? null;

  const previewBoards = boards
    .filter((board) => board.id !== featuredBoard?.id)
    .slice(0, 6);

  const featuredImg = publicMoodboardUrl(featuredBoard?.image_path ?? null);
  const featuredText = await getFeaturedBoardAiSentence(featuredBoard);

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

<p
  className="mt-3 text-[18px] italic tracking-[0.02em] text-center px-6"
  style={{
    fontFamily: "var(--font-libre), Libre Baskerville, serif",
    color: "#8a8a8aff",
  }}
>
  A return to an endless stream of visual
  inspiration for color, print + pattern — now expanded through interpretation.
</p>

<p className="mx-auto max-w-4xl text-[16px] leading-[1.8] text-neutral-600">
  Curatorial Intelligence™ pairs curated visual discovery with context interpretation —
  turning visual exploration into clear design direction. A simple way to explore macro trends, moodboards, color stories and print direction — and ask how a mood translates into product, category, or design.
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
              {featuredBoard?.title ?? "Featured Moodboard"}
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
              {featuredText}
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

<p
  className="max-w-2xl text-[17px] leading-[1.8] text-neutral-700 italic"
  style={{
    fontFamily: "var(--font-libre), Libre Baskerville, serif",
  }}
>
  What we call trend today can often reflect repetition. CI offers a more
  intentional approach, using curatorial context to support interpretation and expand creative perspective.
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

        <section className="mt-20 border-t border-neutral-200 pt-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/image-library" className="group block">
            <div className="relative overflow-hidden">
            <div className="relative h-[150px] overflow-hidden">
     <Image
        src="/image-library-cover.jpg"
        alt="Image Library"
        fill
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/25" />

  {/* text overlay */}
</div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p
            className="text-[11px] uppercase tracking-[0.18em] text-white"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            Included with CI Access
          </p>

          <h2
            className="mt-3 text-[28px] uppercase tracking-[0.18em] text-white"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 300,
            }}
          >
            Image Library
          </h2>

          <p
            className="mt-3 text-[18px] italic text-white"
            style={{
              fontFamily:
                "var(--font-libre), Libre Baskerville, serif",
            }}
          >
            Curated Inspiration
          </p>
        </div>
      </div>
    </Link>
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
                href="https://www.patterncurator.com/scheduling"
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