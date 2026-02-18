"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function InfiniteScrollN({
  nextN,
  hasMore,
}: {
  nextN: number;
  hasMore: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const sp = useSearchParams();

  // Prevent repeated navigations while the sentinel stays in view
  const [firedForN, setFiredForN] = useState<number | null>(null);

  useEffect(() => {
    if (!hasMore) return;

    // If we've already fired for this nextN, do nothing
    if (firedForN === nextN) return;

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;

        // One-shot per nextN
        setFiredForN(nextN);

        const params = new URLSearchParams(sp.toString());
        params.set("n", String(nextN));
        router.replace(`/?${params.toString()}`, { scroll: false });
      },
      { rootMargin: "900px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, nextN, router, sp, firedForN]);

  return <div ref={ref} className="h-1 w-full" aria-hidden="true" />;
}
