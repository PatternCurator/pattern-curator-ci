import Link from "next/link";
import Image from "next/image";
import CurateInterpretation from "./CurateInterpretation";

export type Asset = {
  id: string;
  title: string;
  image_path: string;
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
function twoWordTitle(title: string | null | undefined) {
  const t = (title ?? "").trim();
  if (!t) return "Untitled";
  return t.split(/\s+/).slice(0, 2).join(" ");
}


export default function CurateResults({ q, assets }: { q: string; assets: Asset[] }) {
  if (!assets || assets.length === 0) return null;

  return (
    <section className="space-y-6">
      {/* Curate auto-runs interpretation when q + results exist */}
      {q ? <CurateInterpretation q={q} assets={assets} /> : null}

      <div className="grid grid-cols-3 gap-4">
        {assets.slice(0, 9).map((a) => {
          const src = publicAssetUrl(a.image_path);

          return (
            <div key={a.id}>
              <Link href={`/asset/${a.id}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-100">
                  {src ? (
                    <Image
                      src={src}
                      alt={a.title || ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 20vw"
                    />
                  ) : null}
                </div>
              </Link>

              <div className="mt-2">
                <div className="text-sm leading-snug">{twoWordTitle(a.title)}</div>
                {a.source_site && a.source_url ? (
                  <a
                    href={a.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs opacity-70 hover:opacity-100"
                  >
                    {a.source_site}
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
