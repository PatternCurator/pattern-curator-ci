import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractMoodboardPaletteFromUrl } from "@/lib/extractMoodboardPalette";

function publicMoodboardUrl(path: string | null) {
  if (!path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/moodboards/${encoded}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = typeof body?.slug === "string" ? body.slug : null;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("moodboards")
      .select("id, slug, image_path")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Moodboard not found." },
        { status: 404 }
      );
    }

    const imageUrl = publicMoodboardUrl(data.image_path ?? null);

    if (!imageUrl) {
      return NextResponse.json({ error: "Moodboard image not found." }, { status: 400 });
    }

    const { hexes, names } = await extractMoodboardPaletteFromUrl(imageUrl);

    const updatePayload = {
      palette_hex: hexes,
      palette_names: names,
    };

    const { data: updatedRow, error: updateError } = await supabase
      .from("moodboards")
      .update(updatePayload)
      .eq("id", data.id)
      .select("id, slug, palette_hex, palette_names")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          error: updateError.message,
          details: updateError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      slug,
      palette_hex: hexes,
      palette_names: names,
      updated_row: updatedRow,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Unexpected error." },
      { status: 500 }
    );
  }
}