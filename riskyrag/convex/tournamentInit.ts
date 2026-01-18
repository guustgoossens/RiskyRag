/**
 * Tournament Initialization Functions
 * Internal mutations for automated game setup
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { SCENARIOS, type ScenarioId } from "./scenarios";

/**
 * Initialize territories for a tournament game
 * This creates all territories and assigns them to players based on scenario config
 */
export const initializeTerritories = internalMutation({
  args: {
    gameId: v.id("games"),
    scenario: v.string(),
  },
  handler: async (ctx, args) => {
    const scenarioId = args.scenario as ScenarioId;
    const scenario = SCENARIOS[scenarioId];

    if (!scenario) {
      throw new Error(`Invalid scenario: ${args.scenario}`);
    }

    // Get all players for this game
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    if (players.length === 0) {
      throw new Error("No players found for game");
    }

    // Create player map (nation name -> player ID)
    const playerMap: Record<string, string> = {};
    for (const player of players) {
      playerMap[player.nation] = player._id;
    }

    // Create all territories
    const neutralTerritories =
      "neutralTerritories" in scenario
        ? (scenario as { neutralTerritories: readonly string[] }).neutralTerritories
        : [];
    const neutralTroops =
      "neutralTroops" in scenario
        ? (scenario as { neutralTroops: Record<string, number> }).neutralTroops
        : {};

    for (const territory of scenario.territories) {
      let ownerId: string | undefined;
      let troops = 1; // Default: all territories start with 1 troop

      if (neutralTerritories.includes(territory.name)) {
        // Neutral territory - no owner
        ownerId = undefined;
        troops = neutralTroops[territory.name] ?? 3;
      } else {
        // Find which nation owns this territory
        for (const nation of scenario.nations) {
          const startTerritories = Array.from(nation.startTerritories) as string[];
          if (startTerritories.includes(territory.name)) {
            ownerId = playerMap[nation.name];
            if (!ownerId) {
              console.warn(
                `Territory ${territory.name} assigned to ${nation.name} but no player found`
              );
              continue;
            }
            // Use starting troops from scenario if defined, otherwise 1
            troops = (nation.startingTroops as Record<string, number>)?.[territory.name] ?? 1;
            break;
          }
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

    // Update players with setup troops (for scenarios that require setup phase)
    for (const player of players) {
      const nation = scenario.nations.find((n) => n.name === player.nation);
      if (nation) {
        // Calculate total starting troops
        const startingTroops = nation.startingTroops as Record<string, number>;
        const totalTroops = Object.values(startingTroops).reduce(
          (sum, troops) => sum + troops,
          0
        );
        const territoryCount = nation.startTerritories.length;

        // Setup troops = total - 1 per territory (each territory starts with 1)
        // For tournaments, we skip setup phase, so this is 0
        const setupTroops = 0; // Skip setup phase for tournaments

        await ctx.db.patch(player._id, {
          setupTroopsRemaining: setupTroops,
          cards: [], // Initialize empty card collection
        });
      }
    }

    return { success: true, territoriesCreated: scenario.territories.length };
  },
});

/**
 * Helper to get total starting troops for a nation
 */
function getTotalStartingTroops(nation: {
  startingTroops: Record<string, number>;
}): number {
  return Object.values(nation.startingTroops).reduce(
    (sum, troops) => sum + troops,
    0
  );
}
