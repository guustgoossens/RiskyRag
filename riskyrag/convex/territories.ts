import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { REGION_BONUSES, type ScenarioId } from "./scenarios";

// Roll N dice and return sorted descending
function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).sort(
    (a, b) => b - a
  );
}

// Classic Risk dice combat resolution
function resolveCombat(
  attackerTroops: number,
  defenderTroops: number
): {
  attackerLosses: number;
  defenderLosses: number;
  attackerDice: number[];
  defenderDice: number[];
} {
  // Attacker can roll 1-3 dice (must have at least troops+1 to roll that many)
  const attackerDiceCount = Math.min(3, attackerTroops);
  // Defender can roll 1-2 dice (must have at least 2 troops to roll 2)
  const defenderDiceCount = Math.min(2, defenderTroops);

  const attackerDice = rollDice(attackerDiceCount);
  const defenderDice = rollDice(defenderDiceCount);

  let attackerLosses = 0;
  let defenderLosses = 0;

  // Compare highest dice
  if (attackerDice[0] > defenderDice[0]) {
    defenderLosses++;
  } else {
    attackerLosses++; // Defender wins ties
  }

  // Compare second highest if both rolled 2+
  if (attackerDice.length >= 2 && defenderDice.length >= 2) {
    if (attackerDice[1] > defenderDice[1]) {
      defenderLosses++;
    } else {
      attackerLosses++;
    }
  }

  return { attackerLosses, defenderLosses, attackerDice, defenderDice };
}

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

// Attack a territory (dice-based Risk combat)
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

    // Validate defender is enemy (or neutral)
    if (defender.ownerId === args.playerId) {
      throw new Error("Cannot attack your own territory");
    }

    // Validate adjacency
    if (!attacker.adjacentTo.includes(args.toTerritory)) {
      throw new Error("Territories are not adjacent");
    }

    // Validate troop count (must leave at least 1 behind)
    if (args.attackingTroops < 1 || args.attackingTroops >= attacker.troops) {
      throw new Error("Invalid attacking troop count");
    }

    // Dice-based combat
    const combat = resolveCombat(args.attackingTroops, defender.troops);

    // Apply losses
    const newAttackerTroops = attacker.troops - combat.attackerLosses;
    const newDefenderTroops = defender.troops - combat.defenderLosses;

    // Check for conquest
    const conquered = newDefenderTroops <= 0;

    if (conquered) {
      // Attacker conquers the territory
      const movingTroops = args.attackingTroops - combat.attackerLosses;

      await ctx.db.patch(attacker._id, {
        troops: attacker.troops - args.attackingTroops,
      });

      await ctx.db.patch(defender._id, {
        ownerId: args.playerId,
        troops: Math.max(1, movingTroops),
      });

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
      await ctx.db.patch(attacker._id, {
        troops: newAttackerTroops,
      });
      await ctx.db.patch(defender._id, {
        troops: newDefenderTroops,
      });
    }

    const result = {
      success: true,
      conquered,
      attackerLosses: combat.attackerLosses,
      defenderLosses: combat.defenderLosses,
      attackerDice: combat.attackerDice,
      defenderDice: combat.defenderDice,
    };

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

// Calculate reinforcements for a player (scenario-aware)
export const calculateReinforcements = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return { base: 3, regionBonus: 0, specialBonus: 0, total: 3, territories: 0 };
    }

    const game = await ctx.db.get(player.gameId);
    if (!game) {
      return { base: 3, regionBonus: 0, specialBonus: 0, total: 3, territories: 0 };
    }

    const territories = await ctx.db
      .query("territories")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.playerId))
      .collect();

    // Base: 1 troop per 3 territories (min 3)
    const base = Math.max(3, Math.floor(territories.length / 3));

    // Get scenario-specific region bonuses
    const scenarioId = game.scenario as ScenarioId;
    const scenarioBonuses =
      scenarioId in REGION_BONUSES
        ? (REGION_BONUSES[scenarioId as keyof typeof REGION_BONUSES] as Record<
            string,
            { total: number; bonus: number }
          >)
        : {};

    // Count territories per region
    const regionCounts: Record<string, number> = {};
    for (const t of territories) {
      regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
    }

    // Calculate region bonus
    let regionBonus = 0;
    for (const [region, count] of Object.entries(regionCounts)) {
      const regionData = scenarioBonuses[region];
      if (regionData && count === regionData.total) {
        regionBonus += regionData.bonus;
      }
    }

    // Special bonuses (e.g., Mississippi River for Civil War)
    let specialBonus = 0;
    if (scenarioId === "1861") {
      // Mississippi River bonus: control both mississippi_valley and gulf_coast
      const hasRiver = territories.some((t) => t.name === "mississippi_valley");
      const hasGulf = territories.some((t) => t.name === "gulf_coast");
      if (hasRiver && hasGulf) {
        specialBonus += 2;
      }
    }

    return {
      base,
      regionBonus,
      specialBonus,
      total: base + regionBonus + specialBonus,
      territories: territories.length,
    };
  },
});
