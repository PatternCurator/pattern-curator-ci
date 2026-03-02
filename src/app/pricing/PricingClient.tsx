"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function PricingClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState<string>("");
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionEmail = data?.session?.user?.email ?? "";
      if (!alive) return;
      setEmail(sessionEmail);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? "");
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  async function startCheckout() {
    try {
      setStatus("loading");
      setError("");

      if (!email) {
        setStatus("error");
        setError("Please verify your email first.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setStatus("error");
        setError(data.error || "Could not start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-20 pb-16">
      <header className="text-center">
        <h1 className="text-3xl tracking-[0.12em] uppercase text-neutral-900">
          Full Access
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
          Curatorial Intelligence for print, color, and surface. Email-only login (no password).
        </p>
        {email ? (
          <p className="mt-3 text-xs text-neutral-500">
            Signed in as <span className="text-neutral-700">{email}</span>
          </p>
        ) : (
          <p className="mt-3 text-xs text-neutral-500">
            Verify your email to continue.
          </p>
        )}
      </header>

      <section className="mt-10 border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
            Choose a plan
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            $85/month or $850/year
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`h-11 border text-sm ${
                plan === "monthly"
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-900"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setPlan("annual")}
              className={`h-11 border text-sm ${
                plan === "annual"
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-900"
              }`}
            >
              Annual
            </button>
          </div>

          <div className="border border-neutral-200 p-5 text-sm text-neutral-700 space-y-2">
            <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
              What you get
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Unlimited browsing + full content access</li>
              <li>Curatorial interpretations using AI with Pattern Curator (direction, color, print, application)</li>
              <li>Inspiration trend boards, moodboards, and libary detail views</li>
              <li>New signals added continuously</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startCheckout}
            disabled={status === "loading"}
            className="w-full h-11 border border-neutral-900 bg-neutral-900 text-white text-sm disabled:opacity-60"
          >
            {status === "loading" ? "Redirecting…" : "Subscribe"}
          </button>

          {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

          <p className="text-xs text-neutral-500 text-center">
            {plan === "monthly" ? "$85/month" : "$850/year"}
          </p>
        </div>
      </section>
    </main>
  );
}