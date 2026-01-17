// Civil War map data for GraphMap visualization
// Positions are SVG coordinates for an 800x500 viewBox

export interface TerritoryPosition {
  x: number;
  y: number;
  isCapital?: boolean;
}

export const CIVIL_WAR_POSITIONS: Record<string, TerritoryPosition> = {
  // Union Core (top cluster)
  new_england: { x: 700, y: 80 },
  new_york: { x: 620, y: 120 },
  pennsylvania: { x: 540, y: 160 },
  ohio_valley: { x: 440, y: 140 },
  great_lakes: { x: 340, y: 100 },
  washington_dc: { x: 580, y: 220, isCapital: true },

  // Border States (middle band)
  maryland: { x: 600, y: 180 },
  west_virginia: { x: 480, y: 200 },
  kentucky: { x: 380, y: 220 },
  missouri: { x: 260, y: 180 },

  // Confederate Core (bottom cluster)
  virginia: { x: 540, y: 280, isCapital: true },
  tennessee: { x: 380, y: 300 },
  carolinas: { x: 580, y: 340 },
  deep_south: { x: 480, y: 380 },
  gulf_coast: { x: 380, y: 420 },
  mississippi_valley: { x: 300, y: 360 },

  // Western
  arkansas: { x: 260, y: 320 },
  texas: { x: 180, y: 400 },
};

// Adjacency data for drawing connection lines
export const CIVIL_WAR_ADJACENCIES: [string, string][] = [
  // Union Core connections
  ["new_england", "new_york"],
  ["new_york", "pennsylvania"],
  ["new_york", "ohio_valley"],
  ["pennsylvania", "ohio_valley"],
  ["pennsylvania", "maryland"],
  ["pennsylvania", "west_virginia"],
  ["ohio_valley", "great_lakes"],
  ["ohio_valley", "kentucky"],
  ["great_lakes", "missouri"],
  ["washington_dc", "maryland"],
  ["washington_dc", "virginia"],

  // Border connections
  ["maryland", "virginia"],
  ["west_virginia", "virginia"],
  ["kentucky", "tennessee"],
  ["kentucky", "missouri"],

  // Confederate Core connections
  ["virginia", "carolinas"],
  ["virginia", "tennessee"],
  ["tennessee", "mississippi_valley"],
  ["tennessee", "arkansas"],
  ["tennessee", "carolinas"],
  ["tennessee", "deep_south"],
  ["carolinas", "deep_south"],
  ["deep_south", "gulf_coast"],
  ["deep_south", "mississippi_valley"],
  ["gulf_coast", "texas"],
  ["gulf_coast", "mississippi_valley"],
  ["mississippi_valley", "arkansas"],
  ["arkansas", "texas"],
  ["arkansas", "missouri"],
];

// Nation colors for Civil War
export const CIVIL_WAR_COLORS = {
  Union: {
    primary: "#1565C0", // Navy Blue
    accent: "#FFD700", // Gold
    light: "#42A5F5",
    text: "text-blue-400",
    bg: "fill-blue-800",
    border: "stroke-blue-500",
  },
  Confederacy: {
    primary: "#6B7280", // Gray
    accent: "#DC2626", // Battle Red
    light: "#9CA3AF",
    text: "text-gray-400",
    bg: "fill-gray-700",
    border: "stroke-gray-500",
  },
  neutral: {
    primary: "#4B5563",
    accent: "#9CA3AF",
    light: "#6B7280",
    text: "text-slate-400",
    bg: "fill-slate-700",
    border: "stroke-slate-600",
  },
};

// Region data for visual grouping
export const CIVIL_WAR_REGIONS = {
  "Union Core": {
    color: "rgba(21, 101, 192, 0.1)",
    borderColor: "rgba(21, 101, 192, 0.3)",
  },
  "Confederate Core": {
    color: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.3)",
  },
  "Border States": {
    color: "rgba(234, 179, 8, 0.1)",
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  Western: {
    color: "rgba(139, 92, 46, 0.1)",
    borderColor: "rgba(139, 92, 46, 0.3)",
  },
};
