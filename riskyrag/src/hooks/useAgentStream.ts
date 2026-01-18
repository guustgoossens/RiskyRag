/**
 * Hook for real-time agent activity streaming
 * Following patterns from Intelligence's use-streaming-chat.ts
 */

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";

// Re-export types for convenience
export type AgentActivity = Doc<"agentActivity">;
export type AgentToolCall = Doc<"agentToolCalls">;
export type AgentRagQuery = Doc<"agentRagQueries">;

export interface AgentStreamState {
  activity: AgentActivity | null | undefined;
  toolCalls: AgentToolCall[];
  ragQueries: AgentRagQuery[];
  isRunning: boolean;
  currentTool: string | null;
  currentToolDescription: string | null;
}

/**
 * Subscribe to real-time agent activity for a game
 */
export function useAgentStream(
  gameId: Id<"games"> | undefined,
  options?: { turn?: number }
): AgentStreamState {
  // Subscribe to current activity
  const activity = useQuery(
    api.agentStreaming.getCurrentActivity,
    gameId
      ? {
          gameId,
          turn: options?.turn,
        }
      : "skip"
  );

  // Subscribe to tool calls when we have an activity
  const toolCalls = useQuery(
    api.agentStreaming.watchToolCalls,
    activity?._id ? { activityId: activity._id } : "skip"
  );

  // Subscribe to RAG queries when we have an activity
  const ragQueries = useQuery(
    api.agentStreaming.watchRagQueries,
    activity?._id ? { activityId: activity._id } : "skip"
  );

  const isRunning = activity?.status === "running";

  return {
    activity,
    toolCalls: toolCalls ?? [],
    ragQueries: ragQueries ?? [],
    isRunning,
    currentTool: activity?.currentTool ?? null,
    currentToolDescription: activity?.currentToolDescription ?? null,
  };
}

/**
 * Get full details for a specific activity (for history view)
 */
export function useActivityDetails(activityId: Id<"agentActivity"> | undefined) {
  return useQuery(
    api.agentStreaming.getFullActivityDetails,
    activityId ? { activityId } : "skip"
  );
}

/**
 * Get all activities for a game (for history/replay)
 */
export function useGameActivities(
  gameId: Id<"games"> | undefined,
  limit = 50
) {
  return useQuery(
    api.agentStreaming.getGameActivities,
    gameId ? { gameId, limit } : "skip"
  );
}

/**
 * Get activities for a specific player
 */
export function usePlayerActivities(
  gameId: Id<"games"> | undefined,
  playerId: Id<"players"> | undefined,
  limit = 20
) {
  return useQuery(
    api.agentStreaming.getPlayerActivities,
    gameId && playerId ? { gameId, playerId, limit } : "skip"
  );
}

/**
 * Human-readable tool labels with icons
 */
export const TOOL_LABELS: Record<
  string,
  { label: string; icon: string; highlight?: boolean }
> = {
  get_game_state: { label: "View Map", icon: "map" },
  place_reinforcements: { label: "Reinforce", icon: "shield" },
  advance_phase: { label: "Next Phase", icon: "arrow-right" },
  attack_territory: { label: "Attack", icon: "swords" },
  confirm_conquest: { label: "Confirm Conquest", icon: "flag" },
  fortify: { label: "Fortify", icon: "castle" },
  query_history: { label: "Historical Query", icon: "book-open", highlight: true },
  send_negotiation: { label: "Diplomacy", icon: "message-circle" },
  end_turn: { label: "End Turn", icon: "check" },
};

/**
 * Format a date timestamp for display
 */
export function formatGameDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format duration in milliseconds to human-readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}
