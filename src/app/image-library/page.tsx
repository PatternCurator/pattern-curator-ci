import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import ImageLibraryGrid from "@/components/ImageLibraryGrid";
import SubscriberOnly from "@/components/SubscriberOnly";

export const dynamic = "force-dynamic";

type ImageLibraryAsset = {
  id: string;
  image_path: string;
  source_name: string | null;
  descriptors: string | null;
  tags: string | null;
};

function getImageUrl(path: string | null) {
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return cleanPath;

  return `${supabaseUrl}/storage/v1/object/public/ci-image-library/${cleanPath}`;
}

export default async function ImageLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tag?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const tag = (sp.tag ?? "").trim();

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("ci_image_library")
    .select("id, image_path, source_name, descriptors, tags")
    .eq("is_active", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `source_name.ilike.%${q}%,descriptors.ilike.%${q}%,tags.ilike.%${q}%`
    );
  }

  if (tag) {
    query = query.ilike("tags", `%${tag}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("image library error", error);
  }

  const assets = ((data ?? []) as ImageLibraryAsset[]).map((asset) => ({
    ...asset,
    image_url: getImageUrl(asset.image_path),
  }));

  return (
    <SubscriberOnly>
      <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="space-y-3">
            <h1
              className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontWeight: 300,
              }}
            >
              Image Library
            </h1>

            <p
              className="max-w-2xl text-[13px] italic leading-[1.8] text-neutral-500"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              A curated visual archive references for color,
              print, and pattern inspiration. 
            </p>

            <p
              className="max-w-3xl text-[11px] leading-[1.8] text-neutral-400"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
            }}
    >
      All images in the Image Library have been curated from public domain (CC0)
      sources and are provided as visual references for color, print, pattern,
      and material inspiration.
  </p>

            <form
  className="pt-4 flex gap-2"
  action="/image-library"
>
  <input
    type="search"
    name="q"
    defaultValue={q}
    placeholder="Search images..."
    className="flex-1 border border-neutral-300 px-5 py-3 text-sm outline-none"
  />

  <button
    type="submit"
    className="border border-neutral-300 px-8 py-3 text-[11px] uppercase tracking-[0.18em] text-neutral-700 hover:text-neutral-900"
    style={{
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    Search
  </button>
</form>

            {tag ? (
              <div className="pt-2">
                <a
                  href="/image-library"
                  className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 underline underline-offset-4"
                >
                  Clear tag: {tag}
                </a>
              </div>
            ) : null}
          </section>

          <ImageLibraryGrid assets={assets} activeTag={tag} />
        </div>
      </main>
    </SubscriberOnly>
  );
}