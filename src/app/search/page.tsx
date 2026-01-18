mkdir -p app/search
cat > app/search/page.tsx << 'EOF'
import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Asset = {
  id: string;
  title: string | null;
  image_path: string;
  source_url: string | null;
  category: string | null;
  motif: string | null;
  color: string | null;
  season: string | null;
};

async function signedUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const supabase = await supabaseServer();
  const { data } = await supabase.storage.from("assets").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const supabase = await supabaseServer();

  let query = supabase
    .from("assets")
    .select("id,title,image_path,source_url,category,motif,color,season")
    .limit(60);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,category.ilike.%${q}%,motif.ilike.%${q}%,color.ilike.%${q}%`
    );
  }

  const { data } = await query;
  const assets = (data ?? []) as Asset[];

  const signed = await Promise.all(
    assets.map(async (a) => ({ ...a, signed_url: await signedUrl(a.image_path) }))
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-xl tracking-tight">Search</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {q ? <>Results for <span className="font-medium text-zinc-800">“{q}”</span></> : "All assets"}
          </p>
        </div>

        <form action="/search" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search (e.g., stripe)"
            className="w-64 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:border-zinc-300">
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {signed.map((a) => (
          <Link key={a.id} href={`/asset/${a.id}`} className="group">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="relative aspect-[4/3] bg-zinc-50">
                {a.signed_url ? (
                  <Image
                    src={a.signed_url}
                    alt={a.title ?? "Asset"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-zinc-800 line-clamp-1">
                  {a.title ?? "Untitled"}
                </div>
                <div className="mt-1 text-xs text-zinc-500 line-clamp-1">
                  {[a.category, a.motif, a.color, a.season].filter(Boolean).join(" • ")}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
EOF
