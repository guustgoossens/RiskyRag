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

    // Check if any player has setup troops remaining
    const hasSetupPhase = players.some((p) => (p.setupTroopsRemaining ?? 0) > 0);

    if (hasSetupPhase) {
      // Start in setup phase - players place their initial troops
      await ctx.db.patch(args.gameId, {
        status: "active",
        currentTurn: 0, // Turn 0 = setup phase
        currentPlayerId: firstPlayer._id,
        phase: "setup",
        fortifyUsed: false,
      });
    } else {
      // No setup needed, go directly to reinforce
      const territories = await ctx.db
        .query("territories")
        .withIndex("by_owner", (q) => q.eq("ownerId", firstPlayer._id))
        .collect();
      const baseReinforcements = Math.max(3, Math.floor(territories.length / 3));

      await ctx.db.patch(args.gameId, {
        status: "active",
        currentTurn: 1,
        currentPlayerId: firstPlayer._id,
        phase: "reinforce",
        reinforcementsRemaining: baseReinforcements,
        fortifyUsed: false,
      });
    }

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

    // Cannot advance if there's a pending conquest
    if (game.pendingConquest) {
      throw new Error("Must confirm conquest before ending turn");
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

    // Check for winner (only one player left)
    if (players.length === 1) {
      await ctx.db.patch(args.gameId, {
        status: "finished",
        winnerId: players[0]._id,
      });
      return {
        success: true,
        gameOver: true,
        winnerId: players[0]._id,
        winCondition: "elimination",
      };
    }

    // Check for winner (75% territory domination)
    const allTerritories = await ctx.db
      .query("territories")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    const totalTerritories = allTerritories.length;
    const dominationThreshold = Math.ceil(totalTerritories * 0.75);

    for (const player of players) {
      const playerTerritories = allTerritories.filter(
        (t) => t.ownerId === player._id
      ).length;
      if (playerTerritories >= dominationThreshold) {
        await ctx.db.patch(args.gameId, {
          status: "finished",
          winnerId: player._id,
        });
        return {
          success: true,
          gameOver: true,
          winnerId: player._id,
          winCondition: "domination",
          territoriesControlled: playerTerritories,
          totalTerritories,
        };
      }
    }

    // Find current player index
    const currentIndex = players.findIndex(
      (p) => p._id === game.currentPlayerId
    );
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    // Calculate next player's reinforcements
    const territories = await ctx.db
      .query("territories")
      .withIndex("by_owner", (q) => q.eq("ownerId", nextPlayer._id))
      .collect();
    const baseReinforcements = Math.max(3, Math.floor(territories.length / 3));

    // TODO: Add region bonuses calculation here

    // Advance game date (scenario-specific: 2 weeks for 1861, 1 month for others)
    const scenarioId = game.scenario as ScenarioId;
    const scenario = SCENARIOS[scenarioId];
    const timeAdvancement =
      "timeAdvancementMs" in scenario
        ? (scenario as { timeAdvancementMs: number }).timeAdvancementMs
        : 30 * 24 * 60 * 60 * 1000; // Default: ~30 days
    const newDate = game.currentDate + timeAdvancement;

    await ctx.db.patch(args.gameId, {
      currentTurn: game.currentTurn + 1,
      currentPlayerId: nextPlayer._id,
      currentDate: newDate,
      phase: "reinforce",
      reinforcementsRemaining: baseReinforcements,
      fortifyUsed: false,
      pendingConquest: undefined,
    });

    return {
      success: true,
      nextPlayerId: nextPlayer._id,
      turn: game.currentTurn + 1,
      reinforcements: baseReinforcements,
    };
  },
});

// Transition to next phase
export const advancePhase = mutation({
  args: { gameId: v.id("games"), playerId: v.id("players") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.currentPlayerId !== args.playerId) {
      throw new Error("Not your turn");
    }
    if (game.pendingConquest) {
      throw new Error("Must confirm conquest before advancing phase");
    }

    const currentPhase = game.phase ?? "reinforce";

    if (currentPhase === "reinforce") {
      // Can only advance if all reinforcements are placed
      if ((game.reinforcementsRemaining ?? 0) > 0) {
        throw new Error(
          `Must place all ${game.reinforcementsRemaining} remaining reinforcements first`
        );
      }
      await ctx.db.patch(args.gameId, { phase: "attack" });
      return { success: true, newPhase: "attack" };
    }

    if (currentPhase === "attack") {
      await ctx.db.patch(args.gameId, { phase: "fortify" });
      return { success: true, newPhase: "fortify" };
    }

    if (currentPhase === "fortify") {
      throw new Error("Use nextTurn to end your turn after fortify phase");
    }

    throw new Error(`Unknown phase: ${currentPhase}`);
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
