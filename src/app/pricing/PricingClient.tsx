"use client";

import Link from "next/link";
import { useState } from "react";

type Plan = "monthly" | "annual";

export default function PricingClient() {
  const [email, setEmail] = useState<string>("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string>("");

  async function startCheckout(selectedPlan: Plan) {
    try {
      setPlan(selectedPlan);
      setStatus("loading");
      setError("");

      const checkoutEmail = email.trim().toLowerCase();

      if (!checkoutEmail) {
        setStatus("error");
        setError("Please enter your email before selecting a plan.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: checkoutEmail,
          plan: selectedPlan,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

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
          Curatorial Intelligence
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
          Contextual interpretation, inquiry, and applied insight layered onto curated visual research.
        </p>
      </header>

      <section className="mt-10 border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
            Curatorial Intelligence
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Unlock contextual interpretation, inquiry, and applied direction for color, print, pattern, and product development.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-neutral-900">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
                setError("");
              }}
              placeholder="you@example.com"
              className="h-11 w-full border border-neutral-300 px-4 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <p className="mb-3 text-xs tracking-[0.18em] uppercase text-neutral-900">
              Select a plan
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startCheckout("monthly")}
                disabled={status === "loading"}
                className="border border-neutral-900 bg-neutral-900 px-5 py-5 text-left text-white disabled:opacity-60"
              >
                <span className="block text-xs uppercase tracking-[0.18em]">
                  Monthly
                </span>
                <span className="mt-2 block text-2xl">$29</span>
                <span className="mt-1 block text-sm text-neutral-300">
                  per month
                </span>
                <span className="mt-4 block text-sm">
                  {status === "loading" && plan === "monthly"
                    ? "Redirecting…"
                    : "Unlock monthly"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => startCheckout("annual")}
                disabled={status === "loading"}
                className="border border-neutral-300 bg-white px-5 py-5 text-left text-neutral-900 transition hover:border-neutral-900 disabled:opacity-60"
              >
                <span className="block text-xs uppercase tracking-[0.18em]">
                  Annual
                </span>
                <span className="mt-2 block text-2xl">$290</span>
                <span className="mt-1 block text-sm text-neutral-500">
                  per year
                </span>
                <span className="mt-4 block text-sm">
                  {status === "loading" && plan === "annual"
                    ? "Redirecting…"
                    : "Unlock annually"}
                </span>
              </button>
            </div>
          </div>

          {status === "error" ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <p className="text-center text-xs leading-5 text-neutral-500">
            You will complete payment securely through Stripe.
          </p>

          <div className="space-y-6 border border-neutral-200 p-5 text-sm text-neutral-700">
            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
                Included
              </p>

              <ul className="mt-2 space-y-1">
                <li>— Curatorial context layered onto moodboards</li>
                <li>— Color direction with hex codes</li>
                <li>— Print, pattern, product, and category interpretation</li>
                <li>— New references added continuously</li>
              </ul>
            </div>

            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
                Not Included
              </p>

              <ul className="mt-2 space-y-1">
                <li>— Seasonal Forecasts</li>
                <li>— Downloadable PDF reports</li>
                <li>— Historical Trend Service content</li>
              </ul>
            </div>

            <p
              className="text-sm italic"
              style={{
                color: "#4f8f8b",
                fontWeight: 500,
              }}
            >
              For previous Trend Service subscribers: complete seasonal reports are now offered as downloadable Seasonal Forecasts rather than through a live subscription site.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 border border-neutral-200 bg-white px-6 py-5 text-center">
        <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
          New to CI?
        </p>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-600">
          View a guided preview of the CI framework before subscribing.
        </p>

        <Link
          href="/preview"
          className="mt-4 inline-flex h-11 items-center justify-center border border-neutral-300 px-6 text-sm text-neutral-900 transition hover:border-neutral-900"
        >
          View Preview
        </Link>
      </section>
    </main>
  );
}