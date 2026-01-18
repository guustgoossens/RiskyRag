import { useEffect, useRef, useState, useCallback } from "react";
import OLMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import { Style, Fill, Stroke, Text } from "ol/style";
import { fromLonLat } from "ol/proj";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CIVIL_WAR_BOUNDARIES } from "@/data/maps/civil-war-boundaries";
import { CONSTANTINOPLE_BOUNDARIES } from "@/data/maps/constantinople-boundaries";
import "ol/ol.css";

// Scenario-specific map configurations
// All scenarios use polygon boundaries as the default standard
const MAP_CONFIGS: Record<
  string,
  {
    center: [number, number];
    zoom: number;
    // Primary historical map layer
    tileUrl: string;
    attribution: string;
    // Background/fallback layer
    fallbackUrl: string;
  }
> = {
  "1861": {
    center: [-85, 36],
    zoom: 4.8,
    // ESRI World Physical Map - shows terrain without modern borders
    // Historically appropriate as it shows only physical geography
    tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
    fallbackUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
  },
  "1453": {
    center: [26, 40],
    zoom: 5.2,
    // Stamen Watercolor for an antique painted look appropriate for medieval era
    tileUrl: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
    attribution: "Map tiles by Stamen Design, under CC BY 3.0.",
    fallbackUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
  },
};

// Get boundaries data for a scenario
function getBoundariesForScenario(scenario: string): Record<string, { coordinates: [number, number][][]; center: [number, number]; displayName: string; isCapital?: boolean }> {
  switch (scenario) {
    case "1861":
      return CIVIL_WAR_BOUNDARIES;
    case "1453":
      return CONSTANTINOPLE_BOUNDARIES;
    default:
      return CIVIL_WAR_BOUNDARIES;
  }
}

// Fallback tile URL for base map layer
const FALLBACK_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}";

// Color schemes matching the existing game - with fill opacity for polygons
const NATION_COLORS: Record<string, { fill: string; stroke: string; hover: string; selected: string }> = {
  // Civil War
  Union: {
    fill: "rgba(21, 101, 192, 0.6)",
    stroke: "#1565C0",
    hover: "rgba(21, 101, 192, 0.8)",
    selected: "rgba(13, 71, 161, 0.85)",
  },
  Confederacy: {
    fill: "rgba(107, 114, 128, 0.6)",
    stroke: "#6B7280",
    hover: "rgba(107, 114, 128, 0.8)",
    selected: "rgba(75, 85, 99, 0.85)",
  },
  // Constantinople 1453
  "Ottoman Empire": {
    fill: "rgba(46, 125, 50, 0.6)",
    stroke: "#2E7D32",
    hover: "rgba(46, 125, 50, 0.8)",
    selected: "rgba(27, 94, 32, 0.85)",
  },
  "Byzantine Empire": {
    fill: "rgba(123, 31, 162, 0.6)",
    stroke: "#7B1FA2",
    hover: "rgba(123, 31, 162, 0.8)",
    selected: "rgba(74, 20, 140, 0.85)",
  },
  Venice: {
    fill: "rgba(25, 118, 210, 0.6)",
    stroke: "#1976D2",
    hover: "rgba(25, 118, 210, 0.8)",
    selected: "rgba(13, 71, 161, 0.85)",
  },
  Genoa: {
    fill: "rgba(198, 40, 40, 0.6)",
    stroke: "#C62828",
    hover: "rgba(198, 40, 40, 0.8)",
    selected: "rgba(183, 28, 28, 0.85)",
  },
  // Fallback
  neutral: {
    fill: "rgba(75, 85, 99, 0.5)",
    stroke: "#4B5563",
    hover: "rgba(75, 85, 99, 0.7)",
    selected: "rgba(55, 65, 81, 0.8)",
  },
};

interface OpenLayersMapProps {
  territories: Doc<"territories">[];
  players: Doc<"players">[];
  onTerritoryClick: (id: Id<"territories">) => void;
  selectedTerritory: Id<"territories"> | null;
  attackSource: Id<"territories"> | null;
  scenario: string;
}

