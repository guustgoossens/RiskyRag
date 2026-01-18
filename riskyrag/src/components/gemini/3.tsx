import { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Shield,
  Cpu,
  User,
  Map as MapIcon,
  ChevronRight,
  Crosshair,
  Activity,
  Brain,
  Loader2,
  Eye,
  BookOpen,
  Swords,
  Zap,
  Target,
  Layers,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { GraphMap } from "../map/GraphMap";
import { AgentTurnViewer, AgentViewerButton } from "@/components/agent";
import { useAgentStream } from "@/hooks/useAgentStream";
import { TurnTimeline } from "@/components/timeline";
import { SpectatorOverlay } from "@/components/spectator/SpectatorOverlay";
import { DiplomaticScroll } from "@/components/diplomacy/DiplomaticScroll";
import { HistoricalChat } from "@/components/chat/HistoricalChat";

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

// --- Attack Dialog State ---
interface AttackDialogState {
  isOpen: boolean;
  sourceTerritory: Doc<"territories"> | null;
  targetTerritory: Doc<"territories"> | null;
  selectedDice: number;
}

// --- Conquest Dialog State ---
interface ConquestDialogState {
  isOpen: boolean;
  minTroops: number;
  maxTroops: number;
  selectedTroops: number;
  fromName: string;
  toName: string;
}

// --- Card Trade Dialog State ---
interface CardTradeDialogState {
  isOpen: boolean;
  selectedIndices: number[];
}

// --- Main Game Component ---
export default function RiskyRagGame() {
  // Get gameId from route params
  const { gameId } = useParams({ from: "/game/$gameId" });

  // Local UI state (not game logic state)
  const [selectedTerritory, setSelectedTerritory] = useState<Id<"territories"> | null>(null);
  const [attackSource, setAttackSource] = useState<Id<"territories"> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Attack dialog state
  const [attackDialog, setAttackDialog] = useState<AttackDialogState>({
    isOpen: false,
    sourceTerritory: null,
    targetTerritory: null,
    selectedDice: 3,
  });

  // Conquest dialog state
  const [conquestDialog, setConquestDialog] = useState<ConquestDialogState>({
    isOpen: false,
    minTroops: 1,
    maxTroops: 1,
    selectedTroops: 1,
    fromName: "",
    toName: "",
  });

  // Card trade dialog state
  const [cardDialog, setCardDialog] = useState<CardTradeDialogState>({
    isOpen: false,
    selectedIndices: [],
  });

  // Convex queries
  const gameState = useQuery(api.games.getFullState, { gameId: gameId as Id<"games"> });

  // Convex mutations
  const attackTerritory = useMutation(api.territories.attack);
  const confirmConquestMutation = useMutation(api.territories.confirmConquest);
  const moveTroops = useMutation(api.territories.moveTroops);
  const reinforceTerritory = useMutation(api.territories.reinforce);
  const placeSetupTroop = useMutation(api.territories.placeSetupTroop);
  const finishSetupMutation = useMutation(api.territories.finishSetup);
  const advancePhase = useMutation(api.games.advancePhase);
  const nextTurn = useMutation(api.games.nextTurn);
  const tradeCardsMutation = useMutation(api.territories.tradeCards);

  // Agent observability state
  const [isAgentViewerOpen, setIsAgentViewerOpen] = useState(false);
  const agentStream = useAgentStream(gameId as Id<"games">);

  // UI overhaul state
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);
  const [showHistoricalChat, setShowHistoricalChat] = useState(false);
  const [pendingNegotiation, setPendingNegotiation] = useState<(Doc<"negotiations"> & { senderNation: string; senderColor: string }) | null>(null);
  const [isVictoryDismissed, setIsVictoryDismissed] = useState(false);

  // Query pending negotiations for current player
  const pendingNegotiationsQuery = useQuery(
    api.negotiations.getPendingForPlayer,
    gameState?.game?.currentPlayerId
      ? { gameId: gameId as Id<"games">, playerId: gameState.game.currentPlayerId }
      : "skip"
  );

  // Respond to negotiation mutation
  const respondToNegotiation = useMutation(api.negotiations.respond);

  // Show conquest dialog when there's a pending conquest
  // NOTE: Must be before any early returns to maintain hook order
  const pendingConquest = gameState?.game?.pendingConquest;
  useEffect(() => {
    if (pendingConquest && !conquestDialog.isOpen) {
      setConquestDialog({
        isOpen: true,
        minTroops: pendingConquest.minTroops,
        maxTroops: pendingConquest.maxTroops,
        selectedTroops: pendingConquest.minTroops,
        fromName: pendingConquest.fromTerritory,
        toName: pendingConquest.toTerritory,
      });
    } else if (!pendingConquest && conquestDialog.isOpen) {
      setConquestDialog((prev) => ({ ...prev, isOpen: false }));
    }
  }, [pendingConquest, conquestDialog.isOpen]);

  // Show diplomatic scroll popup for new negotiations (human players only)
  useEffect(() => {
    if (
      pendingNegotiationsQuery &&
      pendingNegotiationsQuery.length > 0 &&
      !pendingNegotiation &&
      gameState?.game?.currentPlayerId
    ) {
      const currentPlayer = gameState.players?.find(
        (p) => p._id === gameState.game?.currentPlayerId
      );
      if (currentPlayer?.isHuman) {
        setPendingNegotiation(pendingNegotiationsQuery[0]);
      }
    }
  }, [pendingNegotiationsQuery, pendingNegotiation, gameState?.game?.currentPlayerId, gameState?.players]);

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

  // Get phase from backend (uppercase for display compatibility)
  const phase = (game.phase ?? "reinforce").toUpperCase() as "SETUP" | "REINFORCE" | "ATTACK" | "FORTIFY";
  const reinforcementsLeft = game.reinforcementsRemaining ?? 0;
  const setupTroopsLeft = myPlayer?.setupTroopsRemaining ?? 0;
  const hasPendingConquest = !!game.pendingConquest;

  // Handle territory click
  const handleTerritoryClick = async (territoryId: Id<"territories">) => {
    if (!isMyTurn || !myPlayer) return;
    if (hasPendingConquest) {
      addLog("Must confirm conquest first!", "text-yellow-500");
      return;
    }

    const territory = territories.find((t) => t._id === territoryId);
    if (!territory) return;

    const isOwner = territory.ownerId === myPlayer._id;

    if (phase === "SETUP") {
      // Setup phase: place initial troops on owned territories
      if (isOwner && setupTroopsLeft > 0) {
        try {
          await placeSetupTroop({
            gameId: game._id,
            playerId: myPlayer._id,
            territory: territory.name,
            troops: 1,
          });
          addLog(`Placed 1 troop on ${territory.displayName}`, "text-purple-400");
        } catch (err) {
          addLog(`Failed to place troop: ${err}`, "text-red-400");
        }
      } else if (!isOwner) {
        addLog("You can only place troops on your own territories", "text-yellow-500");
      }
    } else if (phase === "REINFORCE") {
      if (isOwner && reinforcementsLeft > 0) {
        try {
          await reinforceTerritory({
            gameId: game._id,
            playerId: myPlayer._id,
            territory: territory.name,
            troops: 1,
          });
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
          // Show attack dialog for dice selection
          const sourceTerritory = territories.find((t) => t._id === attackSource);
          if (sourceTerritory && sourceTerritory.adjacentTo.includes(territory.name) && !isOwner) {
            const maxDice = Math.min(3, sourceTerritory.troops - 1);
            setAttackDialog({
              isOpen: true,
              sourceTerritory,
              targetTerritory: territory,
              selectedDice: maxDice,
            });
          } else if (isOwner && territory.troops > 1) {
            // Change source
            setAttackSource(territoryId);
            setSelectedTerritory(territoryId);
          }
        }
      }
    } else if (phase === "FORTIFY") {
      if (game.fortifyUsed) {
        addLog("Already used fortify move this turn!", "text-yellow-500");
        return;
      }
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
          // Let backend validate connected path - allow clicking any owned territory
          if (sourceTerritory && isOwner) {
            try {
              await moveTroops({
                gameId: game._id,
                playerId: myPlayer._id,
                fromTerritory: sourceTerritory.name,
                toTerritory: territory.name,
                count: 1,
              });
              addLog(`Moved 1 troop to ${territory.displayName}`, "text-blue-400");
            } catch (err) {
              addLog(`Move error: ${err}`, "text-red-400");
            }
            setSelectedTerritory(null);
          }
        }
      }
    }
  };

  // Execute attack with selected dice
  const handleExecuteAttack = async () => {
    if (!attackDialog.sourceTerritory || !attackDialog.targetTerritory || !myPlayer) return;

    try {
      const result = await attackTerritory({
        gameId: game._id,
        playerId: myPlayer._id,
        fromTerritory: attackDialog.sourceTerritory.name,
        toTerritory: attackDialog.targetTerritory.name,
        diceCount: attackDialog.selectedDice,
      });

      const diceStr = `[${result.attackerDice?.join(", ")}] vs [${result.defenderDice?.join(", ")}]`;

      if (result.conquered) {
        addLog(`CONQUERED ${attackDialog.targetTerritory.displayName}! ${diceStr}`, "text-green-400");
        // Conquest dialog will open automatically via useEffect
      } else {
        addLog(
          `Attack on ${attackDialog.targetTerritory.displayName}: Lost ${result.attackerLosses}, dealt ${result.defenderLosses}. ${diceStr}`,
          result.attackerLosses > result.defenderLosses ? "text-red-400" : "text-yellow-400"
        );
      }
    } catch (err) {
      addLog(`Attack error: ${err}`, "text-red-400");
    }

    setAttackDialog({ isOpen: false, sourceTerritory: null, targetTerritory: null, selectedDice: 3 });
    setAttackSource(null);
    setSelectedTerritory(null);
  };

  // Confirm conquest with selected troops
  const handleConfirmConquest = async () => {
    if (!myPlayer) return;

    try {
      const result = await confirmConquestMutation({
        gameId: game._id,
        playerId: myPlayer._id,
        troopsToMove: conquestDialog.selectedTroops,
      });
      addLog(`Moved ${result.troopsMoved} troops to ${conquestDialog.toName}`, "text-blue-400");

      if (result.gameOver) {
        addLog(`VICTORY! You control ${result.territoriesControlled}/${result.totalTerritories} territories!`, "text-yellow-400");
      }
    } catch (err) {
      addLog(`Conquest error: ${err}`, "text-red-400");
    }
  };

  // Handle phase transitions using backend mutation
  const handleNextPhase = async () => {
    if (!myPlayer) return;

    if (hasPendingConquest) {
      addLog("Must confirm conquest first!", "text-yellow-500");
      return;
    }

    if (phase === "FORTIFY") {
      await handleEndTurn();
      return;
    }

    try {
      const result = await advancePhase({
        gameId: game._id,
        playerId: myPlayer._id,
      });
      addLog(`Phase: ${result.newPhase?.toUpperCase()}`, "text-blue-300");
      setSelectedTerritory(null);
      setAttackSource(null);
    } catch (err) {
      addLog(`Cannot advance phase: ${err}`, "text-yellow-500");
    }
  };

  // End turn
  const handleEndTurn = async () => {
    if (hasPendingConquest) {
      addLog("Must confirm conquest first!", "text-yellow-500");
      return;
    }

    try {
      const result = await nextTurn({ gameId: game._id });
      setSelectedTerritory(null);
      setAttackSource(null);

      if (result.gameOver) {
        addLog(`GAME OVER! Winner determined.`, "text-yellow-400");
      } else {
        addLog(`Turn ended. Next player gets ${result.reinforcements} reinforcements.`, "text-slate-400");
      }
    } catch (err) {
      addLog(`Error ending turn: ${err}`, "text-red-400");
    }
  };

  // Finish setup phase for current player
  const handleFinishSetup = async () => {
    if (!myPlayer) return;

    try {
      const result = await finishSetupMutation({
        gameId: game._id,
        playerId: myPlayer._id,
      });

      if (result.setupComplete) {
        addLog("Setup complete! Game begins.", "text-green-400");
      } else {
        addLog(`${result.nextPlayerNation}'s turn to place troops.`, "text-purple-400");
      }
    } catch (err) {
      addLog(`Setup error: ${err}`, "text-red-400");
    }
  };

  // Handle card trade
  const handleTradeCards = async () => {
    if (!myPlayer || cardDialog.selectedIndices.length !== 3) return;

    try {
      const result = await tradeCardsMutation({
        gameId: game._id,
        playerId: myPlayer._id,
        cardIndices: cardDialog.selectedIndices,
      });
      addLog(
        `Traded cards for ${result.troopsEarned} bonus troops! (${result.cardsRemaining} cards remaining)`,
        "text-amber-400"
      );
      setCardDialog({ isOpen: false, selectedIndices: [] });
    } catch (err) {
      addLog(`Trade error: ${err}`, "text-red-400");
    }
  };

  // Toggle card selection for trading
  const toggleCardSelection = (index: number) => {
    setCardDialog((prev) => {
      const isSelected = prev.selectedIndices.includes(index);
      const newIndices = isSelected
        ? prev.selectedIndices.filter((i) => i !== index)
        : prev.selectedIndices.length < 3
          ? [...prev.selectedIndices, index]
          : prev.selectedIndices;
      return { ...prev, selectedIndices: newIndices };
    });
  };

  // Check if selected cards form a valid set
  const isValidCardSelection = (): boolean => {
    if (cardDialog.selectedIndices.length !== 3) return false;
    const cards = myPlayer?.cards ?? [];
    const selectedCards = cardDialog.selectedIndices.map((i) => cards[i]);
    const types = new Set(selectedCards);
    return types.size === 1 || types.size === 3;
  };

  // Format date for display
  const gameDate = new Date(game.currentDate);
  const gameDateStr = gameDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });

  // Handle negotiation response
  const handleNegotiationResponse = async (
    status: "accepted" | "rejected" | "countered",
    message?: string
  ) => {
    if (!pendingNegotiation || !myPlayer) return;

    try {
      await respondToNegotiation({
        negotiationId: pendingNegotiation._id,
        playerId: myPlayer._id,
        status,
        responseMessage: message,
      });
      addLog(
        `Responded to ${pendingNegotiation.senderNation}: ${status}`,
        status === "accepted" ? "text-green-400" : status === "rejected" ? "text-red-400" : "text-blue-400"
      );
    } catch (err) {
      addLog(`Failed to respond: ${err}`, "text-red-400");
    }
    setPendingNegotiation(null);
  };

  // Check if this is an AI vs AI game for spectator mode
  const isAllAI = players.every((p) => !p.isHuman);

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
                phase === "SETUP" ? "text-purple-500" : phase === "ATTACK" ? "text-red-500" : phase === "REINFORCE" ? "text-blue-500" : "text-green-500"
              }`}
            >
              {phase}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {phase === "SETUP" && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400">TROOPS TO PLACE</span>
              <span className="text-2xl font-bold text-purple-400 animate-pulse">{setupTroopsLeft}</span>
            </div>
          )}
          {phase === "REINFORCE" && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400">REINFORCEMENTS</span>
              <span className="text-2xl font-bold text-yellow-400 animate-pulse">{reinforcementsLeft}</span>
            </div>
          )}
          {/* Card Display - Imperial Gold styling */}
          {myPlayer && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => phase === "REINFORCE" && (myPlayer.cards?.length ?? 0) >= 3 && setCardDialog({ isOpen: true, selectedIndices: [] })}
                disabled={phase !== "REINFORCE" || (myPlayer.cards?.length ?? 0) < 3}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                  ${(myPlayer.cards?.length ?? 0) >= 5
                    ? 'bg-[#C0392B]/20 border-[#C0392B] animate-pulse'
                    : (myPlayer.cards?.length ?? 0) >= 3 && phase === "REINFORCE"
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer'
                      : 'bg-slate-800/50 border-slate-700 cursor-default'
                  }
                `}
              >
                <Layers size={16} className={(myPlayer.cards?.length ?? 0) >= 5 ? 'text-[#C0392B]' : 'text-[#D4AF37]'} />
                <span className={`font-cinzel text-sm uppercase tracking-wider ${(myPlayer.cards?.length ?? 0) >= 5 ? 'text-[#C0392B]' : 'text-[#D4AF37]'}`}>
                  {myPlayer.cards?.length ?? 0} Cards
                </span>
                {(myPlayer.cards?.length ?? 0) >= 5 && phase === "REINFORCE" && (
                  <span className="text-xs text-[#C0392B] font-bold ml-1">TRADE NOW</span>
                )}
              </button>
            </div>
          )}
          {/* Historical Chat Toggle */}
          {myPlayer && (
            <button
              onClick={() => setShowHistoricalChat(!showHistoricalChat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showHistoricalChat
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50"
              }`}
            >
              <BookOpen size={16} />
              <span className="text-sm">History</span>
            </button>
          )}
          {/* Spectator Mode Toggle (AI vs AI games only) */}
          {isAllAI && (
            <button
              onClick={() => setIsSpectatorMode(!isSpectatorMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isSpectatorMode
                  ? "bg-[#00FFA3] text-[#0F172A]"
                  : "bg-[#00FFA3]/20 text-[#00FFA3] hover:bg-[#00FFA3]/30"
              }`}
            >
              <Eye size={16} />
              <span className="text-sm">Spectate</span>
            </button>
          )}
          {/* Watch AI Button */}
          <AgentViewerButton
            onClick={() => setIsAgentViewerOpen(true)}
            isRunning={agentStream.isRunning}
            nation={agentStream.activity?.nation ?? undefined}
          />
          {phase === "SETUP" ? (
            <Button
              variant="primary"
              onClick={handleFinishSetup}
              disabled={!isMyTurn || setupTroopsLeft > 0}
            >
              Finish Placement <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant={phase === "ATTACK" ? "danger" : "primary"}
              onClick={handleNextPhase}
              disabled={!isMyTurn || hasPendingConquest || (phase === "REINFORCE" && reinforcementsLeft > 0)}
            >
              {phase === "FORTIFY" ? "End Turn" : "Next Phase"} <ChevronRight size={16} />
            </Button>
          )}
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
                <strong className="text-purple-400">Setup:</strong> Click your territories to distribute starting troops.
              </li>
              <li>
                <strong className="text-blue-400">Reinforce:</strong> Click your territory to add troops.
              </li>
              <li>
                <strong className="text-red-400">Attack:</strong> Click source then adjacent target.
              </li>
              <li>
                <strong className="text-green-400">Fortify:</strong> Move troops through any connected chain of your territories.
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

          {/* Historical Chat - in sidebar */}
          {showHistoricalChat && myPlayer && (
            <div className="mt-4 flex-1 min-h-0">
              <HistoricalChat
                gameId={game._id}
                playerNation={myPlayer.nation}
                gameDate={game.currentDate}
              />
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

          {/* Turn Timeline */}
          <div className="z-10">
            <TurnTimeline
              gameId={game._id}
              isSpectatorMode={isSpectatorMode}
            />
          </div>
        </main>
      </div>


      {/* Spectator Overlay */}
      {isAllAI && (
        <SpectatorOverlay
          gameId={game._id}
          players={players}
          isOpen={isSpectatorMode}
          onToggle={() => setIsSpectatorMode(!isSpectatorMode)}
        />
      )}

      {/* Diplomatic Scroll Popup */}
      {pendingNegotiation && myPlayer && (
        <DiplomaticScroll
          negotiation={pendingNegotiation}
          recipientNation={myPlayer.nation}
          isOpen={true}
          onClose={() => setPendingNegotiation(null)}
          onRespond={handleNegotiationResponse}
          isHumanPlayer={myPlayer.isHuman}
        />
      )}

      {/* Attack Dialog - Dice Selection */}
      {attackDialog.isOpen && attackDialog.sourceTerritory && attackDialog.targetTerritory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-cinzel font-bold text-[#D4AF37] mb-4">Attack!</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">From:</span>
                <span className="text-white font-bold">{attackDialog.sourceTerritory.displayName}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">To:</span>
                <span className="text-red-400 font-bold">{attackDialog.targetTerritory.displayName}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Your Troops:</span>
                <span className="text-white">{attackDialog.sourceTerritory.troops}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Enemy Troops:</span>
                <span className="text-red-400">{attackDialog.targetTerritory.troops}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 block mb-2">Select Dice to Roll (1-3):</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((dice) => {
                  const maxDice = Math.min(3, attackDialog.sourceTerritory!.troops - 1);
                  const isDisabled = dice > maxDice;
                  return (
                    <button
                      key={dice}
                      disabled={isDisabled}
                      onClick={() => setAttackDialog((prev) => ({ ...prev, selectedDice: dice }))}
                      className={`flex-1 py-3 rounded font-bold text-lg transition-all ${
                        attackDialog.selectedDice === dice
                          ? "bg-red-600 text-white"
                          : isDisabled
                            ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {dice} 🎲
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Need at least {attackDialog.selectedDice + 1} troops to roll {attackDialog.selectedDice} dice
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="neutral"
                onClick={() => {
                  setAttackDialog({ isOpen: false, sourceTerritory: null, targetTerritory: null, selectedDice: 3 });
                  setAttackSource(null);
                  setSelectedTerritory(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleExecuteAttack} className="flex-1">
                Attack!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conquest Dialog - Troop Selection */}
      {conquestDialog.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-[#00FFA3]/50 rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-cinzel font-bold text-[#00FFA3] mb-4">Territory Conquered!</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">From:</span>
                <span className="text-white font-bold">{conquestDialog.fromName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">To:</span>
                <span className="text-[#00FFA3] font-bold">{conquestDialog.toName}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 block mb-2">
                Troops to Move ({conquestDialog.minTroops} - {conquestDialog.maxTroops}):
              </label>
              <input
                type="range"
                min={conquestDialog.minTroops}
                max={conquestDialog.maxTroops}
                value={conquestDialog.selectedTroops}
                onChange={(e) =>
                  setConquestDialog((prev) => ({ ...prev, selectedTroops: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00FFA3]"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Min: {conquestDialog.minTroops}</span>
                <span className="text-2xl font-bold text-[#00FFA3]">{conquestDialog.selectedTroops}</span>
                <span>Max: {conquestDialog.maxTroops}</span>
              </div>
            </div>

            <Button variant="success" onClick={handleConfirmConquest} className="w-full">
              Confirm Move
            </Button>
          </div>
        </div>
      )}

      {/* Card Trade Dialog - Historical "War Room" aesthetic */}
      {cardDialog.isOpen && myPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#F5E6CC] border-2 border-[#D4AF37] rounded-lg shadow-2xl shadow-black/50 overflow-hidden w-[32rem]">
            {/* Header with parchment texture feel */}
            <div className="bg-[#0F172A]/10 border-b border-[#D4AF37]/30 px-6 py-4">
              <h3 className="font-cinzel text-xl font-bold text-[#0F172A] uppercase tracking-widest flex items-center gap-3">
                <Layers className="text-[#D4AF37]" size={24} />
                Risk Cards
              </h3>
              <p className="text-sm text-[#0F172A]/70 mt-1 font-inter">
                Select 3 cards: three of a kind or one of each type
              </p>
            </div>

            <div className="p-6">
              {/* Trade Bonus Banner */}
              {game.cardTradeCount !== undefined && (
                <div className="mb-6 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-lg px-4 py-3 text-center">
                  <span className="text-[#0F172A]/60 text-sm">Current trade value:</span>
                  <span className="font-cinzel text-2xl font-bold text-[#0F172A] ml-2">
                    {[4, 6, 8, 10, 12, 15, 20][Math.min(game.cardTradeCount ?? 0, 6)]} Troops
                  </span>
                </div>
              )}

              {/* Card Grid - Actual card shapes */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {(myPlayer.cards ?? []).length === 0 ? (
                  <p className="col-span-3 text-[#0F172A]/50 text-center py-8 font-inter">
                    No cards in hand.
                  </p>
                ) : (
                  (myPlayer.cards ?? []).map((card, index) => {
                    const isSelected = cardDialog.selectedIndices.includes(index);
                    const cardConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
                      infantry: {
                        icon: <Swords size={32} />,
                        color: '#B91C1C',
                        bgColor: '#B91C1C/10',
                      },
                      cavalry: {
                        icon: <Zap size={32} />,
                        color: '#0369A1',
                        bgColor: '#0369A1/10',
                      },
                      artillery: {
                        icon: <Target size={32} />,
                        color: '#15803D',
                        bgColor: '#15803D/10',
                      },
                    };
                    const config = cardConfig[card] ?? { icon: <Layers size={32} />, color: '#64748B', bgColor: '#64748B/10' };

                    return (
                      <button
                        key={index}
                        onClick={() => toggleCardSelection(index)}
                        className={`
                          relative flex flex-col items-center justify-center
                          aspect-[2.5/3.5] rounded-lg border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)] scale-105 bg-white'
                            : 'border-[#0F172A]/20 bg-white/80 hover:border-[#D4AF37]/50 hover:shadow-lg'
                          }
                        `}
                      >
                        {/* Card inner content */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          <div style={{ color: config.color }}>
                            {config.icon}
                          </div>
                        </div>
                        <span
                          className="font-cinzel text-xs font-bold uppercase tracking-wider"
                          style={{ color: config.color }}
                        >
                          {card}
                        </span>

                        {/* Selection checkmark */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        )}

                        {/* Card corner decorations */}
                        <div className="absolute top-2 left-2 text-xs font-cinzel" style={{ color: config.color }}>
                          {card === 'infantry' ? 'I' : card === 'cavalry' ? 'C' : 'A'}
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs font-cinzel rotate-180" style={{ color: config.color }}>
                          {card === 'infantry' ? 'I' : card === 'cavalry' ? 'C' : 'A'}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selection Status */}
              <div className="mb-6 text-center">
                <span className="text-sm text-[#0F172A]/60 font-inter">
                  Selected: <strong className="text-[#0F172A]">{cardDialog.selectedIndices.length}</strong> / 3
                </span>
                {cardDialog.selectedIndices.length === 3 && (
                  isValidCardSelection() ? (
                    <span className="ml-3 text-[#27AE60] font-bold">✓ Valid set</span>
                  ) : (
                    <span className="ml-3 text-[#C0392B] font-bold">✗ Invalid combination</span>
                  )
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCardDialog({ isOpen: false, selectedIndices: [] })}
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-[#0F172A]/20 text-[#0F172A]/70 font-cinzel uppercase tracking-wider text-sm hover:border-[#0F172A]/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTradeCards}
                  disabled={!isValidCardSelection()}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-cinzel uppercase tracking-wider text-sm transition-all
                    ${isValidCardSelection()
                      ? 'bg-[#D4AF37] hover:bg-[#F5E6CC] text-[#0F172A] border-2 border-[#D4AF37] shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                      : 'bg-[#0F172A]/10 text-[#0F172A]/30 border-2 border-[#0F172A]/10 cursor-not-allowed'
                    }
                  `}
                >
                  Trade Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Conquest Indicator */}
      {hasPendingConquest && !conquestDialog.isOpen && (
        <div className="fixed bottom-24 right-4 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 z-40">
          <p className="text-yellow-400 font-bold">Pending Conquest!</p>
          <p className="text-xs text-slate-400">You must confirm troop movement.</p>
        </div>
      )}

      {/* Agent Turn Viewer - Observability Panel */}
      <AgentTurnViewer
        gameId={game._id}
        isOpen={isAgentViewerOpen}
        onClose={() => setIsAgentViewerOpen(false)}
      />

      {/* Game Over Overlay */}
      {game.status === "finished" && !isVictoryDismissed && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border-2 border-[#D4AF37] rounded-lg p-8 text-center max-w-md">
            <h2 className="text-3xl font-cinzel font-bold text-[#D4AF37] mb-4">VICTORY!</h2>
            <p className="text-slate-300 mb-6">
              {players.find((p) => p._id === game.winnerId)?.nation} has achieved dominance!
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/lobby">
                <Button variant="primary" className="w-full">Return to Lobby</Button>
              </Link>
              <Button
                variant="neutral"
                onClick={() => setIsVictoryDismissed(true)}
                className="w-full"
              >
                <Eye size={16} />
                Investigate Game
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
