import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="relative z-10 mt-6 w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-[1400px] px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-6">
          
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
            className="flex items-center gap-6 whitespace-nowrap"
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
              href="/library"
              className="text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              Library
            </Link>

            <Link
              href="/inspiration"
              className="text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              Inspiration
            </Link>

            <Link
              href="/archive"
              className="text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              Archive
            </Link>

            <Link
              href="/moodboards"
              className="text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              Moodboards
            </Link>

            <Link
              href="/about"
              className="text-[13px] hover:opacity-80 underline underline-offset-4 decoration-[0.5px]"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}