"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LeadResponse = {
  lead: { id: string; email: string; created_at: string };
  free_searches: { limit: number; used: number; remaining: number };
};

const STORAGE_KEY = "pc_ci_email";
const LAST_Q_KEY = "pc_ci_last_q";

export default function EmailGate({
  source = "ci",
  children,
}: {
  source?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // current query (this is what will consume searches)
  const q = useMemo(() => (searchParams?.get("q") ?? "").trim(), [searchParams]);

  const [email, setEmail] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [remaining, setRemaining] = useState<number | null>(null);

  // Stripe UI state
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState<string>("");

  // Restore email + refresh remaining searches
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;

    if (saved) {
      setEmail(saved);

      // best-effort refresh remaining
      void fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: saved, source }),
      })
        .then((r) => r.json())
        .then((data: LeadResponse) => setRemaining(data?.free_searches?.remaining ?? null))
        .catch(() => {});
    }
  }, [source]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");

    const clean = input.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setStatus("error");
      setError("Please enter a valid email.");
      return;
    }

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, source }),
      });

      const data = (await res.json()) as Partial<LeadResponse> & { error?: string };

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Could not save email.");
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, clean);
      setEmail(clean);
      setRemaining(data.free_searches?.remaining ?? null);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  async function startCheckout() {
    try {
      setCheckoutStatus("loading");
      setCheckoutError("");

      if (!email) {
        setCheckoutStatus("error");
        setCheckoutError("Missing email. Please refresh and try again.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setCheckoutStatus("error");
        setCheckoutError(data.error || "Could not start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setCheckoutStatus("error");
      setCheckoutError("Network error. Please try again.");
    }
  }

  // ✅ Consume a free search when q changes (server-side truth) and update counter
  useEffect(() => {
    if (!email) return;
    if (!q) return;

    // prevent double-counting the same q (e.g., refresh)
    const last = window.localStorage.getItem(LAST_Q_KEY);
    if (last === q) return;

    (async () => {
      try {
        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            action: "search",
            q,
            meta: { pathname },
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setRemaining(data?.free_searches?.remaining ?? null);
          window.localStorage.setItem(LAST_Q_KEY, q);
          return;
        }

        // 402 => limit reached
        if (res.status === 402) {
          setRemaining(data?.free_searches?.remaining ?? 0);
          window.localStorage.setItem(LAST_Q_KEY, q);
          return;
        }

        // other errors: don't block UI; just log
        // (counter might be stale, but avoids breaking the app)
        console.error("Usage logging failed:", data);
      } catch (err) {
        console.error("Usage logging error:", err);
      }
    })();
  }, [email, q, pathname]);

  const hasEmail = Boolean(email);
  const limitReached = hasEmail && remaining === 0;

  return (
    <div className="relative">
      {/* Always render background content (covers visible) */}
      <div className={hasEmail && !limitReached ? "" : "pointer-events-none select-none"}>
        <div className={hasEmail && !limitReached ? "" : "blur-[1.5px] opacity-60"}>
          {children}
        </div>
      </div>

      {/* Top status strip once email is set */}
      {hasEmail ? (
        <div className="fixed top-0 left-0 right-0 z-40 px-4 py-2 text-xs text-neutral-600 flex items-center justify-between border-b border-neutral-200 bg-white/80 backdrop-blur">
          <span>{email}</span>
          {typeof remaining === "number" ? <span>{remaining} free searches left</span> : <span />}
        </div>
      ) : null}

      {/* Email gate OR subscription-required modal */}
      {!hasEmail || limitReached ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          {/* Dim / blur layer */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Floating modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            {!hasEmail ? (
              <>
                <h1 className="text-xl font-semibold">Start with your email</h1>

                <p className="mt-2 text-sm text-neutral-600">
                  Get 5 free searches. No password.
                  <br />
                  <span className="italic text-neutral-500">Full access available by subscription.</span>
                </p>

                <form onSubmit={onSubmit} className="mt-5 space-y-3">
                  <input
                    type="email"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                    autoComplete="email"
                  />

                  {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={status === "saving"}
                    className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {status === "saving" ? "Saving…" : "Continue"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Subscription required</h1>

                <p className="mt-2 text-sm text-neutral-600">You’ve used all 5 free searches.</p>

                <p className="mt-3 text-sm text-neutral-600">
                  To continue exploring the Pattern Curator CI library, full access is available by subscription.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPlan("monthly")}
                      className={`flex-1 rounded-xl border px-4 py-2 text-sm ${
                        plan === "monthly"
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 bg-white text-neutral-800"
                      }`}
                    >
                      Monthly
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlan("annual")}
                      className={`flex-1 rounded-xl border px-4 py-2 text-sm ${
                        plan === "annual"
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 bg-white text-neutral-800"
                      }`}
                    >
                      Annual
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={checkoutStatus === "loading"}
                    className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {checkoutStatus === "loading" ? "Redirecting…" : "Subscribe to continue"}
                  </button>

                  {checkoutStatus === "error" ? <p className="text-sm text-red-600">{checkoutError}</p> : null}

                  <p className="text-xs text-neutral-500 text-center">
                    {plan === "monthly" ? "$85/month" : "$850/year"}
                  </p>
                </div>
              </>
            )}

            <p className="mt-4 text-xs text-neutral-500">
              By continuing, you agree to receive emails from Pattern Curator CI. Unsubscribe anytime.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
