// Game Types for RiskyRag
// These will eventually be replaced by Convex-generated types

export type GameStatus = "waiting" | "active" | "finished";
export type GamePhase = "reinforce" | "attack" | "fortify";

export interface PendingConquest {
  fromTerritory: string;
  toTerritory: string;
  minTroops: number;
  maxTroops: number;
  previousOwner: string | null;
}

export interface Game {
  _id: string;
  status: GameStatus;
  currentTurn: number;
  currentDate: number; // Unix timestamp representing game year
  startDate: number;
  scenario: ScenarioId;
  currentPlayerId?: string;
  phase?: GamePhase;
  reinforcementsRemaining?: number;
  fortifyUsed?: boolean;
  pendingConquest?: PendingConquest;
  winnerId?: string;
}

export type ScenarioId = "1453" | "1776" | "1861" | "1914";

export interface Scenario {
  id: ScenarioId;
  title: string;
  year: number;
  description: string;
  nations: string[];
  difficulty: "easy" | "medium" | "hard";
  mapImage: string;
}

export interface Player {
  _id: string;
  gameId: string;
  isHuman: boolean;
  nation: string;
  model?: LLMModel;
  territories: string[];
  troops: number;
  isEliminated: boolean;
  color: string;
}

export type LLMModel =
  // === Stable (Recommended - reliable tool calling) ===
  | "devstral"        // Best free model
  | "claude-sonnet"   // Best overall (Anthropic)
  | "claude-opus"     // Most capable (Anthropic)
  // === Experimental (May fail or produce errors) ===
  | "claude-haiku"    // Fast but less reliable
  | "llama-3.3-70b"
  | "qwen3-32b"
  | "mistral-small"
  | "trinity-mini"
  | "qwen3-coder"
  | "gemma-3-27b";

export interface Territory {
  _id: string;
  gameId: string;
  name: string;
  owner: string; // Player ID
  troops: number;
  adjacentTo: string[];
  // SVG path data for rendering
  pathData?: string;
  centroid?: { x: number; y: number };
}

export interface HistoricalSnippet {
  _id: string;
  content: string;
  eventDate: number;
  publicationDate: number;
  source: string;
  region: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  content: string;
  timestamp: number;
  type: "user" | "ai" | "system";
}

export interface GameLog {
  id: string;
  gameId: string;
  playerId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: number;
}

// Agent tool calls
export interface AgentToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  timestamp: number;
}
