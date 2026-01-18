import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { REGION_BONUSES, type ScenarioId } from "./scenarios";

// Roll N dice and return sorted descending
function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).sort(
    (a, b) => b - a
  );
}

// Classic Risk dice combat resolution
function resolveCombat(
  attackerDiceCount: number,
  defenderTroops: number
): {
  attackerLosses: number;
  defenderLosses: number;
  attackerDiceRolls: number[];
  defenderDiceRolls: number[];
} {
  // Attacker rolls the number of dice they declared (1-3)
  // Defender can roll 1-2 dice (must have at least 2 troops to roll 2)
  const defenderDiceCount = Math.min(2, defenderTroops);

  const attackerDiceRolls = rollDice(attackerDiceCount);
  const defenderDiceRolls = rollDice(defenderDiceCount);

  let attackerLosses = 0;
  let defenderLosses = 0;

  // Compare highest dice
  if (attackerDiceRolls[0] > defenderDiceRolls[0]) {
    defenderLosses++;
  } else {
    attackerLosses++; // Defender wins ties
  }

  // Compare second highest if both rolled 2+
  if (attackerDiceRolls.length >= 2 && defenderDiceRolls.length >= 2) {
    if (attackerDiceRolls[1] > defenderDiceRolls[1]) {
      defenderLosses++;
    } else {
      attackerLosses++;
    }
  }

  return { attackerLosses, defenderLosses, attackerDiceRolls, defenderDiceRolls };
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

// Move troops between territories (FORTIFY phase only, ONE move per turn)
export const moveTroops = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    fromTerritory: v.string(),
    toTerritory: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    // Get game and check phase
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.currentPlayerId !== args.playerId) {
      throw new Error("Not your turn");
    }
    if (game.phase !== "fortify") {
      throw new Error(`Cannot move troops during ${game.phase} phase. Wait for fortify phase.`);
    }
    if (game.fortifyUsed) {
      throw new Error("You already used your one fortify move this turn");
    }
    if (game.pendingConquest) {
      throw new Error("Must confirm conquest before fortifying");
    }

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

    // Mark fortify as used
    await ctx.db.patch(args.gameId, { fortifyUsed: true });

    // Log the action
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game.currentTurn,
      playerId: args.playerId,
      action: "fortify",
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
    diceCount: v.number(), // 1, 2, or 3 dice
  },
  handler: async (ctx, args) => {
    // Validate dice count
    if (args.diceCount < 1 || args.diceCount > 3) {
      throw new Error("Must roll 1, 2, or 3 dice");
    }

    // Get game and check phase
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.phase !== "attack") {
      throw new Error(`Cannot attack during ${game.phase} phase`);
    }

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

    // Validate troop count: must have at least diceCount + 1 troops (leave 1 behind)
    if (attacker.troops < args.diceCount + 1) {
      throw new Error(
        `Need at least ${args.diceCount + 1} troops to roll ${args.diceCount} dice (must leave 1 behind)`
      );
    }

    // Dice-based combat
    const combat = resolveCombat(args.diceCount, defender.troops);

    // Apply losses to attacker
    const newAttackerTroops = attacker.troops - combat.attackerLosses;
    const newDefenderTroops = defender.troops - combat.defenderLosses;

    // Check for conquest
    const conquered = newDefenderTroops <= 0;

    if (conquered) {
      // Territory conquered! But DON'T auto-move troops yet.
      // Player must call confirmConquest to choose how many to move.
      // For now, just mark the conquest as pending.

      // Update attacker troops (losses only, no movement yet)
      await ctx.db.patch(attacker._id, {
        troops: newAttackerTroops,
      });

      // Transfer ownership but set troops to 0 (pending confirmation)
      const previousOwner = defender.ownerId;
      await ctx.db.patch(defender._id, {
        ownerId: args.playerId,
        troops: 0, // Will be set when player confirms
      });

      // Store pending conquest in game state
      await ctx.db.patch(args.gameId, {
        pendingConquest: {
          fromTerritory: args.fromTerritory,
          toTerritory: args.toTerritory,
          minTroops: args.diceCount, // Must move at least the dice count
          maxTroops: newAttackerTroops - 1, // Can move all but 1
          previousOwner: previousOwner ?? null,
        },
      });

      const result = {
        success: true,
        conquered: true,
        pendingConquest: true,
        minTroopsToMove: args.diceCount,
        maxTroopsToMove: newAttackerTroops - 1,
        attackerLosses: combat.attackerLosses,
        defenderLosses: combat.defenderLosses,
        attackerDice: combat.attackerDiceRolls,
        defenderDice: combat.defenderDiceRolls,
      };

      // Log the action
      await ctx.db.insert("gameLog", {
        gameId: args.gameId,
        turn: game.currentTurn,
        playerId: args.playerId,
        action: "attack",
        details: {
          from: args.fromTerritory,
          to: args.toTerritory,
          diceCount: args.diceCount,
          ...result,
        },
        timestamp: Date.now(),
      });

      return result;
    } else {
      // Defender holds - just apply losses
      await ctx.db.patch(attacker._id, {
        troops: newAttackerTroops,
      });
      await ctx.db.patch(defender._id, {
        troops: newDefenderTroops,
      });

      const result = {
        success: true,
        conquered: false,
        pendingConquest: false,
        attackerLosses: combat.attackerLosses,
        defenderLosses: combat.defenderLosses,
        attackerDice: combat.attackerDiceRolls,
        defenderDice: combat.defenderDiceRolls,
        remainingAttackerTroops: newAttackerTroops,
        remainingDefenderTroops: newDefenderTroops,
      };

      // Log the action
      await ctx.db.insert("gameLog", {
        gameId: args.gameId,
        turn: game.currentTurn,
        playerId: args.playerId,
        action: "attack",
        details: {
          from: args.fromTerritory,
          to: args.toTerritory,
          diceCount: args.diceCount,
          ...result,
        },
        timestamp: Date.now(),
      });

      return result;
    }
  },
});

