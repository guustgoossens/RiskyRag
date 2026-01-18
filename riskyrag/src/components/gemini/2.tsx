import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Shield,
  Swords,
  Bot,
  ChevronRight,
  ChevronLeft,
  Check,
  BrainCircuit,
  Eye,
  User,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Import scenario images
import constantinople1 from "@/assets/images/prompts/constantinople/Gemini_Generated_Image_xsbl8yxsbl8yxsbl.png";
import constantinople2 from "@/assets/images/prompts/constantinople/Gemini_Generated_Image_9skble9skble9skb.png";
import constantinople3 from "@/assets/images/prompts/constantinople/Gemini_Generated_Image_p2eknwp2eknwp2ek.png";
import constantinople4 from "@/assets/images/prompts/constantinople/Gemini_Generated_Image_pa6ih0pa6ih0pa6i.png";
import constantinople5 from "@/assets/images/prompts/constantinople/Gemini_Generated_Image_xeohavxeohavxeoh.png";

import civilwar1 from "@/assets/images/prompts/civil-war/Gemini_Generated_Image_tnof1ptnof1ptnof.png";
import civilwar2 from "@/assets/images/prompts/civil-war/Gemini_Generated_Image_3w0b613w0b613w0b.png";
import civilwar3 from "@/assets/images/prompts/civil-war/Gemini_Generated_Image_7n4dli7n4dli7n4d.png";
import civilwar4 from "@/assets/images/prompts/civil-war/Gemini_Generated_Image_ktr6cmktr6cmktr6.png";
import civilwar5 from "@/assets/images/prompts/civil-war/Gemini_Generated_Image_m0xgc0m0xgc0m0xg.png";

import future1 from "@/assets/images/prompts/2026/Gemini_Generated_Image_ktlczktlczktlczk.png";
import future2 from "@/assets/images/prompts/2026/Gemini_Generated_Image_khrkt8khrkt8khrk.png";
import future3 from "@/assets/images/prompts/2026/Gemini_Generated_Image_9gzwq59gzwq59gzw.png";
import future4 from "@/assets/images/prompts/2026/Gemini_Generated_Image_ly541jly541jly54.png";
import future5 from "@/assets/images/prompts/2026/Gemini_Generated_Image_tx3wj2tx3wj2tx3w.png";

/**
 * RISKYRAG LOBBY / SCENARIO SELECTION
 * Full-width scenario carousel with immersive hover effects.
 */

// --- Design System Constants ---
const COLORS = {
  voidNavy: "#0F172A",
  parchment: "#F5E6CC",
  imperialGold: "#D4AF37",
  cognitiveTeal: "#00FFA3",
  warCrimson: "#C0392B",
  safeEmerald: "#27AE60",
};

