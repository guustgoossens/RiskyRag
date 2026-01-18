/**
 * Hooks for game state management with Convex
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Get full game state including players and territories
 */
export function useGameState(gameId: Id<"games"> | undefined) {
  return useQuery(
    api.games.getFullState,
    gameId ? { gameId } : "skip"
  );
}

/**
 * Get a specific game
 */
export function useGame(gameId: Id<"games"> | undefined) {
  return useQuery(api.games.get, gameId ? { id: gameId } : "skip");
}

/**
 * List waiting games (for lobby)
 */
export function useWaitingGames() {
  return useQuery(api.games.listWaiting, {});
}

/**
 * Get players for a game
 */
export function usePlayers(gameId: Id<"games"> | undefined) {
  return useQuery(
    api.players.getByGame,
    gameId ? { gameId } : "skip"
  );
}

/**
 * Get territories for a game
 */
export function useTerritories(gameId: Id<"games"> | undefined) {
  return useQuery(
    api.territories.getByGame,
    gameId ? { gameId } : "skip"
  );
}

/**
 * Get game log
 */
export function useGameLog(gameId: Id<"games"> | undefined, limit = 20) {
  return useQuery(
    api.gameLog.getByGame,
    gameId ? { gameId, limit } : "skip"
  );
}

/**
 * Get negotiations for a player
 */
export function useNegotiations(
  gameId: Id<"games"> | undefined,
  playerId: Id<"players"> | undefined,
  limit = 50
) {
  return useQuery(
    api.negotiations.getForPlayer,
    gameId && playerId ? { gameId, playerId, limit } : "skip"
  );
}

/**
 * Create a new game
 */
export function useCreateGame() {
  return useMutation(api.games.create);
}

/**
 * Join a game
 */
export function useJoinGame() {
  return useMutation(api.players.join);
}

/**
 * Add an AI player
 */
export function useAddAI() {
  return useMutation(api.players.addAI);
}

/**
 * Initialize a game (add all AI players and territories)
 */
export function useInitializeGame() {
  return useMutation(api.players.initializeGame);
}

/**
 * Start a game
 */
export function useStartGame() {
  return useMutation(api.games.start);
}

/**
 * Attack a territory
 */
export function useAttack() {
  return useMutation(api.territories.attack);
}

/**
 * Move troops
 */
export function useMoveTroops() {
  return useMutation(api.territories.moveTroops);
}

/**
 * Reinforce a territory
 */
export function useReinforce() {
  return useMutation(api.territories.reinforce);
}

/**
 * Get reinforcement calculation
 */
export function useReinforcements(playerId: Id<"players"> | undefined) {
  return useQuery(
    api.territories.calculateReinforcements,
    playerId ? { playerId } : "skip"
  );
}

/**
 * Send a negotiation message
 */
export function useSendNegotiation() {
  return useMutation(api.negotiations.send);
}

/**
 * Advance to next turn
 */
export function useNextTurn() {
  return useMutation(api.games.nextTurn);
}
