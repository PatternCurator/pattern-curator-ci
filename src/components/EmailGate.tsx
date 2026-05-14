"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const STORAGE_KEY = "pc_ci_email";
const PENDING_EMAIL_KEY = "pc_ci_pending_email";
const LAST_Q_KEY = "pc_ci_last_q";
const LAST_VIEW_KEY = "pc_ci_last_view";

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
  const openEmailPromptFromQuery = searchParams?.get("verify") === "1";

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

  const [authChecked, setAuthChecked] = useState<boolean>(true);
  const [gateReady, setGateReady] = useState<boolean>(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState<boolean>(false);

  const hasEmail = Boolean(email);
  const limitReached = hasEmail && remaining === 0;

  const isLegalRoute = pathname === "/legal" || pathname?.startsWith("/legal");
  const isHomeRoute = pathname === "/" || pathname === "/ci";
  const isSubscribeRoute = pathname === "/pricing";
  const isAboutRoute = pathname === "/about";
  const isPreviewRoute = pathname === "/preview";
  const isPublicRoute =
    isLegalRoute || isHomeRoute || isSubscribeRoute || isAboutRoute || isPreviewRoute;

  const shouldGateWithoutEmail = gateReady && authChecked && !hasEmail && !isPublicRoute;

  const shouldShowGate =
    shouldGateWithoutEmail ||
    limitReached ||
    (showEmailPrompt && !hasEmail) ||
    (openEmailPromptFromQuery && !hasEmail);

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

  async function clearLocalAuthArtifacts() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
      window.localStorage.removeItem(LAST_Q_KEY);
      window.localStorage.removeItem(LAST_VIEW_KEY);
    } catch {
      // ignore
    }
  }

  async function hardLogoutAndGoHome() {
    await clearLocalAuthArtifacts();

    setEmail("");
    setInput("");
    setStep("email");
    setCode("");
    setRemaining(null);
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");
    setShowEmailPrompt(false);

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    window.location.href = "/";
  }

  function changeEmailOnly() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
      window.localStorage.removeItem(LAST_Q_KEY);
    } catch {
      // ignore
    }

    setEmail("");
    setRemaining(null);
    setStep("email");
    setCode("");
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");
  }

  function closeEmailPrompt() {
    setShowEmailPrompt(false);
    setStep("email");
    setCode("");
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");

    if (pathname === "/pricing" && searchParams?.get("verify") === "1") {
      window.history.replaceState({}, "", "/pricing");
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        let sessionEmail = "";
        try {
          const { data } = await supabase.auth.getSession();
          sessionEmail = data?.session?.user?.email ?? "";
        } catch (err: any) {
          const code = err?.code || err?.error_code;
          if (code === "refresh_token_not_found") {
            await clearLocalAuthArtifacts();
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
          }
          sessionEmail = "";
        }

        if (!alive) return;

        if (sessionEmail) {
          const clean = normalizeEmail(sessionEmail);
          setEmail(clean);
          try {
            window.localStorage.setItem(STORAGE_KEY, clean);
          } catch {
            // ignore
          }
          await refreshRemaining(clean);
        } else {
          try {
            const pending = window.localStorage.getItem(PENDING_EMAIL_KEY);
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (pending) setInput(pending);
            else if (saved) setInput(saved);
          } catch {
            // ignore
          }
        }
      } finally {
        if (alive) {
          setAuthChecked(true);
          setGateReady(true);
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const sessionEmail = session?.user?.email ?? "";
      if (sessionEmail) {
        const clean = normalizeEmail(sessionEmail);
        setEmail(clean);
        try {
          window.localStorage.setItem(STORAGE_KEY, clean);
        } catch {
          // ignore
        }
        setStep("email");
        setStatus("idle");
        setError("");
        setShowEmailPrompt(false);

        if (pathname === "/pricing" && searchParams?.get("verify") === "1") {
          window.history.replaceState({}, "", "/pricing");
        }

        await refreshRemaining(clean);
      } else {
        setEmail("");
        setRemaining(null);
      }
      setAuthChecked(true);
      setGateReady(true);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase, pathname, searchParams]);

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
      } catch {
        // ignore
      }

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
      } catch {
        // ignore
      }

      setEmail(finalEmail);
      setStep("email");
      setCode("");
      setStatus("idle");
      setShowEmailPrompt(false);

      if (pathname === "/pricing" && searchParams?.get("verify") === "1") {
        window.history.replaceState({}, "", "/pricing");
      }

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
        setShowEmailPrompt(true);
        setStep("email");
        setCheckoutStatus("idle");
        setCheckoutError("");
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

        await refreshRemaining(email);
      } catch (err) {
        console.error("Usage logging error:", err);
      }
    })();
  }, [email, q, pathname]);

  useEffect(() => {
    if (!email) return;

    const p = (pathname || "").toLowerCase();

    let action: "view_asset" | "view_board" | "view_moodboard" | null = null;
    if (p.startsWith("/asset/")) action = "view_asset";
    else if (p.startsWith("/board/")) action = "view_board";
    else if (p.startsWith("/moodboard/")) action = "view_moodboard";

    if (!action) return;

    const key = `${action}::${p}`;
    const last = window.localStorage.getItem(LAST_VIEW_KEY);
    if (last === key) return;

    (async () => {
      try {
        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            email,
            action,
            count: 1,
            meta: { pathname: p },
          }),
        });

        const data = await res.json().catch(() => ({}));
        const rem = extractRemaining(data);
        if (typeof rem === "number") setRemaining(rem);

        window.localStorage.setItem(LAST_VIEW_KEY, key);

        if (res.status === 402) setRemaining(0);

        await refreshRemaining(email);
      } catch (err) {
        console.error("View usage logging error:", err);
      }
    })();
  }, [email, pathname]);

  useEffect(() => {
    if (!email) return;
    refreshRemaining(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, pathname]);

  if (isLegalRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className={shouldGateWithoutEmail || limitReached ? "pointer-events-none select-none" : ""}>
        <div className={shouldGateWithoutEmail || limitReached ? "blur-[1.5px] opacity-60" : ""}>
          {children}
        </div>
      </div>

      {gateReady && shouldShowGate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          <div className="relative w-full max-w-[560px] border border-neutral-200 bg-white px-8 py-8 shadow-xl">
            {!hasEmail ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-[24px] font-semibold leading-tight text-neutral-900">
                    {step === "email" ? "Subscriber Log In or Continue with CI" : "Enter your code"}
                  </h1>

                  {(showEmailPrompt || openEmailPromptFromQuery || shouldGateWithoutEmail) ? (
                    <button
                      type="button"
                      onClick={isSubscribeRoute ? closeEmailPrompt : hardLogoutAndGoHome}
                      className="text-xs text-neutral-600 underline hover:opacity-70"
                    >
                      Back
                    </button>
                  ) : null}
                </div>

                <p className="mt-3 max-w-[460px] text-[15px] leading-7 text-neutral-600">
                  Enter your email to continue. If you already subscribe, use your subscription
                  email to log in. CI uses email-only login with a one-time code.
                </p>

                <p className="mt-2 text-sm italic text-neutral-500">
                  We’ll send a one-time code to confirm it’s really you.
                </p>

                {(showEmailPrompt || openEmailPromptFromQuery) && isSubscribeRoute ? (
                  <p className="mt-4 text-xs text-neutral-500">
                    Verify your email to continue with subscription.
                  </p>
                ) : null}

                {step === "email" ? (
                  <form onSubmit={sendCode} className="mt-6 space-y-4">
                    <input
                      type="email"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-neutral-500"
                      autoComplete="email"
                    />

                    <p className="text-center text-sm text-neutral-500">
                      Already subscribed? Use the same email tied to your membership.
                    </p>

                    {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={status === "saving"}
                      className="w-full bg-neutral-900 px-4 py-3 text-[15px] font-medium text-white disabled:opacity-60"
                    >
                      {status === "saving" ? "Sending…" : "Send log in code"}
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-neutral-600">
                      <Link href="/preview" className="underline hover:opacity-70">
                        View Preview
                      </Link>
                      <Link href="/ci" className="underline hover:opacity-70">
                        Back to CI Home
                      </Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={verifyCode} className="mt-6 space-y-4">
                    <div className="text-sm text-neutral-600">
                      Code sent to <span className="font-medium">{normalizeEmail(input)}</span>
                    </div>

                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full border border-neutral-300 px-4 py-3 text-[15px] tracking-widest outline-none focus:border-neutral-500"
                      autoComplete="one-time-code"
                    />

                    {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={status === "saving"}
                      className="w-full bg-neutral-900 px-4 py-3 text-[15px] font-medium text-white disabled:opacity-60"
                    >
                      {status === "saving" ? "Verifying…" : "Verify and continue"}
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-neutral-600">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setCode("");
                          setStatus("idle");
                          setError("");
                        }}
                        className="underline hover:opacity-70"
                      >
                        Change email
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sendCode({ preventDefault: () => {} } as any);
                        }}
                        disabled={status === "saving"}
                        className="underline hover:opacity-70 disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-neutral-600">
                      <Link href="/preview" className="underline hover:opacity-70">
                        View Preview
                      </Link>
                      <Link href="/ci" className="underline hover:opacity-70">
                        Back to CI Home
                      </Link>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <>
                <h1 className="text-[24px] font-semibold leading-tight text-neutral-900">
                  Subscription required
                </h1>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-600 sm:justify-start">
                  <button
                    type="button"
                    onClick={hardLogoutAndGoHome}
                    className="underline hover:opacity-70"
                  >
                    Log out
                  </button>

                  <button
                    type="button"
                    onClick={changeEmailOnly}
                    className="underline hover:opacity-70"
                  >
                    Change email
                  </button>
                </div>

                <p className="mt-4 max-w-[460px] text-[15px] leading-7 text-neutral-600">
                  Full access to CI boards, notes, and application insight is available by
                  subscription.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlan("monthly")}
                      className={`border px-4 py-3 text-[15px] ${
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
                      className={`border px-4 py-3 text-[15px] ${
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
                    className="w-full bg-neutral-900 px-4 py-3 text-[15px] font-medium text-white disabled:opacity-60"
                  >
                    {checkoutStatus === "loading" ? "Redirecting…" : "Subscribe to continue"}
                  </button>

                  {checkoutStatus === "error" ? <p className="text-sm text-red-600">{checkoutError}</p> : null}

                  <p className="text-center text-sm text-neutral-500">
                    {plan === "monthly" ? "$29/month" : "$290/year"}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-neutral-600">
                    <Link href="/preview" className="underline hover:opacity-70">
                      View Preview
                    </Link>
                    <Link href="/ci" className="underline hover:opacity-70">
                      Back to CI Home
                    </Link>
                  </div>
                </div>
              </>
            )}

            <p className="mt-6 text-xs leading-6 text-neutral-500">
              By continuing, you agree to our{" "}
              <a className="underline underline-offset-4" href="/legal#terms">
                Terms and Conditions
              </a>{" "}
              and acknowledge our{" "}
              <a className="underline underline-offset-4" href="/legal#privacy">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}