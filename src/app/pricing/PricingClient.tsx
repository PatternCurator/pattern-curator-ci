"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingClient() {
  const [email, setEmail] = useState<string>("");
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string>("");

  async function startCheckout() {
    try {
      setStatus("loading");
      setError("");

      const checkoutEmail = email.trim().toLowerCase();

      if (!checkoutEmail) {
        setStatus("error");
        setError("Please enter your email to continue.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail, plan }),
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
          Subscribe to CI
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
          Curatorial Intelligence for print, color, surface, and product direction.
        </p>
      </header>

      <section className="mt-10 border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
            CI Membership
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Ongoing access to curated moodboards, applied insight, color direction,
            and Curatorial Intelligence features.
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
              Choose a plan
            </p>

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
                $29 / month
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
                $290 / year
              </button>
            </div>
          </div>

          <div className="space-y-2 border border-neutral-200 p-5 text-sm text-neutral-700">
            <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
              Included
            </p>

            <ul className="list-disc space-y-1 pl-5">
              <li>Full access to CI moodboards</li>
              <li>Curatorial context and applied design insight</li>
              <li>Color direction with hex codes</li>
              <li>Print, pattern, product, and category interpretation</li>
              <li>New references added continuously</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startCheckout}
            disabled={status === "loading"}
            className="h-11 w-full border border-neutral-900 bg-neutral-900 text-sm text-white disabled:opacity-60"
          >
            {status === "loading" ? "Redirecting…" : "Continue to Checkout"}
          </button>

          {status === "error" ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <p className="text-center text-xs leading-5 text-neutral-500">
            You will complete payment securely through Stripe.
          </p>
        </div>
      </section>

      <section className="mt-6 border border-neutral-200 bg-white px-6 py-5 text-center">
        <p className="text-xs tracking-[0.18em] uppercase text-neutral-900">
          Looking for Seasonal Reports?
        </p>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-600">
          Seasonal Trend Reports are separate one-time downloads and are closer to
          the former Trend Service format.
        </p>
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