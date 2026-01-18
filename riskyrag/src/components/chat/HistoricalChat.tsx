/**
 * HistoricalChat - Inline chat panel for asking historical questions
 * Responds in-persona: "As the Ottoman Empire, I recall..."
 * Shows inline citations in responses
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  BookOpen,
  Send,
  Loader2,
  Clock,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { CitationList } from "@/components/citations/SourceCitation";

interface HistoricalChatProps {
  gameId: Id<"games">;
  playerNation: string;
  gameDate: number;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    url: string | null;
    source: string;
    title?: string | null;
  }>;
  timestamp: number;
  blockedCount?: number;
}

export function HistoricalChat({
  gameId,
  playerNation,
  gameDate,
  className,
}: HistoricalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const synthesizeResponse = useAction(api.rag.synthesizeHistoricalResponse);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput("");

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Query history with LLM synthesis
    setIsLoading(true);
    try {
      const result = await synthesizeResponse({
        gameId,
        question,
        playerNation,
        topK: 5,
        dateRangeYears: 50, // Only show content within ±50 years of game date
      });

      // Create assistant message with synthesized response and citations
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.response,
        citations: result.citations,
        timestamp: Date.now(),
        blockedCount: result.blockedCount,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I was unable to consult the historical archives at this time. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const gameYear = new Date(gameDate).getFullYear();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-indigo-900/30 border border-indigo-700/50 rounded-lg",
          "text-indigo-400 hover:bg-indigo-900/50 transition-colors",
          className
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-sm font-medium">Ask History</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-slate-900/95 border border-indigo-700/30 rounded-lg shadow-xl backdrop-blur-sm overflow-hidden",
        "w-80 h-[400px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-700/30 bg-indigo-900/20">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-400">
            Historical Archives
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {gameYear}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              Ask about historical events known to {playerNation}
            </p>
            <p className="text-xs mt-1 text-slate-600">
              Knowledge limited to {gameYear} and earlier
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "rounded-lg p-2",
              message.role === "user"
                ? "bg-indigo-900/30 ml-6"
                : "bg-slate-800/50 mr-2"
            )}
          >
            <p className="text-sm text-slate-200 whitespace-pre-wrap">
              {message.content}
            </p>

            {/* Blocked events warning */}
            {message.blockedCount !== undefined && message.blockedCount > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>
                  {message.blockedCount} future events hidden
                </span>
              </div>
            )}

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <CitationList citations={message.citations} />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Consulting the archives...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-2 border-t border-indigo-700/30 bg-slate-800/30"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about historical events..."
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default HistoricalChat;
