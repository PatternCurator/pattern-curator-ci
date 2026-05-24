import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getReportDownloadUrl } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: purchases, error } = await supabase
      .from("report_purchases")
      .select("id, report_slug, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ report purchases lookup error:", error);
      return NextResponse.json(
        { error: "Could not load report purchases." },
        { status: 500 }
      );
    }

    if (!purchases?.length) {
      return NextResponse.json({
        ok: true,
        reports: [],
      });
    }

    const slugs = purchases
      .map((purchase) => purchase.report_slug)
      .filter(Boolean);

    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("title, slug, pdf_path")
      .in("slug", slugs)
      .eq("is_active", true);

    if (reportsError) {
      console.error("❌ reports lookup error:", reportsError);
      return NextResponse.json(
        { error: "Could not load reports." },
        { status: 500 }
      );
    }

    const reportMap = new Map(
      (reports ?? []).map((report) => [report.slug, report])
    );

    const purchasedReports = await Promise.all(
      purchases.map(async (purchase) => {
        const report = reportMap.get(purchase.report_slug);

        if (!report?.pdf_path) {
          return null;
        }

        const downloadUrl = await getReportDownloadUrl(report.pdf_path);

        return {
          id: purchase.id,
          title: report.title ?? purchase.report_slug,
          slug: purchase.report_slug,
          purchased_at: purchase.created_at,
          download_url: downloadUrl,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      reports: purchasedReports.filter(Boolean),
    });
  } catch (err: any) {
    console.error("❌ api/reports/purchases error:", err?.message || err);
    return NextResponse.json(
      { error: "Report purchases route failed." },
      { status: 500 }
    );
  }
}