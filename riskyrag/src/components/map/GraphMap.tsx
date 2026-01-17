import { useState } from "react";
import { TerritoryNode } from "./TerritoryNode";
import { ConnectionLine } from "./ConnectionLine";
import {
  CIVIL_WAR_POSITIONS,
  CIVIL_WAR_ADJACENCIES,
  CIVIL_WAR_COLORS,
} from "@/data/maps/civil-war";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface GraphMapProps {
  territories: Doc<"territories">[];
  players: Doc<"players">[];
  onTerritoryClick: (id: Id<"territories">) => void;
  selectedTerritory: Id<"territories"> | null;
  attackSource: Id<"territories"> | null;
  scenario: string;
}

// Map nation names to color schemes
function getNationColors(nation: string) {
  if (nation === "Union") return CIVIL_WAR_COLORS.Union;
  if (nation === "Confederacy") return CIVIL_WAR_COLORS.Confederacy;
  return CIVIL_WAR_COLORS.neutral;
}

export function GraphMap({
  territories,
  players,
  onTerritoryClick,
  selectedTerritory,
  attackSource,
  scenario,
}: GraphMapProps) {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);

  // For Civil War scenario, use the graph-based layout
  const isCivilWar = scenario === "1861";

  // Create lookups
  const playerMap = new Map<Id<"players">, Doc<"players">>();
  for (const player of players) {
    playerMap.set(player._id, player);
  }

  const territoryByName = new Map<string, Doc<"territories">>();
  const territoryById = new Map<Id<"territories">, Doc<"territories">>();
  for (const t of territories) {
    territoryByName.set(t.name, t);
    territoryById.set(t._id, t);
  }

  // Get the attack source territory for highlighting valid targets
  const attackSourceTerritory = attackSource
    ? territoryById.get(attackSource)
    : null;

  // Check if a territory is a valid attack target
  const isValidTarget = (territory: Doc<"territories">) => {
    if (!attackSourceTerritory) return false;
    // Must be adjacent
    if (!attackSourceTerritory.adjacentTo.includes(territory.name)) return false;
    // Must be enemy (different owner or neutral)
    if (territory.ownerId === attackSourceTerritory.ownerId) return false;
    return true;
  };

  // Get owner's color
  const getOwnerColor = (territory: Doc<"territories">) => {
    if (!territory.ownerId) return CIVIL_WAR_COLORS.neutral.primary;
    const owner = playerMap.get(territory.ownerId);
    if (!owner) return CIVIL_WAR_COLORS.neutral.primary;
    const colors = getNationColors(owner.nation);
    return colors.primary;
  };

  // Check if territory is human-owned
  const isHumanOwned = (territory: Doc<"territories">) => {
    if (!territory.ownerId) return false;
    const owner = playerMap.get(territory.ownerId);
    return owner?.isHuman ?? false;
  };

  if (!isCivilWar) {
    // Fallback to the existing node-based visualization for other scenarios
    return (
      <div className="relative w-full aspect-[8/5] max-w-4xl mx-auto p-4 select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Connections */}
          {territories.map((t) =>
            t.adjacentTo.map((neighborName) => {
              const neighbor = territoryByName.get(neighborName);
              if (!neighbor) return null;
              if (t.name > neighborName) return null;
              return (
                <line
                  key={`${t._id}-${neighbor._id}`}
                  x1={t.position.x / 10}
                  y1={t.position.y / 10}
                  x2={neighbor.position.x / 10}
                  y2={neighbor.position.y / 10}
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            })
          )}

          {/* Territory Nodes */}
          {territories.map((t) => {
            const x = t.position.x / 10;
            const y = t.position.y / 10;
            const isSelected = selectedTerritory === t._id;
            const isSource = attackSource === t._id;

            return (
              <g
                key={t._id}
                onClick={() => onTerritoryClick(t._id)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={getOwnerColor(t)}
                  stroke={isSelected || isSource ? "#D4AF37" : "#334155"}
                  strokeWidth={isSelected || isSource ? "1.5" : "0.5"}
                />
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="4"
                  fontWeight="bold"
                  fill="white"
                >
                  {t.troops}
                </text>
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  fontSize="3"
                  fill="#94A3B8"
                  className="uppercase"
                >
                  {t.displayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Civil War Graph Map
  return (
    <div className="relative w-full aspect-[8/5] max-w-4xl mx-auto p-4 select-none">
      <svg viewBox="0 0 800 500" className="w-full h-full drop-shadow-2xl">
        {/* Definitions for filters/gradients */}
        <defs>
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feFlood floodColor="#EF4444" floodOpacity="0.5" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="redPulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#EF4444" floodOpacity="0.3" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Region background gradients */}
          <linearGradient id="unionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(21, 101, 192, 0.15)" />
            <stop offset="100%" stopColor="rgba(21, 101, 192, 0.05)" />
          </linearGradient>
          <linearGradient id="confedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(107, 114, 128, 0.15)" />
            <stop offset="100%" stopColor="rgba(107, 114, 128, 0.05)" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="800" height="500" fill="#0F172A" />

        {/* Subtle region backgrounds */}
        <ellipse
          cx="520"
          cy="120"
          rx="220"
          ry="100"
          fill="url(#unionGradient)"
          opacity="0.5"
        />
        <ellipse
          cx="420"
          cy="360"
          rx="250"
          ry="120"
          fill="url(#confedGradient)"
          opacity="0.5"
        />

        {/* Connection Lines */}
        {CIVIL_WAR_ADJACENCIES.map(([from, to]) => {
          const fromPos = CIVIL_WAR_POSITIONS[from];
          const toPos = CIVIL_WAR_POSITIONS[to];
          if (!fromPos || !toPos) return null;

          const fromTerritory = territoryByName.get(from);
          const toTerritory = territoryByName.get(to);

          // Check if this is an attack path
          const isAttackPath =
            attackSourceTerritory &&
            ((attackSourceTerritory.name === from &&
              toTerritory &&
              isValidTarget(toTerritory)) ||
              (attackSourceTerritory.name === to &&
                fromTerritory &&
                isValidTarget(fromTerritory)));

          return (
            <ConnectionLine
              key={`${from}-${to}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              isAttackPath={isAttackPath ?? false}
            />
          );
        })}

        {/* Territory Nodes */}
        {territories.map((territory) => {
          const position = CIVIL_WAR_POSITIONS[territory.name];
          if (!position) return null;

          const isSelected = selectedTerritory === territory._id;
          const isSource = attackSource === territory._id;
          const validTarget = isValidTarget(territory);

          return (
            <TerritoryNode
              key={territory._id}
              id={territory._id}
              name={territory.name}
              displayName={territory.displayName}
              x={position.x}
              y={position.y}
              troops={territory.troops}
              ownerColor={getOwnerColor(territory)}
              isCapital={position.isCapital ?? false}
              isSelected={isSelected}
              isAttackSource={isSource}
              isValidTarget={validTarget}
              isHumanOwned={isHumanOwned(territory)}
              isNeutral={!territory.ownerId}
              onSelect={() => onTerritoryClick(territory._id)}
              onHover={setHoveredTerritory}
            />
          );
        })}

        {/* Map Title */}
        <text
          x="400"
          y="25"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={14}
          fontWeight="600"
          className="uppercase tracking-widest"
        >
          American Civil War - 1861
        </text>

        {/* Legend */}
        <g transform="translate(20, 440)">
          <rect
            x="0"
            y="0"
            width="180"
            height="50"
            rx="4"
            fill="#0F172A"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.9"
          />
          <text x="10" y="18" fill="#94A3B8" fontSize={10} fontWeight="600">
            NATIONS
          </text>
          {/* Union */}
          <circle cx="20" cy="35" r="6" fill={CIVIL_WAR_COLORS.Union.primary} />
          <text x="32" y="38" fill="#E2E8F0" fontSize={10}>
            Union
          </text>
          {/* Confederacy */}
          <circle cx="90" cy="35" r="6" fill={CIVIL_WAR_COLORS.Confederacy.primary} />
          <text x="102" y="38" fill="#E2E8F0" fontSize={10}>
            Confederacy
          </text>
        </g>

        {/* Hovered territory tooltip */}
        {hoveredTerritory && (
          <g
            transform={`translate(${CIVIL_WAR_POSITIONS[hoveredTerritory]?.x ?? 0}, ${(CIVIL_WAR_POSITIONS[hoveredTerritory]?.y ?? 0) - 50})`}
          >
            <rect
              x="-60"
              y="-20"
              width="120"
              height="25"
              rx="4"
              fill="#1E293B"
              stroke="#475569"
              strokeWidth="1"
            />
            <text x="0" y="-5" textAnchor="middle" fill="#E2E8F0" fontSize={11}>
              {territoryByName.get(hoveredTerritory)?.region ?? hoveredTerritory}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
