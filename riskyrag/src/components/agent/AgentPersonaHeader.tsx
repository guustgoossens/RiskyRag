/**
 * AgentPersonaHeader - Shows nation, model, and game date
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { formatGameDate, type AgentActivity } from "@/hooks/useAgentStream";

interface AgentPersonaHeaderProps {
  activity: AgentActivity;
  onClose?: () => void;
}

// Model display names
const MODEL_NAMES: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "claude-sonnet": "Claude Sonnet",
  "llama-3.2-7b": "Llama 3.2 7B",
};

// Nation colors (from game data)
const NATION_COLORS: Record<string, string> = {
  "Ottoman Empire": "bg-green-900/50 border-green-600",
  "Byzantine Empire": "bg-purple-900/50 border-purple-600",
  Venice: "bg-blue-900/50 border-blue-600",
  "Papal States": "bg-yellow-900/50 border-yellow-600",
  France: "bg-indigo-900/50 border-indigo-600",
  Hungary: "bg-red-900/50 border-red-600",
};

// Nation icons (emoji)
const NATION_ICONS: Record<string, string> = {
  "Ottoman Empire": "\u{1F3F0}",
  "Byzantine Empire": "\u{1F451}",
  Venice: "\u{1F6A2}",
  "Papal States": "\u{26EA}",
  France: "\u{269C}",
  Hungary: "\u{1F3F9}",
};

export function AgentPersonaHeader({
  activity,
  onClose,
}: AgentPersonaHeaderProps) {
  const nation = activity.nation ?? "Unknown";
  const model = activity.model ?? "gpt-4o";
  const modelName = MODEL_NAMES[model] ?? model;
  const nationColor = NATION_COLORS[nation] ?? "bg-slate-800/50 border-slate-600";
  const nationIcon = NATION_ICONS[nation] ?? "\u{1F3C1}";

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border-b",
        nationColor
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{nationIcon}</span>
        <div>
          <h3 className="text-lg font-semibold text-white">{nation}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="info" size="sm">
              {modelName}
            </Badge>
            <span className="text-xs text-slate-400">
              Turn {activity.turn}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activity.gameDateTimestamp && (
          <div className="text-right">
            <div className="text-xs text-slate-400">Knowledge Cutoff</div>
            <div className="text-sm font-medium text-amber-400">
              {formatGameDate(activity.gameDateTimestamp)}
            </div>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Close panel"
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
        )}
      </div>
    </div>
  );
}