// Confirm conquest - player chooses how many troops to move into conquered territory
export const confirmConquest = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    troopsToMove: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (!game.pendingConquest) {
      throw new Error("No pending conquest to confirm");
    }

    const pending = game.pendingConquest;

    // Validate troop count
    if (args.troopsToMove < pending.minTroops) {
      throw new Error(
        `Must move at least ${pending.minTroops} troops (the number of dice rolled)`
      );
    }
    if (args.troopsToMove > pending.maxTroops) {
      throw new Error(
        `Can move at most ${pending.maxTroops} troops (must leave 1 behind)`
      );
    }

    // Get territories
    const fromTerritory = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", pending.fromTerritory)
      )
      .first();

    const toTerritory = await ctx.db
      .query("territories")
      .withIndex("by_game_name", (q) =>
        q.eq("gameId", args.gameId).eq("name", pending.toTerritory)
      )
      .first();

    if (!fromTerritory || !toTerritory) {
      throw new Error("Territory not found");
    }

    // Validate ownership
    if (fromTerritory.ownerId !== args.playerId) {
      throw new Error("You don't own the attacking territory");
    }
    if (toTerritory.ownerId !== args.playerId) {
      throw new Error("You don't own the conquered territory");
    }

    // Move troops
    await ctx.db.patch(fromTerritory._id, {
      troops: fromTerritory.troops - args.troopsToMove,
    });
    await ctx.db.patch(toTerritory._id, {
      troops: args.troopsToMove,
    });

    // Check if previous owner is eliminated
    if (pending.previousOwner !== null) {
      const prevOwnerId = pending.previousOwner;
      const remainingTerritories = await ctx.db
        .query("territories")
        .withIndex("by_owner", (q) => q.eq("ownerId", prevOwnerId))
        .collect();

      if (remainingTerritories.length === 0) {
        await ctx.db.patch(prevOwnerId, { isEliminated: true });
      }
    }

    // Clear pending conquest
    await ctx.db.patch(args.gameId, {
      pendingConquest: undefined,
    });

    // Check for 75% territory domination victory
    const allTerritories = await ctx.db
      .query("territories")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    const totalTerritories = allTerritories.length;
    const dominationThreshold = Math.ceil(totalTerritories * 0.75);
    const playerTerritories = allTerritories.filter(
      (t) => t.ownerId === args.playerId
    ).length;

    let gameOver = false;
    if (playerTerritories >= dominationThreshold) {
      await ctx.db.patch(args.gameId, {
        status: "finished",
        winnerId: args.playerId,
      });
      gameOver = true;
    }

    // Log the action
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game.currentTurn,
      playerId: args.playerId,
      action: "confirm_conquest",
      details: {
        from: pending.fromTerritory,
        to: pending.toTerritory,
        troopsMoved: args.troopsToMove,
        gameOver,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      troopsMoved: args.troopsToMove,
      gameOver,
      territoriesControlled: playerTerritories,
      totalTerritories,
    };
  },
});

