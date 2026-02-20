import Link from "next/link";
import Image from "next/image";

export type Moodboard = {
  id: string;
  title: string | null;
  image_path: string | null;
  source_url: string | null;
  source_site: string | null;
};

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

function sourceLabel(m: Moodboard) {
  const s = (m.source_site ?? "").trim();
  if (s) return s;

  const u = (m.source_url ?? "").trim();
  if (!u) return "";
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function MoodboardResults({ moodboards }: { moodboards: Moodboard[] }) {
  if (!moodboards || moodboards.length === 0) return null;

  return (
    <section className="pt-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {moodboards.map((m) => {
          const src = publicMoodboardUrl(m.image_path);
          const hoverLabel = sourceLabel(m);

          return (
            <div key={m.id}>
              <Link href={`/moodboard/${m.id}`} className="block">
                <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-none bg-zinc-100">
                  {src ? (
                    <Image
                      src={src}
                      alt={m.title ?? "Moodboard"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 20vw"
                    />
                  ) : null}

                  {/* hover-only source overlay (matches your editorial preference) */}
                  {hoverLabel ? (
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                      <div className="absolute bottom-2 left-2 max-w-[90%] truncate text-[11px] leading-none text-white/90">
                        {hoverLabel}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}