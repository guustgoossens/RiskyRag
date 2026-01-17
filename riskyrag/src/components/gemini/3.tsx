import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Shield,
  Cpu,
  User,
  Terminal,
  Map as MapIcon,
  ChevronRight,
  Crosshair,
  Activity,
  Brain,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { GraphMap } from "../map/GraphMap";

// --- Design System Constants ---
const COLORS = {
  ottoman: { bg: "fill-green-900", text: "text-green-400", border: "stroke-green-500" },
  byzantine: { bg: "fill-purple-900", text: "text-purple-400", border: "stroke-purple-500" },
  venice: { bg: "fill-blue-900", text: "text-blue-400", border: "stroke-blue-500" },
  genoa: { bg: "fill-red-900", text: "text-red-400", border: "stroke-red-500" },
  union: { bg: "fill-blue-800", text: "text-blue-400", border: "stroke-blue-500" },
  confederacy: { bg: "fill-gray-700", text: "text-gray-400", border: "stroke-gray-500" },
  neutral: { bg: "fill-slate-800", text: "text-slate-400", border: "stroke-slate-600" },
};

// Map nation names to color keys
const NATION_COLORS: Record<string, keyof typeof COLORS> = {
  "Ottoman Empire": "ottoman",
  "Byzantine Empire": "byzantine",
  "Venice": "venice",
  "Genoa": "genoa",
  "Union": "union",
  "Confederacy": "confederacy",
};

// --- Types ---
interface LogEntry {
  time: string;
  message: string;
  color: string;
}

