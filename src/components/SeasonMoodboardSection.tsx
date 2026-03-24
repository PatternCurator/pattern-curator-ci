"use client";

import Link from "next/link";
import { useState } from "react";

type SeasonMoodboard = {
  id: string;
  slug: string | null;
  title: string | null;
  image_path: string | null;
};

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export default function SeasonMoodboardSection({
  boards,
}: {
  boards: SeasonMoodboard[];
}) {
  const [showAll, setShowAll] = useState(false);

  if (!boards.length) return null;

  const visibleBoards = showAll ? boards : boards.slice(0, 8);
  const hasMore = boards.length > 8;

  return (
    <section className="space-y-8 pt-4">
      <div>
        <p
          className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          Moodboards
        </p>
        <h2 className="text-xl text-zinc-800">Seasonal Direction</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
        {visibleBoards.map((board) => {
          const img = publicMoodboardUrl(board.image_path ?? null);

          return (
            <Link
              key={board.id}
              href={board.slug ? `/moodboard/${board.slug}` : "#"}
              className="block"
            >
              {img ? (
                <img
                  src={img}
                  alt={board.title ?? "Moodboard"}
                  className="block w-full transition-opacity duration-200 hover:opacity-80"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-zinc-100" />
              )}
            </Link>
          );
        })}
      </div>

      {hasMore && !showAll ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center justify-center border border-zinc-300 px-8 py-3 text-sm uppercase tracking-[0.12em] text-zinc-600"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            More
          </button>
        </div>
      ) : null}
    </section>
  );
}