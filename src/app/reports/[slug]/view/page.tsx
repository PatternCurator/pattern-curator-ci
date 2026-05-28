import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getReportDownloadUrl } from "@/lib/reports";
import ForecastPdfViewer from "@/components/ForecastPdfViewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
};

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

export default async function ForecastViewerPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { email: rawEmail } = await searchParams;
  const email = normalizeEmail(rawEmail || "");

  if (!email || !email.includes("@")) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-16">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Forecast Access
        </p>

        <h1 className="mt-4 text-[22px] uppercase tracking-[0.24em] text-neutral-900">
          Email Required
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
          To view this Seasonal Forecast online, return to your account and enter the email used at checkout.
        </p>

        <Link
          href="/account"
          className="mt-6 inline-block border border-neutral-900 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
        >
          Go to Account
        </Link>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: purchase, error: purchaseError } = await supabase
    .from("report_purchases")
    .select("id")
    .eq("email", email)
    .eq("report_slug", slug)
    .maybeSingle();

  if (purchaseError || !purchase) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-16">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Forecast Access
        </p>

        <h1 className="mt-4 text-[22px] uppercase tracking-[0.24em] text-neutral-900">
          Forecast Not Found
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
          We could not find this forecast purchase for the email provided. Return to your account and confirm the checkout email.
        </p>

        <Link
          href="/account"
          className="mt-6 inline-block border border-neutral-900 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
        >
          Back to Account
        </Link>
      </main>
    );
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("title, pdf_path")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (reportError || !report?.pdf_path) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-16">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Forecast Access
        </p>

        <h1 className="mt-4 text-[22px] uppercase tracking-[0.24em] text-neutral-900">
          Forecast Unavailable
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
          This forecast PDF could not be loaded. Email info@patterncurator.com for access.
        </p>
      </main>
    );
  }

  const pdfUrl = await getReportDownloadUrl(report.pdf_path);

  if (!pdfUrl) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-16">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Forecast Access
        </p>

        <h1 className="mt-4 text-[22px] uppercase tracking-[0.24em] text-neutral-900">
          Viewer Unavailable
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
          The online viewer could not create a secure PDF link. Email info@patterncurator.com for access.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 pt-10 pb-16 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
  <div className="mb-6 flex flex-col justify-between gap-5 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end">

        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Seasonal Forecast
          </p>

          <h1 className="mt-2 text-[20px] uppercase tracking-[0.18em] text-neutral-900">
            {report.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/account"
            className="inline-flex h-10 items-center justify-center border border-neutral-300 px-4 text-[11px] uppercase tracking-[0.16em] text-neutral-700 hover:border-neutral-900"
          >
            Account
          </Link>

          <a
            href={pdfUrl}
            className="inline-flex h-10 items-center justify-center border border-neutral-400 bg-white px-4 text-[11px] uppercase tracking-[0.16em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            Download PDF
          </a>
        </div>
      </div>

    </div>
      <div className="mx-auto max-w-[1180px] bg-white">
        <ForecastPdfViewer pdfUrl={pdfUrl} />
        </div>
    </main>
  );
}