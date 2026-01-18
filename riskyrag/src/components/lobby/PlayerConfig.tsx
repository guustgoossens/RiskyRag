import { cn } from "@/lib/utils";
import { User, Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import type { LLMModel } from "@/types";

interface PlayerSlot {
  id: string;
  isHuman: boolean;
  name: string;
  nation: string;
  model?: LLMModel;
}

interface PlayerConfigProps {
  players: PlayerSlot[];
  availableNations: string[];
  onUpdatePlayer: (id: string, updates: Partial<PlayerSlot>) => void;
  onAddAI: () => void;
  onRemovePlayer: (id: string) => void;
}

const AI_MODELS: { value: LLMModel; label: string; description: string }[] = [
  // OpenAI
  { value: "gpt-4o", label: "GPT-4o", description: "Best strategic reasoning" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast, cost-effective" },
  // Anthropic
  { value: "claude-sonnet", label: "Claude Sonnet", description: "Superior negotiation" },
  // DigitalOcean Gradient
  { value: "deepseek-r1-70b", label: "DeepSeek R1 70B", description: "Best open-source reasoning" },
  { value: "mistral-nemo", label: "Mistral NeMo 12B", description: "Fast, 128K context" },
  { value: "llama-3.1-8b", label: "Llama 3.1 8B", description: "Lightweight, fast" },
  { value: "qwen3-32b", label: "Qwen3 32B", description: "Strong multilingual" },
  // Self-hosted vLLM
  { value: "llama-3.2-7b", label: "Llama 3.2 7B (vLLM)", description: "Local inference" },
];

export function PlayerConfig({
  players,
  availableNations,
  onUpdatePlayer,
  onAddAI,
  onRemovePlayer,
}: PlayerConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Players</h3>

      {/* Player Slots */}
      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl",
              "bg-slate-800/50 border border-slate-700"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                player.isHuman ? "bg-blue-600" : "bg-purple-600"
              )}
            >
              {player.isHuman ? (
                <User className="w-6 h-6 text-white" />
              ) : (
                <Bot className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Config Fields */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {/* Name / Model */}
              {player.isHuman ? (
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) =>
                    onUpdatePlayer(player.id, { name: e.target.value })
                  }
                  placeholder="Your name"
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <div className="relative">
                  <select
                    value={player.model}
                    onChange={(e) =>
                      onUpdatePlayer(player.id, {
                        model: e.target.value as LLMModel,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {AI_MODELS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}

              {/* Nation */}
              <div className="relative">
                <select
                  value={player.nation}
                  onChange={(e) =>
                    onUpdatePlayer(player.id, { nation: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Nation</option>
                  {availableNations.map((nation) => (
                    <option key={nation} value={nation}>
                      {nation}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Remove Button (for AI only) */}
            {!player.isHuman && (
              <button
                onClick={() => onRemovePlayer(player.id)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add AI Button */}
      {players.length < 4 && (
        <Button variant="secondary" onClick={onAddAI} className="w-full">
          <Bot className="w-4 h-4 mr-2" />
          Add AI Opponent
        </Button>
      )}
    </div>
  );
}
