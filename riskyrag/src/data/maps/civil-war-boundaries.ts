/**
 * Civil War Territory Boundaries (1863-1865)
 * GeoJSON-style polygon coordinates for each territory
 * Coordinates are [longitude, latitude] pairs
 * 
 * These are simplified approximations of real US state boundaries
 * as they existed during the Civil War period (post-West Virginia statehood, June 1863)
 */

export interface TerritoryBoundary {
  name: string;
  displayName: string;
  // Polygon coordinates: array of [lon, lat] rings (first ring is outer boundary)
  coordinates: [number, number][][];
  // Center point for label placement
  center: [number, number];
  // Optional capital marker
  isCapital?: boolean;
}

export const CIVIL_WAR_BOUNDARIES: Record<string, TerritoryBoundary> = {
  // ==========================================
  // UNION CORE
  // ==========================================
  
  new_england: {
    name: "new_england",
    displayName: "New England",
    // Maine, New Hampshire, Vermont, Massachusetts, Rhode Island, Connecticut
    coordinates: [[
      [-73.5, 45.0],   // Vermont-Canada border
      [-71.5, 45.3],   // NH-Canada
      [-70.7, 45.4],   // Maine border
      [-67.0, 45.2],   // Maine-Canada NE
      [-66.9, 44.8],   // Maine coast
      [-67.2, 44.3],
      [-68.0, 44.4],
      [-69.0, 43.8],
      [-70.2, 43.6],   // Southern Maine coast
      [-70.8, 42.9],   // Mass coast
      [-70.5, 41.8],   // Cape Cod
      [-71.2, 41.5],   // Rhode Island
      [-72.0, 41.2],   // Connecticut coast
      [-73.6, 41.0],   // CT-NY border
      [-73.5, 42.0],   // Mass-NY
      [-73.3, 42.7],   // Vermont border
      [-73.5, 45.0],   // Close polygon
    ]],
    center: [-71.5, 43.0],
  },

  new_york: {
    name: "new_york",
    displayName: "New York",
    coordinates: [[
      [-79.8, 43.0],   // Lake Erie
      [-79.0, 43.2],   // Niagara
      [-76.8, 43.6],   // Lake Ontario
      [-76.2, 44.0],
      [-75.0, 44.8],   // St. Lawrence
      [-74.7, 45.0],   // Canada border
      [-73.4, 45.0],   // Vermont border
      [-73.3, 42.7],
      [-73.5, 42.0],   // Mass border
      [-73.6, 41.0],   // CT border
      [-74.2, 40.5],   // NYC area
      [-74.0, 40.5],   // Staten Island
      [-74.2, 39.8],   // NJ border (slight overlap for visibility)
      [-75.0, 39.9],
      [-75.5, 40.0],
      [-76.0, 40.5],
      [-77.0, 41.0],
      [-79.8, 42.0],   // PA border
      [-79.8, 43.0],   // Close
    ]],
    center: [-75.5, 42.8],
  },

  pennsylvania: {
    name: "pennsylvania",
    displayName: "Pennsylvania",
    coordinates: [[
      [-80.5, 42.0],   // NW corner
      [-79.8, 42.0],   // NY border
      [-77.0, 41.0],
      [-75.5, 40.0],
      [-75.0, 39.9],   // Delaware River
      [-74.8, 40.1],
      [-75.0, 40.4],
      [-75.1, 40.0],
      [-75.5, 39.8],   // SE corner
      [-76.0, 39.7],   // MD border
      [-77.5, 39.7],
      [-78.0, 39.6],
      [-79.5, 39.7],
      [-80.5, 39.7],   // WV border
      [-80.5, 40.6],
      [-80.5, 42.0],   // Close
    ]],
    center: [-77.5, 40.8],
  },

  ohio_valley: {
    name: "ohio_valley",
    displayName: "Ohio Valley",
    // Ohio + Indiana
    coordinates: [[
      [-84.8, 41.7],   // Michigan border
      [-83.5, 41.7],
      [-82.5, 41.7],   // Lake Erie
      [-80.5, 42.0],   // PA border
      [-80.5, 40.6],
      [-80.5, 39.7],   // WV border
      [-81.0, 39.5],
      [-82.0, 38.5],
      [-83.0, 38.7],   // Kentucky border (Ohio River)
      [-84.0, 38.8],
      [-85.0, 39.1],   // Indiana-Kentucky
      [-85.5, 39.0],
      [-88.0, 38.0],   // SW Indiana
      [-87.5, 39.0],
      [-87.5, 41.7],   // Illinois border
      [-84.8, 41.7],   // Close
    ]],
    center: [-83.5, 40.0],
  },

  great_lakes: {
    name: "great_lakes",
    displayName: "Great Lakes",
    // Michigan, Wisconsin, Minnesota, Illinois (upper)
    coordinates: [[
      [-97.0, 49.0],   // Minnesota-Canada
      [-95.0, 49.0],
      [-92.0, 48.5],   // Lake Superior
      [-90.0, 47.0],
      [-87.5, 45.5],   // Upper Michigan
      [-85.0, 45.8],
      [-84.5, 45.0],
      [-83.5, 44.0],   // Lower Michigan
      [-82.5, 43.0],
      [-82.5, 41.7],   // Lake Erie
      [-84.8, 41.7],   // Ohio border
      [-87.5, 41.7],   // Indiana border
      [-87.8, 42.5],   // Chicago
      [-90.0, 42.5],   // Wisconsin
      [-91.0, 43.5],
      [-92.0, 44.5],
      [-94.0, 46.5],
      [-97.0, 46.5],   // Minnesota-Dakota border
      [-97.0, 49.0],   // Close
    ]],
    center: [-88.0, 44.0],
  },

  washington_dc: {
    name: "washington_dc",
    displayName: "Washington D.C.",
    // Small diamond/square for DC
    coordinates: [[
      [-77.2, 39.0],
      [-76.9, 38.85],
      [-77.2, 38.7],
      [-77.5, 38.85],
      [-77.2, 39.0],
    ]],
    center: [-77.1, 38.9],
    isCapital: true,
  },

  // ==========================================
  // BORDER STATES
  // ==========================================

  maryland: {
    name: "maryland",
    displayName: "Maryland",
    // Maryland + Delaware
    coordinates: [[
      [-79.5, 39.7],   // WV border
      [-78.0, 39.6],
      [-77.5, 39.7],
      [-76.0, 39.7],   // PA border
      [-75.5, 39.8],
      [-75.1, 40.0],   // Delaware
      [-75.5, 39.4],
      [-75.0, 38.4],   // Delaware Bay
      [-76.0, 37.9],   // Eastern Shore
      [-76.3, 38.5],
      [-76.0, 39.0],
      [-76.5, 39.2],
      [-77.2, 39.0],   // DC border (exclude DC)
      [-77.5, 38.85],
      [-77.2, 38.7],
      [-76.9, 38.85],
      [-77.2, 39.0],
      [-77.7, 39.0],
      [-78.0, 39.2],
      [-79.0, 39.3],
      [-79.5, 39.5],
      [-79.5, 39.7],   // Close
    ]],
    center: [-76.8, 39.2],
  },

  west_virginia: {
    name: "west_virginia",
    displayName: "West Virginia",
    // West Virginia (statehood June 20, 1863)
    coordinates: [[
      [-80.5, 40.6],   // PA border
      [-80.5, 39.7],
      [-79.5, 39.7],
      [-79.5, 39.5],
      [-79.0, 39.3],
      [-78.0, 39.2],
      [-77.7, 39.0],
      [-77.8, 38.5],
      [-78.5, 38.0],
      [-79.0, 37.5],
      [-80.0, 37.3],   // Virginia border
      [-80.5, 37.5],
      [-81.0, 37.3],
      [-81.7, 37.2],
      [-82.3, 37.5],
      [-82.5, 38.0],
      [-82.0, 38.5],
      [-81.0, 39.5],   // Ohio River
      [-80.5, 39.7],
      [-80.5, 40.6],   // Close
    ]],
    center: [-80.0, 38.6],
  },

  kentucky: {
    name: "kentucky",
    displayName: "Kentucky",
    coordinates: [[
      [-82.5, 38.0],   // WV/VA border
      [-82.3, 37.5],
      [-83.0, 36.6],   // Tennessee border
      [-84.0, 36.6],
      [-86.0, 36.6],
      [-88.0, 36.5],
      [-89.0, 36.5],   // Missouri border
      [-89.2, 37.0],   // Mississippi River
      [-88.5, 37.5],
      [-88.0, 38.0],
      [-87.5, 38.2],
      [-86.5, 38.0],
      [-85.5, 39.0],   // Ohio River
      [-85.0, 39.1],
      [-84.0, 38.8],
      [-83.0, 38.7],
      [-82.0, 38.5],
      [-82.5, 38.0],   // Close
    ]],
    center: [-85.5, 37.8],
  },

  missouri: {
    name: "missouri",
    displayName: "Missouri",
    coordinates: [[
      [-95.8, 40.5],   // NW corner
      [-91.5, 40.5],   // Iowa border
      [-91.0, 40.3],
      [-91.2, 39.8],
      [-90.3, 39.3],   // Illinois border
      [-90.2, 38.9],
      [-90.0, 38.3],
      [-89.2, 37.0],
      [-89.0, 36.5],   // Arkansas border
      [-90.0, 36.0],
      [-90.5, 36.0],
      [-94.6, 36.5],   // Oklahoma/Indian Territory
      [-94.6, 37.0],
      [-95.0, 37.5],
      [-95.5, 39.0],
      [-95.8, 39.5],
      [-95.8, 40.5],   // Close
    ]],
    center: [-92.5, 38.5],
  },

  // ==========================================
  // CONFEDERATE CORE
  // ==========================================

  virginia: {
    name: "virginia",
    displayName: "Virginia",
    // Virginia (reduced after WV secession)
    coordinates: [[
      [-77.8, 38.5],   // DC area
      [-77.2, 38.7],   // DC border
      [-76.9, 38.85],
      [-77.2, 39.0],
      [-77.7, 39.0],
      [-78.0, 39.2],   // MD border
      [-78.5, 38.0],
      [-79.0, 37.5],
      [-80.0, 37.3],   // WV border
      [-80.5, 37.5],
      [-81.0, 37.3],
      [-81.7, 37.2],
      [-83.0, 36.6],   // Tennessee/Kentucky corner
      [-82.0, 36.6],
      [-81.5, 36.6],   // NC border
      [-80.0, 36.5],
      [-78.0, 36.5],
      [-76.0, 36.6],   // NC coastal border
      [-75.5, 37.0],   // Eastern Shore
      [-75.8, 37.5],
      [-76.0, 37.9],
      [-76.3, 38.0],
      [-76.5, 38.3],
      [-77.0, 38.4],
      [-77.8, 38.5],   // Close
    ]],
    center: [-78.5, 37.5],
    isCapital: true,  // Richmond
  },

  tennessee: {
    name: "tennessee",
    displayName: "Tennessee",
    coordinates: [[
      [-83.0, 36.6],   // Virginia corner
      [-82.0, 36.6],
      [-81.5, 36.6],   // NC border
      [-84.0, 35.0],   // Georgia border
      [-85.5, 35.0],
      [-88.0, 35.0],
      [-90.0, 35.0],   // Mississippi border
      [-90.0, 35.5],
      [-89.7, 36.0],   // Missouri boot heel
      [-89.0, 36.5],
      [-88.0, 36.5],
      [-86.0, 36.6],
      [-84.0, 36.6],   // Kentucky border
      [-83.0, 36.6],   // Close
    ]],
    center: [-86.0, 35.8],
  },

  carolinas: {
    name: "carolinas",
    displayName: "The Carolinas",
    // North Carolina + South Carolina
    coordinates: [[
      [-76.0, 36.6],   // Virginia border
      [-75.5, 36.2],   // Outer Banks
      [-75.5, 35.5],
      [-76.0, 34.5],
      [-77.5, 34.0],
      [-78.5, 33.8],   // SC coast
      [-79.5, 33.0],
      [-80.5, 32.5],
      [-81.0, 32.0],   // Georgia border
      [-81.5, 32.5],
      [-82.0, 33.5],
      [-83.0, 34.5],
      [-83.5, 35.0],
      [-84.0, 35.0],   // TN/GA corner
      [-81.5, 36.6],   // NC-TN border
      [-80.0, 36.5],
      [-78.0, 36.5],
      [-76.0, 36.6],   // Close
    ]],
    center: [-80.0, 34.8],
  },

  deep_south: {
    name: "deep_south",
    displayName: "Deep South",
    // Georgia + Alabama
    coordinates: [[
      [-81.0, 32.0],   // SC border
      [-80.8, 31.5],   // Coast
      [-81.0, 30.7],   // Florida border
      [-82.0, 30.5],
      [-84.0, 30.5],
      [-85.0, 30.0],   // Florida panhandle
      [-86.5, 30.3],
      [-88.0, 30.2],   // Alabama coast
      [-88.5, 30.5],   // Mississippi border
      [-88.3, 31.0],
      [-88.2, 33.0],
      [-88.0, 35.0],   // Tennessee border
      [-86.5, 35.0],
      [-85.5, 35.0],
      [-84.0, 35.0],   // GA-TN border
      [-83.5, 35.0],
      [-83.0, 34.5],
      [-82.0, 33.5],
      [-81.5, 32.5],
      [-81.0, 32.0],   // Close
    ]],
    center: [-84.5, 33.0],
  },

  gulf_coast: {
    name: "gulf_coast",
    displayName: "Gulf Coast",
    // Louisiana (East) + Florida panhandle
    coordinates: [[
      [-88.0, 30.2],   // Alabama border
      [-86.5, 30.3],
      [-85.0, 30.0],   // Florida panhandle
      [-84.0, 30.0],
      [-83.5, 29.5],
      [-85.0, 29.0],   // Gulf coast
      [-87.0, 29.5],
      [-88.5, 29.0],
      [-89.5, 29.0],
      [-89.5, 29.5],   // Mississippi River delta
      [-90.5, 29.2],
      [-91.5, 29.5],
      [-92.0, 29.8],   // Louisiana coast
      [-93.5, 30.0],
      [-94.0, 30.0],   // Texas border
      [-94.0, 31.0],
      [-93.5, 31.5],
      [-91.5, 31.0],
      [-91.0, 31.5],
      [-89.8, 32.5],   // Mississippi border
      [-88.8, 32.0],
      [-88.5, 30.5],
      [-88.0, 30.2],   // Close
    ]],
    center: [-89.0, 30.5],
  },

  mississippi_valley: {
    name: "mississippi_valley",
    displayName: "Mississippi Valley",
    // Mississippi state
    coordinates: [[
      [-88.2, 33.0],   // Alabama border
      [-88.3, 31.0],
      [-88.5, 30.5],
      [-88.8, 32.0],
      [-89.8, 32.5],
      [-91.0, 31.5],
      [-91.5, 31.0],   // Louisiana border
      [-91.2, 32.0],
      [-91.0, 33.0],
      [-91.0, 34.0],
      [-90.5, 35.0],   // Tennessee border
      [-90.0, 35.0],
      [-90.0, 35.5],
      [-89.7, 36.0],
      [-88.0, 35.0],
      [-88.2, 33.0],   // Close
    ]],
    center: [-89.6, 33.0],
  },

  arkansas: {
    name: "arkansas",
    displayName: "Arkansas",
    coordinates: [[
      [-89.7, 36.0],   // Missouri boot
      [-89.0, 36.5],
      [-90.0, 36.0],
      [-90.5, 36.0],   // Missouri border
      [-94.5, 36.5],   // Oklahoma border
      [-94.5, 35.5],
      [-94.5, 34.5],
      [-94.3, 33.5],   // Louisiana border
      [-93.5, 33.0],
      [-91.5, 33.0],
      [-91.2, 32.0],   // Louisiana
      [-91.0, 33.0],
      [-91.0, 34.0],
      [-90.5, 35.0],   // Mississippi border
      [-90.0, 35.5],
      [-89.7, 36.0],   // Close
    ]],
    center: [-92.5, 34.8],
  },

  texas: {
    name: "texas",
    displayName: "Texas",
    coordinates: [[
      [-94.0, 31.0],   // Louisiana border
      [-94.0, 30.0],
      [-93.5, 30.0],
      [-93.5, 29.5],   // Gulf coast
      [-95.0, 29.0],
      [-96.5, 28.5],
      [-97.5, 26.0],   // Rio Grande
      [-99.0, 26.5],
      [-100.0, 28.0],
      [-101.0, 29.5],
      [-103.0, 29.5],
      [-104.0, 29.5],
      [-106.5, 31.5],   // El Paso
      [-106.5, 32.0],   // New Mexico border
      [-103.0, 32.0],
      [-103.0, 36.5],   // Oklahoma panhandle
      [-100.0, 36.5],
      [-100.0, 34.5],
      [-99.5, 34.0],
      [-98.0, 34.0],
      [-96.5, 33.5],
      [-94.5, 33.5],   // Arkansas border
      [-94.5, 34.5],
      [-94.3, 33.5],
      [-93.5, 33.0],   // Louisiana corner
      [-94.0, 32.5],
      [-94.0, 31.0],   // Close
    ]],
    center: [-99.0, 31.5],
  },
};

// Color schemes (same as before)
export const CIVIL_WAR_COLORS = {
  Union: {
    primary: "#1565C0",
    accent: "#FFD700",
    light: "#42A5F5",
    hover: "#1976D2",
    selected: "#0D47A1",
  },
  Confederacy: {
    primary: "#6B7280",
    accent: "#DC2626",
    light: "#9CA3AF",
    hover: "#4B5563",
    selected: "#374151",
  },
  neutral: {
    primary: "#4B5563",
    accent: "#9CA3AF",
    light: "#6B7280",
    hover: "#374151",
    selected: "#1F2937",
  },
};
