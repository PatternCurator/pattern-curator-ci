import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AssetInterpretation from "@/components/AssetInterpretation";
import ApplicationQuery from "@/components/ApplicationQuery";

export const dynamic = "force-dynamic";

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export default async function MoodboardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("moodboards")
    .select(
      "id,title,slug,image_path,source_url,source_site,domain,direction,color_notes,print_pattern_notes,created_at,palette_hex,palette_names,season"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return notFound();

  const { data: previousBoard } = await supabase
    .from("moodboards")
    .select("slug,title")
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .gt("created_at", data.created_at)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: nextBoard } = await supabase
    .from("moodboards")
    .select("slug,title")
    .eq("status", "ready")
    .eq("catalog_state", "current")
    .lt("created_at", data.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const img = publicMoodboardUrl(data.image_path ?? null);

  const pdfHref = img
    ? `/api/moodboard/pdf?img1=${encodeURIComponent(img)}&title=${encodeURIComponent(
        data.title ?? "Moodboard"
      )}`
    : null;

  const interpretationAsset = {
    id: data.id,
    title: data.title ?? "Untitled",
    image_path: (data.image_path ?? null) as any,
    source_url: data.source_url ?? null,
    source_site: data.source_site ?? null,
    domain: data.domain ?? null,
    direction: data.direction ?? null,
    color_notes: data.color_notes ?? null,
    print_pattern_notes: data.print_pattern_notes ?? null,
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 space-y-10">
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

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AssetInterpretation asset={interpretationAsset as any} showMeta />

        {img ? (
          <a href={img} target="_blank" rel="noreferrer" className="block">
            <div className="bg-white py-6">
              <img
                src={img}
                alt={data.title ?? "Moodboard"}
                className="mx-auto block h-auto w-full max-w-[900px]"
              />
            </div>
          </a>
        ) : null}

        <div className="pt-6 space-y-3 text-center">
          {Array.isArray(data.palette_hex) && data.palette_hex.length > 0 ? (
            <div className="pt-8 pb-6">
              <div className="mx-auto flex w-full max-w-[900px] justify-center gap-4">
                {data.palette_hex.map((hex: string, index: number) => (
                  <div key={`${hex}-${index}`} className="min-w-0 flex-1">
                    <div
                      className="h-14 w-full border border-zinc-300"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="pt-2 text-center">
                      {Array.isArray(data.palette_names) && data.palette_names[index] ? (
                        <p className="text-xs uppercase tracking-[0.08em] text-zinc-600">
                          {data.palette_names[index]}
                        </p>
                      ) : null}
                      <p
                        className="text-[11px] text-zinc-500"
                        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                      >
                        {hex}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

                    <p className="text-xs text-zinc-400">
            Mood board and color palette shown for editorial and educational purposes. Colors are approximate and may not exactly match the original source. Reference imagery used only for visual analysis; editorial research context, commentary and color direction.
          </p>

          {data.source_site ? (
            <p className="text-sm text-zinc-500">
              sources: {data.source_site}
            </p>
          ) : null}

          {data.source_url ? (
            <p className="text-sm text-zinc-500">
              <a
                className="underline hover:opacity-80"
                href={data.source_url}
                target="_blank"
                rel="noreferrer"
              >
                {data.source_url}
              </a>
            </p>
          ) : null}

          {pdfHref ? (
            <div className="flex justify-center pt-2">
              <a
                href={pdfHref}
                className="inline-flex items-center px-3 h-8 text-xs uppercase tracking-wider border border-zinc-300 bg-zinc-100 text-zinc-600 rounded-full"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Download PDF
              </a>
            </div>
          ) : null}

          {(previousBoard?.slug || nextBoard?.slug) ? (
            <div className="pt-6">
              <div
                className="flex items-center justify-between gap-6"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                <div className="min-w-0 flex-1 text-left">
                  {previousBoard?.slug ? (
                    <Link
                      href={`/moodboard/${previousBoard.slug}`}
                      className="inline-flex items-center text-sm font-bold uppercase tracking-[0.12em] text-zinc-600 underline underline-offset-4 hover:opacity-80"
                    >
                      ← Previous Board
                    </Link>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 text-right">
                  {nextBoard?.slug ? (
                    <Link
                      href={`/moodboard/${nextBoard.slug}`}
                      className="inline-flex items-center text-sm font-bold uppercase tracking-[0.12em] text-zinc-600 underline underline-offset-4 hover:opacity-80"
                    >
                      Next Board →
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {data.season ? (
  <div className="pt-6 text-left">
    <p
      className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      Season
    </p>
    <p className="pt-1 text-sm text-zinc-600">{data.season}</p>
  </div>
) : null}

        <ApplicationQuery
          boardTitle={data.title}
          boardNotes={[data.direction, data.color_notes, data.print_pattern_notes]
            .filter(Boolean)
            .join("\n\n")}
        />
      </div>
    </main>
  );
}