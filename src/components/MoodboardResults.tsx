import Link from "next/link";
import Image from "next/image";

export type Moodboard = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
  source_url: string | null;
  source_site: string | null;
};

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export default function MoodboardResults({ moodboards }: { moodboards: Moodboard[] }) {
  if (!moodboards || moodboards.length === 0) return null;

  return (
    <section className="pt-4">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3">
        {moodboards.map((m) => {
          const src = publicMoodboardUrl(m.image_path);
          const href = m.slug?.trim() ? `/moodboard/${m.slug.trim()}` : null;

          const card = (
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

              {m.title ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100">
                  <div className="mx-4 w-[calc(100%-2rem)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center">
                    <div
                      className="text-[15px] font-bold uppercase"
                      style={{
                        fontFamily: "Arial, Helvetica, sans-serif",
                        letterSpacing: "0.12em",
                        color: "#5f6368",
                      }}
                    >
                      {m.title}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );

          return (
            <div key={m.id}>
              {href ? <Link href={href} className="block">{card}</Link> : card}
            </div>
          );
        })}
      </div>
    </section>
  );
}