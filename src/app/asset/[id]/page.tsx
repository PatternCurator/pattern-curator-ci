import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AssetInterpretation from "@/components/AssetInterpretation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Asset = {
  id: string;
  title: string | null;
  image_path: string | null;
  source_url: string | null;
  source_site: string | null;
  domain: string | null;
  direction: string | null;
  color_notes: string | null;
  print_pattern_notes: string | null;
};

function publicAssetUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/assets/${encoded}`;
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("assets")
    .select(
      "id,title,image_path,source_url,source_site,domain,direction,color_notes,print_pattern_notes"
    )
    .eq("id", id)
    .single();

  if (error || !data) return notFound();

  const asset = data as Asset;
  const url = publicAssetUrl(asset.image_path);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          {/* Keep original title (no new title) */}
          <h1 className="text-xl font-semibold tracking-tight">
            {asset.title ?? "Untitled"}
          </h1>

          {asset.source_url ? (
            <a
              href={asset.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-zinc-700 underline underline-offset-4 break-all"
              title={asset.source_site ?? "Source"}
            >
              {asset.source_site ?? "Source"}
            </a>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No source link</p>
          )}
        </div>

        <Link
  href="/"
  className="inline-flex h-9 items-center rounded-full px-4 text-sm"
  style={{ border: "1px solid #B8B9B6", color: "#707376ff" }}
>
  Back to search
</Link>

      </div>

      {/* Single-asset interpretation (moved to top) */}
<AssetInterpretation asset={asset} />

<div className="mt-6 flex justify-center">
  <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white">
    <div className="relative aspect-[4/5] bg-zinc-50">
      {url ? (
        <Image
          src={url}
          alt={asset.title ?? "Asset"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 90vw, 400px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
          No preview available
        </div>
      )}
    </div>
  </div>
</div>

    </main>
  );
}
