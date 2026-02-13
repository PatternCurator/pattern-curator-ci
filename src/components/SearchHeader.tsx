"use client";

import { useState } from "react";

type SearchHeaderProps = {
  q: string;
  mode?: "curate" | "trend"; // add other modes if you have them
};

export function SearchHeader({ q, mode = "curate" }: SearchHeaderProps) {
  const [val, setVal] = useState(q);

  return (
    <div className="w-full">
      <form method="get" action="/" className="w-full">
        <div className="flex w-full items-center gap-3">
          <input
            name="q"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Search the library…"
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none"
          />

          <button
            type="submit"
            className="shrink-0 h-[46px] rounded-full px-6 text-[11px] flex items-center justify-center"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "1px solid #B8B9B6",
              color: "#707376ff",
              background: "#f4f4f4",
            }}
          >
            CURATE
          </button>
        </div>
      </form>
    </div>
  );
}
