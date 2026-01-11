import { useState, useCallback } from "react";
import type { HistoricalSnippet } from "@/types";

interface UseTemporalRagReturn {
  query: (question: string) => Promise<void>;
  answer: string | null;
  snippets: HistoricalSnippet[];
  isLoading: boolean;
  error: Error | null;
  knowledgeCutoff: number;
}

export function useTemporalRag(maxDate: number): UseTemporalRagReturn {
  const [answer, setAnswer] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<HistoricalSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const query = useCallback(
    async (_question: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Placeholder - will be replaced with Convex action
        // This will call api.rag.queryHistory({ question, maxDate })

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock response
        setAnswer(
          `Based on historical records up to ${new Date(maxDate).getFullYear()}, I can tell you that...`
        );
        setSnippets([
          {
            _id: "snippet-1",
            content: "Historical context about the query...",
            eventDate: maxDate - 86400000 * 30,
            publicationDate: maxDate - 86400000 * 30,
            source: "Wikipedia",
            region: "Europe",
            tags: ["history", "politics"],
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to query history"));
      } finally {
        setIsLoading(false);
      }
    },
    [maxDate]
  );

  return {
    query,
    answer,
    snippets,
    isLoading,
    error,
    knowledgeCutoff: maxDate,
  };
}
