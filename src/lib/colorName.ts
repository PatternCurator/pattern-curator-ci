// src/lib/colorName.ts

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break
      case g:
        h = (b - r) / d + 2;
        break
      case b:
        h = (r - g) / d + 4;
        break
    }

    h /= 6;
  }

  return {
    h: h * 360,
    s: s,
    l: l
  };
}

function getColorFamily(h: number) {
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "coral";
  if (h < 70) return "gold";
  if (h < 150) return "green";
  if (h < 210) return "blue";
  if (h < 270) return "violet";
  if (h < 330) return "pink";
  return "rose";
}

const vocab = {
  light: ["mist", "porcelain", "cloud", "veil", "dawn"],
  muted: ["faded", "dusty", "softened", "powder", "chalk"],
  dark: ["dusk", "shadow", "velvet", "midnight", "ink"],

  pink: ["petal", "blush", "rosewater", "shell", "camellia"],
  green: ["moss", "fern", "meadow", "sage", "lichen"],
  blue: ["sky", "rain", "lagoon", "sea glass", "horizon"],
  violet: ["plum", "iris", "violet", "fig"],
  gold: ["honey", "amber", "sun", "marigold"],
  coral: ["peach", "apricot", "nectar"],
  red: ["poppy", "crimson", "berry"],
  rose: ["rose", "blossom", "bloom"]
};

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getEditorialColorName(hex: string) {
  const { h, s, l } = hexToHsl(hex);

  const family = getColorFamily(h);

  let tone: keyof typeof vocab = "muted";

  if (l > 0.75) tone = "light";
  else if (l < 0.35) tone = "dark";

  const modifier = pick(vocab[tone]);
  const colorWord = vocab[family] ? pick(vocab[family]) : family;

  return `${modifier} ${colorWord}`;
}