"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type PurchasedReport = {
  id: string;
  title: string;
  slug: string;
  purchased_at: string;
  download_url: string | null;
  view_url: string | null;
};

export default function AccountPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState("");
  const [reportError, setReportError] = useState("");
  const [reports, setReports] = useState<PurchasedReport[]>([]);
  const [ciAccess, setCiAccess] = useState<{
    active: boolean;
    isAdmin: boolean;
  } | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const sessionEmail = data?.session?.user?.email ?? "";
      setEmail(sessionEmail);
      setManualEmail(sessionEmail);

      if (sessionEmail) {
        await Promise.all([
          loadPurchasedReports(sessionEmail),
          checkCIAccess(sessionEmail),
        ]);
        setHasChecked(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const sessionEmail = session?.user?.email ?? "";
      setEmail(sessionEmail);
      setManualEmail(sessionEmail);

      if (sessionEmail) {
        Promise.all([
          loadPurchasedReports(sessionEmail),
          checkCIAccess(sessionEmail),
        ]);
        setHasChecked(true);
      } else {
        setReports([]);
        setCiAccess(null);
      }
    });

    return () => {
      alive = false;
      sub?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function loadPurchasedReports(emailToCheck: string) {
    try {
      setLoadingReports(true);
      setReportError("");

      const res = await fetch("/api/reports/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ email: emailToCheck }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReportError(data.error || "Unable to check access.");
        setReports([]);
        return;
      }

      setReports(data.reports ?? []);
    } catch {
      setReportError("Unable to check access.");
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }

  async function checkCIAccess(emailToCheck: string) {
  try {
    const res = await fetch("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        email: emailToCheck,
        action: "status",
      }),
    });

    const data = await res.json();

    const hasAccess = data?.is_unlocked === true;
    const isAdmin = data?.is_admin === true;

    setCiAccess({
      active: hasAccess,
      isAdmin,
    });

    if (hasAccess) {
      try {
        window.localStorage.setItem(
          "pc_ci_email",
          emailToCheck.trim().toLowerCase()
        );
        window.dispatchEvent(new Event("pc-ci-auth-change"));
      } catch {
        // ignore
      }
    }
  } catch {
    setCiAccess(null);
  }
}

  async function handleAccessLookup() {
    const clean = manualEmail.trim().toLowerCase();

    if (!clean || !clean.includes("@")) {
      setReportError("Please enter a valid email.");
      setHasChecked(true);
      setReports([]);
      setCiAccess(null);
      return;
    }

    setError("");
    setReportError("");
    setHasChecked(true);

    await Promise.all([loadPurchasedReports(clean), checkCIAccess(clean)]);
  }

  async function openPortal() {
    try {
      setLoadingPortal(true);
      setError("");

      const accountEmail = email || manualEmail.trim().toLowerCase();

      if (!accountEmail) {
        window.location.href = "/pricing?verify=1";
        return;
      }

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: accountEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Unable to open access management.");
        setLoadingPortal(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
      setLoadingPortal(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const lookupEmail = manualEmail || email;
  const noForecasts = hasChecked && !loadingReports && reports.length === 0;
  const noCiAccess = hasChecked && ciAccess?.active !== true;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-20 pb-20">
      <div className="space-y-8">
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Account
            </p>

            <h1 className="mt-2 text-2xl text-neutral-900">My Account</h1>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Enter the email associated with your Forecast purchases or CI Access.
            </p>

            {email ? (
              <p className="mt-2 text-sm text-neutral-500">
                Signed in as {email}
              </p>
            ) : null}
          </div>

          <div className="px-6 py-6">
            <label className="block text-xs uppercase tracking-[0.18em] text-neutral-500">
              Email
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={manualEmail}
                onChange={(e) => {
                  setManualEmail(e.target.value);
                  setReportError("");
                  setError("");
                  setCiAccess(null);
                  setReports([]);
                  setHasChecked(false);
                }}
                placeholder="email@example.com"
                className="h-11 flex-1 border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              />

              <button
                type="button"
                onClick={handleAccessLookup}
                disabled={loadingReports}
                className="h-11 border border-neutral-900 bg-neutral-900 px-6 text-sm text-white disabled:opacity-60"
              >
                {loadingReports ? "Checking…" : "Check Access"}
              </button>
            </div>

            {email ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 h-10 border border-neutral-300 px-6 text-sm text-neutral-600 hover:opacity-80"
              >
                Log Out
              </button>
            ) : null}

            {reportError ? (
              <p className="mt-4 text-sm text-red-600">{reportError}</p>
            ) : null}
          </div>
        </section>

        {hasChecked && reports.length > 0 ? (
          <section className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Seasonal Forecasts
              </p>

              <h2 className="mt-2 text-xl text-neutral-900">Your Forecasts</h2>

              <p className="mt-3 text-sm leading-6 text-neutral-600">
                View online or download your purchased Seasonal Forecasts.
              </p>
            </div>

            <div className="space-y-4 px-6 py-6">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col justify-between gap-4 border border-neutral-200 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm text-neutral-900">{report.title}</p>

                    {report.purchased_at ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Purchased{" "}
                        {new Date(report.purchased_at).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {report.view_url ? (
                      <a
                        href={`${report.view_url}?email=${encodeURIComponent(
                          lookupEmail
                        )}`}
                        className="inline-block border border-neutral-900 bg-neutral-900 px-4 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-white hover:opacity-80"
                      >
                        View Forecast
                      </a>
                    ) : null}

                    {report.download_url ? (
                      <a
                        href={report.download_url}
                        className="inline-block border border-neutral-900 px-4 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <p className="text-xs text-red-600">
                        Download unavailable
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {hasChecked ? (
          <section className="border border-neutral-200 bg-white">
            <div className="px-6 py-6">
              <div className="flex flex-wrap items-center gap-3">
                {ciAccess?.active && !ciAccess.isAdmin ? (
                  <button
                    type="button"
                    onClick={openPortal}
                    disabled={loadingPortal}
                    className="inline-block border border-neutral-900 bg-neutral-900 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-white disabled:opacity-60"
                  >
                    {loadingPortal ? "Opening…" : "Manage CI Access"}
                  </button>
                ) : null}

                {!ciAccess?.active ? (
                  <a
                    href="/pricing"
                    className="inline-block border border-neutral-900 bg-neutral-900 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-white"
                  >
                    Unlock CI Access
                  </a>
                ) : null}

                {ciAccess?.isAdmin ? (
                  <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    Admin Access Active
                  </div>
                ) : null}

                {noForecasts ? (
                  <a
                    href="/reports"
                    className="inline-block border border-neutral-300 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-neutral-900 hover:border-neutral-900"
                  >
                    View Forecasts
                  </a>
                ) : null}
              </div>

              {noForecasts && noCiAccess ? (
                <p className="mt-4 text-sm leading-6 text-neutral-500">
                  No Forecast purchases or active CI Access were found for this email.
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}