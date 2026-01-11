import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Swords, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui";
import { ScenarioCard, PlayerConfig } from "@/components/lobby";
import type { Scenario, LLMModel, ScenarioId } from "@/types";

export const Route = createFileRoute("/lobby")({
  component: LobbyPage,
});

// Scenario data
const SCENARIOS: Scenario[] = [
  {
    id: "1453",
    title: "Fall of Constantinople",
    year: 1453,
    description:
      "The Ottoman Empire besieges the last bastion of the Byzantine Empire. Will the ancient walls hold?",
    nations: ["Ottoman Empire", "Byzantine Empire", "Venice", "Genoa"],
    difficulty: "medium",
    mapImage: "/scenarios/1453-constantinople.jpg",
  },
  {
    id: "1776",
    title: "American Revolution",
    year: 1776,
    description:
      "The colonies declare independence. Britain must decide how to respond to rebellion.",
    nations: ["Britain", "France", "Thirteen Colonies", "Spain"],
    difficulty: "easy",
    mapImage: "/scenarios/1776-revolution.jpg",
  },
  {
    id: "1914",
    title: "The Great War",
    year: 1914,
    description:
      "The assassination at Sarajevo ignites a powder keg. Alliances will be tested.",
    nations: ["Germany", "France", "Britain", "Russia", "Austria-Hungary"],
    difficulty: "hard",
    mapImage: "/scenarios/1914-wwi.jpg",
  },
];

interface PlayerSlot {
  id: string;
  isHuman: boolean;
  name: string;
  nation: string;
  model?: LLMModel;
}

function LobbyPage() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>("1453");
  const [players, setPlayers] = useState<PlayerSlot[]>([
    { id: "human-1", isHuman: true, name: "", nation: "" },
    { id: "ai-1", isHuman: false, name: "AI", nation: "", model: "gpt-4" },
  ]);

  const currentScenario = SCENARIOS.find((s) => s.id === selectedScenario);
  const availableNations = currentScenario?.nations ?? [];

  const handleUpdatePlayer = (id: string, updates: Partial<PlayerSlot>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleAddAI = () => {
    const newId = `ai-${Date.now()}`;
    setPlayers((prev) => [
      ...prev,
      { id: newId, isHuman: false, name: "AI", nation: "", model: "claude-sonnet" },
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStartGame = () => {
    // TODO: Create game via Convex mutation
    const gameId = `game-${Date.now()}`;
    navigate({ to: "/game/$gameId", params: { gameId } });
  };

  const isValid =
    players.every((p) => p.nation) &&
    players.length >= 2 &&
    new Set(players.map((p) => p.nation)).size === players.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-white">RiskyRag</h1>
            <span className="text-slate-400 text-sm">Game Setup</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Scenario Selection */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-white">
              Choose Your Era
            </h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4">
            {SCENARIOS.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenario === scenario.id}
                onSelect={(id) => setSelectedScenario(id as ScenarioId)}
              />
            ))}
          </div>
        </section>

        {/* Player Configuration */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-white">
                Configure Players
              </h2>
            </div>

            <PlayerConfig
              players={players}
              availableNations={availableNations}
              onUpdatePlayer={handleUpdatePlayer}
              onAddAI={handleAddAI}
              onRemovePlayer={handleRemovePlayer}
            />
          </div>

          {/* Game Summary */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4">
              Game Summary
            </h3>

            {currentScenario && (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-slate-400">Scenario</span>
                  <p className="text-white font-medium">
                    {currentScenario.title}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-slate-400">Starting Year</span>
                  <p className="text-3xl font-bold text-amber-500">
                    {currentScenario.year}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-slate-400">Players</span>
                  <ul className="mt-2 space-y-1">
                    {players.map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span
                          className={
                            player.isHuman ? "text-blue-400" : "text-purple-400"
                          }
                        >
                          {player.isHuman ? "Human" : player.model}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span>{player.nation || "No nation"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">
                    AI Knowledge Cutoff
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-sm text-amber-400">
                      AI agents will only know history up to{" "}
                      <span className="font-bold">{currentScenario.year}</span>.
                      No future knowledge leakage!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-6"
              size="lg"
              disabled={!isValid}
              onClick={handleStartGame}
            >
              <Swords className="w-5 h-5 mr-2" />
              Start Game
            </Button>

            {!isValid && (
              <p className="text-xs text-red-400 mt-2 text-center">
                Each player must select a unique nation
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
