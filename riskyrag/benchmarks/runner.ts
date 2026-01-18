#!/usr/bin/env bun
/**
 * Tournament Runner CLI
 * Run AI vs AI games for evaluation
 *
 * Usage:
 *   bun benchmarks/runner.ts                    # Interactive mode
 *   bun benchmarks/runner.ts quick              # Run predefined tournament
 *   bun benchmarks/runner.ts custom 1453 gpt-4o claude-3.5-sonnet  # Custom game
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import {
  AVAILABLE_MODELS,
  AVAILABLE_SCENARIOS,
  TOURNAMENTS,
  getModel,
  getScenario,
  getTournament,
  validateMatchup,
  estimateTournamentDuration,
  type TournamentConfig,
  type ModelMatchup,
} from "./config";

// ==================== SETUP ====================

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL not found in environment variables");
  console.error("Set VITE_CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// ==================== TYPES ====================

type GameResult = {
  gameId: string;
  scenario: string;
  models: string[];
  winner: string | null;
  totalTurns: number;
  duration: number;
};

// ==================== CLI HELPERS ====================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createProgressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${" ".repeat(empty)}] ${percentage}%`;
}

async function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ==================== GAME MONITORING ====================

async function waitForGameCompletion(
  gameId: string,
  showProgress: boolean = true
): Promise<GameResult> {
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds
  let lastTurn = 0;

  while (true) {
    const status = await client.query(api.tournament.getGameStatus, { gameId });

    if (!status) {
      throw new Error("Game not found");
    }

    // Show progress
    if (showProgress && status.game.currentTurn !== lastTurn) {
      lastTurn = status.game.currentTurn;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(
        `  Turn ${status.game.currentTurn} | ${status.currentActivity?.nation || "waiting"} | ${elapsed}s elapsed`,
        "dim"
      );
    }

    if (status.game.status === "finished") {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const winner = status.players.find(
        (p) => p.id === status.game.winnerId
      );

      return {
        gameId,
        scenario: status.game.scenario,
        models: status.players.map((p) => p.model || "unknown"),
        winner: winner ? `${winner.nation} (${winner.model})` : null,
        totalTurns: status.game.currentTurn,
        duration,
      };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

// ==================== TOURNAMENT EXECUTION ====================

async function runSingleGame(
  scenario: string,
  models: string[],
  gameNumber?: number
): Promise<GameResult> {
  const scenarioConfig = getScenario(scenario);
  if (!scenarioConfig) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }

  const modelNames = models.map((m) => getModel(m)?.name || m).join(" vs ");
  const gameLabel = gameNumber ? ` (Game ${gameNumber})` : "";

  log(`\n▶ Starting: ${modelNames}${gameLabel}`, "cyan");
  log(`  Scenario: ${scenarioConfig.name}`, "dim");

  // Create and start game
  const result = await client.action(
    api.tournament.createAndStartTournamentGame,
    {
      scenario,
      models,
    }
  );

  log(`  Game ID: ${result.gameId}`, "dim");

  // Wait for completion
  const gameResult = await waitForGameCompletion(result.gameId, true);

  // Display result
  if (gameResult.winner) {
    log(`✓ Winner: ${gameResult.winner}`, "green");
  } else {
    log(`✓ Game completed (no winner)`, "yellow");
  }
  log(
    `  ${gameResult.totalTurns} turns | ${gameResult.duration}s duration`,
    "dim"
  );

  return gameResult;
}

async function runTournament(
  tournament: TournamentConfig
): Promise<GameResult[]> {
  log(`\n${"=".repeat(60)}`, "bright");
  log(`🏆 ${tournament.name}`, "bright");
  log(`${"=".repeat(60)}`, "bright");
  log(`${tournament.description}\n`);

  const totalGames =
    tournament.scenarios.length *
    tournament.matchups.length *
    tournament.gamesPerMatchup;

  log(`📊 Tournament Configuration:`, "cyan");
  log(`  Scenarios: ${tournament.scenarios.join(", ")}`);
  log(`  Matchups: ${tournament.matchups.length}`);
  log(`  Games per matchup: ${tournament.gamesPerMatchup}`);
  log(`  Total games: ${totalGames}`);
  log(
    `  Estimated duration: ~${estimateTournamentDuration(tournament)} minutes\n`
  );

  const results: GameResult[] = [];
  let completedGames = 0;

  for (const scenarioId of tournament.scenarios) {
    const scenario = getScenario(scenarioId);
    if (!scenario) {
      log(`⚠ Skipping unknown scenario: ${scenarioId}`, "yellow");
      continue;
    }

    log(`\n📍 Scenario: ${scenario.name}`, "magenta");

    for (const matchup of tournament.matchups) {
      // Validate matchup
      const validation = validateMatchup(matchup, scenario);
      if (!validation.valid) {
        log(`⚠ Skipping invalid matchup: ${validation.error}`, "yellow");
        continue;
      }

      const modelNames = matchup.models
        .map((m) => getModel(m)?.name || m)
        .join(" vs ");
      log(`\n🎮 Matchup: ${modelNames}`, "blue");
      if (matchup.description) {
        log(`  ${matchup.description}`, "dim");
      }

      // Run multiple games for this matchup
      for (let i = 0; i < tournament.gamesPerMatchup; i++) {
        try {
          const result = await runSingleGame(
            scenarioId,
            matchup.models,
            i + 1
          );
          results.push(result);
          completedGames++;

          // Show overall progress
          log(
            `\n  Progress: ${createProgressBar(completedGames, totalGames)} (${completedGames}/${totalGames})`,
            "cyan"
          );
        } catch (error) {
          log(`❌ Game failed: ${error}`, "red");
        }
      }
    }
  }

  return results;
}

// ==================== REPORTING ====================

function generateReport(results: GameResult[]) {
  log(`\n${"=".repeat(60)}`, "bright");
  log(`📊 Tournament Results`, "bright");
  log(`${"=".repeat(60)}\n`, "bright");

  // Overall stats
  log(`Total games played: ${results.length}`, "cyan");
  const avgTurns =
    results.reduce((sum, r) => sum + r.totalTurns, 0) / results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  log(`Average turns: ${Math.round(avgTurns)}`);
  log(`Average duration: ${Math.round(avgDuration)}s\n`);

  // Win rates by model
  const modelStats: Record<
    string,
    { games: number; wins: number; losses: number }
  > = {};

  for (const result of results) {
    for (const model of result.models) {
      if (!modelStats[model]) {
        modelStats[model] = { games: 0, wins: 0, losses: 0 };
      }
      modelStats[model].games++;

      if (result.winner?.includes(model)) {
        modelStats[model].wins++;
      } else {
        modelStats[model].losses++;
      }
    }
  }

  log(`🏆 Model Performance:`, "green");
  const sortedModels = Object.entries(modelStats).sort(
    ([, a], [, b]) => b.wins / b.games - a.wins / a.games
  );

  for (const [model, stats] of sortedModels) {
    const winRate = ((stats.wins / stats.games) * 100).toFixed(1);
    const bar = createProgressBar(stats.wins, stats.games, 20);
    log(`  ${model.padEnd(20)} ${bar} ${winRate}% (${stats.wins}/${stats.games} wins)`);
  }

  // Scenario breakdown
  const scenarioStats: Record<string, number> = {};
  for (const result of results) {
    scenarioStats[result.scenario] = (scenarioStats[result.scenario] || 0) + 1;
  }

  log(`\n📍 Games by Scenario:`, "magenta");
  for (const [scenario, count] of Object.entries(scenarioStats)) {
    log(`  ${scenario}: ${count} games`);
  }

  log(`\n✅ Tournament complete!`, "green");
}

// ==================== INTERACTIVE MODE ====================

async function interactiveMode() {
  log(`\n${"=".repeat(60)}`, "bright");
  log(`🎮 RiskyRag Tournament Runner`, "bright");
  log(`${"=".repeat(60)}\n`, "bright");

  log(`Available Tournaments:`, "cyan");
  const tournamentKeys = Object.keys(TOURNAMENTS);
  tournamentKeys.forEach((key, index) => {
    const tournament = TOURNAMENTS[key];
    log(
      `  ${index + 1}. ${key.padEnd(15)} - ${tournament.description}`,
      "dim"
    );
  });

  log(`\n  ${tournamentKeys.length + 1}. custom         - Create custom game`);
  log(`  ${tournamentKeys.length + 2}. quit           - Exit\n`);

  const answer = await askQuestion("Select an option: ");
  const choice = parseInt(answer);

  if (choice === tournamentKeys.length + 2 || answer.toLowerCase() === "quit") {
    log("Goodbye!", "cyan");
    process.exit(0);
  }

  if (choice === tournamentKeys.length + 1 || answer.toLowerCase() === "custom") {
    await customGameMode();
    return;
  }

  if (choice > 0 && choice <= tournamentKeys.length) {
    const tournamentKey = tournamentKeys[choice - 1];
    const tournament = getTournament(tournamentKey);
    if (tournament) {
      const results = await runTournament(tournament);
      generateReport(results);
    }
    return;
  }

  log("Invalid selection", "red");
  await interactiveMode();
}

async function customGameMode() {
  log(`\n📍 Available Scenarios:`, "cyan");
  AVAILABLE_SCENARIOS.forEach((s, i) => {
    log(`  ${i + 1}. ${s.name} (${s.players} players)`);
  });

  const scenarioAnswer = await askQuestion("\nSelect scenario (number): ");
  const scenarioIndex = parseInt(scenarioAnswer) - 1;

  if (scenarioIndex < 0 || scenarioIndex >= AVAILABLE_SCENARIOS.length) {
    log("Invalid scenario", "red");
    return;
  }

  const scenario = AVAILABLE_SCENARIOS[scenarioIndex];

  log(`\n🤖 Available Models:`, "cyan");
  AVAILABLE_MODELS.forEach((m, i) => {
    log(`  ${i + 1}. ${m.name} (${m.provider})`);
  });

  const models: string[] = [];
  for (let i = 0; i < scenario.players; i++) {
    const answer = await askQuestion(`\nSelect model for player ${i + 1}: `);
    const modelIndex = parseInt(answer) - 1;

    if (modelIndex < 0 || modelIndex >= AVAILABLE_MODELS.length) {
      log("Invalid model", "red");
      return;
    }

    models.push(AVAILABLE_MODELS[modelIndex].id);
  }

  log(`\n🎮 Starting custom game...`, "green");
  const result = await runSingleGame(scenario.id, models);

  log(`\n📊 Game Result:`, "bright");
  log(`  Winner: ${result.winner || "None"}`);
  log(`  Turns: ${result.totalTurns}`);
  log(`  Duration: ${result.duration}s`);
}

// ==================== MAIN ====================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    await interactiveMode();
    return;
  }

  const command = args[0];

  if (command === "list") {
    // List available tournaments
    log(`\n📋 Available Tournaments:\n`, "bright");
    for (const [key, tournament] of Object.entries(TOURNAMENTS)) {
      log(`${key}`, "cyan");
      log(`  ${tournament.description}`);
      log(`  Games: ${tournament.matchups.length * tournament.gamesPerMatchup}`);
      log(`  Duration: ~${estimateTournamentDuration(tournament)} minutes\n`);
    }
    return;
  }

  if (command === "custom" && args.length >= 3) {
    // Custom game: bun benchmarks/runner.ts custom 1453 gpt-4o claude-3.5-sonnet
    const scenario = args[1];
    const models = args.slice(2);

    const result = await runSingleGame(scenario, models);

    log(`\n📊 Game Result:`, "bright");
    log(`  Winner: ${result.winner || "None"}`);
    log(`  Turns: ${result.totalTurns}`);
    log(`  Duration: ${result.duration}s`);
    return;
  }

  // Run predefined tournament
  const tournament = getTournament(command);
  if (!tournament) {
    log(`❌ Unknown tournament: ${command}`, "red");
    log(`Run 'bun benchmarks/runner.ts list' to see available tournaments`, "dim");
    process.exit(1);
  }

  const results = await runTournament(tournament);
  generateReport(results);
}

// Run
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
