import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameMap } from "@/components/map";
import { GameHeader, PlayerHUD, ActionBar } from "@/components/game";
import { HistoricalQueryModal } from "@/components/rag";
import { ChatDrawer } from "@/components/diplomacy";
import { useGameState } from "@/hooks";
import type { Player, ChatMessage } from "@/types";

export const Route = createFileRoute("/game/$gameId")({
  component: GamePage,
});

// Placeholder player data for demo
const DEMO_PLAYERS: Player[] = [
  {
    _id: "player-1",
    gameId: "demo",
    isHuman: true,
    nation: "Byzantine Empire",
    territories: ["constantinople", "thrace", "greece"],
    troops: 15,
    isEliminated: false,
    color: "#7c3aed", // Purple
  },
  {
    _id: "player-2",
    gameId: "demo",
    isHuman: false,
    nation: "Ottoman Empire",
    model: "gpt-4",
    territories: ["anatolia"],
    troops: 20,
    isEliminated: false,
    color: "#dc2626", // Red
  },
  {
    _id: "player-3",
    gameId: "demo",
    isHuman: false,
    nation: "Venice",
    model: "claude-sonnet",
    territories: ["balkans"],
    troops: 8,
    isEliminated: false,
    color: "#0891b2", // Cyan
  },
];

function GamePage() {
  const { gameId } = Route.useParams();
  const { game, territories, isLoading } = useGameState(gameId);

  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Use demo players if no real data
  const players = DEMO_PLAYERS;
  const currentPlayer = players.find((p) => p.isHuman);

  const handleOpenChat = (player: Player) => {
    setChatTarget(player);
    setIsChatOpen(true);
  };

  const handleSendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      playerId: currentPlayer?._id ?? "",
      content,
      timestamp: Date.now(),
      type: "user",
    };
    setChatMessages((prev) => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        playerId: chatTarget?._id ?? "",
        content:
          "I appreciate your diplomatic overture. However, the Sultan has made his intentions clear. Constantinople will fall.",
        timestamp: Date.now(),
        type: "ai",
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 2000);
  };

  // Get attackable territories (adjacent enemy territories from selected)
  const attackableTerritoryIds: string[] = [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <GameHeader
        currentDate={game?.currentDate ?? new Date("1453-05-01").getTime()}
        currentTurn={game?.currentTurn ?? 1}
        scenario={game?.scenario ?? "1453"}
        notification="The Ottoman siege has begun. Constantinople awaits its fate..."
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Area */}
        <div className="flex-1 p-4">
          <GameMap
            territories={territories}
            players={players}
            selectedTerritoryId={selectedTerritoryId}
            attackableTerritoryIds={attackableTerritoryIds}
            onSelectTerritory={setSelectedTerritoryId}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 p-4 border-l border-slate-700 space-y-4">
          <PlayerHUD
            players={players}
            activePlayerId={game?.activePlayerId ?? "player-1"}
            currentUserId={currentPlayer?._id}
          />

          {/* Quick Actions */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Diplomacy
            </h3>
            <div className="space-y-2">
              {players
                .filter((p) => !p.isHuman && !p.isEliminated)
                .map((player) => (
                  <button
                    key={player._id}
                    onClick={() => handleOpenChat(player)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {player.nation}
                      </div>
                      <div className="text-xs text-slate-400">
                        {player.model}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        phase={game?.phase ?? "attack"}
        isMyTurn={true}
        canAttack={selectedTerritoryId !== null}
        canMove={selectedTerritoryId !== null}
        canFortify={selectedTerritoryId !== null}
        onAttack={() => console.log("Attack")}
        onMove={() => console.log("Move")}
        onFortify={() => console.log("Fortify")}
        onEndTurn={() => console.log("End Turn")}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Modals */}
      <HistoricalQueryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        maxDate={game?.currentDate ?? new Date("1453-05-01").getTime()}
        playerNation={currentPlayer?.nation}
      />

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetPlayer={chatTarget}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
