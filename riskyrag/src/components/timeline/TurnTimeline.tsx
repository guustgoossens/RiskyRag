/**
 * TurnTimeline - Horizontal timeline bar at bottom of game view
 * Shows all turns with expandable chapters
 */

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTurnTimeline } from "@/hooks/useTurnTimeline";
import { TurnMarker } from "./TurnMarker";
import { TurnChapter } from "./TurnChapter";
import { ChevronLeft, ChevronRight, X, History } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface TurnTimelineProps {
  gameId: Id<"games">;
  isSpectatorMode?: boolean;
  className?: string;
}

export function TurnTimeline({
  gameId,
  isSpectatorMode = false,
  className,
}: TurnTimelineProps) {
  const {
    turns,
    currentTurn,
    selectedTurn,
    isLoading,
    selectTurn,
    getTurnData,
  } = useTurnTimeline(gameId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedTurnData = selectedTurn !== null ? getTurnData(selectedTurn) : null;

  // Auto-scroll to current turn when it changes
  useEffect(() => {
    if (scrollRef.current && currentTurn > 0) {
      const container = scrollRef.current;
      const markerWidth = 58; // Approximate width of each turn marker
      const scrollPosition = (currentTurn - 2) * markerWidth;
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: "smooth",
      });
    }
  }, [currentTurn]);

  // Scroll navigation
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className={cn("h-20 bg-slate-900/80 border-t border-slate-700", className)}>
        <div className="flex items-center justify-center h-full text-slate-500">
          Loading timeline...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Expanded chapter panel (above timeline) */}
      {selectedTurnData && (
        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-[400px] overflow-y-auto z-20">
          <div className="mx-4 relative">
            <button
              onClick={() => selectTurn(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <TurnChapter
              turnData={selectedTurnData}
              isSpectatorMode={isSpectatorMode}
            />
          </div>
        </div>
      )}

      {/* Timeline bar */}
      <div className="h-20 bg-slate-900/95 border-t border-[#D4AF37]/30 backdrop-blur-sm">
        <div className="h-full flex items-center px-2 gap-2">
          {/* Timeline label */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
            <History className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-cinzel font-bold text-[#D4AF37] uppercase tracking-wider">
              Chronicle
            </span>
          </div>

          {/* Left scroll button */}
          <button
            onClick={scrollLeft}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable turn markers */}
          <div
            ref={scrollRef}
            className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {turns.map((turnData) => (
              <TurnMarker
                key={turnData.turn}
                turnData={turnData}
                isSelected={selectedTurn === turnData.turn}
                isCurrent={currentTurn === turnData.turn}
                onClick={() =>
                  selectTurn(selectedTurn === turnData.turn ? null : turnData.turn)
                }
              />
            ))}
          </div>

          {/* Right scroll button */}
          <button
            onClick={scrollRight}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Current turn indicator */}
          <div className="flex flex-col items-center px-3 py-1 bg-slate-800 rounded-lg border border-[#D4AF37]/50">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              Turn
            </span>
            <span className="text-lg font-bold text-[#D4AF37]">{currentTurn}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TurnTimeline;
