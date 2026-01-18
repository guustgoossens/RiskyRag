import { cn } from "@/lib/utils";

interface TerritoryProps {
  id: string;
  name: string;
  pathData: string;
  ownerColor: string;
  troops: number;
  centroid: { x: number; y: number };
  isSelected: boolean;
  isHighlighted: boolean;
  isAttackable: boolean;
  onSelect: (id: string) => void;
}

export function Territory({
  id,
  name,
  pathData,
  ownerColor,
  troops,
  centroid,
  isSelected,
  isHighlighted,
  isAttackable,
  onSelect,
}: TerritoryProps) {
  return (
    <g
      onClick={() => onSelect(id)}
      className={cn(
        "cursor-pointer transition-all duration-200",
        isSelected && "drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]",
        isHighlighted && "drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
      )}
    >
      {/* Territory Shape */}
      <path
        d={pathData}
        fill={ownerColor}
        stroke={isSelected ? "#fbbf24" : isAttackable ? "#ef4444" : "#1e293b"}
        strokeWidth={isSelected || isAttackable ? 3 : 1.5}
        className={cn(
          "transition-all duration-200",
          "hover:brightness-110",
          isAttackable && "animate-pulse"
        )}
      />

      {/* Troop Count Badge */}
      <g transform={`translate(${centroid.x}, ${centroid.y})`}>
        <circle
          r={16}
          fill="#0f172a"
          stroke={ownerColor}
          strokeWidth={2}
          className="drop-shadow-lg"
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={12}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          {troops}
        </text>
      </g>

      {/* Territory Name (shown on hover) */}
      <title>{name}</title>
    </g>
  );
}
