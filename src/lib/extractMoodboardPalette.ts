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

function classifyNeutralFamily(r: number, g: number, b: number, l: number) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);

  if (spread < 8 && l > 0.92) return "porcelain";
  if (spread < 10 && l > 0.84) return "chalk";
  if (spread < 12 && l > 0.74) return "shell";
  if (spread < 14 && l > 0.62) return "parchment";
  if (spread < 16 && l > 0.48) return "stone";
  if (spread < 18 && l <= 0.48) return "charcoal";

  return null;
}

function classifyHueFamily(h: number) {
  if (h >= 15 && h < 32) return "clay";
  if (h >= 32 && h < 48) return "honey";
  if (h >= 48 && h < 65) return "gold";
  if (h >= 65 && h < 90) return "olive";
  if (h >= 90 && h < 140) return "moss";
  if (h >= 140 && h < 175) return "sage";
  if (h >= 175 && h < 210) return "mineral";
  if (h >= 210 && h < 250) return "sky";
  if (h >= 250 && h < 290) return "violet";
  if (h >= 290 && h < 330) return "rose";
  if (h >= 330 && h < 345) return "blossom";
  return "berry";
}

function classifyMood(h: number, s: number, l: number) {
  if (l > 0.86 && s < 0.18) return "airy";
  if (l > 0.76 && s < 0.34) return "soft";
  if (l < 0.32) return "nocturne";
  if (s > 0.5 && l > 0.62) return "whimsy";
  if (s < 0.18) return "mineral";
  if (h >= 30 && h < 95 && l < 0.62) return "earth";
  return "editorial";
}

const familyWords: Record<string, string[]> = {
  porcelain: ["porcelain", "ivory", "pearl", "alabaster", "cream"],
  chalk: ["chalk", "milk", "bone", "plaster", "frost"],
  shell: ["shell", "oyster", "soft pearl", "shell blush", "petal shell"],
  parchment: ["parchment", "linen", "oat", "canvas", "flax"],
  stone: ["stone", "river stone", "weathered stone", "pebble", "mineral stone"],
  charcoal: ["charcoal", "graphite", "inkstone", "smoke", "cinder"],

  clay: ["clay", "terracotta", "apricot clay", "rose clay", "sun clay"],
  honey: ["honey", "amber", "nectar", "raw honey", "golden nectar"],
  gold: ["gold", "marigold", "saffron", "sun", "buttergold"],
  olive: ["olive", "lichen", "grove", "moss olive", "garden olive"],
  moss: ["moss", "fern", "meadow", "forest moss", "lichen green"],
  sage: ["sage", "eucalyptus", "garden sage", "dried sage", "soft herb"],
  mineral: ["mineral", "sea glass", "storm glass", "tidal blue", "mineral blue"],
  sky: ["sky", "horizon", "rain blue", "coastal blue", "dawn sky"],
  violet: ["violet", "iris", "plum", "fig", "mulberry"],
  rose: ["rose", "petal", "rosewater", "tea rose", "dusty bloom"],
  blossom: ["blossom", "camellia", "peony", "garden bloom", "soft bloom"],
  berry: ["berry", "poppy", "currant", "wild berry", "crushed berry"],
};

const modifiersByMood: Record<string, string[]> = {
  airy: ["mist", "cloud", "luminous", "dawn", "breezy", "lightfall"],
  soft: ["powder", "petal", "faded", "hushed", "blushed", "velvet"],
  nocturne: ["dusk", "shadow", "midnight", "ink", "moonlit", "velvet"],
  whimsy: ["dewdrop", "candied", "storybook", "sunlit", "sugared", "dreamlit"],
  mineral: ["chalked", "weathered", "quiet", "softened", "mineral", "ashen"],
  earth: ["burnished", "sunbaked", "harvest", "toasted", "earthy", "aged"],
  editorial: ["softened", "quiet", "mellow", "faded", "tonal", "muted"],
};

const endingsByMood: Record<string, string[]> = {
  airy: ["mist", "light", "veil", "glow"],
  soft: ["blush", "bloom", "haze", "wash"],
  nocturne: ["shadow", "velvet", "night", "ink"],
  whimsy: ["dream", "sugar", "spark", "glow"],
  mineral: ["stone", "glass", "chalk", "ash"],
  earth: ["clay", "grain", "field", "harvest"],
  editorial: ["tone", "cast", "wash", "finish"],
};

