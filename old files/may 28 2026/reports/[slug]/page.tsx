import ReportPurchaseButton from "@/components/ReportPurchaseButton";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Report = {
  slug: string;
  title: string;
  season_label: string | null;
  description: string | null;
  contents: string | null;
  page_count: number | null;
  price: number;
  hero_image: string | null;
  preview_1: string | null;
  preview_2: string | null;
  preview_3: string | null;
  preview_4: string | null;
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

export default async function ReportSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = getSupabaseAdmin();

  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !report) {
    notFound();
  }

  const r = report as Report;

  const heroImage = getReportAssetUrl(r.hero_image);

  const previewImages = [
    r.preview_1,
    r.preview_2,
    r.preview_3,
    r.preview_4,
  ]
    .map(getReportAssetUrl)
    .filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-20">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_420px]">
        <section className="space-y-4">
          {heroImage ? (
            <img
              src={heroImage}
              alt={r.title}
              className="aspect-[13.33/7.5] w-full border border-neutral-200 object-cover"
            />
          ) : null}

          {previewImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {previewImages.map((image, index) => (
                <a
                  key={image}
                  href={image}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={image}
                    alt={`${r.title} preview ${index + 1}`}
                    className="aspect-[13.33/7.5] w-full border border-neutral-200 object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="max-w-[420px] space-y-8">
          <div className="space-y-4">
            {r.season_label ? (
              <p
                className="text-[11px] uppercase tracking-[0.18em] text-neutral-500"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                {r.season_label}
              </p>
            ) : null}

            <div className="space-y-3">
              <h1
                className="text-[24px] uppercase tracking-[0.12em] text-neutral-950"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 300,
                }}
              >
                {r.title}
              </h1>

              <p className="text-[13px] leading-[1.8] text-neutral-700">
                {r.description}
              </p>
            </div>

            <div className="space-y-2 border-t border-neutral-200 pt-5">
              <p
                className="text-[11px] uppercase tracking-[0.14em] text-neutral-500"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Report Details
              </p>

              <p className="text-[13px] leading-[1.8] text-neutral-700">
                {r.contents}
              </p>

              <p className="pt-1 text-[12px] text-neutral-500">
                {r.page_count} Pages · Digital PDF
              </p>
            </div>

            <div className="space-y-4 border-t border-neutral-200 pt-6">
              <div className="space-y-1">
                <p
                  className="text-[11px] uppercase tracking-[0.16em] text-neutral-500"
                  style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                >
                  Purchase
                </p>

                <p className="text-[28px] font-light tracking-tight text-neutral-950">
                  ${r.price}
                </p>
              </div>

              <ReportPurchaseButton slug={r.slug} />

              <p className="text-[11px] leading-[1.6] text-neutral-500">
  Digital PDF download delivered immediately after purchase.
</p>

              <p className="text-[11px] leading-[1.6] text-neutral-500">
                Student and freelancer rates available by request.
              </p>

              <p className="pt-2 text-[11px] text-neutral-500">
                Digital download for individual use. Team and studio licenses
                available by request.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}