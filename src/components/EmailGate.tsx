"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const STORAGE_KEY = "pc_ci_email";
const PENDING_EMAIL_KEY = "pc_ci_pending_email";
const LAST_Q_KEY = "pc_ci_last_q";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function extractRemaining(data: any): number | null {
  const a = data?.free_searches?.remaining;
  if (typeof a === "number") return a;
  if (typeof a === "string" && a.trim() !== "" && !Number.isNaN(Number(a))) return Number(a);

  const b = data?.remaining;
  if (typeof b === "number") return b;
  if (typeof b === "string" && b.trim() !== "" && !Number.isNaN(Number(b))) return Number(b);

  return null;
}

type GateStep = "email" | "code";

export default function EmailGate({
  source = "ci",
  children,
}: {
  source?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const q = useMemo(() => (searchParams?.get("q") ?? "").trim(), [searchParams]);

  const [email, setEmail] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [step, setStep] = useState<GateStep>("email");
  const [code, setCode] = useState<string>("");

  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string>("");

  const [remaining, setRemaining] = useState<number | null>(null);

  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState<string>("");

  // ✅ prevents "Verify your email" flash on navigation/search
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const hasEmail = Boolean(email);
  const limitReached = hasEmail && remaining === 0;

  async function refreshRemaining(forEmail: string) {
    try {
      const u = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: forEmail, action: "status", count: 1 }),
      });

      const udata = await u.json().catch(() => ({}));
      const rem = extractRemaining(udata);
      if (typeof rem === "number") setRemaining(rem);
    } catch {
      // ignore
    }
  }

  async function hardLogoutAndGoHome() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
      window.localStorage.removeItem(LAST_Q_KEY);
    } catch {}

    setEmail("");
    setInput("");
    setStep("email");
    setCode("");
    setRemaining(null);
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");

    try {
      await supabase.auth.signOut();
    } catch {}

    window.location.href = "/";
  }

  function changeEmailOnly() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
      window.localStorage.removeItem(LAST_Q_KEY);
    } catch {}

    setEmail("");
    setRemaining(null);
    setStep("email");
    setCode("");
    setStatus("idle");
    setError("");
  }

  // Restore session + restore pending email (for convenience)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionEmail = data?.session?.user?.email ?? "";

        if (!alive) return;

        if (sessionEmail) {
          const clean = normalizeEmail(sessionEmail);
          setEmail(clean);
          try {
            window.localStorage.setItem(STORAGE_KEY, clean);
          } catch {}
          await refreshRemaining(clean);
        } else {
          try {
            const pending = window.localStorage.getItem(PENDING_EMAIL_KEY);
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (pending) setInput(pending);
            else if (saved) setInput(saved);
          } catch {}
        }
      } finally {
        if (alive) setAuthChecked(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const sessionEmail = session?.user?.email ?? "";
      if (sessionEmail) {
        const clean = normalizeEmail(sessionEmail);
        setEmail(clean);
        try {
          window.localStorage.setItem(STORAGE_KEY, clean);
        } catch {}
        setStep("email");
        setStatus("idle");
        setError("");
        await refreshRemaining(clean);
      } else {
        setEmail("");
        setRemaining(null);
      }
      setAuthChecked(true);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  async function sendCode(e: React.FormEvent) {
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
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, source }),
      }).catch(() => null);

      try {
        window.localStorage.setItem(PENDING_EMAIL_KEY, clean);
      } catch {}

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { shouldCreateUser: true },
      });

      if (otpErr) {
        setStatus("error");
        setError(otpErr.message || "Could not send code. Please try again.");
        return;
      }

      setStatus("idle");
      setStep("code");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");

    const clean = normalizeEmail(input);
    const token = code.trim();

    if (!token || token.length < 6) {
      setStatus("error");
      setError("Please enter the 6-digit code.");
      return;
    }

    try {
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        email: clean,
        token,
        type: "email",
      });

      if (vErr) {
        setStatus("error");
        setError(vErr.message || "Incorrect code. Please try again.");
        return;
      }

      const verifiedEmail = data?.user?.email ?? clean;
      const finalEmail = normalizeEmail(verifiedEmail);

      try {
        window.localStorage.setItem(STORAGE_KEY, finalEmail);
        window.localStorage.removeItem(PENDING_EMAIL_KEY);
        window.localStorage.removeItem(LAST_Q_KEY);
      } catch {}

      setEmail(finalEmail);
      setStep("email");
      setCode("");
      setStatus("idle");

      await refreshRemaining(finalEmail);
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

    const key = `${pathname}::${q}`;
    const last = window.localStorage.getItem(LAST_Q_KEY);
    if (last === key) return;

    (async () => {
      try {
        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
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

        window.localStorage.setItem(LAST_Q_KEY, key);

        if (res.status === 402) setRemaining(0);

        if (!res.ok && res.status !== 402) {
          console.error("Usage logging failed:", { status: res.status, data });
        }

        // Always sync from server truth
        await refreshRemaining(email);
      } catch (err) {
        console.error("Usage logging error:", err);
      }
    })();
  }, [email, q, pathname]);

  // ✅ NEW: keep the counter accurate when user navigates (views are counted server-side now)
  useEffect(() => {
    if (!email) return;
    // whenever pathname changes, pull server truth
    refreshRemaining(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, pathname]);

  return (
    <div className="relative">
      {/* Always render background content */}
      <div className={hasEmail && !limitReached ? "" : "pointer-events-none select-none"}>
        <div className={hasEmail && !limitReached ? "" : "blur-[1.5px] opacity-60"}>{children}</div>
      </div>

      {/* Top status strip */}
      {hasEmail ? (
        <div className="fixed top-0 left-0 right-0 z-40 px-4 py-2 text-xs text-neutral-600 flex items-center justify-between border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-4">
            <span>{email}</span>
            <button type="button" onClick={hardLogoutAndGoHome} className="underline hover:opacity-70">
              Log out
            </button>
          </div>

          {/* ✅ label updated: it's no longer only searches */}
          {typeof remaining === "number" ? <span>{remaining} free views left</span> : <span />}
        </div>
      ) : null}

      {/* Gate overlay only AFTER authChecked to prevent flash */}
      {authChecked && (!hasEmail || limitReached) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            {!hasEmail ? (
              <>
                <h1 className="text-xl font-semibold">
                  {step === "email" ? "Verify your email" : "Enter your code"}
                </h1>

                <p className="mt-2 text-sm text-neutral-600">
                  Get 5 free views. No password.
                  <br />
                  <span className="italic text-neutral-500">
                    We’ll send a one-time code to confirm it’s really you.
                  </span>
                </p>

                {step === "email" ? (
                  <form onSubmit={sendCode} className="mt-5 space-y-3">
                    <input
                      type="email"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                      autoComplete="email"
                    />

                    <p className="text-xs text-neutral-500 text-center">
                      Already subscribed? Use the same email to unlock unlimited access.
                    </p>

                    {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={status === "saving"}
                      className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {status === "saving" ? "Sending…" : "Send code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyCode} className="mt-5 space-y-3">
                    <div className="text-xs text-neutral-600">
                      Code sent to <span className="font-medium">{normalizeEmail(input)}</span>
                    </div>

                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500 tracking-widest"
                      autoComplete="one-time-code"
                    />

                    {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={status === "saving"}
                      className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {status === "saving" ? "Verifying…" : "Verify"}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setCode("");
                          setStatus("idle");
                          setError("");
                        }}
                        className="text-xs underline text-neutral-600 hover:opacity-70"
                      >
                        Change email
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sendCode({ preventDefault: () => {} } as any);
                        }}
                        disabled={status === "saving"}
                        className="text-xs underline text-neutral-600 hover:opacity-70 disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Subscription required</h1>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={hardLogoutAndGoHome}
                    className="text-xs underline text-neutral-600 hover:opacity-70"
                  >
                    Log out
                  </button>

                  <button
                    type="button"
                    onClick={changeEmailOnly}
                    className="text-xs underline text-neutral-600 hover:opacity-70"
                  >
                    Change email
                  </button>
                </div>

                <p className="mt-4 text-sm text-neutral-600">You’ve used all 5 free views.</p>

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