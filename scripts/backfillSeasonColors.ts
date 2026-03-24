import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { buildName } from "../src/lib/extractMoodboardPalette";

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

async function main() {
  const season = process.argv[2];

  if (!season) {
    console.error('Usage: npm run backfill:season-colors -- "FW27/28"');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: chips, error } = await supabase
    .from("season_color_chips")
    .select("id, season, image_path, sort_order")
    .eq("season", season)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load season color chips:", error.message);
    process.exit(1);
  }

  if (!chips || chips.length === 0) {
    console.error(`No chips found for season "${season}"`);
    process.exit(1);
  }

  console.log(`Processing ${chips.length} chips for ${season}...`);

  let processed = 0;

  for (const chip of chips) {
    try {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/season-color-chips/${chip.image_path}`;

      const res = await fetch(publicUrl);
      if (!res.ok) {
        console.log(`✗ Failed to fetch: ${chip.image_path}`);
        continue;
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
        .eq("id", chip.id);

      if (updateError) {
        console.log(`✗ Failed to update: ${chip.image_path}`);
        continue;
      }

      processed += 1;
      console.log(`✓ ${chip.sort_order ?? "-"}  ${hex}  ${name}`);
    } catch {
      console.log(`✗ Failed: ${chip.image_path}`);
    }
  }

  console.log(`Done. Processed ${processed} of ${chips.length} chips.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});