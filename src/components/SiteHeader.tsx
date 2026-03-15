import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="relative z-10 mt-6 w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">

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
            className="w-full flex flex-wrap justify-start gap-x-4 gap-y-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-6"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#8a8a8aff",
              letterSpacing: "0.08em",
              fontStyle: "italic",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <Link
              href="/ci"
              className="text-[12px] sm:text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              Home
            </Link>

            <Link
              href="/moodboards"
              className="text-[12px] sm:text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              Boards
            </Link>

            <Link
              href="/about"
              className="text-[12px] sm:text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              About
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}