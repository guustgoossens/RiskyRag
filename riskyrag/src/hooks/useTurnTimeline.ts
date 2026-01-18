/**
 * useTurnTimeline - Hook for navigating game history by turn
 * Merges agentActivity, gameLog, negotiations, and agentNotes by turn
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";

export interface TurnData {
  turn: number;
  activities: Doc<"agentActivity">[];
  logs: Doc<"gameLog">[];
  negotiations: Doc<"negotiations">[];
  notes: Array<Doc<"agentNotes"> & { playerNation: string; playerColor: string }>;
  players: Map<Id<"players">, { nation: string; color: string; isHuman: boolean }>;
}

export interface TurnTimelineState {
  turns: TurnData[];
  currentTurn: number;
  selectedTurn: number | null;
  maxTurn: number;
  isLoading: boolean;
  goToTurn: (turn: number) => void;
  selectTurn: (turn: number | null) => void;
  getTurnData: (turn: number) => TurnData | undefined;
}

/**
 * Hook for turn-based timeline navigation
 */
export function useTurnTimeline(gameId: Id<"games"> | undefined): TurnTimelineState {
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);

  // Fetch game state for current turn
  const gameState = useQuery(
    api.games.getFullState,
    gameId ? { gameId } : "skip"
  );

  // Fetch all activities for the game
  const activities = useQuery(
    api.agentStreaming.getGameActivities,
    gameId ? { gameId, limit: 200 } : "skip"
  );

  // Fetch game log
  const gameLogs = useQuery(
    api.gameLog.getByGame,
    gameId ? { gameId, limit: 500 } : "skip"
  );

  // Fetch negotiations
  const negotiations = useQuery(
    api.negotiations.getByGame,
    gameId ? { gameId, limit: 200 } : "skip"
  );

  // Fetch agent notes (for spectator mode)
  const notes = useQuery(
    api.agentNotes.getByGameWithPlayers,
    gameId ? { gameId, limit: 200 } : "skip"
  );

  // Build player lookup
  const playerLookup = useMemo(() => {
    const lookup = new Map<Id<"players">, { nation: string; color: string; isHuman: boolean }>();
    if (gameState?.players) {
      for (const player of gameState.players) {
        lookup.set(player._id, {
          nation: player.nation,
          color: player.color,
          isHuman: player.isHuman,
        });
      }
    }
    return lookup;
  }, [gameState?.players]);

  // Group all data by turn
  const turns = useMemo(() => {
    if (!gameState?.game) return [];

    const maxTurn = gameState.game.currentTurn;
    const turnMap = new Map<number, TurnData>();

    // Initialize all turns
    for (let i = 0; i <= maxTurn; i++) {
      turnMap.set(i, {
        turn: i,
        activities: [],
        logs: [],
        negotiations: [],
        notes: [],
        players: playerLookup,
      });
    }

    // Add activities
    if (activities) {
      for (const activity of activities) {
        const turnData = turnMap.get(activity.turn);
        if (turnData) {
          turnData.activities.push(activity);
        }
      }
    }

    // Add logs
    if (gameLogs) {
      for (const log of gameLogs) {
        const turnData = turnMap.get(log.turn);
        if (turnData) {
          turnData.logs.push(log);
        }
      }
    }

    // Add negotiations
    if (negotiations) {
      for (const neg of negotiations) {
        const turnData = turnMap.get(neg.turn);
        if (turnData) {
          turnData.negotiations.push(neg);
        }
      }
    }

    // Add notes
    if (notes) {
      for (const note of notes) {
        const turnData = turnMap.get(note.turn);
        if (turnData) {
          turnData.notes.push(note);
        }
      }
    }

    // Sort logs within each turn by timestamp
    for (const turnData of turnMap.values()) {
      turnData.logs.sort((a, b) => a.timestamp - b.timestamp);
      turnData.negotiations.sort((a, b) => a.timestamp - b.timestamp);
      turnData.notes.sort((a, b) => a.createdAt - b.createdAt);
    }

    return Array.from(turnMap.values()).sort((a, b) => a.turn - b.turn);
  }, [gameState?.game, activities, gameLogs, negotiations, notes, playerLookup]);

  const currentTurn = gameState?.game?.currentTurn ?? 0;
  const maxTurn = turns.length > 0 ? turns[turns.length - 1].turn : 0;

  const goToTurn = useCallback((turn: number) => {
    setSelectedTurn(Math.max(0, Math.min(turn, maxTurn)));
  }, [maxTurn]);

  const selectTurn = useCallback((turn: number | null) => {
    setSelectedTurn(turn);
  }, []);

  const getTurnData = useCallback((turn: number): TurnData | undefined => {
    return turns.find((t) => t.turn === turn);
  }, [turns]);

  const isLoading = !gameState || !activities || !gameLogs;

  return {
    turns,
    currentTurn,
    selectedTurn,
    maxTurn,
    isLoading,
    goToTurn,
    selectTurn,
    getTurnData,
  };
}

/**
 * Get a summary of what happened in a turn
 */
export function getTurnSummary(turnData: TurnData): {
  attackCount: number;
  conquestCount: number;
  diplomaticCount: number;
  historicalQueries: number;
  activePlayer: string | null;
} {
  let attackCount = 0;
  let conquestCount = 0;
  let diplomaticCount = 0;
  let historicalQueries = 0;
  let activePlayer: string | null = null;

  for (const log of turnData.logs) {
    if (log.action === "attack") attackCount++;
    if (log.action === "conquest" || log.details?.conquered) conquestCount++;
    if (log.action === "negotiate" || log.action === "negotiate_response") diplomaticCount++;
    if (log.action === "query") historicalQueries++;

    // Get the active player from the first log
    if (!activePlayer && log.playerId) {
      const player = turnData.players.get(log.playerId);
      if (player) activePlayer = player.nation;
    }
  }

  // Also check activities for the active player
  if (!activePlayer && turnData.activities.length > 0) {
    activePlayer = turnData.activities[0].nation ?? null;
  }

  diplomaticCount += turnData.negotiations.length;

  return {
    attackCount,
    conquestCount,
    diplomaticCount,
    historicalQueries,
    activePlayer,
  };
}

export default useTurnTimeline;
