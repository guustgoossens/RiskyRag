import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { Player, ChatMessage } from "@/types";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlayer: Player | null;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isThinking?: boolean;
}

export function ChatDrawer({
  isOpen,
  onClose,
  targetPlayer,
  messages,
  onSendMessage,
  isThinking = false,
}: ChatDrawerProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  if (!isOpen || !targetPlayer) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-700">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: targetPlayer.color }}
        >
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">{targetPlayer.nation}</div>
          <div className="flex items-center gap-2">
            {targetPlayer.model && (
              <Badge size="sm" variant="default">
                {targetPlayer.model}
              </Badge>
            )}
            {isThinking && (
              <span className="text-xs text-amber-400 flex items-center">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Thinking...
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.type === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.type === "user"
                  ? "bg-blue-600"
                  : "bg-purple-600"
              )}
            >
              {message.type === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2",
                message.type === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-800 text-slate-200 rounded-tl-none"
              )}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Diplomatic Actions */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/50">
        <div className="flex gap-2 mb-3">
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            Propose Alliance
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            Ceasefire
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs text-red-400">
            Declare War
          </Button>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            className={cn(
              "flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg",
              "text-white placeholder-slate-500 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-amber-500"
            )}
          />
          <Button type="submit" disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
