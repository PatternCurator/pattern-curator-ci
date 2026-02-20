import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AssetInterpretation from "@/components/AssetInterpretation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      "id,title,slug,image_path,source_url,source_site,domain,direction,color_notes,print_pattern_notes"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return notFound();

  const img = publicMoodboardUrl(data.image_path ?? null);

  const pdfHref =
    img
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
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
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
    Back to Moodboards
    </Link>
  </div>

      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Curatorial Intelligence (same as Boards/Assets) */}
        <AssetInterpretation asset={interpretationAsset as any} showMeta />

        {/* Full moodboard visible (no crop) */}
        {img ? (
          <a href={img} target="_blank" rel="noreferrer" className="block">
            <div className="bg-zinc-50">
              <div className="relative aspect-[13/22] w-full bg-white">
                <Image
                  src={img}
                  alt={data.title ?? "Moodboard"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 720px"
                  priority
                />
              </div>
            </div>
          </a>
        ) : null}

        {/* Sources + Download at bottom (matches Boards pattern) */}
        <div className="pt-2 space-y-2">
          {data.source_site ? (
            <p className="text-sm text-zinc-500">{data.source_site}</p>
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
            <div className="flex justify-center">
              <a
                href={pdfHref}
                className="inline-flex items-center px-3 h-8 text-xs uppercase tracking-wider border border-zinc-300 bg-zinc-100 text-zinc-600 rounded-full"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Download PDF
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}