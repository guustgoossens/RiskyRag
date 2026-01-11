import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Clock, BookOpen, CheckCircle, ExternalLink } from "lucide-react";
import { Modal, Button, Badge } from "@/components/ui";
import { useTemporalRag } from "@/hooks";

interface HistoricalQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxDate: number;
  playerNation?: string;
}

export function HistoricalQueryModal({
  isOpen,
  onClose,
  maxDate,
  playerNation = "the Empire",
}: HistoricalQueryModalProps) {
  const [inputValue, setInputValue] = useState("");
  const { query, answer, snippets, isLoading, knowledgeCutoff } =
    useTemporalRag(maxDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      query(inputValue);
    }
  };

  const cutoffYear = new Date(knowledgeCutoff).getFullYear();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historical Knowledge" size="lg">
      <div className="space-y-6">
        {/* Knowledge Cutoff Badge */}
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm font-medium text-amber-400">
                Temporal Filter Active
              </div>
              <div className="text-xs text-slate-400">
                Knowledge cutoff: <span className="font-bold">{cutoffYear}</span>
              </div>
            </div>
          </div>
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Future events blocked
          </Badge>
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-slate-300">
            Ask {playerNation} about history:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`"What happened at Constantinople?" or "Tell me about the Theodosian walls"`}
              className={cn(
                "flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg",
                "text-white placeholder-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              )}
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              <Search className="w-4 h-4 mr-1" />
              {isLoading ? "Searching..." : "Ask"}
            </Button>
          </div>
        </form>

        {/* Answer */}
        {answer && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-slate-300 mb-2">
                    Historical Account
                  </div>
                  <p className="text-slate-200 leading-relaxed">{answer}</p>
                </div>
              </div>
            </div>

            {/* Citations */}
            {snippets.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Sources
                </div>
                {snippets.map((snippet) => (
                  <div
                    key={snippet._id}
                    className="flex items-start gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <div className="text-slate-300 line-clamp-2">
                        {snippet.content}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{snippet.source}</span>
                        <span>•</span>
                        <span>
                          {new Date(snippet.eventDate).getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
            <span className="ml-3 text-slate-400">
              Searching historical records...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!answer && !isLoading && (
          <div className="text-center py-8 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Ask a question to explore historical knowledge</p>
            <p className="text-sm mt-1">
              Limited to events before {cutoffYear}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
