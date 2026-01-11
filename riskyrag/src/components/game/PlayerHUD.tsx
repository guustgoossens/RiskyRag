import { cn } from "@/lib/utils";
import { User, Bot, Crown, Skull } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Player } from "@/types";

interface PlayerHUDProps {
  players: Player[];
  activePlayerId: string;
  currentUserId?: string;
}

export function PlayerHUD({
  players,
  activePlayerId,
  currentUserId,
}: PlayerHUDProps) {
  return (
    <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Players
      </h3>

      <div className="space-y-3">
        {players.map((player) => {
          const isActive = player._id === activePlayerId;
          const isCurrentUser = player._id === currentUserId;

          return (
            <div
              key={player._id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                isActive
                  ? "bg-amber-500/10 border border-amber-500/50"
                  : "bg-slate-800/50",
                player.isEliminated && "opacity-50"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center",
                  "ring-2 ring-offset-2 ring-offset-slate-900"
                )}
                style={{
                  backgroundColor: player.color,
                  boxShadow: isActive ? "0 0 0 2px #f59e0b" : `0 0 0 2px ${player.color}`,
                }}
              >
                {player.isHuman ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Eliminated indicator */}
                {player.isEliminated && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Skull className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {player.nation}
                  </span>
                  {isCurrentUser && (
                    <Badge size="sm" variant="info">
                      You
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                      {player.territories.length}
                    </span>{" "}
                    territories
                  </span>
                  <span className="text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                      {player.troops}
                    </span>{" "}
                    troops
                  </span>
                </div>
              </div>

              {/* AI Model Badge */}
              {!player.isHuman && player.model && (
                <Badge size="sm" variant="default" className="shrink-0">
                  {player.model}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