// --- Helper Components ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({
  onClick,
  disabled,
  variant = "primary",
  children,
  className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "success" | "neutral";
  children: React.ReactNode;
  className?: string;
}) => {
  const baseStyle = "px-4 py-2 rounded font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#D4AF37] hover:bg-[#F5E6CC] text-[#0F172A]",
    danger: "bg-[#C0392B]/20 hover:bg-[#C0392B]/30 text-[#C0392B] border border-[#C0392B]/50",
    success: "bg-[#27AE60]/20 hover:bg-[#27AE60]/30 text-[#27AE60] border border-[#27AE60]/50",
    neutral: "bg-slate-800 hover:bg-slate-700 text-[#F5E6CC] border border-slate-600",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- Game Map Component ---
function GameMap({
  territories,
  players,
  onTerritoryClick,
  selectedTerritory,
  attackSource,
}: {
  territories: Doc<"territories">[];
  players: Doc<"players">[];
  onTerritoryClick: (id: Id<"territories">) => void;
  selectedTerritory: Id<"territories"> | null;
  attackSource: Id<"territories"> | null;
}) {
  const width = 100;
  const height = 100;

  // Create a lookup for player colors
  const playerColors = new Map<Id<"players">, keyof typeof COLORS>();
  for (const player of players) {
    const colorKey = NATION_COLORS[player.nation] || "neutral";
    playerColors.set(player._id, colorKey);
  }

  // Create adjacency lookup by territory name
  const territoryByName = new Map<string, Doc<"territories">>();
  for (const t of territories) {
    territoryByName.set(t.name, t);
  }

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto p-4 select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-2xl">
        {/* Connections */}
        {territories.map((t) =>
          t.adjacentTo.map((neighborName) => {
            const neighbor = territoryByName.get(neighborName);
            if (!neighbor) return null;
            // Draw line only once (alphabetically)
            if (t.name > neighborName) return null;
            return (
              <line
                key={`${t._id}-${neighbor._id}`}
                x1={t.position.x / 10}
                y1={t.position.y / 10}
                x2={neighbor.position.x / 10}
                y2={neighbor.position.y / 10}
                stroke="#334155"
                strokeWidth="1"
              />
            );
          })
        )}

        {/* Territory Nodes */}
        {territories.map((t) => {
          const colorKey = t.ownerId ? playerColors.get(t.ownerId) || "neutral" : "neutral";
          const colors = COLORS[colorKey];
          const isSelected = selectedTerritory === t._id;
          const isSource = attackSource === t._id;

          let ringColor = "stroke-slate-600";
          if (isSource) ringColor = "stroke-yellow-400";
          else if (isSelected) ringColor = "stroke-white";

          // Scale positions (they're stored as 0-800, we want 0-100)
          const x = t.position.x / 10;
          const y = t.position.y / 10;

          return (
            <g
              key={t._id}
              onClick={() => onTerritoryClick(t._id)}
              className="cursor-pointer transition-all duration-300 hover:opacity-90"
            >
              <circle
                cx={x}
                cy={y}
                r="8"
                className={`${colors.bg} ${ringColor} transition-colors duration-300`}
                strokeWidth={isSelected || isSource ? "1.5" : "0.5"}
              />
              {/* Unit Count Badge */}
              <circle cx={x + 5} cy={y - 5} r="3" className="fill-slate-950 stroke-slate-600" strokeWidth="0.5" />
              <text x={x + 5} y={y - 4} className="text-[3px] fill-white font-bold" textAnchor="middle">
                {t.troops}
              </text>

              {/* Territory Name */}
              <text
                x={x}
                y={y + 12}
                className={`text-[3px] font-semibold uppercase tracking-wider ${isSelected ? "fill-white" : "fill-slate-400"}`}
                textAnchor="middle"
              >
                {t.displayName}
              </text>

              {/* Icon in center */}
              <foreignObject x={x - 3} y={y - 3} width="6" height="6">
                <div className={`flex items-center justify-center w-full h-full ${colors.text}`}>
                  {t.ownerId ? (
                    players.find((p) => p._id === t.ownerId)?.isHuman ? (
                      <User size={4} />
                    ) : (
                      <Cpu size={4} />
                    )
                  ) : null}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- Player List Component ---
function PlayerList({
  players,
  currentPlayerId,
  territories,
}: {
  players: Doc<"players">[];
  currentPlayerId: Id<"players"> | undefined;
  territories: Doc<"territories">[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-cinzel font-bold uppercase text-slate-500 tracking-widest mb-2">Nations</h3>
      {players.map((player) => {
        const territoryCount = territories.filter((t) => t.ownerId === player._id).length;
        const isTurn = player._id === currentPlayerId;
        const colorKey = NATION_COLORS[player.nation] || "neutral";
        const colors = COLORS[colorKey];

        return (
          <div
            key={player._id}
            className={`flex items-center gap-3 p-3 rounded border transition-all ${
              isTurn
                ? "bg-slate-800 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                : player.isEliminated
                  ? "bg-slate-900/50 border-slate-800 opacity-50"
                  : "bg-slate-900 border-slate-800 opacity-80"
            }`}
          >
            <div className={`w-8 h-8 rounded flex items-center justify-center text-white`} style={{ backgroundColor: player.color }}>
              {player.isHuman ? <User size={16} /> : <Cpu size={16} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-bold text-sm ${colors.text}`}>{player.nation}</span>
                {isTurn && <Activity size={14} className="text-yellow-500 animate-pulse" />}
              </div>
              <div className="text-xs text-slate-400 flex gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <MapIcon size={10} /> {territoryCount} Territories
                </span>
                {!player.isHuman && player.model && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Brain size={10} /> {player.model}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- System Log Component ---
function SystemLog({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="h-48 flex flex-col bg-[#0F172A] font-mono text-xs border-t-4 border-t-[#00FFA3]">
      <div className="p-2 bg-slate-950 border-b border-slate-900 flex justify-between items-center">
        <span className="text-[#00FFA3] font-bold flex items-center gap-2">
          <Terminal size={12} /> SYSTEM LOG
        </span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse delay-150" />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {logs.length === 0 && <span className="text-slate-600 italic">System ready. Waiting for input...</span>}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-slate-600">[{log.time}]</span>
            <span className={`${log.color || "text-slate-300"}`}>{log.message}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// --- Main Game Component ---
export default function RiskyRagGame() {
  // Get gameId from route params
  const { gameId } = useParams({ from: "/game/$gameId" });

  // Local state
  const [phase, setPhase] = useState<"REINFORCE" | "ATTACK" | "FORTIFY">("REINFORCE");
  const [selectedTerritory, setSelectedTerritory] = useState<Id<"territories"> | null>(null);
  const [attackSource, setAttackSource] = useState<Id<"territories"> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [reinforcementsLeft, setReinforcementsLeft] = useState(0);

  // Convex queries
  const gameState = useQuery(api.games.getFullState, { gameId: gameId as Id<"games"> });

  // Convex mutations
  const attackTerritory = useMutation(api.territories.attack);
  const moveTroops = useMutation(api.territories.moveTroops);
  const reinforceTerritory = useMutation(api.territories.reinforce);
  const nextTurn = useMutation(api.games.nextTurn);

  // Convex queries for reinforcements
  const currentPlayer = gameState?.players.find((p) => p._id === gameState?.game?.currentPlayerId);
  const reinforcements = useQuery(
    api.territories.calculateReinforcements,
    currentPlayer ? { playerId: currentPlayer._id } : "skip"
  );

  // Initialize reinforcements when turn starts
  useEffect(() => {
    if (reinforcements && phase === "REINFORCE") {
      setReinforcementsLeft(reinforcements.total);
    }
  }, [reinforcements?.total, phase]);

  // Log helper
  const addLog = (message: string, color = "text-slate-300") => {
    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { time, message, color }]);
  };

  // Loading state
  if (!gameState || !gameState.game) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A] text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
          <span className="font-cinzel text-lg">Loading Game...</span>
        </div>
      </div>
    );
  }

  const { game, players, territories } = gameState;
  // Hotseat mode: control whichever player's turn it is
  const myPlayer = players.find((p) => p._id === game.currentPlayerId);
  const isMyTurn = !!myPlayer; // Always true for current player in hotseat mode

  // Handle territory click
  const handleTerritoryClick = async (territoryId: Id<"territories">) => {
    if (!isMyTurn || !myPlayer) return;

    const territory = territories.find((t) => t._id === territoryId);
    if (!territory) return;

    const isOwner = territory.ownerId === myPlayer._id;

    if (phase === "REINFORCE") {
      if (isOwner && reinforcementsLeft > 0) {
        try {
          await reinforceTerritory({
            gameId: game._id,
            playerId: myPlayer._id,
            territory: territory.name,
            troops: 1,
          });
          setReinforcementsLeft((prev) => prev - 1);
          addLog(`Deployed 1 troop to ${territory.displayName}`, "text-blue-400");
        } catch (err) {
          addLog(`Failed to reinforce: ${err}`, "text-red-400");
        }
      }
    } else if (phase === "ATTACK") {
      if (!attackSource) {
        if (isOwner && territory.troops > 1) {
          setAttackSource(territoryId);
          setSelectedTerritory(territoryId);
          addLog(`Selected ${territory.displayName} as attack source`, "text-slate-400");
        }
      } else {
        if (attackSource === territoryId) {
          // Deselect
          setAttackSource(null);
          setSelectedTerritory(null);
        } else {
          // Attempt attack
          const sourceTerritory = territories.find((t) => t._id === attackSource);
          if (sourceTerritory && sourceTerritory.adjacentTo.includes(territory.name) && !isOwner) {
            try {
              const result = await attackTerritory({
                gameId: game._id,
                playerId: myPlayer._id,
                fromTerritory: sourceTerritory.name,
                toTerritory: territory.name,
                attackingTroops: Math.min(sourceTerritory.troops - 1, 3),
              });
              if (result.conquered) {
                addLog(`Conquered ${territory.displayName}!`, "text-green-400");
              } else {
                addLog(`Attack failed. Lost ${result.attackerLosses} troops.`, "text-red-400");
              }
            } catch (err) {
              addLog(`Attack error: ${err}`, "text-red-400");
            }
            setAttackSource(null);
            setSelectedTerritory(null);
          } else if (isOwner && territory.troops > 1) {
            // Change source
            setAttackSource(territoryId);
            setSelectedTerritory(territoryId);
          }
        }
      }
    } else if (phase === "FORTIFY") {
      if (!selectedTerritory) {
        if (isOwner && territory.troops > 1) {
          setSelectedTerritory(territoryId);
          addLog(`Selected ${territory.displayName} to move troops from`, "text-slate-400");
        }
      } else {
        if (selectedTerritory === territoryId) {
          setSelectedTerritory(null);
        } else if (isOwner) {
          const sourceTerritory = territories.find((t) => t._id === selectedTerritory);
          if (sourceTerritory && sourceTerritory.adjacentTo.includes(territory.name)) {
            try {
              await moveTroops({
                gameId: game._id,
                playerId: myPlayer._id,
                fromTerritory: sourceTerritory.name,
                toTerritory: territory.name,
                count: 1,
              });
              addLog(`Moved 1 troop to ${territory.displayName}`, "text-blue-400");
              // End turn after fortify
              await handleEndTurn();
            } catch (err) {
              addLog(`Move error: ${err}`, "text-red-400");
            }
            setSelectedTerritory(null);
          }
        }
      }
    }
  };

  // Handle phase transitions
  const handleNextPhase = () => {
    if (phase === "REINFORCE") {
      if (reinforcementsLeft > 0) {
        addLog("Must deploy all reinforcements first!", "text-yellow-500");
        return;
      }
      setPhase("ATTACK");
      addLog("Phase: ATTACK", "text-blue-300");
      setSelectedTerritory(null);
    } else if (phase === "ATTACK") {
      setPhase("FORTIFY");
      addLog("Phase: FORTIFY", "text-blue-300");
      setAttackSource(null);
      setSelectedTerritory(null);
    } else {
      handleEndTurn();
    }
  };

  // End turn
  const handleEndTurn = async () => {
    try {
      await nextTurn({ gameId: game._id });
      setPhase("REINFORCE");
      setSelectedTerritory(null);
      setAttackSource(null);
      addLog("Turn ended", "text-slate-400");
    } catch (err) {
      addLog(`Error ending turn: ${err}`, "text-red-400");
    }
  };

  // Format date for display
  const gameDate = new Date(game.currentDate);
  const gameDateStr = gameDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-lg z-10">
        <Link to="/lobby" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-cinzel font-bold tracking-widest text-[#F5E6CC] uppercase">
              Risky<span className="text-[#00FFA3]">Rag</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono tracking-wider">{gameDateStr}</p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-cinzel font-bold uppercase tracking-widest">Turn</div>
            <div className="text-xl font-mono font-bold text-white">{game.currentTurn}</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <div className="text-xs text-slate-500 font-cinzel font-bold uppercase tracking-widest">Phase</div>
            <div
              className={`text-xl font-mono font-bold ${
                phase === "ATTACK" ? "text-red-500" : phase === "REINFORCE" ? "text-blue-500" : "text-green-500"
              }`}
            >
              {phase}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {phase === "REINFORCE" && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400">REINFORCEMENTS</span>
              <span className="text-2xl font-bold text-yellow-400 animate-pulse">{reinforcementsLeft}</span>
            </div>
          )}
          <Button
            variant={phase === "ATTACK" ? "danger" : "primary"}
            onClick={handleNextPhase}
            disabled={!isMyTurn || (phase === "REINFORCE" && reinforcementsLeft > 0)}
          >
            {phase === "FORTIFY" ? "End Turn" : "Next Phase"} <ChevronRight size={16} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Players */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
          <PlayerList players={players} currentPlayerId={game.currentPlayerId} territories={territories} />

          <div className="mt-8 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Crosshair size={12} /> CONTROLS
            </h4>
            <ul className="text-xs text-slate-500 space-y-2">
              <li>
                <strong className="text-blue-400">Reinforce:</strong> Click your territory to add troops.
              </li>
              <li>
                <strong className="text-red-400">Attack:</strong> Click source then target.
              </li>
              <li>
                <strong className="text-green-400">Fortify:</strong> Move troops between adjacent territories.
              </li>
            </ul>
          </div>

          {/* Hotseat mode indicator */}
          {myPlayer && (
            <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <User className="w-4 h-4" />
                <span>Playing as <strong>{myPlayer.nation}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Map */}
        <main className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#475569 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="flex-1 flex items-center justify-center p-8">
            {game.scenario === "1861" ? (
              <GraphMap
                territories={territories}
                players={players}
                onTerritoryClick={handleTerritoryClick}
                selectedTerritory={selectedTerritory}
                attackSource={attackSource}
                scenario={game.scenario}
              />
            ) : (
              <GameMap
                territories={territories}
                players={players}
                onTerritoryClick={handleTerritoryClick}
                selectedTerritory={selectedTerritory}
                attackSource={attackSource}
              />
            )}
          </div>

          {/* Bottom Log */}
          <div className="p-4 z-10">
            <SystemLog logs={logs} />
          </div>
        </main>
      </div>
    </div>
  );
}
