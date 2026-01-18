import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  Swords,
  Bot,
  ChevronRight,
  Check,
  BrainCircuit,
  Eye,
  User,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * RISKYRAG LOBBY / SCENARIO SELECTION
 * Connected to Convex backend for real game creation.
 */

// --- Design System Constants ---
const COLORS = {
  voidNavy: "bg-[#0F172A]",
  voidNavyDark: "bg-[#0F172A]",
  parchment: "bg-[#F5E6CC]",
  parchmentDark: "bg-[#E6D5B8]",
  imperialGold: "text-[#D4AF37]",
  imperialGoldBorder: "border-[#D4AF37]",
  cognitiveTeal: "text-[#00FFA3]",
  cognitiveTealBorder: "border-[#00FFA3]",
  cognitiveTealBg: "bg-[#00FFA3]",
  warCrimson: "text-[#C0392B]",
};

// --- Scenario Data (maps to Convex scenarios) ---
// Only scenarios that are implemented in convex/scenarios.ts
const SCENARIOS = [
  {
    id: "1453",
    year: 1453,
    title: "Fall of Constantinople",
    description:
      "The Ottoman Empire besieges the Byzantine capital. The end of the Middle Ages is at hand. Will the walls hold?",
    imageColor: "bg-red-900",
    factions: [
      {
        id: "ottoman",
        name: "Ottoman Empire",
        color: "#B91C1C",
        type: "aggressor",
        strength: "Overwhelming numbers, Janissaries",
      },
      {
        id: "byzantine",
        name: "Byzantine Empire",
        color: "#7E22CE",
        type: "defender",
        strength: "The Theodosian Walls, Greek Fire",
      },
      {
        id: "venice",
        name: "Republic of Venice",
        color: "#0369A1",
        type: "mercantile",
        strength: "Naval Superiority, Wealth",
      },
    ],
  },
  {
    id: "1861",
    year: 1861,
    title: "American Civil War",
    description:
      "The Union fights to preserve the nation while the Confederacy battles for independence. Control of the Mississippi will decide the war.",
    imageColor: "bg-gradient-to-br from-blue-900 to-gray-700",
    factions: [
      {
        id: "union",
        name: "Union",
        color: "#1565C0",
        type: "federal",
        strength: "Industrial Might, Naval Superiority",
      },
      {
        id: "confederacy",
        name: "Confederacy",
        color: "#6B7280",
        type: "rebel",
        strength: "Interior Lines, Superior Generals",
      },
    ],
  },
];

const AI_MODELS = [
  // OpenAI (Frontier)
  {
    id: "gpt-4o",
    name: "GPT-4o",
    desc: "Best strategic reasoning, highest accuracy.",
    complexity: "High",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    desc: "Fast, cost-effective frontier model.",
    complexity: "Medium",
  },
  // Anthropic
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    desc: "Superior reasoning and negotiation.",
    complexity: "High",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku",
    desc: "Fast and cheap, good for testing.",
    complexity: "Low",
  },
  // Self-hosted vLLM on DO GPU Droplet (Open Source)
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    desc: "Best OSS model, 77% BFCL score.",
    complexity: "High",
  },
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    desc: "Strong OSS reasoning model.",
    complexity: "High",
  },
  {
    id: "qwen3-32b",
    name: "Qwen3 32B",
    desc: "Strong multilingual, MoE architecture.",
    complexity: "Medium",
  },
  {
    id: "mistral-nemo-12b",
    name: "Mistral NeMo 12B",
    desc: "Fast inference, 128K context.",
    complexity: "Medium",
  },
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 8B",
    desc: "Lightweight, very fast responses.",
    complexity: "Low",
  },
];

// Map UI faction IDs to Convex nation names
const FACTION_TO_NATION: Record<string, string> = {
  // 1453 - Fall of Constantinople
  ottoman: "Ottoman Empire",
  byzantine: "Byzantine Empire",
  venice: "Venice",
  genoa: "Genoa",
  // 1861 - American Civil War
  union: "Union",
  confederacy: "Confederacy",
};

// Model IDs now match backend MODELS keys directly
// No mapping needed - the ID is the model name

type GameMode = "play" | "spectate";

