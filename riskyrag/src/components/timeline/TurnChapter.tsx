/**
 * TurnChapter - Expandable panel showing all activity for a turn
 * Displays moves, reasoning, RAG queries with citations, and agent notes
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TurnData } from "@/hooks/useTurnTimeline";
import { getTurnSummary } from "@/hooks/useTurnTimeline";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ChevronDown,
  ChevronUp,
  Swords,
  Shield,
  MessageCircle,
  BookOpen,
  Brain,
  Clock,
  StickyNote,
  ArrowRight,
} from "lucide-react";
import { SourceCitation } from "@/components/citations/SourceCitation";

interface TurnChapterProps {
  turnData: TurnData;
  isSpectatorMode: boolean;
  className?: string;
}

// Map nation names to colors
const NATION_COLORS: Record<string, string> = {
  "Ottoman Empire": "#22c55e",
  "Byzantine Empire": "#a855f7",
  "Venice": "#3b82f6",
  "Genoa": "#ef4444",
  "Union": "#3b82f6",
  "Confederacy": "#6b7280",
};

// Action icons
const ACTION_ICONS: Record<string, React.ReactNode> = {
  attack: <Swords className="w-4 h-4 text-red-400" />,
  reinforce: <Shield className="w-4 h-4 text-blue-400" />,
  fortify: <ArrowRight className="w-4 h-4 text-green-400" />,
  negotiate: <MessageCircle className="w-4 h-4 text-amber-400" />,
  negotiate_response: <MessageCircle className="w-4 h-4 text-amber-400" />,
  query: <BookOpen className="w-4 h-4 text-indigo-400" />,
  end_turn: <Clock className="w-4 h-4 text-slate-400" />,
  done_checkpoint: <Brain className="w-4 h-4 text-purple-400" />,
};

export function TurnChapter({
  turnData,
  isSpectatorMode,
  className,
}: TurnChapterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const summary = getTurnSummary(turnData);
  const nationColor = summary.activePlayer
    ? NATION_COLORS[summary.activePlayer] ?? "#64748b"
    : "#64748b";

  // Get RAG query details for this turn's activities
  const activityIds = turnData.activities.map((a) => a._id);
  const firstActivityId = activityIds[0];
  const activityDetails = useQuery(
    api.agentStreaming.getFullActivityDetails,
    firstActivityId ? { activityId: firstActivityId } : "skip"
  );

  return (
    <div
      className={cn(
        "bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden",
        className
      )}
      style={{ borderLeftColor: nationColor, borderLeftWidth: 4 }}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2"
            style={{ borderColor: nationColor, color: nationColor }}
          >
            {turnData.turn}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">
              Turn {turnData.turn}
              {summary.activePlayer && (
                <span className="ml-2 text-slate-400">
                  - {summary.activePlayer}
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
              {summary.attackCount > 0 && (
                <span className="flex items-center gap-1">
                  <Swords className="w-3 h-3" /> {summary.attackCount}
                </span>
              )}
              {summary.diplomaticCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {summary.diplomaticCount}
                </span>
              )}
              {summary.historicalQueries > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {summary.historicalQueries}
                </span>
              )}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Agent reasoning/strategy (if available) */}
          {turnData.activities.map((activity) => (
            activity.doneCheckpoint && (
              <div
                key={activity._id}
                className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-purple-400 uppercase tracking-wide mb-2">
                  <Brain className="w-4 h-4" /> Strategy Summary
                </div>
                <p className="text-sm text-slate-300">
                  {activity.doneCheckpoint.strategySummary}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>Confidence: {activity.doneCheckpoint.confidence}</span>
                  <span>|</span>
                  <span>
                    Checklist: {activity.doneCheckpoint.checklistScore}/5
                  </span>
                </div>
              </div>
            )
          ))}

          {/* Action log */}
          {turnData.logs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Actions
              </div>
              {turnData.logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="mt-0.5">
                    {ACTION_ICONS[log.action] ?? (
                      <div className="w-4 h-4 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <ActionDescription action={log.action} details={log.details} />
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* RAG Queries with citations */}
          {activityDetails?.ragQueries && activityDetails.ragQueries.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Historical Queries
              </div>
              {activityDetails.ragQueries.map((query) => (
                <div
                  key={query._id}
                  className="p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg"
                >
                  <p className="text-sm text-white italic">"{query.question}"</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-green-400">
                      {query.snippetsReturned} sources
                    </span>
                    {query.snippetsBlocked > 0 && (
                      <span className="text-amber-400">
                        {query.snippetsBlocked} blocked (future events)
                      </span>
                    )}
                  </div>
                  {/* Show snippets with citations */}
                  {query.snippets && query.snippets.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {query.snippets.slice(0, 3).map((snippet, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-400 truncate max-w-[70%]">
                            {snippet.title ?? snippet.content.slice(0, 50)}
                          </span>
                          <SourceCitation
                            url={snippet.sourceUrl ?? null}
                            source={snippet.source}
                            variant="inline"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Negotiations */}
          {turnData.negotiations.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Diplomacy
              </div>
              {turnData.negotiations.map((neg) => {
                const sender = turnData.players.get(neg.senderId);
                const recipient = turnData.players.get(neg.recipientId);
                return (
                  <div
                    key={neg._id}
                    className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span style={{ color: sender?.color }}>
                        {sender?.nation ?? "Unknown"}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span style={{ color: recipient?.color }}>
                        {recipient?.nation ?? "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{neg.message}</p>
                    {neg.status && neg.status !== "pending" && (
                      <div className="mt-2 text-xs">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded",
                            neg.status === "accepted" && "bg-green-900/50 text-green-400",
                            neg.status === "rejected" && "bg-red-900/50 text-red-400",
                            neg.status === "countered" && "bg-blue-900/50 text-blue-400"
                          )}
                        >
                          {neg.status}
                        </span>
                        {neg.responseMessage && (
                          <p className="mt-1 text-slate-400 italic">
                            "{neg.responseMessage}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Agent Notes (spectator mode only) */}
          {isSpectatorMode && turnData.notes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <StickyNote className="w-4 h-4" /> Private Notes
              </div>
              {turnData.notes.map((note) => (
                <div
                  key={note._id}
                  className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
                  style={{ borderLeftColor: note.playerColor, borderLeftWidth: 3 }}
                >
                  <div className="text-xs text-slate-500 mb-1">
                    {note.playerNation}
                  </div>
                  <p className="text-sm text-slate-300">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Render human-readable description of an action
 */
function ActionDescription({
  action,
  details,
}: {
  action: string;
  details: any;
}) {
  switch (action) {
    case "attack":
      return (
        <span className="text-slate-300">
          Attacked{" "}
          <span className="text-red-400">{details?.to ?? details?.toTerritory}</span>{" "}
          from{" "}
          <span className="text-blue-400">{details?.from ?? details?.fromTerritory}</span>
          {details?.conquered && (
            <span className="ml-1 text-green-400">(Conquered!)</span>
          )}
        </span>
      );
    case "reinforce":
      return (
        <span className="text-slate-300">
          Reinforced{" "}
          <span className="text-blue-400">{details?.territory}</span> with{" "}
          <span className="text-green-400">{details?.troops}</span> troops
        </span>
      );
    case "fortify":
      return (
        <span className="text-slate-300">
          Fortified from{" "}
          <span className="text-blue-400">{details?.from}</span> to{" "}
          <span className="text-green-400">{details?.to}</span>
        </span>
      );
    case "negotiate":
      return (
        <span className="text-slate-300">
          Sent diplomatic message to{" "}
          <span className="text-amber-400">{details?.recipientNation}</span>
        </span>
      );
    case "query":
      return (
        <span className="text-slate-300">
          Queried history:{" "}
          <span className="text-indigo-400 italic">
            "{details?.question?.slice(0, 40)}..."
          </span>
        </span>
      );
    case "done_checkpoint":
      return (
        <span className="text-slate-300">
          Validated strategy -{" "}
          <span className="text-purple-400">{details?.status}</span>
        </span>
      );
    case "end_turn":
      return <span className="text-slate-500">Ended turn</span>;
    default:
      return <span className="text-slate-400">{action}</span>;
  }
}

export default TurnChapter;
