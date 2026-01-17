import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { SCENARIOS, type ScenarioId } from "./scenarios";

// Join a game as a human player
export const join = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.optional(v.string()),
    nation: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    const scenarioId = game.scenario as ScenarioId;
    const scenario = SCENARIOS[scenarioId];
    const nationData = scenario.nations.find((n) => n.name === args.nation);

    if (!nationData) {
      throw new Error(`Invalid nation: ${args.nation}`);
    }

    // Check if nation is already taken
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("nation"), args.nation))
      .first();

    if (existingPlayer) {
      throw new Error(`Nation ${args.nation} is already taken`);
    }

    // Create player
    const playerId = await ctx.db.insert("players", {
      gameId: args.gameId,
      oderId: args.userId,
      isHuman: true,
      nation: args.nation,
      color: nationData.color,
      isEliminated: false,
      joinedAt: Date.now(),
    });

    return playerId;
  },
});

// Add an AI player
export const addAI = mutation({
  args: {
    gameId: v.id("games"),
    nation: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    const scenarioId = game.scenario as ScenarioId;
    const scenario = SCENARIOS[scenarioId];
    const nationData = scenario.nations.find((n) => n.name === args.nation);

    if (!nationData) {
      throw new Error(`Invalid nation: ${args.nation}`);
    }

    // Check if nation is already taken
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("nation"), args.nation))
      .first();

    if (existingPlayer) {
      throw new Error(`Nation ${args.nation} is already taken`);
    }

    // Create AI player
    const playerId = await ctx.db.insert("players", {
      gameId: args.gameId,
      isHuman: false,
      nation: args.nation,
      model: args.model ?? nationData.model,
      color: nationData.color,
      isEliminated: false,
      joinedAt: Date.now(),
    });

    return playerId;
  },
});

// Get players for a game
export const getByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Get player by ID
export const get = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Eliminate a player
export const eliminate = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.patch(args.playerId, {
      isEliminated: true,
    });

    return { success: true };
  },
});

// Initialize all players and territories for a game
export const initializeGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const scenarioId = game.scenario as ScenarioId;
    const scenario = SCENARIOS[scenarioId];

    // Create all AI players that haven't been claimed by humans
    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const takenNations = new Set(existingPlayers.map((p) => p.nation));

    // Add AI players for unclaimed nations
    const playerMap: Record<string, string> = {};

    for (const existingPlayer of existingPlayers) {
      playerMap[existingPlayer.nation] = existingPlayer._id;
    }

    for (const nation of scenario.nations) {
      if (!takenNations.has(nation.name)) {
        const playerId = await ctx.db.insert("players", {
          gameId: args.gameId,
          isHuman: false,
          nation: nation.name,
          model: nation.model,
          color: nation.color,
          isEliminated: false,
          joinedAt: Date.now(),
        });
        playerMap[nation.name] = playerId;
      }
    }

    // Create all territories
    for (const territory of scenario.territories) {
      // Find which nation owns this territory
      let ownerId: string | undefined;
      let troops = 1;

      for (const nation of scenario.nations) {
        // Use Array.from to handle readonly arrays
        const startTerritories = Array.from(nation.startTerritories);
        if (startTerritories.includes(territory.name)) {
          ownerId = playerMap[nation.name];
          troops =
            nation.startingTroops[
              territory.name as keyof typeof nation.startingTroops
            ] ?? 1;
          break;
        }
      }

      await ctx.db.insert("territories", {
        gameId: args.gameId,
        name: territory.name,
        displayName: territory.displayName,
        ownerId: ownerId as any,
        troops,
        adjacentTo: [...territory.adjacentTo], // Convert readonly to mutable
        region: territory.region,
        position: territory.position,
      });
    }

    return { success: true, playerCount: Object.keys(playerMap).length };
  },
});
