import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Record game results for benchmarking
export const recordResult = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Get all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get all territories for final counts
    const territories = await ctx.db
      .query("territories")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Get action counts per player
    const logs = await ctx.db
      .query("gameLog")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Find winner
    const winner = game.winnerId ? await ctx.db.get(game.winnerId) : null;

    // Build player stats
    const playerStats = players.map((player) => {
      const playerLogs = logs.filter((l) => l.playerId === player._id);
      const territoryCount = territories.filter(
        (t) => t.ownerId === player._id
      ).length;

      return {
        oderId: player.oderId,
        nation: player.nation,
        isHuman: player.isHuman,
        model: player.model,
        finalTerritoryCount: territoryCount,
        toolCallsUsed: playerLogs.length,
        historicalQueriesAsked: playerLogs.filter((l) => l.action === "query")
          .length,
        negotiationsInitiated: playerLogs.filter((l) => l.action === "negotiate")
          .length,
      };
    });

    // Automatically evaluate all players in this game
    try {
      await ctx.scheduler.runAfter(0, api.evals.evaluateGame, {
        gameId: args.gameId,
      });
    } catch (error) {
      console.error("Failed to trigger automatic evaluation:", error);
      // Don't fail the benchmark recording if evaluation fails
    }

    // Calculate duration
    const firstLog = logs.sort((a, b) => a.timestamp - b.timestamp)[0];
    const lastLog = logs.sort((a, b) => b.timestamp - a.timestamp)[0];
    const durationMs = lastLog && firstLog
      ? lastLog.timestamp - firstLog.timestamp
      : 0;

    const resultId = await ctx.db.insert("gameResults", {
      gameId: args.gameId,
      scenario: game.scenario,
      totalTurns: game.currentTurn,
      winnerId: game.winnerId,
      winnerNation: winner?.nation,
      winnerModel: winner?.model,
      players: playerStats,
      durationMs,
      completedAt: Date.now(),
    });

    return resultId;
  },
});

// Get benchmark statistics by model
export const getStatsByModel = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query("gameResults").collect();

    const modelStats: Record<
      string,
      {
        wins: number;
        games: number;
        avgTurns: number;
        avgTerritories: number;
        avgQueries: number;
        avgNegotiations: number;
      }
    > = {};

    for (const result of results) {
      // Count wins by model
      if (result.winnerModel) {
        if (!modelStats[result.winnerModel]) {
          modelStats[result.winnerModel] = {
            wins: 0,
            games: 0,
            avgTurns: 0,
            avgTerritories: 0,
            avgQueries: 0,
            avgNegotiations: 0,
          };
        }
        modelStats[result.winnerModel].wins++;
      }

      // Track games played by each model
      for (const player of result.players) {
        if (player.model) {
          if (!modelStats[player.model]) {
            modelStats[player.model] = {
              wins: 0,
              games: 0,
              avgTurns: 0,
              avgTerritories: 0,
              avgQueries: 0,
              avgNegotiations: 0,
            };
          }
          modelStats[player.model].games++;
          modelStats[player.model].avgTerritories += player.finalTerritoryCount;
          modelStats[player.model].avgQueries += player.historicalQueriesAsked;
          modelStats[player.model].avgNegotiations +=
            player.negotiationsInitiated;
        }
      }
    }

    // Calculate averages
    for (const model of Object.keys(modelStats)) {
      const stats = modelStats[model];
      if (stats.games > 0) {
        stats.avgTerritories /= stats.games;
        stats.avgQueries /= stats.games;
        stats.avgNegotiations /= stats.games;
      }
    }

    return modelStats;
  },
});

// Get benchmark statistics by scenario
export const getStatsByScenario = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query("gameResults").collect();

    const scenarioStats: Record<
      string,
      {
        gamesPlayed: number;
        avgTurns: number;
        avgDurationMs: number;
        winsByNation: Record<string, number>;
      }
    > = {};

    for (const result of results) {
      if (!scenarioStats[result.scenario]) {
        scenarioStats[result.scenario] = {
          gamesPlayed: 0,
          avgTurns: 0,
          avgDurationMs: 0,
          winsByNation: {},
        };
      }

      const stats = scenarioStats[result.scenario];
      stats.gamesPlayed++;
      stats.avgTurns += result.totalTurns;
      stats.avgDurationMs += result.durationMs;

      if (result.winnerNation) {
        stats.winsByNation[result.winnerNation] =
          (stats.winsByNation[result.winnerNation] || 0) + 1;
      }
    }

    // Calculate averages
    for (const scenario of Object.keys(scenarioStats)) {
      const stats = scenarioStats[scenario];
      if (stats.gamesPlayed > 0) {
        stats.avgTurns /= stats.gamesPlayed;
        stats.avgDurationMs /= stats.gamesPlayed;
      }
    }

    return scenarioStats;
  },
});

// Get recent game results
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("gameResults")
      .order("desc")
      .take(limit);
  },
});
