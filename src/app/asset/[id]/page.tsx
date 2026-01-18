mkdir -p app/asset/[id]
cat > app/asset/[id]/page.tsx << 'EOF'
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function signedUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const supabase = await supabaseServer();
  const { data } = await supabase.storage.from("assets").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("assets")
    .select("id,title,image_path,source_url,category,motif,color,season")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return notFound();

  const url = await signedUrl(data.image_path);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-600 underline underline-offset-4">
          ← Back to search
        </Link>
      </div>

      <h1 className="text-xl tracking-tight">{data.title ?? "Untitled"}</h1>
      <div className="mt-2 text-sm text-zinc-600">
        {[data.category, data.motif, data.color, data.season].filter(Boolean).join(" • ")}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        <div className="relative aspect-[16/10]">
          {url ? (
            <Image src={url} alt={data.title ?? "Asset"} fill className="object-contain" />
          ) : null}
        </div>
      </div>

      {data.source_url ? (
        <div className="mt-4 text-sm">
          <a
            href={data.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-700 underline underline-offset-4"
          >
            Source link
          </a>
        </div>
      ) : null}
    </main>
  );
}
EOF
