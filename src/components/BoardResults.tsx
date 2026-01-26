import Link from "next/link";
import Image from "next/image";

export type Board = {
  id: string;
  title: string;
  slug: string;
  image_path: string;
  source_site: string | null;
  domain: string | null;
  direction: string | null;
  color_notes: string | null;
  print_pattern_notes: string | null;
};

function publicBoardUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/boards/${encoded}`;
}

function twoWordTitle(title: string | null | undefined) {
  const t = (title ?? "").trim();
  if (!t) return "Untitled";
  return t.split(/\s+/).slice(0, 2).join(" ");
}

export default function BoardResults({
  q,
  boards,
}: {
  q: string;
  boards: Board[];
}) {
  if (!boards || boards.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {boards.map((b) => {
          const src = publicBoardUrl(b.image_path);

          return (
            <div key={b.id}>
              <Link href={`/board/${b.slug}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-100">
                  {src ? (
                    <Image
                      src={src}
                      alt={b.title || ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 20vw"
                    />
                  ) : null}
                </div>
              </Link>

              <div className="mt-2">
                <div className="text-sm leading-snug">
                  {twoWordTitle(b.title)}
                </div>
                {b.source_site ? (
                  <div className="mt-1 text-xs opacity-70">
                    {b.source_site}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
