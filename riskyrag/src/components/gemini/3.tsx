import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Shield,
  Cpu,
  User,
  Terminal,
  Map as MapIcon,
  ChevronRight,
  Crosshair,
  Activity,
  Database,
  LucideIcon,
} from "lucide-react";

// --- Game Constants & Data ---

interface Player {
  id: string;
  name: string;
  color: string;
  textColor: string;
  type: "HUMAN" | "AI";
  icon: LucideIcon;
}

interface Territory {
  id: string;
  name: string;
  x: number;
  y: number;
  neighbors: string[];
}

const PLAYERS: Player[] = [
  {
    id: "p1",
    name: "Human Operative",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    type: "HUMAN",
    icon: User,
  },
  {
    id: "ai1",
    name: "Nexus Core (AI)",
    color: "bg-red-500",
    textColor: "text-red-400",
    type: "AI",
    icon: Cpu,
  },
  {
    id: "ai2",
    name: "DeepMind (AI)",
    color: "bg-purple-500",
    textColor: "text-purple-400",
    type: "AI",
    icon: Database,
  },
];

// Simplified map data: 6 Territories connected in a ring with a center
const TERRITORIES: Territory[] = [
  {
    id: "t1",
    name: "Server Farm",
    x: 20,
    y: 20,
    neighbors: ["t2", "t6", "t7"],
  },
  { id: "t2", name: "Data Lake", x: 50, y: 10, neighbors: ["t1", "t3", "t7"] },
  { id: "t3", name: "Firewall", x: 80, y: 20, neighbors: ["t2", "t4", "t7"] },
  {
    id: "t4",
    name: "Encryption Layer",
    x: 80,
    y: 60,
    neighbors: ["t3", "t5", "t7"],
  },
  { id: "t5", name: "Cache Node", x: 50, y: 80, neighbors: ["t4", "t6", "t7"] },
  { id: "t6", name: "Gateway", x: 20, y: 60, neighbors: ["t5", "t1", "t7"] },
  {
    id: "t7",
    name: "The Core",
    x: 50,
    y: 45,
    neighbors: ["t1", "t2", "t3", "t4", "t5", "t6"],
  },
];

const INITIAL_UNITS = 3;

interface LogEntry {
  time: string;
  message: string;
  color: string;
}

interface GameState {
  ownership: Record<string, string>;
  units: Record<string, number>;
}

// --- TypeScript Interfaces ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'success' | 'neutral';
  size?: 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

interface GameMapProps {
  territories: Territory[];
  gameState: GameState;
  onTerritoryClick: (id: string) => void;
  selectedTerritory: string | null;
  attackSource: string | null;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  ownership: Record<string, string>;
}

interface AIMonitorProps {
  logs: LogEntry[];
}

// --- Helper Components ---

