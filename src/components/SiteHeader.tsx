import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="relative z-10 mt-6 w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* Brand Lockup */}
          <Link href="/ci" className="block leading-tight">
            <div
              className="text-[20px] italic"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
                color: "#8a8a8aff",
              }}
            >
              Pattern Curator
            </div>

            <div
              className="text-[12px]"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#111827",
                letterSpacing: "0.02em",
              }}
            >
              Curatorial Intelligence™
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="flex flex-wrap items-center justify-start gap-x-10 gap-y-2 sm:justify-end"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#111827",
              letterSpacing: "0.12em",
              fontWeight: 400,
              textTransform: "uppercase",
            }}
          >
            <Link
              href="/ci"
              className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
            >
              Home
            </Link>

            <Link
              href="/season/FW27%2F28"
              className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
            >
              Seasons
            </Link>

            <Link
              href="/moodboards"
              className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
            >
              Boards
            </Link>

            <Link
              href="/pricing"
              className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
            >
              Subscribe
            </Link>

            <Link
              href="/about"
              className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
            >
              About
            </Link>

            <Link
              href="https://www.patterncurator.com/scheduling"
              className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
            >
              Advisory
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}