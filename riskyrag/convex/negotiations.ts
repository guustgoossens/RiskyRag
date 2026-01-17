import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a negotiation message
export const send = mutation({
  args: {
    gameId: v.id("games"),
    senderId: v.id("players"),
    recipientId: v.id("players"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current game turn
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const negotiationId = await ctx.db.insert("negotiations", {
      gameId: args.gameId,
      turn: game.currentTurn,
      senderId: args.senderId,
      recipientId: args.recipientId,
      message: args.message,
      timestamp: Date.now(),
    });

    // Log the action
    await ctx.db.insert("gameLog", {
      gameId: args.gameId,
      turn: game.currentTurn,
      playerId: args.senderId,
      action: "negotiate",
      details: {
        recipientId: args.recipientId,
        messagePreview: args.message.slice(0, 100),
      },
      timestamp: Date.now(),
    });

    return negotiationId;
  },
});

// Get negotiations for a game
export const getByGame = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("negotiations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(limit);
  },
});

// Get negotiations for a specific player
export const getForPlayer = query({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const negotiations = await ctx.db
      .query("negotiations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) =>
        q.or(
          q.eq(q.field("senderId"), args.playerId),
          q.eq(q.field("recipientId"), args.playerId)
        )
      )
      .order("desc")
      .take(limit);

    return negotiations;
  },
});

// Get negotiations between two players
export const getBetweenPlayers = query({
  args: {
    gameId: v.id("games"),
    player1Id: v.id("players"),
    player2Id: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const negotiations = await ctx.db
      .query("negotiations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), args.player1Id),
            q.eq(q.field("recipientId"), args.player2Id)
          ),
          q.and(
            q.eq(q.field("senderId"), args.player2Id),
            q.eq(q.field("recipientId"), args.player1Id)
          )
        )
      )
      .order("desc")
      .take(limit);

    return negotiations;
  },
});