const Card = ({ children, className = "" }: CardProps) => (
  <div
    className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  onClick,
  disabled,
  variant = "primary",
  children,
  className = "",
}: ButtonProps) => {
  const baseStyle =
    "px-4 py-2 rounded font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#D4AF37] hover:bg-[#F5E6CC] text-[#0F172A]",
    danger: "bg-[#C0392B]/20 hover:bg-[#C0392B]/30 text-[#C0392B] border border-[#C0392B]/50",
    success: "bg-[#27AE60]/20 hover:bg-[#27AE60]/30 text-[#27AE60] border border-[#27AE60]/50",
    neutral: "bg-slate-800 hover:bg-slate-700 text-[#F5E6CC] border border-slate-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- Sub-Components ---

const GameMap = ({
  territories,
  gameState,
  onTerritoryClick,
  selectedTerritory,
  attackSource,
}: GameMapProps) => {
  // SVG Coordinate mapping
  const width = 100;
  const height = 100;

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto p-4 select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Connections */}
        {territories.map((t) =>
          t.neighbors.map((nId) => {
            const neighbor = territories.find((n) => n.id === nId);
            if (!neighbor) return null;
            // Draw line only once
            if (t.id > nId) return null;
            return (
              <line
                key={`${t.id}-${nId}`}
                x1={t.x}
                y1={t.y}
                x2={neighbor.x}
                y2={neighbor.y}
                stroke="#334155"
                strokeWidth="1"
              />
            );
          }),
        )}

        {/* Territory Nodes */}
        {territories.map((t) => {
          const owner = PLAYERS.find((p) => p.id === gameState.ownership[t.id]);
          const units = gameState.units[t.id];
          const isSelected = selectedTerritory === t.id;
          const isSource = attackSource === t.id;

          let ringColor = "stroke-slate-600";
          if (isSource) ringColor = "stroke-yellow-400";
          else if (isSelected) ringColor = "stroke-white";

          // Determine fill color based on owner
          let fillClass = "fill-slate-800";
          if (owner?.id === "p1") fillClass = "fill-blue-900";
          if (owner?.id === "ai1") fillClass = "fill-red-900";
          if (owner?.id === "ai2") fillClass = "fill-purple-900";

          return (
            <g
              key={t.id}
              onClick={() => onTerritoryClick(t.id)}
              className="cursor-pointer transition-all duration-300 hover:opacity-90"
            >
              <circle
                cx={t.x}
                cy={t.y}
                r="8"
                className={`${fillClass} ${ringColor} transition-colors duration-300`}
                strokeWidth={isSelected || isSource ? "1.5" : "0.5"}
              />
              {/* Unit Count Badge */}
              <circle
                cx={t.x + 5}
                cy={t.y - 5}
                r="3"
                className="fill-slate-950 stroke-slate-600"
                strokeWidth="0.5"
              />
              <text
                x={t.x + 5}
                y={t.y - 4}
                className="text-[3px] fill-white font-bold"
                textAnchor="middle"
              >
                {units}
              </text>

              {/* Territory Name */}
              <text
                x={t.x}
                y={t.y + 12}
                className={`text-[3px] font-semibold uppercase tracking-wider ${isSelected ? "fill-white" : "fill-slate-400"}`}
                textAnchor="middle"
              >
                {t.name}
              </text>

              {/* Icon in center */}
              {owner && (
                <foreignObject x={t.x - 3} y={t.y - 3} width="6" height="6">
                  <div
                    className={`flex items-center justify-center w-full h-full ${owner.textColor}`}
                  >
                    <owner.icon size={4} />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const PlayerList = ({ players, currentPlayerId, ownership }: PlayerListProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-cinzel font-bold uppercase text-slate-500 tracking-widest mb-2">
        Operatives
      </h3>
      {players.map((player) => {
        const territoryCount = Object.values(ownership).filter(
          (ownerId) => ownerId === player.id,
        ).length;
        const isTurn = player.id === currentPlayerId;

        return (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 rounded border transition-all ${
              isTurn
                ? "bg-slate-800 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                : "bg-slate-900 border-slate-800 opacity-80"
            }`}
          >
            <div
              className={`w-8 h-8 rounded flex items-center justify-center ${player.color} text-white`}
            >
              <player.icon size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-bold text-sm ${player.textColor}`}>
                  {player.name}
                </span>
                {isTurn && (
                  <Activity
                    size={14}
                    className="text-yellow-500 animate-pulse"
                  />
                )}
              </div>
              <div className="text-xs text-slate-400 flex gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <MapIcon size={10} /> {territoryCount} Nodes
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AIMonitor = ({ logs }: AIMonitorProps) => {
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
          <div className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse delay-75"></div>
          <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse delay-150"></div>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {logs.length === 0 && (
          <span className="text-slate-600 italic">
            System ready. Waiting for input...
          </span>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-slate-600">[{log.time}]</span>
            <span className={`${log.color || "text-slate-300"}`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- Main Application ---

export default function RiskyRagApp() {
  // Game State
  const [phase, setPhase] = useState<string>("DEPLOY"); // DEPLOY, ATTACK, FORTIFY
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [turn, setTurn] = useState<number>(1);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [attackSource, setAttackSource] = useState<string | null>(null);
  const [deployableUnits, setDeployableUnits] = useState<number>(0);

  // Data State
  const [ownership, setOwnership] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [aiThinking, setAiThinking] = useState<boolean>(false);

  // Initialize Game
  useEffect(() => {
    const initialOwnership: Record<string, string> = {};
    const initialUnits: Record<string, number> = {};

    // Random distribution
    const shuffledTerritories = [...TERRITORIES].sort(
      () => 0.5 - Math.random(),
    );
    shuffledTerritories.forEach((t, i) => {
      initialOwnership[t.id] = PLAYERS[i % PLAYERS.length].id;
      initialUnits[t.id] = INITIAL_UNITS;
    });

    setOwnership(initialOwnership);
    setUnits(initialUnits);
    addLog("System initialized. Map generated.", "text-emerald-400");
    startTurn(0);
  }, []);

  const currentPlayer = PLAYERS[currentPlayerIdx];

  // AI Logic Loop
  useEffect(() => {
    if (currentPlayer.type === "AI" && !aiThinking) {
      setAiThinking(true);
      setTimeout(() => performAITurn(), 1500);
    }
  }, [currentPlayerIdx, phase, aiThinking]);

  // --- Actions ---

  const addLog = (message: string, color = "text-slate-300") => {
    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { time, message, color }]);
  };

  const startTurn = (playerIdx: number) => {
    const player = PLAYERS[playerIdx];
    // Calculate reinforcements using functional update pattern
    setOwnership((currOwnership) => {
      const currentOwned = Object.values(currOwnership).filter(
        (id) => id === player.id,
      ).length;
      const bonus = Math.max(3, Math.floor(currentOwned / 3));

      setDeployableUnits(bonus);
      setPhase("DEPLOY");
      setSelectedTerritory(null);
      setAttackSource(null);

      addLog(
        `Turn ${turn}: ${player.name} starting. Reinforcements: ${bonus}`,
        player.textColor,
      );
      return currOwnership; // Return unchanged
    });
  };

  const nextTurn = () => {
    const nextIdx = (currentPlayerIdx + 1) % PLAYERS.length;
    if (nextIdx === 0) setTurn((t) => t + 1);
    setCurrentPlayerIdx(nextIdx);
    startTurn(nextIdx);
  };

  const nextPhase = () => {
    if (phase === "DEPLOY") {
      if (deployableUnits > 0) {
        addLog("Must deploy all units first!", "text-yellow-500");
        return;
      }
      setPhase("ATTACK");
      addLog("Phase: ATTACK initialized.", "text-blue-300");
      setSelectedTerritory(null);
    } else if (phase === "ATTACK") {
      setPhase("FORTIFY");
      addLog("Phase: FORTIFY initialized.", "text-blue-300");
      setAttackSource(null);
      setSelectedTerritory(null);
    } else {
      nextTurn();
    }
  };

  const handleTerritoryClick = (tId: string) => {
    if (currentPlayer.type !== "HUMAN") return;

    const owner = ownership[tId];
    const isOwner = owner === currentPlayer.id;

    if (phase === "DEPLOY") {
      if (isOwner && deployableUnits > 0) {
        setUnits((prev) => ({ ...prev, [tId]: prev[tId] + 1 }));
        setDeployableUnits((prev) => prev - 1);
        addLog(
          `Deployed unit to ${TERRITORIES.find((t) => t.id === tId)?.name ?? tId}`,
          "text-blue-400",
        );
      }
    } else if (phase === "ATTACK") {
      if (!attackSource) {
        if (isOwner && units[tId] > 1) {
          setAttackSource(tId);
          setSelectedTerritory(tId);
          addLog("Select target territory...", "text-slate-400");
        }
      } else {
        if (attackSource === tId) {
          // Deselect
          setAttackSource(null);
          setSelectedTerritory(null);
        } else {
          // Attempt attack
          const source = TERRITORIES.find((t) => t.id === attackSource);
          if (source?.neighbors.includes(tId) && !isOwner && attackSource) {
            resolveCombat(attackSource, tId);
          } else if (isOwner && units[tId] > 1) {
            // Change source
            setAttackSource(tId);
            setSelectedTerritory(tId);
          }
        }
      }
    } else if (phase === "FORTIFY") {
      // Simplified fortify: click source, then dest. Move 1 unit.
      if (!selectedTerritory) {
        if (isOwner && units[tId] > 1) setSelectedTerritory(tId);
      } else {
        if (selectedTerritory === tId) setSelectedTerritory(null);
        else if (isOwner && selectedTerritory) {
          // Check adjacency
          const source = TERRITORIES.find((t) => t.id === selectedTerritory);
          if (source?.neighbors.includes(tId)) {
            setUnits((prev) => ({
              ...prev,
              [selectedTerritory]: prev[selectedTerritory] - 1,
              [tId]: prev[tId] + 1,
            }));
            addLog(`Moved unit from ${source.name}`, "text-blue-400");
            setSelectedTerritory(null);
            nextTurn(); // End turn after one move
          }
        }
      }
    }
  };

  const resolveCombat = (fromId: string, toId: string) => {
    const fromUnits = units[fromId];
    const toUnits = units[toId];

    // Simple dice logic
    // Attacker rolls up to 3 dice (must leave 1 unit behind)
    // Defender rolls up to 2 dice
    const attackDiceCount = Math.min(3, fromUnits - 1);
    const defendDiceCount = Math.min(2, toUnits);

    const attackRolls = Array(attackDiceCount)
      .fill(0)
      .map(() => Math.ceil(Math.random() * 6))
      .sort((a, b) => b - a);
    const defendRolls = Array(defendDiceCount)
      .fill(0)
      .map(() => Math.ceil(Math.random() * 6))
      .sort((a, b) => b - a);

    let attackLosses = 0;
    let defendLosses = 0;

    const comparisons = Math.min(attackRolls.length, defendRolls.length);
    for (let i = 0; i < comparisons; i++) {
      if (attackRolls[i] > defendRolls[i]) defendLosses++;
      else attackLosses++;
    }

    const newFromUnits = fromUnits - attackLosses;
    const newToUnits = toUnits - defendLosses;

    const targetName = TERRITORIES.find((t) => t.id === toId)?.name ?? toId;

    addLog(
      `Battle at ${targetName}! A:${attackRolls.join(",")} vs D:${defendRolls.join(",")}`,
      "text-yellow-400",
    );
    addLog(
      `Result: Attacker lost ${attackLosses}, Defender lost ${defendLosses}`,
      "text-yellow-200",
    );

    if (newToUnits <= 0) {
      // Conquered
      const moveUnits = attackDiceCount; // Move attacker dice count into new territory
      setOwnership((prev) => ({ ...prev, [toId]: ownership[fromId] }));
      setUnits((prev) => ({
        ...prev,
        [fromId]: newFromUnits - moveUnits,
        [toId]: moveUnits,
      }));
      setAttackSource(null);
      setSelectedTerritory(null);
      addLog(`Territory ${targetName} CONQUERED!`, "text-green-400 font-bold");

      // Check win condition
      const allOurs = Object.values({
        ...ownership,
        [toId]: ownership[fromId],
      }).every((o) => o === ownership[fromId]);
      if (allOurs) {
        const winner = PLAYERS.find((p) => p.id === ownership[fromId]);
        addLog(
          `GAME OVER. ${winner?.name ?? "Unknown"} WINS!`,
          "text-4xl text-green-500 font-bold",
        );
        setPhase("GAME_OVER");
      }
    } else {
      setUnits((prev) => ({
        ...prev,
        [fromId]: newFromUnits,
        [toId]: newToUnits,
      }));
    }
  };

  const performAITurn = () => {
    // Very basic AI
    const myId = currentPlayer.id;
    const myTerritories = TERRITORIES.filter((t) => ownership[t.id] === myId);

    if (phase === "DEPLOY") {
      if (deployableUnits > 0) {
        // Deploy to random owned territory
        const target =
          myTerritories[Math.floor(Math.random() * myTerritories.length)];
        setUnits((prev) => ({ ...prev, [target.id]: prev[target.id] + 1 }));
        setDeployableUnits((prev) => prev - 1);
        // addLog(`AI deployed to ${target.name}`, "text-slate-500");
        // Re-trigger loop
        setTimeout(performAITurn, 300);
      } else {
        nextPhase();
        setAiThinking(false);
      }
    } else if (phase === "ATTACK") {
      // Find valid attack
      let attackMade = false;
      for (const t of myTerritories) {
        if (units[t.id] > 2) {
          // Need at least 2 to attack
          const neighbors = t.neighbors
            .map((nid) => TERRITORIES.find((x) => x.id === nid))
            .filter((n): n is Territory => n !== undefined);
          const targets = neighbors.filter((n) => ownership[n.id] !== myId);
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            if (target) {
              // Attack
              addLog(
                `AI attacking ${target.name} from ${t.name}`,
                "text-red-400",
              );
              resolveCombat(t.id, target.id);
              attackMade = true;
              break; // One attack per turn for simplicity
            }
          }
        }
      }

      if (!attackMade || Math.random() > 0.7) {
        nextPhase();
      }
      setAiThinking(false);
    } else if (phase === "FORTIFY") {
      // Skip fortify for now
      nextTurn();
      setAiThinking(false);
    }
  };

  // --- Rendering ---

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
            <p className="text-xs text-slate-500 font-mono tracking-wider">
              TACTICAL OPERATION MAP
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-cinzel font-bold uppercase tracking-widest">
              Turn
            </div>
            <div className="text-xl font-mono font-bold text-white">{turn}</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-center">
            <div className="text-xs text-slate-500 font-cinzel font-bold uppercase tracking-widest">
              Phase
            </div>
            <div
              className={`text-xl font-mono font-bold ${
                phase === "ATTACK"
                  ? "text-red-500"
                  : phase === "DEPLOY"
                    ? "text-blue-500"
                    : "text-green-500"
              }`}
            >
              {phase}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {phase === "DEPLOY" && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400">REINFORCEMENTS</span>
              <span className="text-2xl font-bold text-yellow-400 animate-pulse">
                {deployableUnits}
              </span>
            </div>
          )}
          <Button
            variant={phase === "ATTACK" ? "danger" : "primary"}
            onClick={nextPhase}
            disabled={
              currentPlayer.type !== "HUMAN" ||
              (phase === "DEPLOY" && deployableUnits > 0)
            }
          >
            {phase === "FORTIFY" ? "End Turn" : "Next Phase"}{" "}
            <ChevronRight size={16} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Players */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
          <PlayerList
            players={PLAYERS}
            currentPlayerId={currentPlayer.id}
            ownership={ownership}
          />

          <div className="mt-8 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Crosshair size={12} /> CONTROLS
            </h4>
            <ul className="text-xs text-slate-500 space-y-2">
              <li>
                • <strong className="text-blue-400">Deploy:</strong> Click your
                territory to add units.
              </li>
              <li>
                • <strong className="text-red-400">Attack:</strong> Click your
                node (origin) then enemy node (target).
              </li>
              <li>
                • <strong className="text-green-400">Fortify:</strong> Move
                units between adjacent owned nodes.
              </li>
            </ul>
          </div>
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
          ></div>

          <div className="flex-1 flex items-center justify-center p-8">
            <GameMap
              territories={TERRITORIES}
              gameState={{ ownership, units }}
              onTerritoryClick={handleTerritoryClick}
              selectedTerritory={selectedTerritory}
              attackSource={attackSource}
            />
          </div>

          {/* Bottom Log */}
          <div className="p-4 z-10">
            <AIMonitor logs={logs} />
          </div>
        </main>
      </div>
    </div>
  );
}
