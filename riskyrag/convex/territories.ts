import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all territories for a game
export const getByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("territories")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Get territories by owner
export const getByOwner = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("territories")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.playerId))
      .collect();
  },
});

// Get a specific territory
export const getByName = query({
  args: {
    gameId: v.id("games"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", args.name)
      )
      .first();
  },
});

// Move troops between territories
export const moveTroops = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    fromTerritory: v.string(),
    toTerritory: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    // Get both territories
    const from = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", args.fromTerritory)
      )
      .first();

    const to = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", args.toTerritory)
      )
      .first();

    if (!from || !to) {
      throw new Error("Territory not found");
    }

    // Validate ownership
    if (from.ownerId !== args.playerId || to.ownerId !== args.playerId) {
      throw new Error("You don't own both territories");
    }

    // Validate adjacency
    if (!from.adjacentTo.includes(args.toTerritory)) {
      throw new Error("Territories are not adjacent");
    }

    // Validate troop count
    if (args.count < 1 || args.count >= from.troops) {
      throw new Error("Invalid troop count (must leave at least 1)");
    }

    // Move troops
    await ctx.db.patch(from._id, { troops: from.troops - args.count });
    await ctx.db.patch(to._id, { troops: to.troops + args.count });

    // Log the action
    const game = await ctx.db.get(args.gameId);
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game?.currentTurn ?? 0,
      playerId: args.playerId,
      action: "move",
      details: {
        from: args.fromTerritory,
        to: args.toTerritory,
        count: args.count,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Attack a territory (simplified deterministic combat)
export const attack = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    fromTerritory: v.string(),
    toTerritory: v.string(),
    attackingTroops: v.number(),
  },
  handler: async (ctx, args) => {
    // Get both territories
    const attacker = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", args.fromTerritory)
      )
      .first();

    const defender = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", args.toTerritory)
      )
      .first();

    if (!attacker || !defender) {
      throw new Error("Territory not found");
    }

    // Validate attacker ownership
    if (attacker.ownerId !== args.playerId) {
      throw new Error("You don't own the attacking territory");
    }

    // Validate defender is enemy
    if (defender.ownerId === args.playerId) {
      throw new Error("Cannot attack your own territory");
    }

    // Validate adjacency
    if (!attacker.adjacentTo.includes(args.toTerritory)) {
      throw new Error("Territories are not adjacent");
    }

    // Validate troop count
    if (args.attackingTroops < 1 || args.attackingTroops >= attacker.troops) {
      throw new Error("Invalid attacking troop count");
    }

    // Simplified combat: Attacker wins if troops > defender troops + 1
    // Losses: defender loses all, attacker loses floor(defender troops / 2)
    const defenderTroops = defender.troops;
    const attackerWins = args.attackingTroops > defenderTroops + 1;

    let result: {
      success: boolean;
      conquered: boolean;
      attackerLosses: number;
      defenderLosses: number;
    };

    if (attackerWins) {
      // Attacker conquers
      const attackerLosses = Math.floor(defenderTroops / 2);
      const remainingAttackers = args.attackingTroops - attackerLosses;

      // Update attacker territory
      await ctx.db.patch(attacker._id, {
        troops: attacker.troops - args.attackingTroops,
      });

      // Update defender territory - change owner
      await ctx.db.patch(defender._id, {
        ownerId: args.playerId,
        troops: remainingAttackers,
      });

      result = {
        success: true,
        conquered: true,
        attackerLosses,
        defenderLosses: defenderTroops,
      };

      // Check if defender player is eliminated
      const defenderPlayer = defender.ownerId;
      if (defenderPlayer) {
        const remainingTerritories = await ctx.db
          .query("territories")
          .withIndex("by_owner", (q) => q.eq("ownerId", defenderPlayer))
          .collect();

        if (remainingTerritories.length === 0) {
          await ctx.db.patch(defenderPlayer, { isEliminated: true });
        }
      }
    } else {
      // Defender holds
      const attackerLosses = Math.min(
        args.attackingTroops,
        Math.ceil(args.attackingTroops * 0.6)
      );
      const defenderLosses = Math.min(
        defenderTroops - 1,
        Math.floor(args.attackingTroops * 0.3)
      );

      await ctx.db.patch(attacker._id, {
        troops: attacker.troops - attackerLosses,
      });
      await ctx.db.patch(defender._id, {
        troops: defender.troops - defenderLosses,
      });

      result = {
        success: true,
        conquered: false,
        attackerLosses,
        defenderLosses,
      };
    }

    // Log the action
    const game = await ctx.db.get(args.gameId);
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game?.currentTurn ?? 0,
      playerId: args.playerId,
      action: "attack",
      details: {
        from: args.fromTerritory,
        to: args.toTerritory,
        attackingTroops: args.attackingTroops,
        ...result,
      },
      timestamp: Date.now(),
    });

    return result;
  },
});

// Add reinforcements to a territory
export const reinforce = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    territory: v.string(),
    troops: v.number(),
  },
  handler: async (ctx, args) => {
    const territory = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", args.territory)
      )
      .first();

    if (!territory) {
      throw new Error("Territory not found");
    }

    if (territory.ownerId !== args.playerId) {
      throw new Error("You don't own this territory");
    }

    await ctx.db.patch(territory._id, {
      troops: territory.troops + args.troops,
    });

    // Log the action
    const game = await ctx.db.get(args.gameId);
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game?.currentTurn ?? 0,
      playerId: args.playerId,
      action: "reinforce",
      details: {
        territory: args.territory,
        troops: args.troops,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Calculate reinforcements for a player
export const calculateReinforcements = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const territories = await ctx.db
      .query("territories")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.playerId))
      .collect();

    // Base: 1 troop per 3 territories (min 3)
    const base = Math.max(3, Math.floor(territories.length / 3));

    // Bonus for controlling entire regions
    const regionCounts: Record<string, number> = {};
    const regionTotals: Record<string, number> = {
      Balkans: 6,
      Anatolia: 2,
      Thrace: 2,
    };

    for (const t of territories) {
      regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
    }

    let regionBonus = 0;
    for (const [region, count] of Object.entries(regionCounts)) {
      if (count === regionTotals[region]) {
        regionBonus += region === "Anatolia" ? 2 : 3;
      }
    }

    return {
      base,
      regionBonus,
      total: base + regionBonus,
      territories: territories.length,
    };
  },
});
