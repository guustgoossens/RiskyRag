/**
 * Constantinople 1453 Territory Boundaries
 * GeoJSON-style polygon coordinates for each territory
 * Coordinates are [longitude, latitude] pairs
 * 
 * These are simplified approximations of historical regions
 * during the Fall of Constantinople (1453)
 */

export interface TerritoryBoundary {
  name: string;
  displayName: string;
  coordinates: [number, number][][];
  center: [number, number];
  isCapital?: boolean;
}

export const CONSTANTINOPLE_BOUNDARIES: Record<string, TerritoryBoundary> = {
  // ==========================================
  // THRACE REGION
  // ==========================================

  constantinople: {
    name: "constantinople",
    displayName: "Constantinople",
    // The city and immediate surroundings
    coordinates: [[
      [28.7, 41.15],
      [29.2, 41.2],
      [29.3, 41.0],
      [29.1, 40.85],
      [28.8, 40.9],
      [28.7, 41.15],
    ]],
    center: [28.98, 41.01],
    isCapital: true,
  },

  thrace: {
    name: "thrace",
    displayName: "Thrace",
    // Eastern Thrace (European Turkey today)
    coordinates: [[
      [26.0, 42.0],
      [27.5, 42.1],
      [28.5, 41.9],
      [28.7, 41.15],  // Constantinople border
      [28.8, 40.9],
      [29.1, 40.85],
      [28.5, 40.3],   // Sea of Marmara coast
      [27.0, 40.5],
      [26.0, 40.8],
      [25.5, 41.2],
      [26.0, 42.0],
    ]],
    center: [27.2, 41.3],
  },

  // ==========================================
  // BALKANS REGION
  // ==========================================

  macedonia: {
    name: "macedonia",
    displayName: "Macedonia",
    // Historical Macedonia region
    coordinates: [[
      [22.0, 41.8],
      [23.5, 42.2],
      [24.5, 42.0],
      [26.0, 42.0],
      [25.5, 41.2],
      [26.0, 40.8],
      [25.0, 40.5],
      [24.0, 40.3],
      [22.5, 40.5],
      [21.5, 40.8],
      [21.8, 41.5],
      [22.0, 41.8],
    ]],
    center: [23.7, 41.2],
  },

  greece: {
    name: "greece",
    displayName: "Greece",
    // Central and Northern Greece (excluding Morea)
    coordinates: [[
      [21.5, 40.8],
      [22.5, 40.5],
      [24.0, 40.3],
      [25.0, 40.5],
      [25.5, 39.5],
      [24.5, 38.5],
      [24.0, 38.0],
      [23.5, 37.8],
      [22.5, 38.0],
      [21.5, 38.5],
      [21.0, 39.0],
      [20.5, 39.5],
      [20.0, 40.0],
      [20.5, 40.5],
      [21.5, 40.8],
    ]],
    center: [22.5, 39.5],
  },

  morea: {
    name: "morea",
    displayName: "Morea",
    // Peloponnese peninsula
    coordinates: [[
      [21.5, 38.5],
      [22.5, 38.0],
      [23.5, 37.8],
      [23.2, 37.0],
      [22.8, 36.4],
      [22.0, 36.5],
      [21.5, 36.8],
      [21.2, 37.0],
      [21.0, 37.5],
      [21.2, 38.0],
      [21.5, 38.5],
    ]],
    center: [22.0, 37.4],
  },

  serbia: {
    name: "serbia",
    displayName: "Serbia",
    // Medieval Serbian territories
    coordinates: [[
      [20.0, 44.5],
      [21.5, 44.8],
      [22.5, 44.5],
      [23.0, 44.0],
      [23.5, 42.2],
      [22.0, 41.8],
      [21.8, 41.5],
      [21.0, 42.5],
      [20.5, 43.0],
      [19.5, 43.5],
      [19.0, 44.0],
      [19.5, 44.5],
      [20.0, 44.5],
    ]],
    center: [21.5, 43.2],
  },

  bulgaria: {
    name: "bulgaria",
    displayName: "Bulgaria",
    // Bulgarian territories in 1453
    coordinates: [[
      [22.5, 44.5],
      [25.0, 44.5],
      [27.0, 44.0],
      [28.5, 43.5],
      [28.5, 42.5],
      [28.5, 41.9],
      [27.5, 42.1],
      [26.0, 42.0],
      [24.5, 42.0],
      [23.5, 42.2],
      [23.0, 44.0],
      [22.5, 44.5],
    ]],
    center: [26.0, 43.0],
  },

  bosnia: {
    name: "bosnia",
    displayName: "Bosnia",
    // Medieval Bosnian Kingdom
    coordinates: [[
      [16.0, 45.0],
      [17.5, 45.2],
      [19.0, 44.8],
      [19.5, 44.5],
      [19.0, 44.0],
      [19.5, 43.5],
      [18.5, 42.8],
      [17.5, 42.5],
      [16.5, 43.0],
      [15.5, 44.0],
      [16.0, 45.0],
    ]],
    center: [17.8, 44.0],
  },

  // ==========================================
  // ANATOLIA REGION
  // ==========================================

  bithynia: {
    name: "bithynia",
    displayName: "Bithynia",
    // Northwestern Anatolia (around Bursa)
    coordinates: [[
      [29.1, 40.85],  // Constantinople border
      [29.3, 41.0],
      [30.5, 41.2],
      [31.5, 41.5],
      [32.0, 41.2],
      [31.5, 40.5],
      [30.5, 40.0],
      [29.5, 40.2],
      [28.5, 40.3],
      [29.1, 40.85],
    ]],
    center: [30.2, 40.6],
  },

  anatolia: {
    name: "anatolia",
    displayName: "Anatolia",
    // Central and Eastern Anatolia (Ottoman heartland)
    coordinates: [[
      [32.0, 41.2],
      [34.0, 42.0],
      [36.0, 41.5],
      [38.0, 41.0],
      [40.0, 40.5],
      [42.0, 39.5],
      [42.0, 38.0],
      [40.0, 37.0],
      [38.0, 36.5],
      [36.0, 36.5],
      [34.0, 37.0],
      [32.0, 37.5],
      [30.0, 38.0],
      [29.0, 38.5],
      [29.5, 40.2],
      [30.5, 40.0],
      [31.5, 40.5],
      [32.0, 41.2],
    ]],
    center: [34.0, 39.0],
  },
};

// Color schemes for 1453 scenario
export const CONSTANTINOPLE_COLORS = {
  "Ottoman Empire": {
    primary: "#2E7D32",
    accent: "#FFD700",
    light: "#4CAF50",
    hover: "#1B5E20",
    selected: "#1B5E20",
  },
  "Byzantine Empire": {
    primary: "#7B1FA2",
    accent: "#FFD700",
    light: "#9C27B0",
    hover: "#4A148C",
    selected: "#4A148C",
  },
  Venice: {
    primary: "#1565C0",
    accent: "#FFD700",
    light: "#1976D2",
    hover: "#0D47A1",
    selected: "#0D47A1",
  },
  Genoa: {
    primary: "#C62828",
    accent: "#FFD700",
    light: "#D32F2F",
    hover: "#B71C1C",
    selected: "#B71C1C",
  },
  neutral: {
    primary: "#4B5563",
    accent: "#9CA3AF",
    light: "#6B7280",
    hover: "#374151",
    selected: "#1F2937",
  },
};
