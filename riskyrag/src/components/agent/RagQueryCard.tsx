/**
 * RagQueryCard - Displays a RAG query with temporal filter visualization and source citations
 */

import { cn } from "@/lib/utils";
import type { AgentRagQuery } from "@/hooks/useAgentStream";
import { TemporalFilterBadge } from "./TemporalFilterBadge";
import { SourceCitation, CitationList } from "@/components/citations/SourceCitation";

interface RagQueryCardProps {
  ragQuery: AgentRagQuery;
  className?: string;
  showSnippets?: boolean;
}

export function RagQueryCard({ ragQuery, className, showSnippets = true }: RagQueryCardProps) {
  const snippets = ragQuery.snippets ?? [];

  return (
    <div
      className={cn(
        "p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg",
        className
      )}
    >
      {/* Header with icon */}
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-indigo-800/50 rounded">
          <svg
            className="w-4 h-4 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-indigo-400 uppercase tracking-wide">
            Historical Query
          </div>
          <p className="text-sm text-white mt-1 italic">
            "{ragQuery.question}"
          </p>
        </div>
      </div>

      {/* Temporal filter info */}
      <TemporalFilterBadge ragQuery={ragQuery} />

      {/* Snippets with inline citations */}
      {showSnippets && snippets.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Sources Found
          </div>
          {snippets.slice(0, 3).map((snippet, index) => (
            <div
              key={index}
              className="p-2 bg-slate-800/50 rounded text-xs"
            >
              <p className="text-slate-300 line-clamp-2">
                {snippet.content}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-500 text-[10px]">
                  {snippet.date ? new Date(snippet.date).getFullYear() : "Unknown"}
                </span>
                <SourceCitation
                  url={snippet.sourceUrl ?? null}
                  source={snippet.source}
                  title={snippet.title}
                  variant="inline"
                />
              </div>
            </div>
          ))}
          {snippets.length > 3 && (
            <p className="text-xs text-slate-500 italic">
              +{snippets.length - 3} more sources
            </p>
          )}
        </div>
      )}

      {/* Citation list at bottom */}
      {snippets.length > 0 && (
        <CitationList
          citations={snippets.map((s) => ({
            url: s.sourceUrl ?? null,
            source: s.source,
            title: s.title,
          }))}
        />
      )}
    </div>
  );
}

/**
 * Compact inline version for the tool calls list
 */
interface RagQueryInlineProps {
  question: string;
  snippetsReturned: number;
  snippetsBlocked: number;
  snippets?: Array<{
    title?: string;
    source: string;
    sourceUrl?: string;
  }>;
}

export function RagQueryInline({
  question,
  snippetsReturned,
  snippetsBlocked,
  snippets,
}: RagQueryInlineProps) {
  return (
    <div className="mt-1 pl-6">
      <p className="text-xs text-slate-400 italic truncate">
        "{question.length > 60 ? question.slice(0, 60) + "..." : question}"
      </p>
      <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
        <span className="text-green-400">{snippetsReturned} sources</span>
        {snippetsBlocked > 0 && (
          <span className="text-amber-400">
            {snippetsBlocked} blocked
          </span>
        )}
        {snippets && snippets.length > 0 && (
          <div className="flex gap-1">
            {snippets.slice(0, 2).map((snippet, index) => (
              <SourceCitation
                key={index}
                url={snippet.sourceUrl ?? null}
                source={snippet.source}
                title={snippet.title}
                variant="inline"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
