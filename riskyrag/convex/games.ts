import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { SCENARIOS, type ScenarioId } from "./scenarios";

// Create a new game
export const create = mutation({
  args: {
    scenario: v.string(),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const scenarioId = args.scenario as ScenarioId;
    const scenario = SCENARIOS[scenarioId];

    if (!scenario) {
      throw new Error(`Invalid scenario: ${args.scenario}`);
    }

    const maxPlayers = args.maxPlayers ?? scenario.nations.length;

    const gameId = await ctx.db.insert("games", {
      status: "waiting",
      scenario: args.scenario,
      startDate: scenario.startDate,
      currentDate: scenario.startDate,
      currentTurn: 0,
      maxPlayers,
      createdAt: Date.now(),
    });

    return gameId;
  },
});

// Get a game by ID
export const get = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List games by status
export const listByStatus = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("games")
        .withIndex("by_status", (q) =>
          q.eq(
            "status",
            args.status as "waiting" | "active" | "finished"
          )
        )
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("games")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

// List waiting games (for lobby)
export const listWaiting = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .collect();
  },
});

// Start the game
export const start = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    // Get all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    if (players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    // Set first player
    const firstPlayer = players[0];

    await ctx.db.patch(args.gameId, {
      status: "active",
      currentTurn: 1,
      currentPlayerId: firstPlayer._id,
    });

    return { success: true };
  },
});

// End game
export const finish = mutation({
  args: {
    gameId: v.id("games"),
    winnerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await ctx.db.patch(args.gameId, {
      status: "finished",
      winnerId: args.winnerId,
    });

    return { success: true };
  },
});

// Advance to next turn
export const nextTurn = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "active") {
      throw new Error("Game is not active");
    }

    // Get all active players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("isEliminated"), false))
      .collect();

    if (players.length === 0) {
      throw new Error("No active players");
    }

    // Find current player index
    const currentIndex = players.findIndex(
      (p) => p._id === game.currentPlayerId
    );
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    // Advance game date (1 month per turn for 1453 scenario)
    const newDate = game.currentDate + 30 * 24 * 60 * 60 * 1000; // ~30 days

    await ctx.db.patch(args.gameId, {
      currentTurn: game.currentTurn + 1,
      currentPlayerId: nextPlayer._id,
      currentDate: newDate,
    });

    return {
      success: true,
      nextPlayerId: nextPlayer._id,
      turn: game.currentTurn + 1,
    };
  },
});

// Get full game state (for UI)
export const getFullState = query({
  args: { gameId: v.id("games") },
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

    const recentLog = await ctx.db
      .query("gameLog")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(20);

    return {
      game,
      players,
      territories,
      recentLog,
    };
  },
});
