/**
 * ToolCallsPanel - Displays expandable tool call list
 * Following patterns from Intelligence's transparency-panel.tsx
 */

import { cn } from "@/lib/utils";
import { useState, type ReactElement } from "react";
import {
  TOOL_LABELS,
  formatDuration,
  type AgentToolCall,
  type AgentRagQuery,
} from "@/hooks/useAgentStream";
import { RagQueryInline } from "./RagQueryCard";

interface ToolCallsPanelProps {
  toolCalls: AgentToolCall[];
  ragQueries: AgentRagQuery[];
  className?: string;
}

// Tool icons using SVG
const ToolIcon = ({ name }: { name: string }) => {
  const iconMap: Record<string, ReactElement> = {
    map: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    shield: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    "arrow-right": (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    ),
    swords: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    flag: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
    castle: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
    "book-open": (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    "message-circle": (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    check: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  const iconKey = TOOL_LABELS[name]?.icon ?? "check";
  return iconMap[iconKey] ?? iconMap.check;
};

export function ToolCallsPanel({
  toolCalls,
  ragQueries,
  className,
}: ToolCallsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create a map of RAG queries by tool call ID
  const ragQueryMap = new Map<string, AgentRagQuery>();
  for (const rq of ragQueries) {
    ragQueryMap.set(rq.toolCallId, rq);
  }

  if (toolCalls.length === 0) {
    return (
      <div className={cn("p-4 text-center text-slate-500", className)}>
        No tool calls yet...
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-slate-700/50", className)}>
      {toolCalls.map((tc) => {
        const toolLabel = TOOL_LABELS[tc.toolName] ?? {
          label: tc.toolName,
          icon: "check",
        };
        const isExpanded = expandedId === tc._id;
        const isRagQuery = tc.toolName === "query_history";
        const ragQuery = ragQueryMap.get(tc._id);
        const isPending = tc.status === "pending";
        const isError = tc.status === "error";

        return (
          <div key={tc._id} className="py-2">
            {/* Tool call header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : tc._id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-700/30 transition-colors"
            >
              {/* Status indicator */}
              {isPending ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                </div>
              ) : (
                <div
                  className={cn(
                    "p-1 rounded",
                    isError
                      ? "bg-red-900/50 text-red-400"
                      : isRagQuery
                        ? "bg-indigo-900/50 text-indigo-400"
                        : "bg-slate-700 text-slate-300"
                  )}
                >
                  <ToolIcon name={tc.toolName} />
                </div>
              )}

              {/* Label */}
              <span
                className={cn(
                  "flex-1 text-left text-sm",
                  isRagQuery
                    ? "text-indigo-300 font-medium"
                    : isError
                      ? "text-red-300"
                      : "text-slate-300"
                )}
              >
                {toolLabel.label}
                {isRagQuery && (
                  <span className="ml-1 text-yellow-400">*</span>
                )}
              </span>

              {/* Duration badge */}
              {tc.durationMs && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    tc.durationMs > 1000
                      ? "bg-amber-900/30 text-amber-400"
                      : "bg-slate-700 text-slate-400"
                  )}
                >
                  {formatDuration(tc.durationMs)}
                </span>
              )}

              {/* Expand indicator */}
              <svg
                className={cn(
                  "w-4 h-4 text-slate-500 transition-transform",
                  isExpanded && "rotate-180"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* RAG query inline preview (for query_history) */}
            {isRagQuery && ragQuery && !isExpanded && (
              <RagQueryInline
                question={ragQuery.question}
                snippetsReturned={ragQuery.snippetsReturned}
                snippetsBlocked={ragQuery.snippetsBlocked}
              />
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-2 ml-6 p-2 bg-slate-800/50 rounded text-xs">
                {/* Arguments */}
                {tc.arguments && Object.keys(tc.arguments).length > 0 && (
                  <div className="mb-2">
                    <div className="text-slate-500 uppercase tracking-wide mb-1">
                      Arguments
                    </div>
                    <pre className="text-slate-300 overflow-x-auto">
                      {JSON.stringify(tc.arguments, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Result */}
                {tc.result && (
                  <div>
                    <div className="text-slate-500 uppercase tracking-wide mb-1">
                      Result
                    </div>
                    <pre className="text-slate-300 overflow-x-auto max-h-32 overflow-y-auto">
                      {typeof tc.result === "string"
                        ? tc.result.slice(0, 500) + (tc.result.length > 500 ? "..." : "")
                        : JSON.stringify(tc.result, null, 2).slice(0, 500)}
                    </pre>
                  </div>
                )}

                {/* Error message */}
                {tc.errorMessage && (
                  <div className="text-red-400 mt-2">
                    Error: {tc.errorMessage}
                  </div>
                )}

                {/* RAG query details */}
                {isRagQuery && ragQuery && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="text-slate-500 uppercase tracking-wide mb-1">
                      Temporal Filter
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">
                        {ragQuery.snippetsReturned} returned
                      </span>
                      {ragQuery.snippetsBlocked > 0 && (
                        <span className="text-amber-400">
                          {ragQuery.snippetsBlocked} blocked (future events)
                        </span>
                      )}
                    </div>
                    {ragQuery.blockedEventsSample &&
                      ragQuery.blockedEventsSample.length > 0 && (
                        <div className="mt-1 text-slate-400">
                          Blocked:{" "}
                          {ragQuery.blockedEventsSample
                            .map((e) => e.title ?? "Unknown")
                            .join(", ")}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
