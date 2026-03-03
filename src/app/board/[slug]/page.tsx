import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AssetInterpretation from "@/components/AssetInterpretation";
import ApplicationQuery from "@/components/ApplicationQuery";

export const dynamic = "force-dynamic";

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
      "id,title,slug,board_image_path_1,board_image_path_2,source_site,domain,direction,color_notes,print_pattern_notes,catalog_state,report_type"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return notFound();

  const isMood = data.report_type === "mood";
  const img1 = publicBoardUrl(data.board_image_path_1 ?? null);
  const img2 = publicBoardUrl(data.board_image_path_2 ?? null);

  const pdfHref =
    img1
      ? `/api/board/pdf?img1=${encodeURIComponent(img1)}${
          img2 ? `&img2=${encodeURIComponent(img2)}` : ""
        }&title=${encodeURIComponent(data.title ?? "Board")}`
      : null;

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
    <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
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
          href={data.catalog_state === "archive" ? "/archive" : "/inspiration"}
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
          {data.catalog_state === "archive" ? "Back to Archive" : "Back to Inspiration"}
        </Link>
      </div>

      {/* ✅ Notes span full width (not stuck left) */}
      <section className="w-full">
        <AssetInterpretation asset={interpretationAsset as any} showMeta />
      </section>

      {/* ✅ Images: big hero scale, sharp corners */}
      <section className="w-full space-y-6">
        {img1 ? (
          <a href={img1} target="_blank" rel="noreferrer" className="block">
            <div className="bg-zinc-50">
              <div className={`relative w-full ${isMood ? "aspect-[13/20.5]" : "min-h-[75vh]"}`}>
                <Image
                  src={img1}
                  alt="Board image 1"
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 1200px, 95vw"
                  priority
                />
              </div>
            </div>
          </a>
        ) : null}

        {img2 ? (
          <a href={img2} target="_blank" rel="noreferrer" className="block">
            <div className="bg-zinc-50">
              <div className="relative w-full min-h-[75vh]">
                <Image
                  src={img2}
                  alt="Board image 2"
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 1200px, 95vw"
                />
              </div>
            </div>
          </a>
        ) : null}
      </section>

      {/* ✅ Footer/meta (still full width) */}
      <div className="pt-2 space-y-2">
        {data.source_site ? <p className="text-sm text-zinc-500">{data.source_site}</p> : null}

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

      {/* ✅ ApplicationQuery spans full width */}
      <section className="w-full">
        <ApplicationQuery
          boardTitle={data.title}
          boardNotes={[data.direction, data.color_notes, data.print_pattern_notes]
            .filter(Boolean)
            .join("\n\n")}
        />
      </section>
    </main>
  );
}