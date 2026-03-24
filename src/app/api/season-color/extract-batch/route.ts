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

async function processChip(chip: any, supabase: any) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const publicUrl = `${base}/storage/v1/object/public/season-color-chips/${chip.image_path}`;

  const res = await fetch(publicUrl);
  if (!res.ok) return null;

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data } = await sharp(buffer)
    .resize(20, 20, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0,
    g = 0,
    b = 0;

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

  await supabase
    .from("season_color_chips")
    .update({ hex, name })
    .eq("id", chip.id);

  return { id: chip.id, hex, name };
}

export async function POST(req: Request) {
  try {
    const { season } = await req.json();

    if (!season) {
      return NextResponse.json({ error: "Missing season" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const { data: chips, error } = await supabase
      .from("season_color_chips")
      .select("*")
      .eq("season", season)
      .order("sort_order", { ascending: true });

    if (error || !chips) {
      return NextResponse.json({ error: "No chips found" }, { status: 404 });
    }

    const results = [];

    for (const chip of chips) {
      const result = await processChip(chip, supabase);
      if (result) results.push(result);
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}