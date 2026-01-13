import { useState, ReactNode } from "react";
import {
  Trophy,
  Skull,
  Clock,
  Scroll,
  Download,
  Share2,
  RotateCcw,
  Home,
  BrainCircuit,
  AlertTriangle,
} from "lucide-react";

// --- MOCK DATA ---
const GAME_RESULTS = {
  outcome: "victory", // 'victory' or 'defeat'
  scenario: "1453 - Fall of Constantinople",
  duration: "42m 15s",
  totalTurns: 24,
  winnerId: "human-1",
  historicalAccuracy: 87,
  players: [
    {
      id: "human-1",
      name: "Player (You)",
      nation: "Byzantine Empire",
      isHuman: true,
      avatar:
        "https://api.dicebear.com/7.x/initials/svg?seed=BE&backgroundColor=7E22CE",
      color: "border-[#7E22CE]",
      stats: {
        territories: 8,
        troops: 45,
        attacks: 15,
        wins: 12,
        diplomacy: 5,
        queries: 3,
      },
      toolUsage: { attack: 15, fortify: 10, diplomacy: 5, history: 3 },
    },
    {
      id: "ai-1",
      name: "Mehmed II",
      nation: "Ottoman Empire",
      isHuman: false,
      model: "GPT-4",
      avatar:
        "https://api.dicebear.com/7.x/initials/svg?seed=OT&backgroundColor=B91C1C",
      color: "border-[#B91C1C]",
      stats: {
        territories: 2,
        troops: 12,
        attacks: 22,
        wins: 18,
        diplomacy: 2,
        queries: 18,
      },
      toolUsage: { attack: 22, fortify: 8, diplomacy: 2, history: 18 },
    },
    {
      id: "ai-2",
      name: "Doge Foscari",
      nation: "Venice",
      isHuman: false,
      model: "Claude 3 Opus",
      avatar:
        "https://api.dicebear.com/7.x/initials/svg?seed=VE&backgroundColor=0369A1",
      color: "border-[#0369A1]",
      stats: {
        territories: 0,
        troops: 0,
        attacks: 8,
        wins: 3,
        diplomacy: 12,
        queries: 15,
      },
      toolUsage: { attack: 8, fortify: 15, diplomacy: 12, history: 15 },
    },
  ],
};

// --- COMPONENTS ---

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

export const StatCard = ({ icon, label, value, subtext }: StatCardProps) => (
  <div className="flex flex-col items-center justify-center p-4 bg-[#0F172A]/40 border border-imperial-gold/30 rounded-lg backdrop-blur-sm">
    <div className="text-[#D4AF37] mb-2">{icon}</div>
    <div className="font-cinzel text-2xl text-[#F5E6CC]">{value}</div>
    <div className="text-xs font-inter text-slate-400 uppercase tracking-wider">
      {label}
    </div>
    {subtext && (
      <div className="text-[10px] text-slate-500 mt-1">{subtext}</div>
    )}
  </div>
);

interface PlayerStats {
  territories: number;
  troops: number;
  attacks: number;
  wins: number;
  diplomacy: number;
  queries: number;
}

interface ToolUsage {
  attack: number;
  fortify: number;
  diplomacy: number;
  history: number;
}

interface Player {
  id: string;
  name: string;
  nation: string;
  isHuman: boolean;
  model?: string;
  avatar: string;
  color: string;
  stats: PlayerStats;
  toolUsage: ToolUsage;
}

interface ComparisonRowProps {
  label: string;
  metricKey: keyof PlayerStats;
  players: Player[];
  highlightWinner?: boolean;
}

const ComparisonRow = ({ label, metricKey, players, highlightWinner }: ComparisonRowProps) => {
  // Find max value to highlight the leader
  const maxVal = Math.max(...players.map((p) => p.stats[metricKey]));

  return (
    <div className="grid grid-cols-4 gap-4 py-3 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors items-center">
      <div className="col-span-1 font-inter text-sm text-slate-400 pl-4">
        {label}
      </div>
      {players.map((player) => (
        <div
          key={player.id}
          className={`
            col-span-1 text-center font-mono text-sm
            ${player.stats[metricKey] === maxVal && highlightWinner ? "text-[#D4AF37] font-bold" : "text-slate-300"}
          `}
        >
          {player.stats[metricKey]}
        </div>
      ))}
    </div>
  );
};

interface ToolUsageChartProps {
  players: Player[];
}

