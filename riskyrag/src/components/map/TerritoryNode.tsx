import { cn } from "@/lib/utils";
import { Crown, User, Cpu } from "lucide-react";

interface TerritoryNodeProps {
  id: string;
  name: string;
  displayName: string;
  x: number;
  y: number;
  troops: number;
  ownerColor: string;
  isCapital?: boolean;
  isSelected?: boolean;
  isAttackSource?: boolean;
  isValidTarget?: boolean;
  isHumanOwned?: boolean;
  isNeutral?: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function TerritoryNode({
  id,
  displayName,
  x,
  y,
  troops,
  ownerColor,
  isCapital,
  isSelected,
  isAttackSource,
  isValidTarget,
  isHumanOwned,
  isNeutral,
  onSelect,
  onHover,
}: TerritoryNodeProps) {
  // Calculate node size - capitals are larger
  const baseRadius = isCapital ? 28 : 22;
  const radius = baseRadius;

  // Determine stroke style based on state
  let strokeColor = "#334155"; // Default slate
  let strokeWidth = 2;
  let glowFilter = "";

  if (isSelected) {
    strokeColor = "#D4AF37"; // Gold
    strokeWidth = 3;
    glowFilter = "url(#goldGlow)";
  } else if (isAttackSource) {
    strokeColor = "#EF4444"; // Red
    strokeWidth = 3;
    glowFilter = "url(#redGlow)";
  } else if (isValidTarget) {
    strokeColor = "#EF4444"; // Red dashed
    strokeWidth = 2;
    glowFilter = "url(#redPulse)";
  }

  return (
    <g
      onClick={() => onSelect(id)}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      className="cursor-pointer"
      style={{ filter: glowFilter }}
    >
      {/* Background circle */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={isNeutral ? "#4B5563" : ownerColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isValidTarget ? "4 2" : "none"}
        className={cn(
          "transition-all duration-200",
          isValidTarget && "animate-pulse"
        )}
      />

      {/* Capital crown indicator */}
      {isCapital && (
        <g transform={`translate(${x - 8}, ${y - radius - 12})`}>
          <Crown size={16} className="fill-yellow-500 stroke-yellow-600" />
        </g>
      )}

      {/* Troop count in center */}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
        fontWeight="bold"
        fill="white"
        className="select-none pointer-events-none font-mono"
      >
        {troops}
      </text>

      {/* Owner indicator icon (small, top-right) */}
      {!isNeutral && (
        <g transform={`translate(${x + radius - 8}, ${y - radius + 8})`}>
          <circle
            cx={0}
            cy={0}
            r={8}
            fill="#0F172A"
            stroke={ownerColor}
            strokeWidth={1}
          />
          <g transform="translate(-5, -5)">
            {isHumanOwned ? (
              <User size={10} className="fill-white stroke-white" />
            ) : (
              <Cpu size={10} className="fill-white stroke-white" />
            )}
          </g>
        </g>
      )}

      {/* Territory name below */}
      <text
        x={x}
        y={y + radius + 14}
        textAnchor="middle"
        fontSize={10}
        fontWeight="500"
        fill={isSelected || isAttackSource ? "#F5E6CC" : "#94A3B8"}
        className="select-none pointer-events-none uppercase tracking-wider"
      >
        {displayName}
      </text>
    </g>
  );
}
