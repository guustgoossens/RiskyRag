import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  Swords,
  Bot,
  ChevronRight,
  Check,
  BrainCircuit,
} from "lucide-react";

/**
 * RISKYRAG LOBBY / SCENARIO SELECTION
 * * Design Philosophy:
 * "The Digital War Room" - A collision of Grand Strategy (Gold/Parchment)
 * and Cyber-Intelligence (Dark Glass/Teal).
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

// --- Mock Data ---
const SCENARIOS = [
  {
    id: "1453",
    year: 1453,
    title: "Fall of Constantinople",
    description:
      "The Ottoman Empire besieges the Byzantine capital. The end of the Middle Ages is at hand. Will the walls hold?",
    imageColor: "bg-red-900", // Placeholder for art
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
    id: "1776",
    year: 1776,
    title: "American Revolution",
    description:
      "The colonies rise against the Crown. A new nation is forged in fire, but the Empire strikes back with fury.",
    imageColor: "bg-blue-900",
    factions: [
      {
        id: "britain",
        name: "Great Britain",
        color: "#B91C1C",
        type: "imperial",
        strength: "Royal Navy, Discipline",
      },
      {
        id: "colonies",
        name: "Thirteen Colonies",
        color: "#2563EB",
        type: "revolutionary",
        strength: "Guerilla Tactics, Morale",
      },
      {
        id: "france",
        name: "Kingdom of France",
        color: "#FCD34D",
        type: "ally",
        strength: "Support Fleet, Artillery",
      },
    ],
  },
  {
    id: "1914",
    year: 1914,
    title: "The Great War",
    description:
      "Alliances have been drawn. The powder keg of Europe is sparked. Modern warfare changes the world forever.",
    imageColor: "bg-stone-800",
    factions: [
      {
        id: "germany",
        name: "German Empire",
        color: "#1C1917",
        type: "central",
        strength: "Industrial Might, U-Boats",
      },
      {
        id: "france",
        name: "French Republic",
        color: "#3B82F6",
        type: "entente",
        strength: "Elan Vital, Defensive Lines",
      },
      {
        id: "russia",
        name: "Russian Empire",
        color: "#166534",
        type: "entente",
        strength: "Manpower, Vast Territory",
      },
      {
        id: "britain",
        name: "British Empire",
        color: "#B91C1C",
        type: "entente",
        strength: "Expeditionary Force, Navy",
      },
    ],
  },
];

const AI_MODELS = [
  {
    id: "gpt4",
    name: "Strategos-4 (GPT-4)",
    desc: "Balanced, diplomatic, high strategic depth.",
    complexity: "High",
  },
  {
    id: "claude",
    name: "Historian-3 (Claude)",
    desc: "Cautious, historically accurate decisions.",
    complexity: "Medium",
  },
  {
    id: "llama",
    name: "Warlord-3.2 (Llama)",
    desc: "Aggressive, expansionist, rapid turns.",
    complexity: "High",
  },
];

export default function Lobby() {
  const navigate = useNavigate();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [playerNationId, setPlayerNationId] = useState<string | null>(null);
  const [opponents, setOpponents] = useState<Record<string, { enabled?: boolean; model: string }>>({});
  const [isLaunching, setIsLaunching] = useState(false);

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenarioId);

  // Initialize opponents when scenario changes
  useEffect(() => {
    if (activeScenario && playerNationId) {
      const initialOpponents: Record<string, { enabled?: boolean; model: string }> = {};
      activeScenario.factions
        .filter((f) => f.id !== playerNationId)
        .forEach((f) => {
          initialOpponents[f.id] = { enabled: true, model: "gpt4" };
        });
      setOpponents(initialOpponents);
    }
  }, [selectedScenarioId, playerNationId]);

  const handleStartGame = () => {
    setIsLaunching(true);
    // Generate a unique game ID (in production this would come from backend)
    const gameId = `${selectedScenarioId}-${Date.now()}`;
    // Simulate API call then navigate
    setTimeout(() => {
      navigate({ to: "/game/$gameId", params: { gameId } });
    }, 1500);
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

                {/* 1. Player Nation Selection (The "Old World" UI) */}
                <div className="mb-8">
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

                {/* 2. AI Opponents Setup (The "New World" UI) */}
                {playerNationId && (
                  <div className="flex-1 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px bg-[#00FFA3]/30 flex-1" />
                      <h3 className="font-mono text-[#00FFA3] text-sm tracking-wider">
                        OPPOSING INTELLIGENCE
                      </h3>
                      <div className="h-px bg-[#00FFA3]/30 flex-1" />
                    </div>

                    <div className="space-y-4 mb-8">
                      {activeScenario.factions
                        .filter((f) => f.id !== playerNationId)
                        .map((faction) => (
                          <div
                            key={faction.id}
                            className="bg-slate-900/60 border border-[#00FFA3]/20 rounded p-4 flex flex-col md:flex-row gap-4 items-center"
                          >
                            {/* Faction Info */}
                            <div className="flex items-center gap-3 w-full md:w-1/3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 font-serif font-bold">
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
                                    setOpponents((prev) => ({
                                      ...prev,
                                      [faction.id]: {
                                        ...prev[faction.id],
                                        model: e.target.value,
                                      },
                                    }));
                                  }}
                                  value={opponents[faction.id]?.model || "gpt4"}
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
                              BEGIN CAMPAIGN
                            </span>
                            <Swords
                              className={`w-5 h-5 ${COLORS.voidNavyDark} group-hover:rotate-12 transition-transform`}
                            />
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
                          Estimated Simulation Time: Infinite
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
