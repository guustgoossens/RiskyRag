/**
 * SpectatorOverlay - Multi-agent split view for AI vs AI games
 * Shows all agents' thinking, notes, and activity in real-time
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import {
  Eye,
  EyeOff,
  Brain,
  BookOpen,
  StickyNote,
  Activity,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { SourceCitation } from "@/components/citations/SourceCitation";

interface SpectatorOverlayProps {
  gameId: Id<"games">;
  players: Doc<"players">[];
  isOpen: boolean;
  onToggle: () => void;
}

// Nation colors
const NATION_COLORS: Record<string, string> = {
  "Ottoman Empire": "#22c55e",
  "Byzantine Empire": "#a855f7",
  "Venice": "#3b82f6",
  "Genoa": "#ef4444",
  "Union": "#3b82f6",
  "Confederacy": "#6b7280",
};

export function SpectatorOverlay({
  gameId,
  players,
  isOpen,
  onToggle,
}: SpectatorOverlayProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  // Get all AI players
  const aiPlayers = players.filter((p) => !p.isHuman);

  const toggleAgent = (playerId: string) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
    } else {
      newExpanded.add(playerId);
    }
    setExpandedAgents(newExpanded);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-20 right-4 z-40 flex items-center gap-2 px-3 py-2 bg-[#00FFA3]/20 border border-[#00FFA3]/50 rounded-lg text-[#00FFA3] hover:bg-[#00FFA3]/30 transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">Spectator Mode</span>
      </button>
    );
  }

  return (
    <div className="fixed top-16 right-4 bottom-24 w-96 z-40 flex flex-col bg-slate-900/95 border border-[#00FFA3]/30 rounded-lg shadow-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#00FFA3]/30 bg-[#00FFA3]/10">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#00FFA3]" />
          <span className="font-cinzel font-bold text-[#00FFA3] uppercase tracking-wider">
            Spectator Mode
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Agent panels */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {aiPlayers.map((player) => (
          <AgentPanel
            key={player._id}
            gameId={gameId}
            player={player}
            isExpanded={expandedAgents.has(player._id)}
            onToggle={() => toggleAgent(player._id)}
          />
        ))}

        {aiPlayers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Brain className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No AI agents in this game</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual agent panel showing their current state and thinking
 */
interface AgentPanelProps {
  gameId: Id<"games">;
  player: Doc<"players">;
  isExpanded: boolean;
  onToggle: () => void;
}

function AgentPanel({ gameId, player, isExpanded, onToggle }: AgentPanelProps) {
  const nationColor = NATION_COLORS[player.nation] ?? "#64748b";

  // Get current activity for this player
  const activities = useQuery(api.agentStreaming.getPlayerActivities, {
    gameId,
    playerId: player._id,
    limit: 5,
  });

  // Get agent notes
  const notes = useQuery(api.agentNotes.getByPlayer, {
    gameId,
    playerId: player._id,
    limit: 10,
  });

  const latestActivity = activities?.[0];
  const isRunning = latestActivity?.status === "running";

  // Get activity details if we have one
  const activityDetails = useQuery(
    api.agentStreaming.getFullActivityDetails,
    latestActivity ? { activityId: latestActivity._id } : "skip"
  );

  return (
    <div
      className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
      style={{ borderLeftColor: nationColor, borderLeftWidth: 3 }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: nationColor }}
          >
            {player.nation.charAt(0)}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">{player.nation}</div>
            <div className="text-xs text-slate-500">{player.model ?? "AI"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-1 text-[#00FFA3]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Thinking</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Current activity */}
          {latestActivity && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <Activity className="w-3 h-3" />
                Current Activity
              </div>

              {/* Current tool */}
              {latestActivity.currentTool && (
                <div className="p-2 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded text-sm">
                  <span className="text-[#00FFA3]">
                    {latestActivity.currentToolDescription ??
                      latestActivity.currentTool}
                  </span>
                </div>
              )}

              {/* Strategy summary */}
              {latestActivity.doneCheckpoint && (
                <div className="p-2 bg-purple-900/20 border border-purple-700/30 rounded">
                  <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
                    <Brain className="w-3 h-3" /> Strategy
                  </div>
                  <p className="text-xs text-slate-300">
                    {latestActivity.doneCheckpoint.strategySummary}
                  </p>
                  <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                    <span>
                      Score: {latestActivity.doneCheckpoint.checklistScore}/5
                    </span>
                    <span>|</span>
                    <span>{latestActivity.doneCheckpoint.confidence}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RAG Queries */}
          {activityDetails?.ragQueries && activityDetails.ragQueries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 uppercase tracking-wide">
                <BookOpen className="w-3 h-3" />
                Historical Knowledge
              </div>
              {activityDetails.ragQueries.slice(0, 2).map((query) => (
                <div
                  key={query._id}
                  className="p-2 bg-indigo-900/20 border border-indigo-700/30 rounded"
                >
                  <p className="text-xs text-slate-300 italic line-clamp-2">
                    "{query.question}"
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-green-400">
                      {query.snippetsReturned} sources
                    </span>
                    {query.snippetsBlocked > 0 && (
                      <span className="text-amber-400">
                        {query.snippetsBlocked} blocked
                      </span>
                    )}
                  </div>
                  {/* Show one citation */}
                  {query.snippets && query.snippets[0] && (
                    <div className="mt-1">
                      <SourceCitation
                        url={query.snippets[0].sourceUrl ?? null}
                        source={query.snippets[0].source}
                        title={query.snippets[0].title}
                        variant="inline"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Agent Notes */}
          {notes && notes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <StickyNote className="w-3 h-3" />
                Private Notes
              </div>
              {notes.slice(0, 3).map((note) => (
                <div
                  key={note._id}
                  className="p-2 bg-slate-800/50 border border-slate-700 rounded"
                >
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {note.content}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Turn {note.turn}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* No data state */}
          {!latestActivity && (!notes || notes.length === 0) && (
            <div className="text-center py-4 text-slate-500 text-xs">
              Waiting for agent activity...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SpectatorOverlay;
