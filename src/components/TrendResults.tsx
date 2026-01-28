import Link from "next/link";
import Image from "next/image";

export type Board = {
  id: string;
  title: string | null;
  slug: string;
  cover_image_path: string | null;
  source_site: string | null;
  report_type?: string | null;
};

function publicCoverUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/boards_covers/${encoded}`;
}

function formatType(t?: string | null) {
  if (!t) return "";
  return t.toUpperCase().replace("+", " + ");
}

export default function TrendResults({ boards }: { boards: Board[] }) {
  if (!boards || boards.length === 0) return null;

  return (
    <section className="pt-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {boards.map((b) => {
          const src = publicCoverUrl(b.cover_image_path);

          return (
            <Link key={b.id} href={`/board/${b.slug}`} className="block">
              <div className="overflow-hidden rounded-2xl bg-zinc-100">
                <div className="relative aspect-[3/2] w-full">
                  {src ? (
                    <Image
                      src={src}
                      alt={b.title ?? "Cover"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
                      No cover image
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-1.5 space-y-0.5">
                <div className="text-sm leading-snug">{b.title ?? "Untitled"}</div>
                {b.report_type ? (
                  <div
                    className="text-[11px] italic"
                    style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#707376ff" }}
                  >
                    {formatType(b.report_type)}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
