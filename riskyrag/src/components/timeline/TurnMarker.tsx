/**
 * TurnMarker - Individual turn marker in the timeline
 * Shows turn number with nation color and activity indicators
 */

import { cn } from "@/lib/utils";
import type { TurnData } from "@/hooks/useTurnTimeline";
import { getTurnSummary } from "@/hooks/useTurnTimeline";
import { Swords, MessageCircle, BookOpen, Flag } from "lucide-react";

interface TurnMarkerProps {
  turnData: TurnData;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

// Map nation names to colors
const NATION_COLORS: Record<string, string> = {
  "Ottoman Empire": "#22c55e", // green
  "Byzantine Empire": "#a855f7", // purple
  "Venice": "#3b82f6", // blue
  "Genoa": "#ef4444", // red
  "Union": "#3b82f6", // blue
  "Confederacy": "#6b7280", // gray
};

export function TurnMarker({
  turnData,
  isSelected,
  isCurrent,
  onClick,
}: TurnMarkerProps) {
  const summary = getTurnSummary(turnData);
  const nationColor = summary.activePlayer
    ? NATION_COLORS[summary.activePlayer] ?? "#64748b"
    : "#64748b";

  const hasActivity =
    summary.attackCount > 0 ||
    summary.conquestCount > 0 ||
    summary.diplomaticCount > 0 ||
    summary.historicalQueries > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all min-w-[50px]",
        "hover:bg-slate-800/50",
        isSelected && "bg-slate-800 ring-2 ring-[#D4AF37]",
        isCurrent && !isSelected && "bg-slate-800/30 ring-1 ring-[#D4AF37]/50"
      )}
    >
      {/* Turn number with nation color border */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
          "border-2 transition-colors"
        )}
        style={{
          borderColor: nationColor,
          backgroundColor: isSelected ? nationColor + "20" : "transparent",
          color: isSelected ? nationColor : "#94a3b8",
        }}
      >
        {turnData.turn}
      </div>

      {/* Activity indicators */}
      {hasActivity && (
        <div className="flex gap-0.5">
          {summary.attackCount > 0 && (
            <div className="p-0.5" title={`${summary.attackCount} attacks`}>
              <Swords className="w-3 h-3 text-red-400" />
            </div>
          )}
          {summary.conquestCount > 0 && (
            <div className="p-0.5" title={`${summary.conquestCount} conquests`}>
              <Flag className="w-3 h-3 text-green-400" />
            </div>
          )}
          {summary.diplomaticCount > 0 && (
            <div className="p-0.5" title={`${summary.diplomaticCount} diplomatic`}>
              <MessageCircle className="w-3 h-3 text-blue-400" />
            </div>
          )}
          {summary.historicalQueries > 0 && (
            <div className="p-0.5" title={`${summary.historicalQueries} queries`}>
              <BookOpen className="w-3 h-3 text-indigo-400" />
            </div>
          )}
        </div>
      )}

      {/* Nation name (abbreviated) */}
      {summary.activePlayer && (
        <span
          className="text-[10px] truncate max-w-[48px]"
          style={{ color: nationColor }}
        >
          {summary.activePlayer.split(" ")[0]}
        </span>
      )}

      {/* Current turn glow */}
      {isCurrent && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 20px ${nationColor}40`,
          }}
        />
      )}
    </button>
  );
}

export default TurnMarker;
