/**
 * Tournament Functions
 * Convex functions for creating and managing AI vs AI tournaments
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ==================== MUTATIONS ====================

/**
 * Create an AI vs AI game for tournament evaluation
 */
export const createAIGame = mutation({
  args: {
    scenario: v.string(), // "1453", "1776", "1914"
    models: v.array(v.string()), // Model IDs for each player
    isSpectatorMode: v.optional(v.boolean()), // Show all agent thinking
  },
  handler: async (ctx, args) => {
    const { scenario, models, isSpectatorMode = true } = args;

    // Validate scenario
    const scenarioConfigs: Record<
      string,
      { startDate: number; nations: string[]; colors: string[] }
    > = {
      "1453": {
        startDate: new Date("1453-01-01").getTime(),
        nations: ["Ottoman Empire", "Byzantine Empire", "Venice", "Genoa"],
        colors: ["#2E7D32", "#7B1FA2", "#1565C0", "#C62828"],
      },
      "1776": {
        startDate: new Date("1776-01-01").getTime(),
        nations: ["British Empire", "American Colonies", "Kingdom of France"],
        colors: ["#c8102e", "#003f87", "#0055a4"],
      },
      "1914": {
        startDate: new Date("1914-01-01").getTime(),
        nations: [
          "German Empire",
          "British Empire",
          "Russian Empire",
          "French Republic",
        ],
        colors: ["#000000", "#c8102e", "#0039a6", "#0055a4"],
      },
    };

    const config = scenarioConfigs[scenario];
    if (!config) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    if (models.length !== config.nations.length) {
      throw new Error(
        `Scenario ${scenario} requires ${config.nations.length} players but got ${models.length} models`
      );
    }

    // Create game
    const gameId = await ctx.db.insert("games", {
      status: "waiting",
      scenario,
      startDate: config.startDate,
      currentDate: config.startDate,
      currentTurn: 0,
      maxPlayers: models.length,
      createdAt: Date.now(),
      phase: "setup",
      reinforcementsRemaining: 0,
      fortifyUsed: false,
      isSpectatorMode,
      cardTradeCount: 0,
      conqueredThisTurn: false,
      mustTradeCards: false,
    });

    // Create AI players
    const playerIds: Id<"players">[] = [];
    for (let i = 0; i < models.length; i++) {
      const playerId = await ctx.db.insert("players", {
        gameId,
        isHuman: false,
        nation: config.nations[i],
        model: models[i],
        color: config.colors[i],
        isEliminated: false,
        joinedAt: Date.now(),
        setupTroopsRemaining: 0,
        cards: [],
      });
      playerIds.push(playerId);
    }

    return {
      gameId,
      playerIds,
      scenario,
      models,
    };
  },
});

/**
 * Start an AI game (after creation)
 */
export const startAIGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "waiting") {
      throw new Error("Game already started");
    }

    // Initialize game state (territories, etc.)
    // This would call the same initialization logic as regular games
    await ctx.db.patch(args.gameId, {
      status: "active",
      currentTurn: 1,
    });

    return { success: true };
  },
});

// ==================== QUERIES ====================

/**
 * Get game status for monitoring
 */
export const getGameStatus = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const territories = await ctx.db
      .query("territories")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const logs = await ctx.db
      .query("gameLog")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const activities = await ctx.db
      .query("agentActivity")
      .withIndex("by_game_status", (q) =>
        q.eq("gameId", args.gameId).eq("status", "running")
      )
      .collect();

    // Get recent errors from agent activity
    const recentErrorActivities = await ctx.db
      .query("agentActivity")
      .withIndex("by_game_status", (q) =>
        q.eq("gameId", args.gameId).eq("status", "error")
      )
      .order("desc")
      .take(3);

    const recentErrors = recentErrorActivities.map((a) => {
      const tool = a.currentTool || "unknown";
      return `${a.nation}: ${tool} failed`;
    });

    return {
      game,
      players: players.map((p) => ({
        id: p._id,
        nation: p.nation,
        model: p.model,
        isEliminated: p.isEliminated,
        territoryCount: territories.filter((t) => t.ownerId === p._id).length,
      })),
      currentActivity: activities[0]
        ? {
            activityId: activities[0]._id,
            playerId: activities[0].playerId,
            nation: activities[0].nation,
            model: activities[0].model,
            currentTool: activities[0].currentTool,
            currentToolDescription: activities[0].currentToolDescription,
            reasoning: activities[0].reasoning,
          }
        : null,
      totalActions: logs.length,
      recentErrors,
    };
  },
});

