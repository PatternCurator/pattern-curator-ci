import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function publicMoodboardUrl(path) {
  if (!path) return null;
  const clean = path.trim().replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/moodboards/${encoded}`;
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rn:
        h = 60 * (((gn - bn) / delta) % 6);
        break;
      case gn:
        h = 60 * ((bn - rn) / delta + 2);
        break;
      case bn:
        h = 60 * ((rn - gn) / delta + 4);
        break;
    }
  }

  if (h < 0) h += 360;

  return { h, s, l };
}

function classifyHue(h) {
  if (h >= 15 && h < 45) return "ochre";
  if (h >= 45 && h < 70) return "citrine";
  if (h >= 70 && h < 95) return "olive";
  if (h >= 95 && h < 140) return "moss";
  if (h >= 140 && h < 175) return "sage";
  if (h >= 175 && h < 210) return "mineral";
  if (h >= 210 && h < 250) return "slate";
  if (h >= 250 && h < 290) return "violet";
  if (h >= 290 && h < 345) return "rose";
  return "clay";
}

function classifyNeutral(r, g, b, l) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);

  if (spread < 10 && l > 0.82) return "chalk";
  if (spread < 12 && l > 0.68) return "parchment";
  if (spread < 14 && l > 0.45) return "stone";
  if (spread < 18 && l <= 0.45) return "charcoal";

  return null;
}

function classifyTone(s, l) {
  if (l > 0.82) return "pale";
  if (l > 0.7 && s < 0.22) return "soft";
  if (s < 0.16) return "faded";
  if (s < 0.28) return "washed";
  if (l < 0.28) return "deep";
  if (l < 0.4) return "burnished";
  return "muted";
}

function toTitleCase(value) {
  return value.replace(/\b\w/g, (m) => m.toUpperCase());
}

function generatePatternCuratorName(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  const neutral = classifyNeutral(r, g, b, l);

  if (neutral) {
    const tone = classifyTone(s, l);
    return toTitleCase(`${tone} ${neutral}`);
  }

  const tone = classifyTone(s, l);
  const hue = classifyHue(h);

  return toTitleCase(`${tone} ${hue}`);
}

async function sampleAverageRgb(imageBuffer, left, top, width, height) {
  const { data, info } = await sharp(imageBuffer)
    .extract({
      left: Math.max(0, Math.round(left)),
      top: Math.max(0, Math.round(top)),
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  const channels = info.channels;
  const pixels = info.width * info.height;

  for (let i = 0; i < data.length; i += channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  return {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels),
  };
}

async function extractMoodboardPaletteFromUrl(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch moodboard image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read moodboard image dimensions.");
  }

  const imageWidth = metadata.width;
  const imageHeight = metadata.height;

  const chipCount = 7;

  const paletteTop = imageHeight * 0.945;
  const paletteHeight = imageHeight * 0.04;

  const paletteLeft = imageWidth * 0.195;
  const paletteWidth = imageWidth * 0.49;

  const slotWidth = paletteWidth / chipCount;

  const hexes = [];
  const names = [];

  for (let i = 0; i < chipCount; i++) {
    const slotLeft = paletteLeft + i * slotWidth;

    const sampleWidth = slotWidth * 0.48;
    const sampleHeight = paletteHeight * 0.58;

    const sampleLeft = slotLeft + (slotWidth - sampleWidth) / 2;
    const sampleTop = paletteTop + (paletteHeight - sampleHeight) / 2;

    const { r, g, b } = await sampleAverageRgb(
      imageBuffer,
      sampleLeft,
      sampleTop,
      sampleWidth,
      sampleHeight
    );

    hexes.push(rgbToHex(r, g, b));
    names.push(generatePatternCuratorName(r, g, b));
  }

  return { hexes, names };
}

async function main() {
  const { data: boards, error } = await supabase
    .from("moodboards")
    .select("id, slug, image_path")
    .or("palette_hex.is.null,palette_names.is.null")
    .order("created_at", { ascending: true });

  if (error) throw error;

  if (!boards || boards.length === 0) {
    console.log("No moodboards need backfill.");
    return;
  }

  console.log(`Found ${boards.length} moodboards to backfill.`);

  for (const board of boards) {
    try {
      const imageUrl = publicMoodboardUrl(board.image_path);
      if (!imageUrl) {
        console.log(`Skipping ${board.slug}: missing image_path`);
        continue;
      }

      const { hexes, names } = await extractMoodboardPaletteFromUrl(imageUrl);

      const { error: updateError } = await supabase
        .from("moodboards")
        .update({
          palette_hex: hexes,
          palette_names: names,
        })
        .eq("id", board.id);

      if (updateError) {
        console.log(`Failed ${board.slug}: ${updateError.message}`);
        continue;
      }

      console.log(`Updated ${board.slug}`);
    } catch (err) {
      console.log(`Failed ${board.slug}: ${err.message}`);
    }
  }

  console.log("Backfill complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});