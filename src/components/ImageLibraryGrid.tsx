"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Asset = {
  id: string;
  image_path: string;
  image_url: string | null;
  source_name: string | null;
  descriptors: string | null;
  tags: string | null;
};

const INITIAL_COUNT = 50;
const LOAD_MORE_COUNT = 50;

export default function ImageLibraryGrid({
  assets,
  activeTag,
}: {
  assets: Asset[];
  activeTag?: string;
}) {
  const [selected, setSelected] = useState<Asset | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const visibleAssets = useMemo(
    () => assets.slice(0, visibleCount),
    [assets, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [assets]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];

        if (first.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + LOAD_MORE_COUNT, assets.length)
          );
        }
      },
      { rootMargin: "800px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [assets.length]);

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 900);
    }

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        {visibleAssets.map((asset) => {
          if (!asset.image_url) return null;

          const tags = asset.tags
            ? Array.from(
                new Set(
                  asset.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              )
            : [];

          return (
            <div key={asset.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSelected(asset)}
                className="block w-full text-left"
              >
                <img
                  src={asset.image_url}
                  alt={asset.source_name ?? "Curated image"}
                  className="aspect-[4/5] w-full border border-neutral-200 object-cover"
                  loading="lazy"
                />
              </button>

              {asset.source_name ? (
                <p
                  className="mt-1.5 text-[11px] text-neutral-800"
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: 400,
                  }}
                >
                  {asset.source_name}
                </p>
              ) : null}

              {tags.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {tags.map((tag) => {
                    const isActive = activeTag === tag;

                    return (
                      <a
                        key={tag}
                        href={`/image-library?tag=${encodeURIComponent(tag)}`}
                        className={[
                          "text-[9px] uppercase tracking-[0.12em] underline underline-offset-4",
                          isActive
                            ? "text-neutral-900"
                            : "text-neutral-400 hover:text-neutral-700",
                        ].join(" ")}
                      >
                        {tag}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {visibleCount < assets.length ? (
        <div ref={loadMoreRef} className="h-20" />
      ) : null}

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 border border-neutral-300 bg-white px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-neutral-600 shadow-sm hover:text-neutral-900"
        >
          Back to Top
        </button>
      ) : null}

      {selected?.image_url ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 text-2xl text-white"
            onClick={() => setSelected(null)}
          >
            ×
          </button>

          <div
            className="max-h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.image_url}
              alt={selected.source_name ?? "Curated image"}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />

            <div className="mt-3 flex flex-col items-center gap-3">
              {selected.source_name ? (
                <p className="text-center text-xs tracking-[0.06em] text-white/80">
                  {selected.source_name}
                </p>
              ) : null}

              <a
                href={selected.image_url}
                download
                className="border border-white/40 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white/80 hover:text-white"
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}