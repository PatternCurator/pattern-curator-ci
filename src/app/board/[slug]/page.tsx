import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AssetInterpretation from "@/components/AssetInterpretation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function publicBoardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  // IMPORTANT: trim whitespace/newlines to prevent %0A in URLs
  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/boards/${encoded}`;
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("boards")
    .select(
      "id,title,slug,board_image_path_1,board_image_path_2,source_site,domain,direction,color_notes,print_pattern_notes"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return notFound();

  const img1 = publicBoardUrl(data.board_image_path_1 ?? null);
  const img2 = publicBoardUrl(data.board_image_path_2 ?? null);

  // Reuse interpretation component by providing the shape it expects
  const interpretationAsset = {
    id: data.id,
    title: data.title ?? "Untitled",
    image_path: (data.board_image_path_1 ?? null) as any,
    source_url: null,
    source_site: data.source_site ?? null,
    domain: data.domain ?? null,
    direction: data.direction ?? null,
    color_notes: data.color_notes ?? null,
    print_pattern_notes: data.print_pattern_notes ?? null,
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-6">
        <h1
  className="text-xl tracking-tight italic"
  style={{
    fontFamily: "var(--font-libre), Libre Baskerville, serif",
    color: "#8a8a8aff",
  }}
>
  {(data.title ?? "Untitled").toUpperCase()}
</h1>



        <Link
          href="/trend"
          className="inline-flex h-9 items-center rounded-full px-4 text-sm"
          style={{ border: "1px solid #B8B9B6", color: "#707376ff" }}
        >
          Back to Trend
        </Link>
      </div>

      {/* ✅ Balanced layout: AI + images share the same width */}
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* AI info (hide market/domain header line) */}
        <AssetInterpretation asset={interpretationAsset as any} showMeta={false} />

        {/* Board JPGs: landscape, sharp corners, no outlines.
            Click opens the image alone in a new tab/window. */}
        {img1 ? (
          <a href={img1} target="_blank" rel="noreferrer" className="block">
            <div className="bg-zinc-50">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={img1}
                  alt="Board image 1"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 720px"
                />
              </div>
            </div>
          </a>
        ) : null}

        {img2 ? (
          <a href={img2} target="_blank" rel="noreferrer" className="block">
            <div className="bg-zinc-50">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={img2}
                  alt="Board image 2"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 720px"
                />
              </div>
            </div>
          </a>
        ) : null}

        {/* Sources sentence at bottom */}
        {data.source_site ? (
          <p className="pt-2 text-sm text-zinc-500">{data.source_site}</p>
        ) : null}
      </div>
    </main>
  );
}
