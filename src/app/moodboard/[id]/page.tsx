export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export default async function MoodboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("moodboards")
    .select("id,title,image_path,source_url,source_site")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-sm text-zinc-600">Moodboard not found.</div>
      </main>
    );
  }

  const src = publicMoodboardUrl(data.image_path);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-widest text-zinc-500 italic">
          Moodboard
        </div>
        {data.title ? (
          <div className="text-[18px] italic" style={{ fontFamily: "var(--font-libre), Libre Baskerville, serif" }}>
            {data.title}
          </div>
        ) : null}

        {(data.source_site || data.source_url) ? (
          <div className="text-xs text-zinc-500">
            {data.source_site ? data.source_site : null}
            {data.source_url ? (
              <>
                {data.source_site ? " · " : null}
                <a className="underline hover:opacity-80" href={data.source_url} target="_blank" rel="noreferrer">
                  Source
                </a>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-none bg-zinc-100">
        <div className="relative w-full aspect-[4/5]">
          {src ? (
            <Image
              src={src}
              alt={data.title ?? "Moodboard"}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}