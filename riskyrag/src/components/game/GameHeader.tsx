import { cn } from "@/lib/utils";
import { Calendar, Clock, Scroll } from "lucide-react";
import { formatHistoricalDate } from "@/lib/utils";

interface GameHeaderProps {
  currentDate: number;
  currentTurn: number;
  maxTurns?: number;
  scenario: string;
  notification?: string;
}

export function GameHeader({
  currentDate,
  currentTurn,
  maxTurns = 50,
  scenario,
  notification,
}: GameHeaderProps) {
  const year = new Date(currentDate).getFullYear();

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Historical Date */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {year}
                </div>
                <div className="text-xs text-slate-400">
                  {formatHistoricalDate(currentDate)}
                </div>
              </div>
            </div>

            <div className="w-px h-10 bg-slate-700" />

            {/* Scenario */}
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">
                {scenario === "1453" && "Fall of Constantinople"}
                {scenario === "1776" && "American Revolution"}
                {scenario === "1914" && "The Great War"}
              </span>
            </div>
          </div>

          {/* Turn Counter */}
          <div className="flex items-center gap-4">
            {/* Notification Ticker */}
            {notification && (
              <div className="max-w-md overflow-hidden">
                <div
                  className={cn(
                    "text-sm text-amber-400 italic",
                    "animate-pulse"
                  )}
                >
                  "{notification}"
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">
                Turn{" "}
                <span className="font-bold text-white">{currentTurn}</span>
                <span className="text-slate-500">/{maxTurns}</span>
              </span>

              {/* Progress Bar */}
              <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${(currentTurn / maxTurns) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