export default function Lobby() {
  const navigate = useNavigate();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("spectate"); // Default to spectate for AI vs AI
  const [playerNationId, setPlayerNationId] = useState<string | null>(null);
  const [factionModels, setFactionModels] = useState<Record<string, string>>({});
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const createGame = useMutation(api.games.create);
  const joinGame = useMutation(api.players.join);
  const initializeGame = useMutation(api.players.initializeGame);
  const startGame = useMutation(api.games.start);

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenarioId);

  // Initialize faction models when scenario changes
  useEffect(() => {
    if (activeScenario) {
      const initialModels: Record<string, string> = {};
      activeScenario.factions.forEach((f, idx) => {
        // Alternate between models for variety in spectate mode
        initialModels[f.id] = idx === 0 ? "gpt-4o" : "deepseek-r1-70b";
      });
      setFactionModels(initialModels);
    }
  }, [selectedScenarioId]);

  const handleStartGame = async () => {
    if (!selectedScenarioId) return;
    // In play mode, require a nation selection
    if (gameMode === "play" && !playerNationId) return;

    setIsLaunching(true);
    setError(null);

    try {
      // 1. Create the game in Convex
      const gameId = await createGame({
        scenario: selectedScenarioId,
      });

      // 2. In play mode, join as the human player
      if (gameMode === "play" && playerNationId) {
        const playerNation = FACTION_TO_NATION[playerNationId];
        if (!playerNation) {
          throw new Error(`Unknown faction: ${playerNationId}`);
        }

        await joinGame({
          gameId,
          nation: playerNation,
        });
      }

      // 3. Build AI model preferences from faction selections
      const aiModels: Record<string, string> = {};
      for (const [factionId, model] of Object.entries(factionModels)) {
        // In play mode, skip the human player's faction
        if (gameMode === "play" && factionId === playerNationId) continue;

        const nationName = FACTION_TO_NATION[factionId];
        if (nationName) {
          aiModels[nationName] = model || "gpt-4o";
        }
      }

      // 4. Initialize the game (creates AI players and territories)
      await initializeGame({ gameId, aiModels });

      // 5. Start the game
      await startGame({ gameId });

      // 6. Navigate to the game
      navigate({ to: "/game/$gameId", params: { gameId } });
    } catch (err) {
      console.error("Failed to create game:", err);
      setError(err instanceof Error ? err.message : "Failed to create game");
      setIsLaunching(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${COLORS.voidNavy} text-slate-200 font-sans selection:bg-[#D4AF37] selection:text-slate-900 overflow-x-hidden`}
    >
      {/* --- Global Ambient Effects --- */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-900/50 to-slate-950 z-0" />
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0" />

      {/* --- Main Layout --- */}
      <div className="relative z-10 container mx-auto px-6 py-8 h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div
              className={`w-10 h-10 border-2 ${COLORS.imperialGoldBorder} flex items-center justify-center rounded-sm bg-slate-900`}
            >
              <Shield className={`w-6 h-6 ${COLORS.imperialGold}`} />
            </div>
            <div>
              <h1
                className={`font-cinzel uppercase text-2xl tracking-[0.2em] ${COLORS.imperialGold}`}
              >
                RISKYRAG
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse"></span>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  System Online
                </span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-xs font-mono text-[#00FFA3]">
                TEMPORAL ENGINE: ACTIVE
              </div>
              <div className="text-xs text-slate-500">v2.4.0-alpha</div>
            </div>
          </div>
        </header>

        {/* Content Area - Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start lg:items-stretch min-h-0">
          {/* Left/Top: Scenario Carousel */}
          <section
            className={`flex-1 w-full transition-all duration-700 ${selectedScenarioId ? "lg:w-1/2" : "lg:w-full"}`}
          >
            <div className="text-center mb-8">
              <h2 className="font-cinzel uppercase text-4xl text-slate-100 mb-2">
                SELECT CAMPAIGN
              </h2>
              <p className="font-mono text-sm text-[#00FFA3]/70">
                Choose your point of divergence.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-center h-full max-h-[600px]">
              {SCENARIOS.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                const isInactive = selectedScenarioId && !isSelected;

                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenarioId(scenario.id);
                      setPlayerNationId(null); // Reset player choice
                    }}
                    className={`
                      relative group transition-all duration-500 ease-out text-left
                      w-full md:w-[320px]
                      ${isSelected ? "h-[500px] md:scale-105 z-20" : "h-[400px] opacity-80 hover:opacity-100"}
                      ${isInactive ? "opacity-40 grayscale scale-95" : ""}
                      rounded-lg overflow-hidden border-2
                      ${
                        isSelected
                          ? "border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                          : "border-slate-700 hover:border-[#D4AF37]/50"
                      }
                    `}
                  >
                    {/* Scenario Art Placeholder */}
                    <div
                      className={`absolute inset-0 ${scenario.imageColor} mix-blend-multiply opacity-60 transition-transform duration-700 group-hover:scale-110`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col h-full justify-end">
                      {/* Top Year Badge */}
                      <div className="absolute top-6 right-6">
                        <div
                          className={`
                           px-3 py-1 border border-[#00FFA3]/50 bg-slate-900/80 backdrop-blur-sm
                           text-[#00FFA3] font-mono text-lg font-bold
                           ${isSelected ? "animate-pulse" : ""}
                         `}
                        >
                          {scenario.year}
                        </div>
                      </div>

                      <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                        <h3
                          className={`font-cinzel uppercase text-2xl mb-2 text-[#F5E6CC]`}
                        >
                          {scenario.title}
                        </h3>
                        <p
                          className={`text-sm font-sans leading-relaxed mb-4 ${isSelected ? "text-slate-300" : "text-slate-500 line-clamp-3"}`}
                        >
                          {scenario.description}
                        </p>

                        {/* Faction Pills */}
                        <div className="flex flex-wrap gap-2">
                          {scenario.factions.map((f) => (
                            <span
                              key={f.id}
                              className="text-[10px] uppercase tracking-wider px-2 py-1 bg-slate-800/80 border border-slate-700 text-slate-400 rounded"
                            >
                              {f.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Selection Check */}
                      {isSelected && (
                        <div className="absolute top-6 left-6 w-8 h-8 bg-[#D4AF37] text-slate-900 flex items-center justify-center rounded-full shadow-lg animate-bounce-short">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right/Bottom: Configuration Panel */}
          {/* Only visible when a scenario is selected */}
          {activeScenario && (
            <section className="flex-1 w-full lg:w-1/2 animate-slide-in-right">
              <div className="h-full bg-slate-800/30 backdrop-blur-md border-l border-white/5 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
                <h2 className="font-mono text-[#00FFA3] text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BrainCircuit size={16} />
                  Match Configuration
                </h2>

                {/* Game Mode Toggle */}
                <div className="mb-6">
                  <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                    <button
                      onClick={() => {
                        setGameMode("spectate");
                        setPlayerNationId(null);
                      }}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md
                        font-mono text-sm transition-all duration-200
                        ${gameMode === "spectate"
                          ? "bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/30"
                          : "text-slate-400 hover:text-slate-200"
                        }
                      `}
                    >
                      <Eye size={16} />
                      Spectate AI vs AI
                    </button>
                    <button
                      onClick={() => setGameMode("play")}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md
                        font-mono text-sm transition-all duration-200
                        ${gameMode === "play"
                          ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                          : "text-slate-400 hover:text-slate-200"
                        }
                      `}
                    >
                      <User size={16} />
                      Play as Human
                    </button>
                  </div>
                </div>

                {/* Player Nation Selection - Only in Play mode */}
                {gameMode === "play" && (
                  <div className="mb-8 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px bg-[#D4AF37]/30 flex-1" />
                      <h3 className="font-serif text-[#D4AF37] text-xl">
                        Select Your Nation
                      </h3>
                      <div className="h-px bg-[#D4AF37]/30 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeScenario.factions.map((faction) => {
                        const isSelected = playerNationId === faction.id;
                        return (
                          <button
                            key={faction.id}
                            onClick={() => setPlayerNationId(faction.id)}
                            className={`
                              relative p-4 text-left border-2 rounded transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-[#F5E6CC] border-[#D4AF37] shadow-lg translate-x-1"
                                  : "bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                              }
                            `}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div
                                  className={`font-serif font-bold ${isSelected ? "text-[#0F172A]" : "text-slate-200"}`}
                                >
                                  {faction.name}
                                </div>
                                <div
                                  className={`text-xs mt-1 ${isSelected ? "text-slate-700" : "text-slate-400"}`}
                                >
                                  {faction.strength}
                                </div>
                              </div>
                              {/* Color Swatch */}
                              <div
                                className="w-4 h-4 rounded-full border border-black/20"
                                style={{ backgroundColor: faction.color }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Configuration - Show when ready */}
                {(gameMode === "spectate" || (gameMode === "play" && playerNationId)) && (
                  <div className="flex-1 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px bg-[#00FFA3]/30 flex-1" />
                      <h3 className="font-mono text-[#00FFA3] text-sm tracking-wider">
                        {gameMode === "spectate" ? "AI COMBATANTS" : "OPPOSING INTELLIGENCE"}
                      </h3>
                      <div className="h-px bg-[#00FFA3]/30 flex-1" />
                    </div>

                    <div className="space-y-4 mb-8">
                      {activeScenario.factions
                        .filter((f) => gameMode === "spectate" || f.id !== playerNationId)
                        .map((faction) => (
                          <div
                            key={faction.id}
                            className="bg-slate-900/60 border border-[#00FFA3]/20 rounded p-4 flex flex-col md:flex-row gap-4 items-center"
                          >
                            {/* Faction Info */}
                            <div className="flex items-center gap-3 w-full md:w-1/3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-white"
                                style={{ backgroundColor: faction.color }}
                              >
                                {faction.name.charAt(0)}
                              </div>
                              <span className="text-slate-300 font-serif text-sm">
                                {faction.name}
                              </span>
                            </div>

                            {/* AI Model Selector */}
                            <div className="flex-1 w-full">
                              <div className="relative">
                                <Bot
                                  size={14}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00FFA3]"
                                />
                                <select
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-10 py-2 text-xs font-mono text-slate-300 focus:border-[#00FFA3] focus:outline-none appearance-none cursor-pointer hover:bg-slate-900"
                                  onChange={(e) => {
                                    setFactionModels((prev) => ({
                                      ...prev,
                                      [faction.id]: e.target.value,
                                    }));
                                  }}
                                  value={factionModels[faction.id] || "gpt-4o"}
                                >
                                  {AI_MODELS.map((model) => (
                                    <option key={model.id} value={model.id}>
                                      {model.name}
                                    </option>
                                  ))}
                                </select>
                                {/* Custom arrow to avoid browser default ugly one */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                  <ChevronRight
                                    size={12}
                                    className="rotate-90"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Temporal Knowledge Badge */}
                            <div className="hidden md:flex flex-col items-end min-w-[100px]">
                              <span className="text-[10px] text-slate-500 font-mono uppercase">
                                Knowledge Cap
                              </span>
                              <span className="text-xs text-[#00FFA3] font-mono border border-[#00FFA3]/30 px-2 rounded bg-[#00FFA3]/5">
                                ≤ {activeScenario.year}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Launch Button */}
                    <div className="mt-auto pt-6 border-t border-slate-700">
                      {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm">
                          {error}
                        </div>
                      )}
                      <button
                        onClick={handleStartGame}
                        disabled={isLaunching}
                        className={`
                          w-full group relative overflow-hidden rounded py-4 px-6
                          flex items-center justify-center gap-3
                          transition-all duration-300
                          ${isLaunching ? "bg-slate-800 cursor-wait" : "bg-[#D4AF37] hover:bg-[#F5E6CC] shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]"}
                        `}
                      >
                        {isLaunching ? (
                          <>
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            <span className="font-cinzel font-bold text-slate-400 tracking-widest">
                              INITIALIZING RAG...
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className={`font-serif font-bold text-lg tracking-[0.15em] ${COLORS.voidNavyDark}`}
                            >
                              {gameMode === "spectate" ? "START SIMULATION" : "BEGIN CAMPAIGN"}
                            </span>
                            {gameMode === "spectate" ? (
                              <Eye className={`w-5 h-5 ${COLORS.voidNavyDark}`} />
                            ) : (
                              <Swords
                                className={`w-5 h-5 ${COLORS.voidNavyDark} group-hover:rotate-12 transition-transform`}
                              />
                            )}
                          </>
                        )}

                        {/* Decorative Lines on Button */}
                        {!isLaunching && (
                          <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-900/10" />
                        )}
                        {!isLaunching && (
                          <div className="absolute top-0 bottom-0 right-4 w-px bg-slate-900/10" />
                        )}
                      </button>

                      <div className="text-center mt-3">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                          {gameMode === "spectate"
                            ? "Watch AI models compete in real-time"
                            : "Estimated Simulation Time: Infinite"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* CSS Utility for Animations (simulated in JS for file completeness) */}
      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10%); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s infinite;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom Scrollbar for the Cyber-feel */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 163, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 163, 0.4);
        }
      `}</style>
    </div>
  );
}
