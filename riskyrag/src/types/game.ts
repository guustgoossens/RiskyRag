// Game Types for RiskyRag
// These will eventually be replaced by Convex-generated types

export type GameStatus = "waiting" | "active" | "finished";
export type GamePhase = "deploy" | "attack" | "fortify";

export interface Game {
  _id: string;
  status: GameStatus;
  currentTurn: number;
  currentDate: number; // Unix timestamp representing game year
  startDate: number;
  scenario: ScenarioId;
  activePlayerId: string;
  phase: GamePhase;
}

export type ScenarioId = "1453" | "1776" | "1914";

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

export type LLMModel = "gpt-4" | "claude-sonnet" | "llama-3.2-7b" | "llama-3.2-13b";

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
