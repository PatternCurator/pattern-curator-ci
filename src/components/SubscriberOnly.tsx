"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function hasSubscriberAccess(data: any): boolean {
  return (
    data?.is_unlocked === true ||
    data?.is_unlimited === true ||
    data?.is_subscriber === true ||
    data?.requires_subscription === false
  );
}

export default function SubscriberOnly({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [ready, setReady] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

let email = sessionData?.session?.user?.email?.trim().toLowerCase() || "";

if (!email && typeof window !== "undefined") {
  email = window.localStorage.getItem("pc_ci_email")?.trim().toLowerCase() || "";
}

if (!email) {
  setHasAccess(false);
  setReady(true);
  return;
}

        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            email,
            action: "status",
            count: 1,
          }),
        });

        const data = await res.json().catch(() => ({}));
        setHasAccess(hasSubscriberAccess(data));
      } catch {
        setHasAccess(false);
      } finally {
        setReady(true);
      }
    }

    checkAccess();
  }, [supabase]);

  if (!ready) return null;

  if (!hasAccess) {
    return (
      <section className="border-t border-neutral-200 pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Curatorial Intelligence™
          </p>

          <h2
            className="mt-3 text-[24px] font-normal text-neutral-900"
            style={{ fontFamily: "var(--font-libre), Libre Baskerville, serif" }}
          >
            Subscriber Access
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-7 text-neutral-600">
            Subscribers can access color interpretation, supporting direction, and applied insight.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="border border-neutral-900 bg-neutral-900 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white hover:opacity-80"
            >
              Subscribe
            </Link>

            <Link
              href="/pricing?verify=1"
              className="border border-neutral-300 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-neutral-700 hover:opacity-80"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}