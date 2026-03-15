import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export default async function SeasonGalleryPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const decodedSeason = decodeURIComponent(season);

  const supabase = await supabaseServer();

  const { data: boards, error } = await supabase
    .from("moodboards")
    .select("id,title,slug,image_path,season,created_at")
    .eq("season", decodedSeason)
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(`Failed to load season moodboards: ${error.message}`);
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-end pb-6">
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

        <div className="pb-8 text-left">
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            Season
          </p>
          <h1 className="pt-1 text-lg text-zinc-700">{decodedSeason}</h1>
        </div>

        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {boards.map((board) => {
              const img = publicMoodboardUrl(board.image_path ?? null);

              return (
                <Link
  key={board.id}
  href={`/moodboard/${board.slug}`}
  className="group block"
>
  <div className="bg-white">
    {img ? (
      <img
        src={img}
        alt={board.title ?? "Moodboard"}
        className="block h-auto w-full"
      />
    ) : (
      <div className="aspect-[4/5] w-full bg-zinc-100" />
    )}
  </div>
</Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No moodboards found for this season.
          </p>
        )}
      </div>
    </main>
  );
}