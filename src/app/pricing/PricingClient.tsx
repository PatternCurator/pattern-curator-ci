"use client";

import Link from "next/link";

export default function PricingClient() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-20 pb-16">
      <header className="text-center">
        <h1 className="text-3xl tracking-[0.12em] uppercase text-neutral-900">
          Curatorial Intelligence is moving home.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
          CI is now part of Pattern Curator, bringing research, seasonal direction
          and visual work together in one place.
        </p>
      </header>

      <section className="mt-10 border border-neutral-200 bg-white px-6 py-8 text-center">
        <p className="text-sm leading-6 text-neutral-600">
          New CI subscriptions are now closed.
        </p>

        <a
          href="https://www.patterncurator.com"
          className="mt-6 inline-flex h-11 items-center justify-center border border-neutral-900 bg-neutral-900 px-6 text-sm text-white"
        >
          Explore Pattern Curator
        </a>

        <p className="mt-8 text-xs leading-5 text-neutral-500">
          Already a CI subscriber? Your current access remains available during
          the transition.
        </p>

        <Link
          href="/login"
          className="mt-4 inline-flex h-11 items-center justify-center border border-neutral-300 px-6 text-sm text-neutral-900 transition hover:border-neutral-900"
        >
          Current Member Access
        </Link>
      </section>
    </main>
  );
}
