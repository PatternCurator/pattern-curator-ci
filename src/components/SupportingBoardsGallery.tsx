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

function formatBoardTypeLabel(boardType: string) {
  if (boardType === "cultural_behavior") return "Cultural / Consumer Behavior";
  if (boardType === "color") return "Color";
  if (boardType === "print_pattern") return "Print + Pattern";
  return boardType;
}

function publicSupportingBoardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboard-supporting-boards/${encoded}`;
}

export default function SupportingBoardsGallery({
  boards,
}: {
  boards: SupportingBoard[];
}) {
  const [activeBoard, setActiveBoard] = useState<SupportingBoard | null>(null);

  if (!boards.length) return null;

  return (
    <>
      <div className="mx-auto w-full max-w-[900px]">
  <p
    className="text-sm uppercase tracking-[0.12em] text-zinc-600 mb-4 text-left"
    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
  >
    Trend Signals:
  </p>
</div>
      <div className="pt-1">
        <div className="mx-auto w-full max-w-[900px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {boards.map((board) => {
              const supportingImg = publicSupportingBoardUrl(board.image_path ?? null);
              const contextLine = board.context_line?.trim();

              return (
                <div key={board.id} className="space-y-3 text-left">
                  <p
                    className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    {formatBoardTypeLabel(board.board_type)}
                  </p>

                  {supportingImg ? (
                    <button
                      type="button"
                      onClick={() => setActiveBoard(board)}
                      className="block w-full text-left"
                    >
                      <img
                        src={supportingImg}
                        alt={formatBoardTypeLabel(board.board_type)}
                        className="block w-full border border-zinc-200 transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                      />
                    </button>
                  ) : null}

                  {contextLine ? (
                    <p className="text-xs leading-5 text-zinc-500">
                      {contextLine}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                {formatBoardTypeLabel(activeBoard.board_type)}
              </p>

              {publicSupportingBoardUrl(activeBoard.image_path ?? null) ? (
                <img
                  src={publicSupportingBoardUrl(activeBoard.image_path ?? null) ?? ""}
                  alt={formatBoardTypeLabel(activeBoard.board_type)}
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