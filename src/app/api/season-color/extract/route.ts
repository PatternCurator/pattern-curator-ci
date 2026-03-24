import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildName } from "@/lib/extractMoodboardPalette";

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .toUpperCase()
  );
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const { data: chip, error } = await supabase
      .from("season_color_chips")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !chip) {
      return NextResponse.json({ error: "Chip not found" }, { status: 404 });
    }

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) {
      return NextResponse.json({ error: "Missing Supabase URL" }, { status: 500 });
    }

    const publicUrl = `${base}/storage/v1/object/public/season-color-chips/${chip.image_path}`;

    const res = await fetch(publicUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch chip image: ${res.status}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data } = await sharp(buffer)
      .resize(20, 20, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let r = 0;
    let g = 0;
    let b = 0;

    for (let i = 0; i < data.length; i += 3) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    const pixelCount = data.length / 3;

    r /= pixelCount;
    g /= pixelCount;
    b /= pixelCount;

    const hex = rgbToHex(r, g, b);
    const name = buildName(r, g, b);

    const { error: updateError } = await supabase
      .from("season_color_chips")
      .update({ hex, name })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ hex, name });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}