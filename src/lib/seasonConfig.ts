export type SeasonKey = "FW27_28" | "SS27" | "SS28";

export type ConceptConfig = {
  title: string;
  context: string;
  slug: string;
};

export type MacroConfig = {
  title: string;
  context: string;
  asset: string;
  concepts: ConceptConfig[];
  color_support: string[];
  print_support: string[];
  moodboards: string[];
};

export type SeasonConfigMap = {
  current: SeasonKey;
  previous: SeasonKey;
  preview: {
    season: SeasonKey;
    boards: string[];
  };
  seasons: {
    FW27_28: {
      macros: MacroConfig[];
    };
    SS27: {
      moodboards: string[];
    };
  };
};

export const seasonConfig: SeasonConfigMap = {
  current: "FW27_28",
  previous: "SS27",

  preview: {
    season: "SS28",
    boards: [],
  },

  seasons: {
    FW27_28: {
      macros: [
        {
          title: "Library Lounge",
          context: "Replace with your 1-line macro context.",
          asset: "replace-with-existing-moodboard-slug-for-the-singular-asset",
          concepts: [
            {
              title: "Concept One",
              context: "Replace with your first concept line.",
              slug: "replace-with-existing-moodboard-slug-1",
            },
            {
              title: "Concept Two",
              context: "Replace with your second concept line.",
              slug: "replace-with-existing-moodboard-slug-2",
            },
            {
              title: "Concept Three",
              context: "Replace with your third concept line.",
              slug: "replace-with-existing-moodboard-slug-3",
            },
          ],
          color_support: [],
          print_support: [],
          moodboards: [],
        },
      ],
    },

    SS27: {
      moodboards: [],
    },
  },
};