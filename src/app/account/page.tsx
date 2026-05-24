"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type PurchasedReport = {
  id: string;
  title: string;
  slug: string;
  purchased_at: string;
  download_url: string | null;
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

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const sessionEmail = data?.session?.user?.email ?? "";
      setEmail(sessionEmail);
      setManualEmail(sessionEmail);

      if (sessionEmail) {
        loadPurchasedReports(sessionEmail);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const sessionEmail = session?.user?.email ?? "";
      setEmail(sessionEmail);
      setManualEmail(sessionEmail);

      if (sessionEmail) {
        loadPurchasedReports(sessionEmail);
      } else {
        setReports([]);
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
        setReportError(data.error || "Unable to load purchased reports.");
        setReports([]);
        return;
      }

      setReports(data.reports ?? []);
    } catch {
      setReportError("Unable to load purchased reports.");
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleManualReportLookup() {
    const clean = manualEmail.trim().toLowerCase();

    if (!clean || !clean.includes("@")) {
      setReportError("Please enter the email used at checkout.");
      return;
    }

    await loadPurchasedReports(clean);
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
        setError(data.error || "Unable to open portal.");
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

  return (
    <main className="mx-auto max-w-3xl px-6 pt-20 pb-20">
      <div className="space-y-8">
        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Account
            </p>

            <h1 className="mt-2 text-2xl text-neutral-900">
              Account Access
            </h1>

            {email ? (
              <p className="mt-3 text-sm text-neutral-600">
                Signed in as {email}
              </p>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                Enter the email used at checkout to access purchased reports.
              </p>
            )}
          </div>

          <div className="px-6 py-6">
            <label className="block text-xs uppercase tracking-[0.18em] text-neutral-500">
              Checkout Email
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-11 flex-1 border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
              />

              <button
                type="button"
                onClick={handleManualReportLookup}
                disabled={loadingReports}
                className="h-11 border border-neutral-900 bg-neutral-900 px-6 text-sm text-white disabled:opacity-60"
              >
                {loadingReports ? "Checking…" : "Find Reports"}
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
          </div>
        </section>

        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Purchased Reports
            </p>

            <h2 className="mt-2 text-xl text-neutral-900">
              Report Downloads
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              If you purchased a Pattern Curator report, your available downloads will appear here.
            </p>
          </div>

          <div className="px-6 py-6">
            {loadingReports ? (
              <p className="text-sm text-neutral-500">Loading reports…</p>
            ) : reportError ? (
              <p className="text-sm text-red-600">{reportError}</p>
            ) : reports.length ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col justify-between gap-4 border border-neutral-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-sm text-neutral-900">
                        {report.title}
                      </p>

                      {report.purchased_at ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          Purchased{" "}
                          {new Date(report.purchased_at).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>

                    {report.download_url ? (
                      <a
                        href={report.download_url}
                        className="inline-block border border-neutral-900 px-4 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
                      >
                        Download
                      </a>
                    ) : (
                      <p className="text-xs text-red-600">
                        Download unavailable
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-neutral-500">
                No purchased reports were found for this email.
              </p>
            )}
          </div>
        </section>

        <section className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              CI Subscription
            </p>

            <h2 className="mt-2 text-xl text-neutral-900">
              Subscription Management
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Manage billing, payment methods, invoices, renewals, and cancellation through Stripe.
            </p>
          </div>

          <div className="px-6 py-6">
            <button
              type="button"
              onClick={openPortal}
              disabled={loadingPortal}
              className="h-11 border border-neutral-900 bg-neutral-900 px-6 text-sm text-white disabled:opacity-60"
            >
              {loadingPortal ? "Opening…" : "Manage Subscription"}
            </button>

            {error ? (
              <p className="mt-4 text-sm text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}