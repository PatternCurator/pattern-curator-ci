import sharp from "sharp";

type PaletteResult = {
  hexes: string[];
  names: string[];
};

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbToHsl(r: number, g: number, b: number) {
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

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (m) => m.toUpperCase());
}

function hashRgb(r: number, g: number, b: number, salt: string) {
  let hash = r * 3 + g * 5 + b * 7;

  for (let i = 0; i < salt.length; i++) {
    hash = (hash * 31 + salt.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function pickDeterministic(words: string[], r: number, g: number, b: number, salt: string) {
  const index = hashRgb(r, g, b, salt) % words.length;
  return words[index];
}

function classifyFamily(r: number, g: number, b: number, h: number, l: number) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);

  if (spread < 8 && l > 0.92) return "ivory";
  if (spread < 10 && l > 0.84) return "chalk";
  if (spread < 12 && l > 0.74) return "shell";
  if (spread < 14 && l > 0.62) return "linen";
  if (spread < 16 && l > 0.48) return "cement";
  if (spread < 18 && l <= 0.48) return "slate";

  if (h >= 15 && h < 32) return "terracotta";
  if (h >= 32 && h < 48) return "amber";
  if (h >= 48 && h < 65) return "gold";
  if (h >= 65 && h < 90) return "citron";
  if (h >= 90 && h < 140) return "grass";
  if (h >= 140 && h < 175) return "jade";
  if (h >= 175 && h < 210) return "ocean";
  if (h >= 210 && h < 250) return "navy";
  if (h >= 250 && h < 290) return "indigo";
  if (h >= 290 && h < 320) return l > 0.65 ? "pink" : "ruby";
  if (h >= 320 && h < 345) return "rose";
  return l > 0.55 ? "pink" : "ruby";
}

/**
 * Curated, family-specific approved combinations only.
 * This is intentionally more constrained so the output feels smarter.
 */
const combinationsByFamily: Record<string, string[]> = {
  ivory: [
    "Opalescent Ivory",
    "Airy Pearl",
    "Translucent Lace",
    "Cloud Ivory",
    "Ephemeral Pearl",
    "Porcelain Ivory",
    "Seaside Pearl",
  ],
  chalk: [
    "Smoke Chalk",
    "Cloud Bone",
    "Opalescent Plaster",
    "Airy Chalk",
    "Modern Ash",
    "Translucent Bone",
  ],
  shell: [
    "Rosewater Shell",
    "Opalescent Shell",
    "Airy Blush",
    "Cloud Pearl",
    "Ephemeral Petal",
    "Modern Shell",
  ],
  linen: [
    "Artisan Linen",
    "Modern Canvas",
    "Coastal Linen",
    "Painterly Flax",
    "Romantic Parchment",
    "Airy Canvas",
  ],
  cement: [
    "Ocean Cement",
    "Smoke Stone",
    "Coastal Pebble",
    "Modern Cement",
    "Artisan Mica",
    "Cloud Stone",
  ],
  slate: [
    "Smoke Slate",
    "Inked Graphite",
    "Modern Cinder",
    "Ocean Slate",
    "Coastal Shadow",
    "Indigo Slate",
  ],

  terracotta: [
    "Artisan Terracotta",
    "Painterly Terra",
    "Romantic Clay",
    "Burnish Terracotta",
    "Modern Poppy",
    "Desert Clay",
    "Rosewater Terra",
  ],
  amber: [
    "Amber Lantern",
    "Honeyed Amber",
    "Artisan Ochre",
    "Golden Cider",
    "Burnish Maple",
    "Saffron Lantern",
    "Modern Amber",
  ],
  gold: [
    "Sunlit Gold",
    "Golden Ochre",
    "Saffron Pollen",
    "Marigold Brocade",
    "Citron Gold",
    "Artisan Ochre",
    "Burnish Gold",
  ],
  citron: [
    "Citron Pollen",
    "Modern Citron",
    "Sunlit Citron",
    "Citrus Glow",
    "Saffron Citron",
    "Artisan Lemon",
  ],
  grass: [
    "Grass Meadow",
    "Garden Clover",
    "Modern Grass",
    "Romantic Grove",
    "Artisan Field",
    "Seaside Grass",
    "Painterly Fern",
  ],
  jade: [
    "Jade Moss",
    "Emerald Clover",
    "Modern Jade",
    "Ocean Herb",
    "Artisan Fern",
    "Rich Jade",
    "Garden Moss",
  ],
  ocean: [
    "Ocean Glass",
    "Seaside Tide",
    "Coastal Wave",
    "Tidal Glass",
    "Modern Lagoon",
    "Smoke Ocean",
    "Ocean Harbor",
  ],
  navy: [
    "Navy Horizon",
    "Seaside Navy",
    "Ocean Rain",
    "Modern Harbor",
    "Smoke Navy",
    "Rich Horizon",
    "Coastal Sky",
  ],
  indigo: [
    "Indigo Ink",
    "Sapphire Indigo",
    "Modern Indigo",
    "Smoke Fig",
    "Rich Indigo",
    "Ocean Night",
    "Studio Indigo",
  ],
  pink: [
    "Romantic Peony",
    "Rosewater Pink",
    "Opalescent Blush",
    "Airy Camellia",
    "Modern Pink",
    "Cloud Peony",
    "Ephemeral Rosewater",
  ],
  ruby: [
    "Ruby Fig",
    "Rich Mulberry",
    "Modern Ruby",
    "Smoke Wine",
    "Jewel Plum",
    "Artisan Berry",
    "Painterly Fig",
  ],
  rose: [
    "Rosewater Peony",
    "Romantic Rose",
    "Cloud Rose",
    "Opalescent Camellia",
    "Modern Rose",
    "Airy Petal",
    "Ephemeral Dahlia",
  ],
};

export function buildName(r: number, g: number, b: number) {
  const { h, l } = rgbToHsl(r, g, b);
  const family = classifyFamily(r, g, b, h, l);

  const options = combinationsByFamily[family] ?? ["Modern Color"];
  const result = pickDeterministic(options, r, g, b, `combo-${family}`);

  return toTitleCase(result.trim());
}

async function sampleAverageRgb(
  imageBuffer: Buffer,
  left: number,
  top: number,
  width: number,
  height: number
) {
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

export async function extractMoodboardPaletteFromUrl(imageUrl: string): Promise<PaletteResult> {
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

  const hexes: string[] = [];
  const names: string[] = [];

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
    names.push(buildName(r, g, b));
  }

  return { hexes, names };
}