// --- Scenario Data ---
// These must match the nations defined in convex/scenarios.ts
const SCENARIOS = [
  {
    id: "1453",
    year: 1453,
    title: "Fall of Constantinople",
    subtitle: "The End of an Empire",
    description:
      "The Ottoman Empire besieges the Byzantine capital. The end of the Middle Ages is at hand. Will the walls hold?",
    images: [constantinople1, constantinople2, constantinople3, constantinople4, constantinople5],
    factions: [
      {
        id: "ottoman",
        name: "Ottoman Empire",
        color: "#2E7D32",
        type: "aggressor",
        strength: "Overwhelming numbers, Janissaries",
      },
      {
        id: "byzantine",
        name: "Byzantine Empire",
        color: "#7B1FA2",
        type: "defender",
        strength: "The Theodosian Walls, Greek Fire",
      },
      {
        id: "venice",
        name: "Venice",
        color: "#1565C0",
        type: "mercantile",
        strength: "Naval Superiority, Wealth",
      },
      {
        id: "genoa",
        name: "Genoa",
        color: "#C62828",
        type: "mercantile",
        strength: "Trade Networks, Galata Colony",
      },
    ],
  },
  {
    id: "1861",
    year: 1861,
    title: "American Civil War",
    subtitle: "A House Divided",
    description:
      "The Union fights to preserve the nation while the Confederacy battles for independence. Control of the Mississippi will decide the war.",
    images: [civilwar1, civilwar2, civilwar3, civilwar4, civilwar5],
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
  {
    id: "2026",
    year: 2026,
    title: "World Order 2026",
    subtitle: "The Multipolar Moment",
    description:
      "The post-Cold War consensus has shattered. Three wars rage while great power competition intensifies. The multipolar world order hangs in the balance.",
    images: [future1, future2, future3, future4, future5],
    factions: [
      {
        id: "usa",
        name: "United States",
        color: "#1E40AF",
        type: "superpower",
        strength: "Military Supremacy, Global Reach",
      },
      {
        id: "china",
        name: "People's Republic of China",
        color: "#DC2626",
        type: "superpower",
        strength: "Manufacturing, Largest Navy",
      },
      {
        id: "russia",
        name: "Russian Federation",
        color: "#1F2937",
        type: "great_power",
        strength: "Nuclear Arsenal, Ukraine Front",
      },
      {
        id: "eu",
        name: "European Union",
        color: "#1D4ED8",
        type: "alliance",
        strength: "Economic Power, NATO Pillar",
      },
      {
        id: "uk",
        name: "United Kingdom",
        color: "#1E3A8A",
        type: "great_power",
        strength: "Nuclear Power, AUKUS",
      },
      {
        id: "india",
        name: "Republic of India",
        color: "#F97316",
        type: "great_power",
        strength: "Population, Multi-alignment",
      },
      {
        id: "turkey",
        name: "Republic of Turkey",
        color: "#DC2626",
        type: "regional",
        strength: "NATO Army, Drone Power",
      },
      {
        id: "saudi",
        name: "Saudi-GCC Coalition",
        color: "#15803D",
        type: "regional",
        strength: "Oil Wealth, BRICS Member",
      },
      {
        id: "iran",
        name: "Islamic Republic of Iran",
        color: "#166534",
        type: "regional",
        strength: "Nuclear Program, Proxy Network",
      },
      {
        id: "israel",
        name: "State of Israel",
        color: "#1E40AF",
        type: "regional",
        strength: "Military Tech, Nuclear Arsenal",
      },
      {
        id: "brazil",
        name: "Federative Republic of Brazil",
        color: "#16A34A",
        type: "regional",
        strength: "BRICS Leader, S. America",
      },
    ],
  },
];

// AI Models grouped by reliability
// IMPORTANT: Only Devstral and Claude models are confirmed stable for tool calling
const AI_MODELS = [
  // === STABLE (Recommended - reliable tool calling) ===
  { id: "devstral", name: "★ Devstral (Free)", desc: "Best free model. Excellent tool use.", complexity: "Medium", tier: "stable" },
  { id: "claude-sonnet", name: "★ Claude Sonnet", desc: "Best overall. Superior reasoning. (Anthropic)", complexity: "High", tier: "stable" },
  { id: "claude-opus", name: "★ Claude Opus", desc: "Most capable. Deep analysis. (Anthropic)", complexity: "Very High", tier: "stable" },
  // === EXPERIMENTAL (May fail or produce errors) ===
  { id: "claude-haiku", name: "Claude Haiku", desc: "Fast but less reliable. (Anthropic)", complexity: "Low", tier: "experimental" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", desc: "Meta's best. Tool use can fail.", complexity: "High", tier: "experimental" },
  { id: "qwen3-32b", name: "Qwen3 32B", desc: "Strong reasoning. Inconsistent tools.", complexity: "Medium", tier: "experimental" },
  { id: "mistral-small", name: "Mistral Small 24B", desc: "Fast but error-prone.", complexity: "Medium", tier: "experimental" },
  { id: "trinity-mini", name: "Trinity Mini (Free)", desc: "Arcee 26B MoE. Often fails.", complexity: "Low", tier: "experimental" },
  { id: "qwen3-coder", name: "Qwen3 Coder (Free)", desc: "Very inconsistent tool use.", complexity: "Medium", tier: "experimental" },
  { id: "gemma-3-27b", name: "Gemma 3 27B", desc: "Google's 27B. Frequently fails.", complexity: "Medium", tier: "experimental" },
];

// Maps lobby faction IDs to the nation names used in convex/scenarios.ts
const FACTION_TO_NATION: Record<string, string> = {
  // 1453 - Fall of Constantinople
  ottoman: "Ottoman Empire",
  byzantine: "Byzantine Empire",
  venice: "Venice",
  genoa: "Genoa",
  // 1861 - American Civil War
  union: "Union",
  confederacy: "Confederacy",
  // 2026 - World Order
  usa: "United States",
  china: "People's Republic of China",
  russia: "Russian Federation",
  eu: "European Union",
  uk: "United Kingdom",
  india: "Republic of India",
  turkey: "Republic of Turkey",
  saudi: "Saudi-GCC Coalition",
  iran: "Islamic Republic of Iran",
  israel: "State of Israel",
  brazil: "Federative Republic of Brazil",
};

type GameMode = "play" | "spectate";

// --- Image Carousel Component ---
function ImageCarousel({
  images,
  isActive,
}: {
  images: string[];
  isActive: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-advance carousel when active
  useEffect(() => {
    if (!isActive) {
      setCurrentIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [isActive, images.length]);

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const goNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, goTo]);

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, goTo]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Images */}
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            idx === currentIndex
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          } ${isTransitioning && idx === currentIndex ? "opacity-50" : ""}`}
        >
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Navigation - only show when active */}
      {isActive && (
        <>
          {/* Arrow buttons - z-40 to be above all overlays */}
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40
              w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm
              flex items-center justify-center
              opacity-70 hover:opacity-100 transition-all duration-300
              hover:bg-black/70 hover:scale-110 border border-white/20
              active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40
              w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm
              flex items-center justify-center
              opacity-70 hover:opacity-100 transition-all duration-300
              hover:bg-black/70 hover:scale-110 border border-white/20
              active:scale-95"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-52 left-1/2 -translate-x-1/2 z-40 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-[#D4AF37] w-8"
                    : "bg-white/40 hover:bg-white/60 w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Scenario Card Component ---
function ScenarioCard({
  scenario,
  isHovered,
  isSelected,
  onHover,
  onSelect,
}: {
  scenario: typeof SCENARIOS[0];
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(scenario.id)}
      onMouseEnter={() => onHover(scenario.id)}
      onMouseLeave={() => onHover(null)}
      className={`
        relative flex-1 h-full group cursor-pointer overflow-hidden
        transition-all duration-700 ease-out
        ${isHovered ? "flex-[1.5]" : "flex-1"}
      `}
    >
      {/* Image Layer */}
      <ImageCarousel images={scenario.images} isActive={isHovered} />

      {/* Dark Overlay - Strong when not hovered */}
      <div
        className={`
          absolute inset-0 z-10 transition-all duration-700 ease-out
          ${isHovered
            ? "bg-gradient-to-t from-black/90 via-black/40 to-black/10"
            : "bg-black/60"
          }
        `}
      />

      {/* Vignette effect */}
      <div
        className={`
          absolute inset-0 z-10 pointer-events-none transition-opacity duration-700
          ${isHovered ? "opacity-0" : "opacity-100"}
        `}
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Selection border glow */}
      {isSelected && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 3px ${COLORS.imperialGold}, inset 0 0 60px rgba(212, 175, 55, 0.3)`,
          }}
        />
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-8 pb-12 pt-8">
        {/* Year Badge - top right */}
        <div
          className={`
            absolute top-8 right-8 transition-all duration-500
            ${isHovered ? "opacity-100 translate-y-0" : "opacity-70 translate-y-0"}
          `}
        >
          <div
            className={`
              px-4 py-2 backdrop-blur-sm border rounded
              font-mono text-xl font-bold tracking-wider
              transition-all duration-500
              ${isHovered
                ? "bg-[#00FFA3]/20 border-[#00FFA3]/50 text-[#00FFA3]"
                : "bg-black/40 border-white/20 text-white/70"
              }
            `}
          >
            {scenario.year}
          </div>
        </div>

        {/* Selection Check */}
        {isSelected && (
          <div
            className="absolute top-8 left-8 w-10 h-10 rounded-full flex items-center justify-center
              animate-bounce-short"
            style={{ backgroundColor: COLORS.imperialGold }}
          >
            <Check className="w-6 h-6 text-[#0F172A]" strokeWidth={3} />
          </div>
        )}

        {/* Text Content */}
        <div
          className={`
            transition-all duration-700 ease-out
            ${isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-80"}
          `}
        >
          {/* Subtitle */}
          <div
            className={`
              text-xs uppercase tracking-[0.3em] mb-3
              transition-all duration-500
              ${isHovered ? "text-[#D4AF37]" : "text-white/50"}
            `}
          >
            {scenario.subtitle}
          </div>

          {/* Title */}
          <h3
            className={`
              font-cinzel uppercase text-3xl md:text-4xl mb-5
              transition-all duration-500 leading-tight
              ${isHovered ? "text-[#F5E6CC]" : "text-white/80"}
            `}
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            {scenario.title}
          </h3>

          {/* Description - only visible on hover */}
          <p
            className={`
              text-base leading-relaxed max-w-lg mb-8
              transition-all duration-500
              ${isHovered ? "opacity-100 text-slate-200" : "opacity-0 text-slate-500 h-0 mb-0"}
            `}
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
          >
            {scenario.description}
          </p>

          {/* Faction Pills - only visible on hover */}
          <div
            className={`
              flex flex-wrap gap-3 transition-all duration-500
              ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 h-0"}
            `}
          >
            {scenario.factions.map((f) => (
              <span
                key={f.id}
                className="flex items-center gap-2 text-xs uppercase tracking-wider
                  px-4 py-2 bg-black/50 backdrop-blur-sm border border-white/20
                  text-slate-200 rounded-lg"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient line accent */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 h-1 z-30
          transition-all duration-700
          ${isHovered
            ? "opacity-100 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
            : "opacity-0"
          }
        `}
      />
    </button>
  );
}

// --- Main Lobby Component ---
export default function Lobby() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("spectate");
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
        initialModels[f.id] = idx === 0 ? "devstral" : "trinity-mini";
      });
      setFactionModels(initialModels);
    }
  }, [selectedScenarioId]);

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setPlayerNationId(null);
  };

  const handleStartGame = async () => {
    if (!selectedScenarioId) return;
    if (gameMode === "play" && !playerNationId) return;

    setIsLaunching(true);
    setError(null);

    try {
      const gameId = await createGame({ scenario: selectedScenarioId });

      if (gameMode === "play" && playerNationId) {
        const playerNation = FACTION_TO_NATION[playerNationId];
        if (!playerNation) throw new Error(`Unknown faction: ${playerNationId}`);
        await joinGame({ gameId, nation: playerNation });
      }

      const aiModels: Record<string, string> = {};
      for (const [factionId, model] of Object.entries(factionModels)) {
        if (gameMode === "play" && factionId === playerNationId) continue;
        const nationName = FACTION_TO_NATION[factionId];
        if (nationName) aiModels[nationName] = model || "devstral";
      }

      await initializeGame({ gameId, aiModels });
      await startGame({ gameId });
      navigate({ to: "/game/$gameId", params: { gameId } });
    } catch (err) {
      console.error("Failed to create game:", err);
      setError(err instanceof Error ? err.message : "Failed to create game");
      setIsLaunching(false);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-200 font-sans selection:bg-[#D4AF37] selection:text-slate-900"
      style={{ backgroundColor: COLORS.voidNavy }}
    >
      {/* --- Main Layout --- */}
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-50 flex justify-between items-center px-8 py-6 bg-[#0F172A]/80 backdrop-blur-sm border-b border-white/5">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 border-2 border-[#D4AF37] flex items-center justify-center rounded-sm bg-slate-900">
              <Shield className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="font-cinzel uppercase text-2xl tracking-[0.2em] text-[#D4AF37]">
                RISKYRAG
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  System Online
                </span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-xs font-mono text-[#00FFA3]">TEMPORAL ENGINE: ACTIVE</div>
              <div className="text-xs text-slate-500">v2.4.0-alpha</div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Scenario Cards Section */}
          <div
            className={`
              flex transition-all duration-700 ease-out
              ${selectedScenarioId ? "w-2/3" : "w-full"}
            `}
          >
            {SCENARIOS.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isHovered={hoveredId === scenario.id}
                isSelected={selectedScenarioId === scenario.id}
                onHover={setHoveredId}
                onSelect={handleSelectScenario}
              />
            ))}
          </div>

          {/* Configuration Panel */}
          {activeScenario && (
            <div className="w-1/3 bg-[#0F172A]/95 backdrop-blur-md border-l border-white/5 p-8 flex flex-col overflow-y-auto animate-slide-in-right">
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
                    Spectate
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
                    Play
                  </button>
                </div>
              </div>

              {/* Player Nation Selection */}
              {gameMode === "play" && (
                <div className="mb-8 animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-[#D4AF37]/30 flex-1" />
                    <h3 className="font-serif text-[#D4AF37] text-lg">Select Your Nation</h3>
                    <div className="h-px bg-[#D4AF37]/30 flex-1" />
                  </div>

                  <div className="grid gap-3">
                    {activeScenario.factions.map((faction) => {
                      const isSelected = playerNationId === faction.id;
                      return (
                        <button
                          key={faction.id}
                          onClick={() => setPlayerNationId(faction.id)}
                          className={`
                            relative p-4 text-left border-2 rounded transition-all duration-200
                            ${isSelected
                              ? "bg-[#F5E6CC] border-[#D4AF37] shadow-lg"
                              : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`font-serif font-bold ${isSelected ? "text-[#0F172A]" : "text-slate-200"}`}>
                                {faction.name}
                              </div>
                              <div className={`text-xs mt-1 ${isSelected ? "text-slate-700" : "text-slate-400"}`}>
                                {faction.strength}
                              </div>
                            </div>
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

              {/* AI Configuration */}
              {(gameMode === "spectate" || (gameMode === "play" && playerNationId)) && (
                <div className="flex-1 animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-[#00FFA3]/30 flex-1" />
                    <h3 className="font-mono text-[#00FFA3] text-sm tracking-wider">
                      {gameMode === "spectate" ? "AI COMBATANTS" : "OPPOSING AI"}
                    </h3>
                    <div className="h-px bg-[#00FFA3]/30 flex-1" />
                  </div>

                  <div className="space-y-4 mb-8">
                    {activeScenario.factions
                      .filter((f) => gameMode === "spectate" || f.id !== playerNationId)
                      .map((faction) => (
                        <div
                          key={faction.id}
                          className="bg-slate-900/60 border border-[#00FFA3]/20 rounded p-4"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-white"
                              style={{ backgroundColor: faction.color }}
                            >
                              {faction.name.charAt(0)}
                            </div>
                            <span className="text-slate-300 font-serif text-sm">{faction.name}</span>
                          </div>

                          <div className="relative">
                            <Bot size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00FFA3]" />
                            <select
                              className="w-full bg-slate-950 border border-slate-700 rounded px-10 py-2 text-xs font-mono text-slate-300 focus:border-[#00FFA3] focus:outline-none appearance-none cursor-pointer hover:bg-slate-900"
                              onChange={(e) => setFactionModels((prev) => ({ ...prev, [faction.id]: e.target.value }))}
                              value={factionModels[faction.id] || "devstral"}
                            >
                              <optgroup label="★ Stable (Recommended)">
                                {AI_MODELS.filter(m => m.tier === "stable").map((model) => (
                                  <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="⚠️ Experimental (May Fail)">
                                {AI_MODELS.filter(m => m.tier === "experimental").map((model) => (
                                  <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                              </optgroup>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                              <ChevronRight size={12} className="rotate-90" />
                            </div>
                          </div>

                          <div className="mt-2 flex justify-end">
                            <span className="text-xs text-[#00FFA3] font-mono border border-[#00FFA3]/30 px-2 rounded bg-[#00FFA3]/5">
                              Knowledge ≤ {activeScenario.year}
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
                        w-full group relative overflow-hidden rounded-lg py-4 px-6
                        flex items-center justify-center gap-3
                        transition-all duration-300 font-cinzel
                        ${isLaunching
                          ? "bg-slate-800 cursor-wait"
                          : "bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] hover:from-[#F5D76E] hover:via-[#FFE49C] hover:to-[#F5D76E] shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:shadow-[0_0_35px_rgba(245,215,110,0.6)] border border-[#B8860B]"
                        }
                      `}
                    >
                      {isLaunching ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          <span className="font-bold text-slate-400 tracking-widest">INITIALIZING...</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-lg tracking-[0.15em] text-[#0F172A]">
                            {gameMode === "spectate" ? "START SIMULATION" : "BEGIN CAMPAIGN"}
                          </span>
                          {gameMode === "spectate" ? (
                            <Eye className="w-5 h-5 text-[#0F172A]" />
                          ) : (
                            <Swords className="w-5 h-5 text-[#0F172A] group-hover:rotate-12 transition-transform" />
                          )}
                        </>
                      )}
                    </button>

                    <div className="text-center mt-3">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        {gameMode === "spectate" ? "Watch AI models compete in real-time" : "Test your strategy against AI"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
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
      `}</style>
    </div>
  );
}