// Add reinforcements to a territory (REINFORCE phase only)
export const reinforce = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    territory: v.string(),
    troops: v.number(),
  },
  handler: async (ctx, args) => {
    // Get game and check phase
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.currentPlayerId !== args.playerId) {
      throw new Error("Not your turn");
    }
    if (game.phase !== "reinforce") {
      throw new Error(`Cannot reinforce during ${game.phase} phase`);
    }

    // Validate troop count
    if (args.troops < 1) {
      throw new Error("Must place at least 1 troop");
    }
    const remaining = game.reinforcementsRemaining ?? 0;
    if (args.troops > remaining) {
      throw new Error(`Only ${remaining} reinforcements remaining`);
    }

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

    // Update remaining reinforcements
    const newRemaining = remaining - args.troops;
    await ctx.db.patch(args.gameId, {
      reinforcementsRemaining: newRemaining,
    });

    // Log the action
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game.currentTurn,
      playerId: args.playerId,
      action: "reinforce",
      details: {
        territory: args.territory,
        troops: args.troops,
        remaining: newRemaining,
      },
      timestamp: Date.now(),
    });

    return { success: true, remaining: newRemaining };
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

// Place troops during SETUP phase (initial troop placement - Risk rules)
export const placeSetupTroop = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    territory: v.string(),
    troops: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate troops count
    if (args.troops < 1) {
      throw new Error("Must place at least 1 troop");
    }

    // Get game and check phase
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.phase !== "setup") {
      throw new Error(`Cannot place setup troops during ${game.phase} phase`);
    }
    if (game.currentPlayerId !== args.playerId) {
      throw new Error("Not your turn");
    }

    // Get player and check remaining troops
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }
    const remaining = player.setupTroopsRemaining ?? 0;
    if (args.troops > remaining) {
      throw new Error(`Only ${remaining} setup troops remaining`);
    }

    // Get territory and validate ownership
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

    // Place troops
    await ctx.db.patch(territory._id, {
      troops: territory.troops + args.troops,
    });

    // Update remaining setup troops
    const newRemaining = remaining - args.troops;
    await ctx.db.patch(args.playerId, {
      setupTroopsRemaining: newRemaining,
    });

    // Log the action
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game.currentTurn,
      playerId: args.playerId,
      action: "setup_place",
      details: {
        territory: args.territory,
        troops: args.troops,
        remaining: newRemaining,
      },
      timestamp: Date.now(),
    });

    return { success: true, remaining: newRemaining };
  },
});

// Finish setup for current player and advance to next player or start game
export const finishSetup = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.phase !== "setup") {
      throw new Error("Not in setup phase");
    }
    if (game.currentPlayerId !== args.playerId) {
      throw new Error("Not your turn");
    }

    // Check if player has placed all troops
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }
    if ((player.setupTroopsRemaining ?? 0) > 0) {
      throw new Error(
        `Must place all ${player.setupTroopsRemaining} remaining troops first`
      );
    }

    // Get all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Find next player who still has setup troops
    const currentIndex = players.findIndex((p) => p._id === args.playerId);
    let nextPlayerIndex = (currentIndex + 1) % players.length;
    let checkedCount = 0;

    while (checkedCount < players.length) {
      const nextPlayer = players[nextPlayerIndex];
      if ((nextPlayer.setupTroopsRemaining ?? 0) > 0) {
        // This player still has troops to place
        await ctx.db.patch(args.gameId, {
          currentPlayerId: nextPlayer._id,
        });

        // If next player is AI, trigger their turn
        if (!nextPlayer.isHuman) {
          await ctx.scheduler.runAfter(0, api.agent.executeTurn, {
            gameId: args.gameId,
            playerId: nextPlayer._id,
          });
        }

        return {
          success: true,
          setupComplete: false,
          nextPlayerId: nextPlayer._id,
          nextPlayerNation: nextPlayer.nation,
        };
      }
      nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
      checkedCount++;
    }

    // All players done with setup - transition to turn 1 reinforce phase
    const firstPlayer = players[0];
    const territories = await ctx.db
      .query("territories")
      .withIndex("by_owner", (q) => q.eq("ownerId", firstPlayer._id))
      .collect();
    const baseReinforcements = Math.max(3, Math.floor(territories.length / 3));

    await ctx.db.patch(args.gameId, {
      currentTurn: 1,
      currentPlayerId: firstPlayer._id,
      phase: "reinforce",
      reinforcementsRemaining: baseReinforcements,
      fortifyUsed: false,
    });

    // Log setup completion
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: 0,
      playerId: args.playerId,
      action: "setup_complete",
      details: { message: "All players have placed their initial troops" },
      timestamp: Date.now(),
    });

    // If first player is AI, trigger their turn
    if (!firstPlayer.isHuman) {
      await ctx.scheduler.runAfter(0, api.agent.executeTurn, {
        gameId: args.gameId,
        playerId: firstPlayer._id,
      });
    }

    return {
      success: true,
      setupComplete: true,
      firstPlayerId: firstPlayer._id,
      reinforcements: baseReinforcements,
    };
  },
});
