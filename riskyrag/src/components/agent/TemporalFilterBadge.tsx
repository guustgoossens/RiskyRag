/**
 * TemporalFilterBadge - Shows blocked events count for temporal RAG
 */

import { cn } from "@/lib/utils";
import { formatGameDate, type AgentRagQuery } from "@/hooks/useAgentStream";
import { useState } from "react";

interface TemporalFilterBadgeProps {
  ragQuery: AgentRagQuery;
  className?: string;
}

export function TemporalFilterBadge({
  ragQuery,
  className,
}: TemporalFilterBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasBlockedEvents = ragQuery.snippetsBlocked > 0;

  return (
    <div className={cn("mt-2", className)}>
      {/* Summary row */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-400">
          {ragQuery.snippetsReturned} sources found
        </span>

        {hasBlockedEvents && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors",
              "bg-amber-900/30 border border-amber-700/50 text-amber-400",
              "hover:bg-amber-900/50"
            )}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              {ragQuery.snippetsBlocked} future event
              {ragQuery.snippetsBlocked !== 1 ? "s" : ""} filtered
            </span>
            <svg
              className={cn(
                "w-3 h-3 transition-transform",
                expanded && "rotate-180"
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
        )}
      </div>

      {/* Expanded blocked events list */}
      {expanded && hasBlockedEvents && ragQuery.blockedEventsSample && (
        <div className="mt-2 p-2 bg-amber-900/20 border border-amber-700/30 rounded-lg">
          <div className="text-xs font-medium text-amber-300 mb-1">
            Blocked Future Events:
          </div>
          <ul className="space-y-1">
            {ragQuery.blockedEventsSample.map((event, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between text-xs text-slate-300"
              >
                <span className="truncate flex-1">
                  {event.title ?? "Unknown event"}
                </span>
                <span className="text-amber-400 ml-2 whitespace-nowrap">
                  {formatGameDate(event.eventDate)}
                </span>
              </li>
            ))}
            {ragQuery.snippetsBlocked > 5 && (
              <li className="text-xs text-slate-500 italic">
                +{ragQuery.snippetsBlocked - 5} more blocked
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Cutoff date reminder */}
      <div className="text-xs text-slate-500 mt-1">
        Cutoff: {formatGameDate(ragQuery.gameDateTimestamp)}
      </div>
    </div>
  );
}
