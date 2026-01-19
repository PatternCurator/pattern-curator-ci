import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand lockup */}
          <Link href="/" className="block leading-tight">
            <div
              className="text-[15px] italic"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
                color: "#6b7280", // medium gray
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

          {/* Top nav */}
<nav className="flex items-center gap-3 text-sm">
  <Link
    href="/"
    className="rounded-full px-3 py-2 hover:bg-black/5"
    title="Curate"
  >
    Curate
  </Link>
</nav>

        </div>
      </div>
    </header>
  );
}
