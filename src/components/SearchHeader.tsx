"use client";

import { useState } from "react";

export default function SearchHeader({ q }: { q: string }) {
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

          {/* Curate-only submit */}
          <button
          type="submit"
          className="h-11 w-40 rounded-full px-6 text-sm hover:bg-black/5"
          style={{ border: "1px solid #B8B9B6", color: "#4b5563" }}
          title="Curate"
          >
          Curate
        </button>

        </div>
      </form>
    </div>
  );
}
