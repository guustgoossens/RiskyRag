import { useState, useCallback } from "react";
import { Territory } from "./Territory";
import type { Territory as TerritoryType, Player } from "@/types";

interface GameMapProps {
  territories: TerritoryType[];
  players: Player[];
  selectedTerritoryId: string | null;
  attackableTerritoryIds: string[];
  onSelectTerritory: (id: string | null) => void;
  onAttack?: (from: string, to: string) => void;
}

// Placeholder map data for 1453 Constantinople scenario
// This would be replaced with actual SVG path data
const PLACEHOLDER_TERRITORIES = [
  {
    _id: "constantinople",
    name: "Constantinople",
    pathData: "M 400 200 L 450 180 L 480 210 L 470 250 L 420 260 L 390 230 Z",
    centroid: { x: 435, y: 220 },
  },
  {
    _id: "anatolia",
    name: "Anatolia",
    pathData: "M 480 210 L 550 190 L 600 230 L 580 290 L 500 280 L 470 250 Z",
    centroid: { x: 530, y: 240 },
  },
  {
    _id: "thrace",
    name: "Thrace",
    pathData: "M 350 180 L 400 200 L 390 230 L 340 240 L 310 210 Z",
    centroid: { x: 358, y: 210 },
  },
  {
    _id: "greece",
    name: "Greece",
    pathData: "M 300 250 L 340 240 L 380 280 L 360 340 L 300 330 L 280 280 Z",
    centroid: { x: 325, y: 290 },
  },
  {
    _id: "balkans",
    name: "Balkans",
    pathData: "M 280 160 L 350 180 L 340 240 L 300 250 L 250 220 L 260 170 Z",
    centroid: { x: 300, y: 200 },
  },
];

function getPlayerColor(playerId: string, players: Player[]): string {
  const player = players.find((p) => p._id === playerId);
  return player?.color ?? "#475569";
}

export function GameMap({
  territories,
  players,
  selectedTerritoryId,
  attackableTerritoryIds,
  onSelectTerritory,
}: GameMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use placeholder data if no territories provided
  const displayTerritories =
    territories.length > 0
      ? territories
      : PLACEHOLDER_TERRITORIES.map((t) => ({
          ...t,
          gameId: "placeholder",
          owner: "ottoman",
          troops: Math.floor(Math.random() * 10) + 1,
          adjacentTo: [],
        }));

  const handleSelect = useCallback(
    (id: string) => {
      if (selectedTerritoryId === id) {
        onSelectTerritory(null);
      } else {
        onSelectTerritory(id);
      }
    },
    [selectedTerritoryId, onSelectTerritory]
  );

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden">
      {/* Map Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('/textures/parchment.png')`,
          backgroundSize: "cover",
        }}
      />

      {/* SVG Map */}
      <svg
        viewBox="0 0 800 500"
        className="w-full h-full"
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* Background sea */}
        <rect x="0" y="0" width="800" height="500" fill="#1e3a5f" />

        {/* Territories */}
        {displayTerritories.map((territory) => (
          <Territory
            key={territory._id}
            id={territory._id}
            name={territory.name}
            pathData={territory.pathData ?? ""}
            ownerColor={getPlayerColor(territory.owner, players)}
            troops={territory.troops}
            centroid={territory.centroid ?? { x: 0, y: 0 }}
            isSelected={selectedTerritoryId === territory._id}
            isHighlighted={hoveredId === territory._id}
            isAttackable={attackableTerritoryIds.includes(territory._id)}
            onSelect={handleSelect}
          />
        ))}

        {/* Map decorations */}
        <text x="400" y="30" textAnchor="middle" fill="#94a3b8" fontSize={14}>
          Mediterranean Region - 1453
        </text>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-slate-400 mb-2 font-semibold">Nations</div>
        <div className="space-y-1">
          {players.map((player) => (
            <div key={player._id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="text-xs text-slate-300">{player.nation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
