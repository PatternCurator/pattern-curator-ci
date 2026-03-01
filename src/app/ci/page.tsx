import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 60 * 60 * 24 * 7; // 7 days

type Signal = {
  id: string;
  image_path: string | null;
  source_url: string | null;
  source_site: string | null;
  title: string | null;
  direction: string | null;
  color_notes: string | null;
  print_pattern_notes: string | null;
};

type Featured = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
  source_url: string | null;
  source_site: string | null;
};

type Recent = {
  id: string;
  slug: string | null;
  title: string | null;
  cover_image_path: string | null;
  report_type: string | null;
  created_at: string | null;
};

function publicBucketUrl(bucket: string, path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

export default async function CiLandingPage() {
  const supabase = await supabaseServer();

  const [
    { data: signalsData, error: signalsError },
    { data: featuredData, error: featuredError },
    { data: recentData, error: recentError },
  ] = await Promise.all([
    supabase.from("ci_home_current_signals").select("*"),
    supabase.from("ci_home_featured_board").select("*"),
    supabase.from("ci_home_recent_interpretations").select("*"),
  ]);

  if (signalsError) console.error("ci_home_current_signals error:", signalsError);
  if (featuredError) console.error("ci_home_featured_board error:", featuredError);
  if (recentError) console.error("ci_home_recent_interpretations error:", recentError);

  const signals = (signalsData ?? []) as Signal[];
  const featured = ((featuredData ?? [])[0] ?? null) as Featured | null;
  const recent = (recentData ?? []) as Recent[];

  const signalImgs = signals.map((s) => ({
    ...s,
    img: publicBucketUrl("assets", s.image_path),
  }));

  const featuredImg = publicBucketUrl("moodboards", featured?.image_path ?? null);

  const recentItems = recent.map((r) => ({
    ...r,
    img: publicBucketUrl("boards_covers", r.cover_image_path),
  }));

  const signalHref = (id: string) => `/asset/${id}`;
  const featuredHref = featured?.slug ? `/moodboard/${featured.slug}` : "/moodboards";
  const boardHref = (slug: string | null) => (slug ? `/board/${slug}` : "/archive");

  const heroTitle = "Curatorial Intelligence";
  const heroSubtitleA =
    "An evolving intelligence system for interpreting culture through print, color, and surface.";
  const heroSubtitleB = "Signals observed. Context synthesized. Direction translated into application.";

  const teaserSignal = signalImgs[0] ?? null;

  const directionLine = teaserSignal?.direction?.trim()
    ? teaserSignal.direction.trim().toUpperCase()
    : "";

  const weeklyLine =
    "A weekly snapshot of print, color, and surface directions shaping contemporary creative work.";

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-16">
        {/* HERO */}
        <header className="text-center">
          <Link href="/" className="block leading-tight">
            <div
              className="text-[20px] italic"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
                color: "#8a8a8aff",
              }}
            >
              Pattern Curator
            </div>
          </Link>

          <h1 className="mt-4 font-libre text-[44px] tracking-[0.14em] uppercase text-neutral-900">
            {heroTitle}
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-[16px] leading-[1.75] text-neutral-700">
            {heroSubtitleA}
          </p>

          <p className="mx-auto mt-3 max-w-3xl text-[16px] leading-[1.75] text-neutral-700">
            {heroSubtitleB}
          </p>

          <div className="mt-8 flex items-center justify-center gap-8 text-[14px] tracking-[0.08em] uppercase">
            <Link className="text-neutral-900 hover:underline" href="/inspiration">
              Explore the Library
            </Link>
            <span className="text-neutral-300">|</span>
            <Link className="text-neutral-900 hover:underline" href="/pricing">
              Unlock Full Access
            </Link>
          </div>
        </header>

        {/* MAIN SURFACE */}
        <section className="mt-14 grid grid-cols-12 gap-10">
          {/* Left: Current Signals */}
          <div className="col-span-12 lg:col-span-8">
            <div className="border-b border-neutral-200 pb-3">
              <p className="text-[12px] tracking-[0.18em] uppercase text-neutral-900">
                Current Signals
              </p>
            </div>

            <p className="mt-4 max-w-3xl text-[16px] leading-[1.75] text-neutral-700">
              {weeklyLine}
            </p>

            {directionLine ? (
              <p className="mt-3 text-[12px] tracking-[0.18em] uppercase text-neutral-500">
                {directionLine}
              </p>
            ) : null}

            {/* Brick layout */}
            <div className="mt-6 grid grid-cols-12 gap-4">
              {/* Large */}
              <div className="col-span-12 md:col-span-8">
                {signalImgs[0]?.img ? (
                  <Link href={signalHref(signalImgs[0].id)} className="block">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                      <Image
                        src={signalImgs[0].img}
                        alt={signalImgs[0].title ?? "Current signal"}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 66vw, 100vw"
                        priority
                      />
                    </div>
                  </Link>
                ) : (
                  <div className="aspect-[16/10] w-full bg-neutral-100" />
                )}
              </div>

              {/* Two small */}
              <div className="col-span-12 md:col-span-4 grid grid-rows-2 gap-4">
                {[1, 2].map((i) =>
                  signalImgs[i]?.img ? (
                    <Link key={signalImgs[i].id} href={signalHref(signalImgs[i].id)} className="block">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                        <Image
                          src={signalImgs[i].img}
                          alt={signalImgs[i].title ?? `Signal ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 33vw, 100vw"
                        />
                      </div>
                    </Link>
                  ) : (
                    <div key={i} className="aspect-[16/10] w-full bg-neutral-100" />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right: Featured Board */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="border-b border-neutral-200 pb-3">
              <p className="text-[12px] tracking-[0.18em] uppercase text-neutral-900">
                Featured Board
              </p>
            </div>

            <div className="mt-6">
              {featuredImg ? (
                <Link href={featuredHref} className="block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={featuredImg}
                      alt={featured?.title ?? "Featured board"}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, 100vw"
                    />
                  </div>
                </Link>
              ) : (
                <div className="aspect-[4/5] w-full bg-neutral-100" />
              )}
            </div>
          </aside>
        </section>

        {/* PALETTE STRIP */}
        <div className="mt-10">
          <div className="h-[36px] w-full overflow-hidden bg-neutral-100">
            <div className="flex h-full">
              <div className="h-full w-[16%] bg-[#C9D1C0]" />
              <div className="h-full w-[20%] bg-[#7D8A78]" />
              <div className="h-full w-[14%] bg-[#E8E2D6]" />
              <div className="h-full w-[18%] bg-[#9A7A53]" />
              <div className="h-full w-[16%] bg-[#8B8D90]" />
              <div className="h-full w-[16%] bg-[#5F6468]" />
            </div>
          </div>
        </div>

        {/* RECENT INTERPRETATIONS (THIS WAS MISSING) */}
        <section className="mt-16 border-t border-neutral-200 pt-10">
          <p className="text-center text-[12px] tracking-[0.18em] uppercase text-neutral-900">
            Recent Interpretations
          </p>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
            {recentItems.map((r) => (
              <Link key={r.id} href={boardHref(r.slug)} className="group">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  {r.img ? (
                    <Image
                      src={r.img}
                      alt={r.title ?? "Interpretation"}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 25vw, 50vw"
                    />
                  ) : null}
                </div>

                <div className="mt-3 text-center text-[13px] leading-[1.35] text-neutral-800">
                  <div className="italic">{(r.report_type ?? "Post").toString()}</div>
                  <div className="mt-1 whitespace-normal break-words">
                    {r.title ?? "Untitled"}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {recentItems.length === 0 ? (
            <p className="mx-auto mt-8 max-w-3xl text-center text-[14px] text-neutral-500">
              No recent interpretations yet.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}