"use client";

import { useMemo } from "react";

type Asset = {
  id: string;
  // pick the field you already store (examples):
  // color_hexes?: string[] | null;
  // dominant_hex?: string | null;
  // colors?: string[] | null;
  color_hexes?: string[] | null;
};

function normalizeHex(hex: string) {
  const h = hex.trim().toUpperCase();
  if (!h) return null;
  return h.startsWith("#") ? h : `#${h}`;
}

export default function ColorBar({
  assets,
  max = 10,
}: {
  assets: Asset[];
  max?: number;
}) {
  const colors = useMemo(() => {
    const bag: string[] = [];

    for (const a of assets) {
      const list = a.color_hexes ?? [];
      for (const c of list) {
        const n = normalizeHex(c);
        if (n) bag.push(n);
      }
    }

    // unique, keep order
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const c of bag) {
      if (!seen.has(c)) {
        seen.add(c);
        uniq.push(c);
      }
      if (uniq.length >= max) break;
    }

    return uniq;
  }, [assets, max]);

  if (!colors.length) return null;

  return (
    <div className="w-full flex gap-[2px]">
      {colors.map((hex) => (
        <div
          key={hex}
          className="h-[10px] flex-1"
          style={{ backgroundColor: hex }}
          title={hex}
        />
      ))}
    </div>
  );
}