import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a log entry
export const add = mutation({
  args: {
    gameId: v.id("games"),
    turn: v.number(),
    playerId: v.id("players"),
    action: v.string(),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gameLog", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get log entries for a game
export const getByGame = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("gameLog")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(limit);
  },
});

// Get log entries for a specific turn
export const getByTurn = query({
  args: {
    gameId: v.id("games"),
    turn: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameLog")
      .withIndex("by_game_turn", (q) =>
        q.eq("gameId", args.gameId).eq("turn", args.turn)
      )
      .collect();
  },
});

// Get player's actions in a game
export const getByPlayer = query({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("gameLog")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .order("desc")
      .take(limit);
  },
});

// Count actions by type for benchmarking
export const countByType = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("gameLog")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.action] = (counts[log.action] || 0) + 1;
    }
    return counts;
  },
});
