/**
 * AgentTurnViewer - Main slide-out panel for observing AI agent turns
 * Following patterns from Intelligence's chat-interface.tsx
 */

import { cn } from "@/lib/utils";
import { useAgentStream } from "@/hooks/useAgentStream";
import type { Id } from "../../../convex/_generated/dataModel";
import { AgentPersonaHeader } from "./AgentPersonaHeader";
import { ToolCallsPanel } from "./ToolCallsPanel";
import { RagQueryCard } from "./RagQueryCard";

interface AgentTurnViewerProps {
  gameId: Id<"games">;
  isOpen: boolean;
  onClose: () => void;
  turn?: number;
}

export function AgentTurnViewer({
  gameId,
  isOpen,
  onClose,
  turn,
}: AgentTurnViewerProps) {
  const { activity, toolCalls, ragQueries, isRunning, currentToolDescription } =
    useAgentStream(gameId, { turn });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-md bg-slate-900 border-l border-slate-700",
          "flex flex-col h-full shadow-2xl",
          "animate-in slide-in-from-right duration-200"
        )}
      >
        {/* Header */}
        {activity ? (
          <AgentPersonaHeader activity={activity} onClose={onClose} />
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <span className="text-slate-400">No active AI turn</span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activity ? (
            <>
              {/* Status indicator */}
              {isRunning && (
                <div className="px-4 py-3 bg-blue-900/20 border-b border-blue-700/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-sm text-blue-300">
                      {currentToolDescription ?? "Thinking..."}
                    </span>
                  </div>
                  {/* Animated dots */}
                  <div className="flex gap-1 mt-2">
                    <div
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              {/* Completed status */}
              {activity.status === "completed" && activity.reasoning && (
                <div className="px-4 py-3 bg-green-900/20 border-b border-green-700/30">
                  <div className="text-xs font-medium text-green-400 uppercase tracking-wide mb-1">
                    Turn Complete
                  </div>
                  <p className="text-sm text-slate-300 italic">
                    "{activity.reasoning}"
                  </p>
                </div>
              )}

              {/* Error status */}
              {activity.status === "error" && (
                <div className="px-4 py-3 bg-red-900/20 border-b border-red-700/30">
                  <div className="text-xs font-medium text-red-400 uppercase tracking-wide mb-1">
                    Error
                  </div>
                  <p className="text-sm text-red-300">
                    {activity.reasoning ?? "An error occurred"}
                  </p>
                </div>
              )}

              {/* Tool calls section */}
              <div className="p-4">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Tool Calls ({toolCalls.length})
                </h4>
                <ToolCallsPanel
                  toolCalls={toolCalls}
                  ragQueries={ragQueries}
                />
              </div>

              {/* RAG queries highlight section */}
              {ragQueries.length > 0 && (
                <div className="p-4 pt-0">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Temporal Filter Summary
                  </h4>
                  <div className="space-y-2">
                    {ragQueries.map((rq) => (
                      <RagQueryCard key={rq._id} ragQuery={rq} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p>Waiting for AI turn...</p>
              <p className="text-xs mt-2 text-slate-600">
                The AI's thinking will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer with summary stats */}
        {activity && (
          <div className="p-3 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>{toolCalls.length} tool calls</span>
                <span>{ragQueries.length} history queries</span>
              </div>
              {activity.completedAt && activity.startedAt && (
                <span>
                  Duration:{" "}
                  {((activity.completedAt - activity.startedAt) / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Floating button to open the agent viewer
 */
interface AgentViewerButtonProps {
  onClick: () => void;
  isRunning: boolean;
  nation?: string;
}

export function AgentViewerButton({
  onClick,
  isRunning,
  nation,
}: AgentViewerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
        "border shadow-lg",
        isRunning
          ? "bg-blue-900/50 border-blue-600 text-blue-300 animate-pulse"
          : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500"
      )}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
      <span className="text-sm">
        {isRunning ? `${nation ?? "AI"} thinking...` : "Watch AI"}
      </span>
    </button>
  );
}