function buildName(r: number, g: number, b: number) {
  const { h, s, l } = rgbToHsl(r, g, b);

  const neutralFamily = classifyNeutralFamily(r, g, b, l);
  const family = neutralFamily ?? classifyHueFamily(h);
  const mood = classifyMood(h, s, l);

  const familyPool = familyWords[family] ?? [family];
  const modifierPool = modifiersByMood[mood] ?? ["softened"];
  const endingPool = endingsByMood[mood] ?? ["tone"];

  const familyWord = pickDeterministic(familyPool, r, g, b, `family-${family}`);
  const familyWordIsCompound = familyWord.includes(" ");
  const modifier = pickDeterministic(modifierPool, r, g, b, `modifier-${mood}`);
  const ending = pickDeterministic(endingPool, r, g, b, `ending-${mood}`);

  const structure = hashRgb(r, g, b, "structure") % 8;

  let result = "";

  switch (structure) {
  case 0:
    result = familyWordIsCompound ? familyWord : `${modifier} ${familyWord}`;
    break;
  case 1:
    result = familyWord;
    break;
  case 2:
    result = neutralFamily ? familyWord : `${modifier} ${family}`;
    break;
  case 3:
    result = familyWordIsCompound ? familyWord : `${familyWord} ${ending}`;
    break;
  case 4:
    result = neutralFamily ? familyWord : `${modifier} ${familyWord}`;
    break;
  case 5:
    result = familyWord;
    break;
  case 6:
    result = neutralFamily ? familyWord : `${modifier} ${family}`;
    break;
  default:
    result = familyWordIsCompound ? familyWord : `${modifier} ${familyWord}`;
    break;
}

  result = result
    .replace(/\bsoft herb\b/gi, "Herb")
    .replace(/\bsoft herb haze\b/gi, "Herb Haze")
    .replace(/\bsoft herb bloom\b/gi, "Herb Bloom")
    .replace(/\bsoft herb wash\b/gi, "Herb Wash")
    .replace(/\brain blue\b/gi, "Rain Blue")
    .replace(/\bdawn sky\b/gi, "Dawn Sky")
    .replace(/\bsea glass\b/gi, "Sea Glass")
    .replace(/\bstorm glass\b/gi, "Storm Glass")
    .replace(/\btidal blue\b/gi, "Tidal Blue")
    .replace(/\bmineral blue\b/gi, "Mineral Blue")
    .replace(/\bdusty bloom\b/gi, "Dusty Bloom")
    .replace(/\bgarden bloom\b/gi, "Garden Bloom")
    .replace(/\bshell blush\b/gi, "Shell Blush")
    .replace(/\bpetal shell\b/gi, "Petal Shell")
    .replace(/\bsoft pearl\b/gi, "Soft Pearl")
    .replace(/\braw honey\b/gi, "Raw Honey")
    .replace(/\bgolden nectar\b/gi, "Golden Nectar")
    .replace(/\bapricot clay\b/gi, "Apricot Clay")
    .replace(/\brose clay\b/gi, "Rose Clay")
    .replace(/\bsun clay\b/gi, "Sun Clay")
    .replace(/\bforest moss\b/gi, "Forest Moss")
    .replace(/\blichen green\b/gi, "Lichen Green")
    .replace(/\bgarden sage\b/gi, "Garden Sage")
    .replace(/\bdried sage\b/gi, "Dried Sage")
    .replace(/\btea rose\b/gi, "Tea Rose")
    .replace(/\bweathered stone\b/gi, "Weathered Stone")
    .replace(/\briver stone\b/gi, "River Stone")
    .replace(/\bmineral stone\b/gi, "Stone")
    .replace(/\bcrushed berry\b/gi, "Crushed Berry")
    .replace(/\bwild berry\b/gi, "Wild Berry")
    .replace(/\bmoss olive\b/gi, "Moss Olive")
    .replace(/\bgarden olive\b/gi, "Garden Olive")
    .replace(/\bcoastal blue\b/gi, "Coastal Blue")
    .replace(/\bbuttergold\b/gi, "Buttergold")
    .replace(/\binkstone\b/gi, "Inkstone")
    .replace(/\bweathered stone stone\b/gi, "Weathered Stone")
    .replace(/\bstone stone\b/gi, "Stone")
    .replace(/\bberry berry\b/gi, "Berry")
    .replace(/\brose rose\b/gi, "Rose")
    .replace(/\bviolet violet\b/gi, "Violet")
    .replace(/\bgold gold\b/gi, "Gold")
    .replace(/\bclay clay\b/gi, "Clay")
    .replace(/\bmoss moss\b/gi, "Moss")
    .replace(/\bsky sky\b/gi, "Sky")
    .replace(/\bsage sage\b/gi, "Sage")
    .replace(/\bblossom blossom\b/gi, "Blossom")
    .replace(/\bporcelain mist\b/gi, "Porcelain")
    .replace(/\bporcelain glow\b/gi, "Porcelain")
    .replace(/\bchalk chalk\b/gi, "Chalk")
    .replace(/\bparchment wash\b/gi, "Parchment")
    .replace(/\boyster wash\b/gi, "Oyster")
    .replace(/\bcream wash\b/gi, "Cream");

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