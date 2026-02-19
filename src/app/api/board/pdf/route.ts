import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(input: string) {
  const cleaned = (input || "")
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned.length ? cleaned : "Board";
}

function isAllowedSupabasePublicBoardsUrl(raw: string) {
  try {
    const u = new URL(raw);

    // Only allow https
    if (u.protocol !== "https:") return false;

    // Only allow *.supabase.co (matches your Next remotePatterns too)
    // Note: this blocks arbitrary URLs and prevents SSRF.
    if (!u.hostname.endsWith(".supabase.co")) return false;

    // Only allow public boards bucket path (adjust if your bucket name differs)
    if (!u.pathname.includes("/storage/v1/object/public/boards/")) return false;

    return true;
  } catch {
    return false;
  }
}

async function fetchBytes(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, contentType };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const img1 = searchParams.get("img1");
    const img2 = searchParams.get("img2"); // optional
    const title = searchParams.get("title") || "Board";

    if (!img1) {
      return NextResponse.json({ error: "Missing img1" }, { status: 400 });
    }

    if (!isAllowedSupabasePublicBoardsUrl(img1)) {
      return NextResponse.json({ error: "img1 URL not allowed" }, { status: 400 });
    }
    if (img2 && !isAllowedSupabasePublicBoardsUrl(img2)) {
      return NextResponse.json({ error: "img2 URL not allowed" }, { status: 400 });
    }

    const pdf = await PDFDocument.create();

    // Page 1
    const b1 = await fetchBytes(img1);
    const e1 =
      b1.contentType.includes("png")
        ? await pdf.embedPng(b1.bytes)
        : await pdf.embedJpg(b1.bytes);

    const p1 = pdf.addPage([e1.width, e1.height]);
    p1.drawImage(e1, { x: 0, y: 0, width: e1.width, height: e1.height });

    // Optional Page 2
    if (img2) {
      const b2 = await fetchBytes(img2);
      const e2 =
        b2.contentType.includes("png")
          ? await pdf.embedPng(b2.bytes)
          : await pdf.embedJpg(b2.bytes);

      const p2 = pdf.addPage([e2.width, e2.height]);
      p2.drawImage(e2, { x: 0, y: 0, width: e2.width, height: e2.height });
    }

    const pdfBytes = await pdf.save();
    const filename = safeFilename(title);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "PDF generation failed" },
      { status: 500 }
    );
  }
}

