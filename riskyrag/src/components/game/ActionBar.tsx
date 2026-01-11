import { cn } from "@/lib/utils";
import { Swords, Move, Shield, SkipForward, History } from "lucide-react";
import { Button } from "@/components/ui";
import type { GamePhase } from "@/types";

interface ActionBarProps {
  phase: GamePhase;
  isMyTurn: boolean;
  canAttack: boolean;
  canMove: boolean;
  canFortify: boolean;
  onAttack: () => void;
  onMove: () => void;
  onFortify: () => void;
  onEndTurn: () => void;
  onOpenHistory: () => void;
}

const PHASE_INFO = {
  deploy: {
    label: "Deploy",
    description: "Place your reinforcements",
    color: "text-green-400",
  },
  attack: {
    label: "Attack",
    description: "Attack enemy territories",
    color: "text-red-400",
  },
  fortify: {
    label: "Fortify",
    description: "Move troops between your territories",
    color: "text-blue-400",
  },
};

export function ActionBar({
  phase,
  isMyTurn,
  canAttack,
  canMove,
  canFortify,
  onAttack,
  onMove,
  onFortify,
  onEndTurn,
  onOpenHistory,
}: ActionBarProps) {
  const phaseInfo = PHASE_INFO[phase];

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Phase Indicator */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    phase === "deploy" && "bg-green-400",
                    phase === "attack" && "bg-red-400",
                    phase === "fortify" && "bg-blue-400"
                  )}
                />
                <span className={cn("text-sm font-semibold", phaseInfo.color)}>
                  {phaseInfo.label} Phase
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMyTurn ? phaseInfo.description : "Waiting for opponent..."}
              </p>
            </div>

            {/* Phase Progress */}
            <div className="flex items-center gap-1">
              {(["deploy", "attack", "fortify"] as GamePhase[]).map((p, i) => (
                <div
                  key={p}
                  className={cn(
                    "flex items-center",
                    i > 0 && "ml-1"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      phase === p
                        ? "bg-amber-500 text-white"
                        : (["deploy", "attack", "fortify"].indexOf(phase) > i)
                          ? "bg-slate-600 text-slate-300"
                          : "bg-slate-700 text-slate-500"
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={cn(
                        "w-4 h-0.5 ml-1",
                        ["deploy", "attack", "fortify"].indexOf(phase) > i
                          ? "bg-slate-600"
                          : "bg-slate-700"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {phase === "attack" && (
              <Button
                variant="danger"
                size="sm"
                disabled={!isMyTurn || !canAttack}
                onClick={onAttack}
              >
                <Swords className="w-4 h-4 mr-1" />
                Attack
              </Button>
            )}

            {phase === "attack" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={!isMyTurn || !canMove}
                onClick={onMove}
              >
                <Move className="w-4 h-4 mr-1" />
                Move
              </Button>
            )}

            {phase === "fortify" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={!isMyTurn || !canFortify}
                onClick={onFortify}
              >
                <Shield className="w-4 h-4 mr-1" />
                Fortify
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenHistory}
            >
              <History className="w-4 h-4 mr-1" />
              Ask History
            </Button>

            <div className="w-px h-6 bg-slate-700 mx-1" />

            <Button
              variant="primary"
              size="sm"
              disabled={!isMyTurn}
              onClick={onEndTurn}
            >
              <SkipForward className="w-4 h-4 mr-1" />
              End Turn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
