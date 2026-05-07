"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AccountPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      setEmail(data?.session?.user?.email ?? "");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? "");
    });

    return () => {
      alive = false;
      sub?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function openPortal() {
    try {
      setLoading(true);
      setError("");

      if (!email) {
        window.location.href = "/pricing?verify=1";
        return;
      }

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Unable to open portal.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-20 pb-20">
      <div className="border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Account
          </p>

          <h1 className="mt-2 text-2xl text-neutral-900">
            Subscription Management
          </h1>

          {email ? (
            <p className="mt-3 text-sm text-neutral-600">
              Signed in as {email}
            </p>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              Verify your email to manage your subscription.
            </p>
          )}
        </div>

        <div className="px-6 py-6">
          <button
            type="button"
            onClick={openPortal}
            disabled={loading}
            className="h-11 border border-neutral-900 bg-neutral-900 px-6 text-sm text-white disabled:opacity-60"
          >
            {loading ? "Opening…" : "Manage Subscription"}
          </button>

          {error ? (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <p className="mt-6 text-xs leading-5 text-neutral-500">
            Manage billing, payment methods, invoices, renewals, and cancellation through Stripe.
          </p>
        </div>
      </div>
    </main>
  );
}