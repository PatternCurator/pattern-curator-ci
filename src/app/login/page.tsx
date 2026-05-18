import EmailGate from "@/components/EmailGate";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <EmailGate source="ci">
      <main className="mx-auto max-w-2xl px-6 pt-20 pb-20">
        <div className="border border-neutral-200 bg-white px-6 py-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Pattern Curator CI
          </p>

          <h1
            className="mt-3 text-[24px] font-normal text-neutral-900"
            style={{ fontFamily: "var(--font-libre), Libre Baskerville, serif" }}
          >
            Subscriber Log In
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600">
            Log in with your subscription email to access subscriber context,
            account tools, and applied insight.
          </p>

          <div className="mt-6">
            <Link
              href="/account"
              className="text-xs uppercase tracking-[0.12em] text-neutral-500 underline underline-offset-4"
            >
              Continue to Account
            </Link>
          </div>
        </div>
      </main>
    </EmailGate>
  );
}