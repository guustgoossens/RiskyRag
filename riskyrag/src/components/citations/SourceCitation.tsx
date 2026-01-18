/**
 * SourceCitation - Displays a clickable source citation link
 * Uses Imperial Gold color scheme for historical authenticity
 */

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceCitationProps {
  url: string | null;
  source: string;
  title?: string | null;
  className?: string;
  variant?: "inline" | "block";
}

/**
 * Formats a source name for display
 */
function formatSourceName(source: string): string {
  const sourceNames: Record<string, string> = {
    wikipedia: "Wikipedia",
    britannica: "Britannica",
    historychannel: "History Channel",
    worldhistory: "World History",
    unknown: "Source",
  };
  return sourceNames[source.toLowerCase()] ?? source;
}

/**
 * Inline citation link component
 * Displays as [Source] with external link icon
 */
export function SourceCitation({
  url,
  source,
  title,
  className,
  variant = "inline",
}: SourceCitationProps) {
  const displayName = title
    ? title.length > 30
      ? title.slice(0, 30) + "..."
      : title
    : formatSourceName(source);

  if (!url) {
    return (
      <span
        className={cn(
          "text-slate-500 text-xs italic",
          variant === "block" && "block mt-1",
          className
        )}
      >
        [{displayName}]
      </span>
    );
  }

  if (variant === "block") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1.5 text-[#00FFA3] hover:text-[#00FFA3]/80 transition-colors mt-2 text-xs group",
          className
        )}
      >
        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        <span className="underline underline-offset-2">{displayName}</span>
        <span className="text-slate-500">({formatSourceName(source)})</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-[#00FFA3] hover:text-[#00FFA3]/80 transition-colors text-xs group",
        className
      )}
      title={`View source: ${title ?? source}`}
    >
      <span className="inline-flex items-center gap-1">
        [{formatSourceName(source)}
        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />]
      </span>
    </a>
  );
}

/**
 * Citation list for multiple sources
 */
interface CitationListProps {
  citations: Array<{
    url: string | null;
    source: string;
    title?: string | null;
  }>;
  className?: string;
}

export function CitationList({ citations, className }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-700/50",
        className
      )}
    >
      <span className="text-xs text-slate-500 uppercase tracking-wide">
        Sources:
      </span>
      {citations.map((citation, index) => (
        <SourceCitation
          key={index}
          url={citation.url}
          source={citation.source}
          title={citation.title}
          variant="inline"
        />
      ))}
    </div>
  );
}

export default SourceCitation;
