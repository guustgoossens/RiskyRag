import { useState, useEffect } from "react";
import type { Game, Territory, Player } from "@/types";

// Placeholder hook - will be replaced with Convex useQuery
// This simulates what the real hook will look like

interface UseGameStateReturn {
  game: Game | null;
  territories: Territory[];
  players: Player[];
  isLoading: boolean;
  error: Error | null;
  currentPlayer: Player | null;
  isMyTurn: boolean;
}

export function useGameState(gameId: string): UseGameStateReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);

  // Placeholder data - will be replaced with Convex queries
  const [game] = useState<Game | null>(() => ({
    _id: gameId,
    status: "active",
    currentTurn: 1,
    currentDate: new Date("1453-05-29").getTime(),
    startDate: new Date("1453-01-01").getTime(),
    scenario: "1453",
    activePlayerId: "player-1",
    phase: "attack",
  }));

  const [territories] = useState<Territory[]>([]);
  const [players] = useState<Player[]>([]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [gameId]);

  const currentPlayer = players.find((p) => p._id === game?.activePlayerId) ?? null;
  const isMyTurn = currentPlayer?.isHuman ?? false;

  return {
    game,
    territories,
    players,
    isLoading,
    error,
    currentPlayer,
    isMyTurn,
  };
}
