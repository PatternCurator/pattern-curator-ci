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

export default function MoodboardResults({
  moodboards,
}: {
  moodboards: Moodboard[];
}) {
  if (!moodboards || moodboards.length === 0) return null;

  return (
    <section className="pt-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {moodboards.map((m) => {
          const src = publicMoodboardUrl(m.image_path);

          return (
            <div key={m.id}>
              <Link href={`/moodboard/${m.id}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-none bg-zinc-100">
                  {src ? (
                    <Image
                      src={src}
                      alt={m.title ?? "Moodboard"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 20vw"
                    />
                  ) : null}
                </div>
              </Link>

              {/* Centered Title */}
              {m.title ? (
                <div
                  className="pt-2 text-center text-sm leading-snug"
                  style={{
                    fontFamily:
                      "var(--font-libre), Libre Baskerville, serif",
                  }}
                >
                  {m.title}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}