const ToolUsageChart = ({ players }: ToolUsageChartProps) => {
  const tools: Array<{ key: keyof ToolUsage; label: string; color: string }> = [
    { key: "attack", label: "Attack", color: "bg-[#C0392B]" },
    { key: "fortify", label: "Fortify", color: "bg-slate-500" },
    { key: "diplomacy", label: "Diplomacy", color: "bg-[#D4AF37]" },
    { key: "history", label: "RAG Query", color: "bg-[#00FFA3]" },
  ];

  return (
    <div className="w-full space-y-6">
      {players.map((player) => (
        <div key={player.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-cinzel ${player.isHuman ? "text-[#D4AF37]" : "text-[#00FFA3]"}`}
            >
              {player.nation}
            </span>
            {!player.isHuman && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1 rounded border border-slate-700">
                {player.model}
              </span>
            )}
          </div>

          {/* Bar Chart Row */}
          <div className="flex h-4 gap-1 w-full bg-slate-900/50 rounded-sm overflow-hidden p-0.5 border border-slate-700">
            {tools.map((tool) => {
              const val = player.toolUsage[tool.key];
              const widthPct = (val / 40) * 100; // Arbitrary scaling for demo visual
              return (
                <div
                  key={tool.key}
                  className={`h-full ${tool.color} transition-all duration-500 hover:opacity-80 relative group`}
                  style={{ width: `${Math.max(widthPct, 2)}%` }} // Min width for visibility
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0F172A] border border-slate-600 text-xs text-[#F5E6CC] px-2 py-1 rounded z-50 whitespace-nowrap">
                    {tool.label}: {val}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {tools.map((tool) => (
          <div key={tool.key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${tool.color}`} />
            <span className="text-[10px] font-inter text-slate-400">
              {tool.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PostGameResults() {
  const [_activeTab, _setActiveTab] = useState("overview"); // overview | ai-deep-dive

  const isVictory = GAME_RESULTS.outcome === "victory";

  return (
    <div className="min-h-screen bg-[#0F172A] font-inter selection:bg-[#D4AF37]/30 selection:text-[#F5E6CC] overflow-x-hidden">
      {/* --- VICTORY / DEFEAT BANNER --- */}
      <header
        className={`
        relative w-full py-16 flex flex-col items-center justify-center text-center overflow-hidden
        ${
          isVictory
            ? "bg-gradient-to-b from-[#D4AF37]/20 via-[#0F172A]/90 to-[#0F172A]"
            : "bg-gradient-to-b from-[#C0392B]/20 via-[#0F172A]/90 to-[#0F172A]"
        }
      `}
      >
        {/* Background Particles/Texture would go here */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>

        <div className="z-10 animate-fade-in-up">
          <div className="flex items-center justify-center gap-4 mb-4">
            {isVictory ? (
              <Trophy className="w-12 h-12 text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
            ) : (
              <Skull className="w-12 h-12 text-slate-500" />
            )}
          </div>

          <h1
            className={`
            font-cinzel text-6xl font-bold tracking-widest mb-2
            ${
              isVictory
                ? "text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37] to-[#9A7D2A] drop-shadow-sm"
                : "text-slate-500"
            }
          `}
          >
            {isVictory ? "VICTORY" : "DEFEAT"}
          </h1>

          <p className="font-cinzel text-xl text-[#F5E6CC]/80 tracking-wide mt-2">
            {isVictory
              ? "The Ottoman Empire has been Vanquished"
              : "Constantinople has Fallen"}
          </p>
        </div>
      </header>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="max-w-6xl mx-auto px-4 pb-24 -mt-8 relative z-20">
        {/* 1. Game Summary Bar */}
        <div className="bg-[#0F172A]/80 border-y border-imperial-gold/30 backdrop-blur-md mb-8 py-4 px-6 flex flex-wrap justify-between items-center gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Scroll className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">
                Scenario
              </div>
              <div className="text-[#F5E6CC] font-cinzel">
                {GAME_RESULTS.scenario}
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-300 font-mono text-sm">
                {GAME_RESULTS.duration}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span className="text-slate-300 font-mono text-sm">
                {GAME_RESULTS.totalTurns} Turns
              </span>
            </div>
          </div>
        </div>

        {/* 2. Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Player Comparison (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Player Cards Header */}
            <div className="grid grid-cols-3 gap-4 mb-2 px-4">
              {/* Spacer for label col */}
              <div className="hidden md:block"></div>
              {GAME_RESULTS.players.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`
                     w-12 h-12 rounded-full border-2 overflow-hidden mb-2 shadow-lg relative
                     ${player.color}
                     ${player.id === GAME_RESULTS.winnerId ? "ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#0F172A]" : ""}
                   `}
                  >
                    <img
                      src={player.avatar}
                      alt={player.nation}
                      className="w-full h-full object-cover"
                    />
                    {player.id === GAME_RESULTS.winnerId && (
                      <div className="absolute -top-3 -right-3 bg-[#D4AF37] rounded-full p-1">
                        <Trophy className="w-3 h-3 text-[#0F172A]" />
                      </div>
                    )}
                  </div>
                  <div className="font-cinzel text-sm text-[#F5E6CC] truncate w-full">
                    {player.nation}
                  </div>
                  {player.isHuman ? (
                    <span className="text-[10px] text-[#D4AF37]/80 uppercase tracking-wider">
                      Human
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#00FFA3] bg-[#00FFA3]/10 px-1.5 py-0.5 rounded font-mono border border-cognitive-teal/20">
                      {player.model}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-cinzel text-lg text-[#F5E6CC]">
                  Performance Matrix
                </h3>
                <span className="text-xs text-slate-500 italic">
                  Game ID: #8821-AF
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                <ComparisonRow
                  label="Territories Controlled"
                  metricKey="territories"
                  players={GAME_RESULTS.players}
                  highlightWinner
                />
                <ComparisonRow
                  label="Troops Remaining"
                  metricKey="troops"
                  players={GAME_RESULTS.players}
                  highlightWinner
                />
                <ComparisonRow
                  label="Offensive Actions"
                  metricKey="attacks"
                  players={GAME_RESULTS.players}
                />
                <ComparisonRow
                  label="Successful Conquests"
                  metricKey="wins"
                  players={GAME_RESULTS.players}
                  highlightWinner
                />
                <ComparisonRow
                  label="Diplomatic Treaties"
                  metricKey="diplomacy"
                  players={GAME_RESULTS.players}
                />
                <ComparisonRow
                  label="Historical Queries"
                  metricKey="queries"
                  players={GAME_RESULTS.players}
                />
              </div>
            </div>

            {/* AI Deep Dive Section */}
            <div className="bg-slate-900/50 border border-cognitive-teal/30 rounded-lg overflow-hidden backdrop-blur-sm relative">
              {/* Decorative AI Element */}
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <BrainCircuit className="w-24 h-24 text-[#00FFA3]" />
              </div>

              <div className="px-6 py-4 border-b border-cognitive-teal/20 bg-[#00FFA3]/5">
                <h3 className="font-cinzel text-lg text-[#00FFA3] flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5" />
                  AI Strategic Analysis
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Strategic Summary Text */}
                <div className="font-mono text-sm text-slate-300 bg-slate-950/50 p-4 rounded border-l-2 border-cognitive-teal">
                  <span className="text-[#00FFA3] font-bold">
                    {">"} ANALYSIS:
                  </span>
                  <p className="mt-2 leading-relaxed">
                    The{" "}
                    <span className="text-[#B91C1C] font-bold">
                      Ottoman AI (GPT-4)
                    </span>{" "}
                    prioritized aggressive expansion early, utilizing historical
                    queries to identify weak points in the Theodosian Walls.
                    <span className="text-[#0369A1] font-bold ml-1">
                      Venice (Claude)
                    </span>{" "}
                    remained defensive, attempting diplomatic leverage but
                    failed to mobilize sufficient naval support.
                  </p>
                </div>

                {/* Tool Usage Chart */}
                <div>
                  <h4 className="text-xs font-inter text-slate-400 uppercase tracking-widest mb-4">
                    Tool Usage Distribution
                  </h4>
                  <ToolUsageChart players={GAME_RESULTS.players} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Metrics & Download (1 col) */}
          <div className="space-y-6">
            {/* Historical Accuracy Score */}
            <div className="bg-[#F5E6CC] text-[#0F172A] rounded-lg p-6 shadow-xl border-2 border-imperial-gold relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/20 rounded-bl-full -mr-10 -mt-10"></div>

              <h3 className="font-cinzel text-lg font-bold mb-4 flex items-center gap-2">
                <Scroll className="w-5 h-5" />
                Historical Fidelity
              </h3>

              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-cinzel font-bold text-[#0F172A]">
                  {GAME_RESULTS.historicalAccuracy}
                </span>
                <span className="text-xl font-cinzel text-slate-600 mb-1">
                  / 100
                </span>
              </div>

              <div className="w-full bg-slate-300 h-2 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-[#D4AF37] h-full"
                  style={{ width: `${GAME_RESULTS.historicalAccuracy}%` }}
                ></div>
              </div>

              <p className="text-sm font-inter text-slate-700 italic border-l-2 border-imperial-gold pl-3">
                "AI maneuvers closely mirrored the 1453 siege tactics,
                specifically the transport of ships overland."
              </p>
            </div>

            {/* Temporal RAG Stats */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 font-mono text-sm">
              <h3 className="text-[#00FFA3] font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Temporal RAG Stats
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Queries</span>
                  <span className="text-[#F5E6CC]">33</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Avg. Relevance</span>
                  <span className="text-[#00FFA3]">94%</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">
                    Future Knowledge Blocked
                  </span>
                  <div className="flex items-center gap-1 text-[#C0392B]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>3 Attempts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button className="w-full py-4 bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F172A] font-cinzel font-bold text-lg rounded-lg shadow-lg hover:shadow-imperial-gold/20 transition-all flex items-center justify-center gap-2 group">
                <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                Play Again
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[#F5E6CC] font-inter text-sm rounded transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Log (JSON)
                </button>
                <button className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[#F5E6CC] font-inter text-sm rounded transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              <button className="w-full py-2 text-slate-500 hover:text-[#F5E6CC] text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                <Home className="w-3 h-3" />
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F172A] via-[#D4AF37]/50 to-[#0F172A] pointer-events-none"></footer>

      {/* Tailwind Custom Animations */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
