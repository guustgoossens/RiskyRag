import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Agent Notes - Private strategic notes for AI agents
 * Hidden during play, visible in spectator mode and replay
 */

/**
 * Add a new note for an agent
 */
export const add = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    turn: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert("agentNotes", {
      gameId: args.gameId,
      playerId: args.playerId,
      turn: args.turn,
      content: args.content,
      createdAt: Date.now(),
    });
    return noteId;
  },
});

/**
 * Get all notes for a player in a game
 */
export const getByPlayer = query({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("agentNotes")
      .withIndex("by_game_player", (q) =>
        q.eq("gameId", args.gameId).eq("playerId", args.playerId)
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Get all notes for a specific turn in a game
 */
export const getByTurn = query({
  args: {
    gameId: v.id("games"),
    turn: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentNotes")
      .withIndex("by_game_turn", (q) =>
        q.eq("gameId", args.gameId).eq("turn", args.turn)
      )
      .collect();
  },
});

/**
 * Get all notes for a game (for spectator mode)
 */
export const getByGame = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const notes = await ctx.db
      .query("agentNotes")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .order("desc")
      .take(limit);

    return notes;
  },
});

/**
 * Get notes with player info (for display)
 */
export const getByGameWithPlayers = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const notes = await ctx.db
      .query("agentNotes")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .order("desc")
      .take(limit);

    // Enrich with player info
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        const player = await ctx.db.get(note.playerId);
        return {
          ...note,
          playerNation: player?.nation ?? "Unknown",
          playerColor: player?.color ?? "#666",
        };
      })
    );

    return enrichedNotes;
  },
});
