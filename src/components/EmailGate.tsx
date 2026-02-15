"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "pc_ci_email";
const LAST_Q_KEY = "pc_ci_last_q";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Works with BOTH response shapes:
// - old: { free_searches: { remaining } }
// - new: { remaining }
function extractRemaining(data: any): number | null {
  if (typeof data?.free_searches?.remaining === "number") return data.free_searches.remaining;
  if (typeof data?.remaining === "number") return data.remaining;
  return null;
}

export default function EmailGate({
  source = "ci",
  children,
}: {
  source?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const hasEmail = Boolean(email);
  const limitReached = hasEmail && remaining === 0;

  function handleLogout() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LAST_Q_KEY);
    setEmail("");
    setInput("");
    setRemaining(null);
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");
  }

  // Restore saved email
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setEmail(saved);
  }, [source]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");

    const clean = normalizeEmail(input);
    if (!clean || !clean.includes("@")) {
      setStatus("error");
      setError("Please enter a valid email.");
      return;
    }

    try {
      // Save lead (best-effort)
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, source }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setError(data?.error || "Could not save email.");
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, clean);
      setEmail(clean);
      setStatus("idle");

      // Immediately fetch remaining without consuming a search
      const u = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, action: "status", count: 1 }),
      });

      const udata = await u.json().catch(() => ({}));
      const rem = extractRemaining(udata);
      if (typeof rem === "number") setRemaining(rem);
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

  // Consume a free search when q changes and update counter
  useEffect(() => {
    if (!email) return;
    if (!q) return;

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
            count: 1,
            q,
            meta: { pathname },
          }),
        });

        const data = await res.json().catch(() => ({}));

        const rem = extractRemaining(data);
        if (typeof rem === "number") setRemaining(rem);

        window.localStorage.setItem(LAST_Q_KEY, q);

        // If you hit 402, set to 0 so the modal triggers
        if (res.status === 402) setRemaining(0);

        // Log only unexpected failures
        if (!res.ok && res.status !== 402) {
          console.error("Usage logging failed:", data);
        }
      } catch (err) {
        console.error("Usage logging error:", err);
      }
    })();
  }, [email, q, pathname]);

  return (
    <div className="relative">
      {/* Always render background content */}
      <div className={hasEmail && !limitReached ? "" : "pointer-events-none select-none"}>
        <div className={hasEmail && !limitReached ? "" : "blur-[1.5px] opacity-60"}>
          {children}
        </div>
      </div>

      {/* Top status strip */}
      {hasEmail ? (
        <div className="fixed top-0 left-0 right-0 z-40 px-4 py-2 text-xs text-neutral-600 flex items-center justify-between border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-4">
            <span>{email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="underline hover:opacity-70"
            >
              Log out
            </button>
          </div>

          {typeof remaining === "number" ? <span>{remaining} free searches left</span> : <span />}
        </div>
      ) : null}

      {/* Email gate OR subscription-required modal */}
      {!hasEmail || limitReached ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            {!hasEmail ? (
              <>
                <h1 className="text-xl font-semibold">Start with your email</h1>

                <p className="mt-2 text-sm text-neutral-600">
                  Get 5 free searches. No password.
                  <br />
                  <span className="italic text-neutral-500">
                    Full access available by subscription.
                  </span>
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

                  <p className="text-xs text-neutral-500 text-center">
                  Already subscribed? Use the same email to unlock unlimited searches.
                  </p>

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

                  {checkoutStatus === "error" ? (
                    <p className="text-sm text-red-600">{checkoutError}</p>
                  ) : null}

                  {/* ✅ Pricing line you want */}
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
