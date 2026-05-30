import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Report = {
  slug: string;
  title: string;
  season_label: string | null;
  description: string | null;
  price: number;
  cover_image: string | null;
};

function getReportAssetUrl(path: string | null) {
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return cleanPath;

  return `${supabaseUrl}/storage/v1/object/public/paid-report-images/${cleanPath}`;
}

export default async function LibraryPage() {
  const supabase = getSupabaseAdmin();

  const { data: reports, error } = await supabase
    .from("reports")
    .select("slug, title, season_label, description, price, cover_image")
    .eq("is_active", true)
    .eq("report_type", "archive")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("library page error", error);
  }

  const archiveReports = (reports ?? []) as Report[];

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-16">
        <section className="space-y-5">
          <div className="space-y-2">
            <h1
              className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontWeight: 300,
              }}
            >
              Pattern Curator Library
            </h1>

            <p
              className="text-[13px] italic text-neutral-500"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              A curated archive of previous trend reports designed to inspire color, print, pattern, and concept development.
            </p>

            <p
              className="max-w-3xl text-[13px] leading-[1.8]"
              style={{
                fontWeight: 500,
              }}
            >
              Complete seasonal reports
              are now offered as downloadable pdf reports rather than
              through a live subscription site.
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-2">
        

          </div>

          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {archiveReports.map((report) => (
              <Link
                key={report.slug}
                href={`/reports/${report.slug}`}
                className="group block"
              >
                {report.cover_image ? (
                  <img
                    src={getReportAssetUrl(report.cover_image) ?? ""}
                    alt={`${report.title} cover`}
                    className="aspect-square w-full border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full border border-neutral-200 bg-neutral-100" />
                )}

                <div className="mt-4 space-y-2">
                  {report.season_label ? (
                    <p
                      className="text-[11px] uppercase tracking-[0.16em] text-neutral-500"
                      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                    >
                      {report.season_label}
                    </p>
                  ) : null}

                  <h3 className="text-base font-normal text-neutral-950 group-hover:opacity-70">
                    {report.title}
                  </h3>

                  {report.description ? (
                    <p className="max-w-sm text-[12px] leading-[1.7] text-neutral-600">
                      {report.description}
                    </p>
                  ) : null}

                  <p
                    className="pt-1 text-[11px] uppercase tracking-[0.14em] text-neutral-900"
                    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    ${report.price} · Forecast Access + PDF
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}