export function OpenLayersMap({
  territories,
  players,
  onTerritoryClick,
  selectedTerritory,
  attackSource,
  scenario,
}: OpenLayersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const [hoveredTerritoryId, setHoveredTerritoryId] = useState<string | null>(null);

  // Get boundaries for current scenario
  const boundaries = getBoundariesForScenario(scenario);

  // Create player lookup
  const playerLookup = new globalThis.Map<Id<"players">, Doc<"players">>();
  for (const player of players) {
    playerLookup.set(player._id, player);
  }

  // Create territory lookups
  const territoryByName = new globalThis.Map<string, Doc<"territories">>();
  const territoryById = new globalThis.Map<Id<"territories">, Doc<"territories">>();
  for (const t of territories) {
    territoryByName.set(t.name, t);
    territoryById.set(t._id, t);
  }

  // Get attack source territory
  const attackSourceTerritory = attackSource ? territoryById.get(attackSource) : null;

  // Check if territory is valid attack target
  const isValidTarget = useCallback(
    (territory: Doc<"territories">) => {
      if (!attackSourceTerritory) return false;
      if (!attackSourceTerritory.adjacentTo.includes(territory.name)) return false;
      if (territory.ownerId === attackSourceTerritory.ownerId) return false;
      return true;
    },
    [attackSourceTerritory]
  );

  // Get owner's colors for polygon fill/stroke
  const getOwnerColors = useCallback(
    (territory: Doc<"territories">) => {
      if (!territory.ownerId) return NATION_COLORS.neutral;
      const owner = playerLookup.get(territory.ownerId);
      if (!owner) return NATION_COLORS.neutral;
      return NATION_COLORS[owner.nation] || NATION_COLORS.neutral;
    },
    [playerLookup]
  );

  // Convert polygon coordinates to map projection
  const convertCoordinates = useCallback((coords: [number, number][][]): number[][][] => {
    return coords.map((ring) => ring.map((coord) => fromLonLat(coord) as [number, number]));
  }, []);

  // Create style for territory polygon
  const createPolygonStyle = useCallback(
    (
      territory: Doc<"territories">,
      displayName: string,
      isHovered: boolean,
      isSelected: boolean,
      isSource: boolean,
      isTarget: boolean
    ): Style[] => {
      const colors = getOwnerColors(territory);

      // Determine fill color based on state
      let fillColor = colors.fill;
      if (isSource) {
        fillColor = "rgba(239, 68, 68, 0.7)"; // Red for attack source
      } else if (isSelected) {
        fillColor = colors.selected;
      } else if (isHovered) {
        fillColor = colors.hover;
      } else if (isTarget) {
        fillColor = "rgba(239, 68, 68, 0.5)"; // Light red for valid target
      }

      // Determine stroke style
      let strokeColor = colors.stroke;
      let strokeWidth = 2;
      let strokeDash: number[] | undefined;

      if (isSource) {
        strokeColor = "#DC2626";
        strokeWidth = 4;
      } else if (isSelected) {
        strokeColor = "#D4AF37"; // Gold
        strokeWidth = 4;
      } else if (isTarget) {
        strokeColor = "#EF4444";
        strokeWidth = 3;
        strokeDash = [10, 5];
      } else if (isHovered) {
        strokeColor = "#F5E6CC";
        strokeWidth = 3;
      }

      // Polygon fill and stroke style
      const polygonStyle = new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({
          color: strokeColor,
          width: strokeWidth,
          lineDash: strokeDash,
        }),
      });

      // Territory name label
      const labelStyle = new Style({
        text: new Text({
          text: displayName,
          font: `${isHovered || isSelected ? "bold 13px" : "12px"} sans-serif`,
          fill: new Fill({ color: "#FFFFFF" }),
          stroke: new Stroke({ color: "#000000", width: 4 }),
          overflow: true,
          offsetY: -8,
        }),
      });

      // Troop count
      const troopStyle = new Style({
        text: new Text({
          text: `⚔ ${territory.troops}`,
          font: "bold 14px monospace",
          fill: new Fill({ color: "#FFD700" }),
          stroke: new Stroke({ color: "#000000", width: 4 }),
          offsetY: 10,
        }),
      });

      return [polygonStyle, labelStyle, troopStyle];
    },
    [getOwnerColors]
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const config = MAP_CONFIGS[scenario] || MAP_CONFIGS["1861"];

    // Create tile layer with historical map
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: config.tileUrl,
        attributions: config.attribution,
        crossOrigin: "anonymous",
      }),
      opacity: 0.7,
    });

    // Fallback tile layer
    const fallbackLayer = new TileLayer({
      source: new XYZ({
        url: FALLBACK_TILE_URL,
        crossOrigin: "anonymous",
      }),
      opacity: 0.5,
    });

    // Territory polygons layer
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 2,
    });

    // Create map
    const map = new OLMap({
      target: mapRef.current,
      layers: [fallbackLayer, tileLayer, vectorLayer],
      view: new View({
        center: fromLonLat(config.center),
        zoom: config.zoom,
        minZoom: 3,
        maxZoom: 10,
      }),
      controls: [],
    });

    mapInstanceRef.current = map;

    // Handle pointer move for hover
    map.on("pointermove", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (layer) => layer === vectorLayer,
      });

      if (feature) {
        const territoryId = feature.get("territoryId");
        if (territoryId !== hoveredTerritoryId) {
          setHoveredTerritoryId(territoryId);
        }
        map.getTargetElement().style.cursor = "pointer";
      } else {
        if (hoveredTerritoryId !== null) {
          setHoveredTerritoryId(null);
        }
        map.getTargetElement().style.cursor = "";
      }
    });

    // Handle click
    map.on("click", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (layer) => layer === vectorLayer,
      });

      if (feature) {
        const territoryId = feature.get("territoryId") as Id<"territories">;
        if (territoryId) {
          onTerritoryClick(territoryId);
        }
      }
    });

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [scenario]);

  // Update features when data changes
  useEffect(() => {
    const vectorSource = vectorSourceRef.current;
    if (!vectorSource) return;

    // Clear existing features
    vectorSource.clear();

    // Add territory polygons
    for (const territory of territories) {
      const boundaryData = boundaries[territory.name];
      if (!boundaryData) {
        console.warn(`No boundary data for territory: ${territory.name}`);
        continue;
      }

      const isHovered = hoveredTerritoryId === territory._id;
      const isSelected = selectedTerritory === territory._id;
      const isSource = attackSource === territory._id;
      const isTarget = isValidTarget(territory);

      // Convert coordinates and create polygon
      const convertedCoords = convertCoordinates(boundaryData.coordinates);
      const polygon = new Polygon(convertedCoords);

      const feature = new Feature({
        geometry: polygon,
        territoryId: territory._id,
        name: territory.name,
      });

      // Apply polygon style
      feature.setStyle(
        createPolygonStyle(
          territory,
          boundaryData.displayName,
          isHovered,
          isSelected,
          isSource,
          isTarget
        )
      );

      vectorSource.addFeature(feature);
    }
  }, [
    territories,
    players,
    selectedTerritory,
    attackSource,
    hoveredTerritoryId,
    boundaries,
    convertCoordinates,
    createPolygonStyle,
    isValidTarget,
  ]);

  // Get scenario title
  const scenarioTitle =
    scenario === "1861"
      ? "American Civil War - 1861"
      : scenario === "1453"
        ? "Fall of Constantinople - 1453"
        : `Scenario ${scenario}`;

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-slate-900">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Title Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-4 py-2">
          <h2 className="text-sm font-cinzel font-semibold text-slate-300 uppercase tracking-widest">
            {scenarioTitle}
          </h2>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Nations
          </h3>
          <div className="flex flex-wrap gap-3">
            {players.map((player) => {
              const colors = NATION_COLORS[player.nation] || NATION_COLORS.neutral;
              return (
                <div key={player._id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor: colors.fill,
                      borderColor: colors.stroke,
                    }}
                  />
                  <span className="text-xs text-slate-300">{player.nation}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hovered Territory Tooltip */}
      {hoveredTerritoryId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-slate-800/95 border border-slate-600 rounded-lg px-3 py-2 shadow-xl">
            <span className="text-sm text-slate-200">
              {territoryById.get(hoveredTerritoryId as Id<"territories">)?.region}
            </span>
          </div>
        </div>
      )}

      {/* Custom CSS for OpenLayers */}
      <style>{`
        .ol-viewport {
          border-radius: 0.75rem;
        }
      `}</style>
    </div>
  );
}
