"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const pathname = usePathname();

  // Prevent repeated navigations while the sentinel stays in view
  const firedForNRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasMore) return;

    // If we've already fired for this nextN, do nothing
    if (firedForNRef.current === nextN) return;

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;

        // One-shot per nextN
        firedForNRef.current = nextN;

        const params = new URLSearchParams(sp.toString());
        params.set("n", String(nextN));

        // Preserve current route and prevent scroll jump
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      },
      {
        // CHANGE: load earlier to feel more "never ending"
        // (bigger margin = fetch triggers sooner)
        rootMargin: "1600px 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, nextN, router, sp, pathname]);

  return <div ref={ref} className="h-1 w-full" aria-hidden="true" />;
}