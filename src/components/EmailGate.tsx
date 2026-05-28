"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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

function hasUnlockedAccess(data: any): boolean {
  return (
    data?.is_unlocked === true ||
    data?.is_unlimited === true ||
    data?.is_subscriber === true ||
    data?.requires_subscription === false
  );
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
  const openEmailPromptFromQuery = searchParams?.get("verify") === "1";

  const [email, setEmail] = useState<string>("");
  const [input, setInput] = useState<string>("");

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
    setRemaining(null);
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");
    setShowEmailPrompt(false);

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
    setInput("");
    setRemaining(null);
    setStatus("idle");
    setError("");
    setCheckoutStatus("idle");
    setCheckoutError("");
  }

  function closeEmailPrompt() {
    setShowEmailPrompt(false);
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
        const saved = window.localStorage.getItem(STORAGE_KEY);
        const pending = window.localStorage.getItem(PENDING_EMAIL_KEY);

        const savedEmail = saved ? normalizeEmail(saved) : "";
        const pendingEmail = pending ? normalizeEmail(pending) : "";

        if (!alive) return;

        if (savedEmail) {
          const res = await fetch("/api/usage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              email: savedEmail,
              action: "status",
              count: 1,
            }),
          });

          const data = await res.json().catch(() => ({}));

          if (hasUnlockedAccess(data)) {
            setEmail(savedEmail);
            setInput(savedEmail);
            const rem = extractRemaining(data);
            if (typeof rem === "number") setRemaining(rem);
          } else {
            await clearLocalAuthArtifacts();
            setEmail("");
            setInput(savedEmail);
            setRemaining(null);
          }
        } else if (pendingEmail) {
          setInput(pendingEmail);
        }
      } finally {
        if (alive) {
          setAuthChecked(true);
          setGateReady(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function submitEmail(e: React.FormEvent) {
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

      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: clean,
          action: "status",
          count: 1,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const unlocked = hasUnlockedAccess(data);

      if (!unlocked) {
        try {
          window.localStorage.setItem(PENDING_EMAIL_KEY, clean);
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }

        setEmail("");
        setRemaining(null);
        setStatus("error");
        setError("We could not find active Curatorial Intelligence access for this email.");
        return;
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, clean);
        window.localStorage.removeItem(PENDING_EMAIL_KEY);
        window.localStorage.removeItem(LAST_Q_KEY);
      } catch {
        // ignore
      }

      const rem = extractRemaining(data);
      if (typeof rem === "number") setRemaining(rem);

      setEmail(clean);
      setInput(clean);
      setStatus("idle");
      setError("");
      setShowEmailPrompt(false);

      if (pathname === "/pricing" && searchParams?.get("verify") === "1") {
        window.history.replaceState({}, "", "/pricing");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  async function startCheckout() {
    try {
      setCheckoutStatus("loading");
      setCheckoutError("");

      const checkoutEmail = email || normalizeEmail(input);

      if (!checkoutEmail || !checkoutEmail.includes("@")) {
        setShowEmailPrompt(true);
        setCheckoutStatus("idle");
        setCheckoutError("");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail, plan }),
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
                    Curatorial Intelligence Access
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
                  Enter the email associated with your Curatorial Intelligence access.
                </p>

                <p className="mt-2 text-sm italic text-neutral-500">
                  No code is required.
                </p>

                {(showEmailPrompt || openEmailPromptFromQuery) && isSubscribeRoute ? (
                  <p className="mt-4 text-xs text-neutral-500">
                    Enter your access email to continue.
                  </p>
                ) : null}

                <form onSubmit={submitEmail} className="mt-6 space-y-4">
                  <input
                    type="email"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-neutral-500"
                    autoComplete="email"
                  />

                  <p className="text-center text-sm text-neutral-500">
                    Already have access? Use the email tied to your Curatorial Intelligence access.
                  </p>

                  {status === "error" ? <p className="text-sm text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={status === "saving"}
                    className="w-full bg-neutral-900 px-4 py-3 text-[15px] font-medium text-white disabled:opacity-60"
                  >
                    {status === "saving" ? "Checking…" : "Continue"}
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-neutral-600">
                    <Link href="/preview" className="underline hover:opacity-70">
                      View Preview
                    </Link>
                    <Link href="/ci" className="underline hover:opacity-70">
                      Back to Home
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-[24px] font-semibold leading-tight text-neutral-900">
                  Curatorial Intelligence required
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
                  Curatorial Intelligence unlocks full context, inquiry, and applied insight for curated moodboards.
                  
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
                    {checkoutStatus === "loading" ? "Redirecting…" : "Unlock Intelligence"}
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
