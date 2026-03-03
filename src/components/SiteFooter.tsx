import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-neutral-600">
          <div className="font-medium text-neutral-800">Pattern Curator LLC</div>
          <div className="mt-1">
            © {year} · P.O. Box 2266 · Vineland, NJ 08360 ·{" "}
            <a className="underline underline-offset-4" href="mailto:info@patterncurator.com">
              info@patterncurator.com
            </a>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link className="underline underline-offset-4" href="/legal#terms">
            Terms and Conditions
          </Link>
          <Link className="underline underline-offset-4" href="/legal#privacy">
            Privacy
          </Link>
          <Link className="underline underline-offset-4" href="/legal#dmca">
            DMCA
          </Link>
        </nav>
      </div>
    </footer>
  );
}