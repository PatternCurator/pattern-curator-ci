import Link from "next/link";

const reports = [
  {
    slug: "ss-27",
    season: "SS27",
    title: "Spring / Summer 27 Trend Report",
    price: "$250",
    coverLabel: "Report Cover",
    description:
      "A visual seasonal report exploring consumer sentiment, macro direction, color, print, and pattern.",
  },
];

export default function ReportsPage() {
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
              Trend Reports
            </h1>

            <p
              className="text-[13px] italic text-neutral-500"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              Seasonal visual reports designed to support creative direction,
              concept development, color, print and pattern.
            </p>

            <p className="max-w-3xl text-[12px] leading-[1.7] text-neutral-700">
              Pattern Curator trend reports are available as separate digital
              purchases. Each report is delivered as a downloadable PDF and is
              not included with a Curatorial Intelligence subscription.
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-2">
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Available Reports
            </p>

            <h2 className="text-xl text-neutral-900">Seasonal Downloads</h2>
          </div>

          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Link
                key={report.slug}
                href={`/reports/${report.slug}`}
                className="group block"
              >
              <div className="p-1"></div>  
                <img
                    src="/reports/ss-27/cover.jpg"
                    alt={`${report.title} cover`}
                    className="aspect-square w-full border border-neutral-200 object-cover"
            />

                <div className="mt-4 space-y-2">
                  <p
                    className="text-[11px] uppercase tracking-[0.16em] text-neutral-500"
                    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    {report.season}
                  </p>

                  <h3 className="text-base font-normal text-neutral-950 group-hover:opacity-70">
                    {report.title}
                  </h3>

                  <p className="max-w-sm text-[12px] leading-[1.7] text-neutral-600">
                    {report.description}
                  </p>

                  <p
                    className="pt-1 text-[11px] uppercase tracking-[0.14em] text-neutral-900"
                    style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                  >
                    {report.price} · Purchase + Download
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