/**
 * Get all active tournament games
 */
export const getActiveTournamentGames = query({
  args: {},
  handler: async (ctx) => {
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter for AI-only games (spectator mode)
    const tournamentGames = activeGames.filter((g) => g.isSpectatorMode);

    const gamesWithPlayers = await Promise.all(
      tournamentGames.map(async (game) => {
        const players = await ctx.db
          .query("players")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();

        const territories = await ctx.db
          .query("territories")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();

        return {
          gameId: game._id,
          scenario: game.scenario,
          currentTurn: game.currentTurn,
          status: game.status,
          models: players.map((p) => p.model || "unknown"),
          playerCounts: players.map((p) => ({
            nation: p.nation,
            territories: territories.filter((t) => t.ownerId === p._id).length,
          })),
          createdAt: game.createdAt,
        };
      })
    );

    return gamesWithPlayers;
  },
});

/**
 * Get tournament game results
 */
export const getTournamentResults = query({
  args: {
    scenario: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let results = await ctx.db
      .query("gameResults")
      .order("desc")
      .take(limit);

    if (args.scenario) {
      results = results.filter((r) => r.scenario === args.scenario);
    }

    return results;
  },
});

/**
 * Get tournament statistics
 */
export const getTournamentStats = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query("gameResults").collect();

    const stats: Record<
      string,
      {
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
        avgTurns: number;
        avgTerritories: number;
      }
    > = {};

    for (const result of results) {
      for (const player of result.players) {
        if (!player.model) continue;

        const model = player.model;
        if (!stats[model]) {
          stats[model] = {
            totalGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            avgTurns: 0,
            avgTerritories: 0,
          };
        }

        stats[model].totalGames++;
        stats[model].avgTurns += result.totalTurns;
        stats[model].avgTerritories += player.finalTerritoryCount;

        if (result.winnerModel === model) {
          stats[model].wins++;
        } else {
          stats[model].losses++;
        }
      }
    }

    // Calculate averages and win rates
    for (const model of Object.keys(stats)) {
      const modelStats = stats[model];
      modelStats.winRate =
        modelStats.totalGames > 0
          ? modelStats.wins / modelStats.totalGames
          : 0;
      modelStats.avgTurns =
        modelStats.totalGames > 0
          ? modelStats.avgTurns / modelStats.totalGames
          : 0;
      modelStats.avgTerritories =
        modelStats.totalGames > 0
          ? modelStats.avgTerritories / modelStats.totalGames
          : 0;
    }

    return stats;
  },
});

// ==================== ACTIONS ====================

/**
 * Create and start a tournament game (fully automated)
 * Creates game, players, initializes territories, and starts AI execution
 */
export const createAndStartTournamentGame = action({
  args: {
    scenario: v.string(),
    models: v.array(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ gameId: Id<"games">; playerIds: Id<"players">[] }> => {
    // Create the game
    const { gameId, playerIds } = await ctx.runMutation(
      api.tournament.createAIGame,
      {
        scenario: args.scenario,
        models: args.models,
        isSpectatorMode: true,
      }
    );

    // Initialize territories
    await ctx.runMutation(internal.tournamentInit.initializeTerritories, {
      gameId,
      scenario: args.scenario,
    });

    // Start the game
    await ctx.runMutation(api.tournament.startAIGame, { gameId });

    return { gameId, playerIds };
  },
});

/**
 * Wait for a game to complete (polling)
 */
export const waitForGameCompletion = action({
  args: {
    gameId: v.id("games"),
    timeoutMs: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<
    | { completed: true; winnerId: any; totalTurns: number }
    | { completed: false; error: string }
  > => {
    const timeout = args.timeoutMs ?? 600000; // 10 minutes default
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeout) {
      const status: any = await ctx.runQuery(api.tournament.getGameStatus, {
        gameId: args.gameId,
      });

      if (!status) {
        throw new Error("Game not found");
      }

      if (status.game.status === "finished") {
        return {
          completed: true,
          winnerId: status.game.winnerId,
          totalTurns: status.game.currentTurn,
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return {
      completed: false,
      error: "Timeout waiting for game completion",
    };
  },
});
