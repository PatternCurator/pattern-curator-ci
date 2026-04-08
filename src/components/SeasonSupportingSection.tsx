"use client";

import { useState } from "react";

type SupportingBoard = {
  id: string;
  board_type: string;
  match_value?: string | null;
  image_path?: string | null;
  context_line?: string | null;
  season?: string | null;
  sort_order?: number | null;
};

function publicSupportingBoardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboard-supporting-boards/${encoded}`;
}

function firstLine(text?: string | null) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const match = clean.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0].trim() : clean;
}

async function trackSeasonClick() {
  try {
    const email =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pc_ci_email")
        : null;

    if (!email) return;

    await fetch("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        action: "view_season",
      }),
    });
  } catch {
    // fail silently
  }
}

export default function SeasonSupportingSection({
  label,
  title,
  boards,
  variant = "small",
}: {
  label: string;
  title: string;
  boards: SupportingBoard[];
    variant?: "large" | "small" | "landscape";
}) {
  const [activeBoard, setActiveBoard] = useState<SupportingBoard | null>(null);

  if (!boards.length) return null;

    const gridClass =
    variant === "large"
      ? "grid grid-cols-1 gap-8 md:grid-cols-3"
      : variant === "landscape"
      ? "grid grid-cols-1 gap-6 md:grid-cols-3"
      : "grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5";

  return (
    <>
      <section className="space-y-8">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            {label}
          </p>
          <h2 className="text-xl text-zinc-800">{title}</h2>
        </div>

        <div className={gridClass}>
          {boards.map((board) => {
            const img = publicSupportingBoardUrl(board.image_path ?? null);
            const shortLine = firstLine(board.context_line);

            return (
              <div key={board.id} className="space-y-3">
                {img ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await trackSeasonClick();
                      setActiveBoard(board);
                    }}
                    className="block w-full text-left"
                  >
                    <img
                      src={img}
                      alt={title}
                      className={`block w-full cursor-pointer border border-zinc-200 transition-opacity duration-200 hover:opacity-80 ${
  variant === "landscape" ? "aspect-[4/3] object-cover" : ""
}`}
                    />
                  </button>
                ) : null}

                {variant === "large" && shortLine ? (
                  <div className="space-y-1">
                    <p className="text-xs leading-5 text-zinc-500">{shortLine}</p>

                    <button
                      type="button"
                      onClick={async () => {
                        await trackSeasonClick();
                        setActiveBoard(board);
                      }}
                      className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 underline underline-offset-4"
                      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                    >
                      Read more
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {activeBoard ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 py-10"
          onClick={() => setActiveBoard(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-white p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveBoard(null)}
              className="absolute right-4 top-4 text-xs uppercase tracking-[0.12em] text-zinc-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Close
            </button>

            <div className="space-y-4 pt-6">
              {publicSupportingBoardUrl(activeBoard.image_path ?? null) ? (
                <img
                  src={publicSupportingBoardUrl(activeBoard.image_path ?? null) ?? ""}
                  alt={title}
                  className="mx-auto block max-h-[75vh] w-auto max-w-full border border-zinc-200"
                />
              ) : null}

              {activeBoard.context_line?.trim() ? (
                <p className="mx-auto max-w-3xl text-sm leading-6 text-zinc-600">
                  {activeBoard.context_line.trim()}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}