import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand lockup */}
          <Link href="/" className="block leading-tight">
            <div
              className="text-[20px] italic"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
                color: "#8a8a8aff", //  gray
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
            className="flex items-center gap-4"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#111827",
              letterSpacing: "0.02em",
            }}
          >
            <Link
              href="/search"
              className="text-[12px] hover:opacity-80"
              style={{ color: "#111827" }}
            >
              Curate
            </Link>
            <Link
              href="/trend"
              className="text-[12px] hover:opacity-80"
              style={{ color: "#111827" }}
            >
              Trend
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
