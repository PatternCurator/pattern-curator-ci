import Stripe from "stripe";
import { getReportDownloadUrl } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReportSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
        <div className="mx-auto max-w-5xl space-y-4">
          <h1 className="text-[22px] uppercase tracking-[0.24em] text-neutral-900">
            Download Unavailable
          </h1>
          <p className="max-w-2xl text-[12px] leading-[1.7] text-neutral-700">
            No checkout session was found. If your payment went through, email info@patterncurator.com for access.
          </p>
        </div>
      </main>
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20" as any,
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const isPaid = session.payment_status === "paid";
  const isReport = session.metadata?.product_type === "report";

  if (!isPaid || !isReport) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
        <div className="mx-auto max-w-5xl space-y-4">
          <h1 className="text-[22px] uppercase tracking-[0.24em] text-neutral-900">
            Download Unavailable
          </h1>
          <p className="max-w-2xl text-[12px] leading-[1.7] text-neutral-700">
            We could not verify this report purchase. If your payment went through, email info@patterncurator.com for access.
          </p>
        </div>
      </main>
    );
  }

  const downloadUrl = await getReportDownloadUrl("ss-27-trend-report.pdf");

  if (!downloadUrl) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
        <div className="mx-auto max-w-5xl space-y-4">
          <h1 className="text-[22px] uppercase tracking-[0.24em] text-neutral-900">
            Download Unavailable
          </h1>
          <p className="max-w-2xl text-[12px] leading-[1.7] text-neutral-700">
            Your payment was received, but the report link could not be created. Email info@patterncurator.com for access.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Purchase Complete
        </p>

        <h1 className="text-[22px] uppercase tracking-[0.24em] text-neutral-900">
          Your Report Is Ready
        </h1>

        <p className="max-w-2xl text-[12px] leading-[1.7] text-neutral-700">
          Thank you for your purchase. Use the button below to download your report.
        </p>

        <a
          href={downloadUrl}
          className="inline-block border border-neutral-900 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
        >
          Download Report
        </a>
      </div>
    </main>
  );
}