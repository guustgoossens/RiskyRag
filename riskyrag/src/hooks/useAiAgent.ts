import { useState, useEffect } from "react";
import type { AgentToolCall } from "@/types";

interface AgentStatus {
  isThinking: boolean;
  currentToolCall: AgentToolCall | null;
  recentToolCalls: AgentToolCall[];
}

interface UseAiAgentReturn {
  status: AgentStatus;
  toolCallHistory: AgentToolCall[];
}

export function useAiAgent(gameId: string, playerId?: string): UseAiAgentReturn {
  const [status] = useState<AgentStatus>({
    isThinking: false,
    currentToolCall: null,
    recentToolCalls: [],
  });

  const [toolCallHistory] = useState<AgentToolCall[]>([]);

  useEffect(() => {
    // Placeholder - will subscribe to Convex for real-time agent updates
    // This will use api.agent.subscribeStatus({ gameId, playerId })

    // Simulate periodic updates for demo
    const interval = setInterval(() => {
      // Mock data - will be replaced with real Convex subscription
    }, 2000);

    return () => clearInterval(interval);
  }, [gameId, playerId]);

  return {
    status,
    toolCallHistory,
  };
}
