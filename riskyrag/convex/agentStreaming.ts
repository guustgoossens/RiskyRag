import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Human-readable tool descriptions
const TOOL_DESCRIPTIONS: Record<string, string> = {
  get_game_state: "Viewing current game state",
  place_reinforcements: "Placing reinforcements",
  finish_setup: "Completing initial setup",
  advance_phase: "Advancing to next phase",
  attack_territory: "Attacking territory",
  confirm_conquest: "Confirming conquest",
  fortify: "Fortifying position",
  query_history: "Querying historical knowledge",
  send_negotiation: "Sending diplomatic message",
  done: "Validating strategy checkpoint",
  end_turn: "Ending turn",
};

// ==================== MUTATIONS ====================

/**
 * Start a new activity record when an AI begins its turn
 */
export const startActivity = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    turn: v.number(),
    model: v.optional(v.string()),
    nation: v.optional(v.string()),
    gameDateTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("agentActivity", {
      gameId: args.gameId,
      playerId: args.playerId,
      turn: args.turn,
      status: "running",
      startedAt: Date.now(),
      model: args.model,
      nation: args.nation,
      gameDateTimestamp: args.gameDateTimestamp,
    });
    return activityId;
  },
});

/**
 * Update the current tool being executed
 */
export const updateCurrentTool = mutation({
  args: {
    activityId: v.id("agentActivity"),
    toolName: v.string(),
  },
  handler: async (ctx, args) => {
    const description =
      TOOL_DESCRIPTIONS[args.toolName] ?? `Executing ${args.toolName}`;
    await ctx.db.patch(args.activityId, {
      currentTool: args.toolName,
      currentToolDescription: description,
    });
  },
});

/**
 * Log the start of a tool call
 */
export const logToolCallStart = mutation({
  args: {
    activityId: v.id("agentActivity"),
    gameId: v.id("games"),
    toolName: v.string(),
    arguments: v.any(),
  },
  handler: async (ctx, args) => {
    const toolCallId = await ctx.db.insert("agentToolCalls", {
      activityId: args.activityId,
      gameId: args.gameId,
      toolName: args.toolName,
      arguments: args.arguments,
      status: "pending",
      startedAt: Date.now(),
    });
    return toolCallId;
  },
});

/**
 * Log the completion of a tool call
 */
export const logToolCallComplete = mutation({
  args: {
    toolCallId: v.id("agentToolCalls"),
    result: v.optional(v.any()),
    status: v.union(v.literal("success"), v.literal("error")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const toolCall = await ctx.db.get(args.toolCallId);
    if (!toolCall) return;

    const completedAt = Date.now();
    const durationMs = completedAt - toolCall.startedAt;

    await ctx.db.patch(args.toolCallId, {
      result: args.result,
      status: args.status,
      errorMessage: args.errorMessage,
      completedAt,
      durationMs,
    });
  },
});

/**
 * Log a RAG query with temporal filtering info
 */
export const logRagQuery = mutation({
  args: {
    activityId: v.id("agentActivity"),
    toolCallId: v.id("agentToolCalls"),
    gameId: v.id("games"),
    question: v.string(),
    gameDateTimestamp: v.number(),
    snippetsReturned: v.number(),
    snippetsBlocked: v.number(),
    blockedEventsSample: v.optional(
      v.array(
        v.object({
          title: v.optional(v.string()),
          eventDate: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const ragQueryId = await ctx.db.insert("agentRagQueries", {
      activityId: args.activityId,
      toolCallId: args.toolCallId,
      gameId: args.gameId,
      question: args.question,
      gameDateTimestamp: args.gameDateTimestamp,
      snippetsReturned: args.snippetsReturned,
      snippetsBlocked: args.snippetsBlocked,
      blockedEventsSample: args.blockedEventsSample,
    });
    return ragQueryId;
  },
});

/**
 * Log the done checkpoint when agent validates its strategy
 */
export const logDoneCheckpoint = mutation({
  args: {
    activityId: v.id("agentActivity"),
    gameId: v.id("games"),
    status: v.string(),
    strategySummary: v.string(),
    checklist: v.object({
      consulted_history: v.boolean(),
      evaluated_threats: v.boolean(),
      reinforced_weak_points: v.boolean(),
      considered_diplomacy: v.boolean(),
      maximized_attacks: v.boolean(),
    }),
    confidence: v.string(),
    nextTurnPriority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate checklist score
    const checklistItems = Object.values(args.checklist);
    const checklistScore = checklistItems.filter((v) => v).length;

    // Update activity with checkpoint data
    await ctx.db.patch(args.activityId, {
      doneCheckpoint: {
        status: args.status,
        strategySummary: args.strategySummary,
        checklist: args.checklist,
        confidence: args.confidence,
        nextTurnPriority: args.nextTurnPriority,
        checklistScore,
      },
    });

    return { checklistScore, total: checklistItems.length };
  },
});

/**
 * Complete an activity record when an AI finishes its turn
 */
export const completeActivity = mutation({
  args: {
    activityId: v.id("agentActivity"),
    reasoning: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("completed"), v.literal("error"))
    ),
    doneBeforeEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.activityId, {
      status: args.status ?? "completed",
      completedAt: Date.now(),
      currentTool: undefined,
      currentToolDescription: undefined,
      reasoning: args.reasoning,
      doneBeforeEnd: args.doneBeforeEnd,
    });
  },
});

// ==================== QUERIES ====================

/**
 * Get the current (or most recent) activity for a game
 * Subscribable - updates in real-time
 */
export const getCurrentActivity = query({
  args: {
    gameId: v.id("games"),
    turn: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.turn !== undefined) {
      // Get activity for specific turn
      const activity = await ctx.db
        .query("agentActivity")
        .withIndex("by_game_turn", (q) =>
          q.eq("gameId", args.gameId).eq("turn", args.turn!)
        )
        .first();
      return activity;
    }

    // Get the most recent running activity or most recent completed
    const runningActivity = await ctx.db
      .query("agentActivity")
      .withIndex("by_game_status", (q) =>
        q.eq("gameId", args.gameId).eq("status", "running")
      )
      .first();

    if (runningActivity) return runningActivity;

    // Fall back to most recent activity
    const activities = await ctx.db
      .query("agentActivity")
      .withIndex("by_game_turn", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(1);

    return activities[0] ?? null;
  },
});

/**
 * Get activity by ID
 */
export const getActivityById = query({
  args: {
    activityId: v.id("agentActivity"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activityId);
  },
});

/**
 * Watch tool calls for an activity - real-time subscription
 */
export const watchToolCalls = query({
  args: {
    activityId: v.id("agentActivity"),
  },
  handler: async (ctx, args) => {
    const toolCalls = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();

    return toolCalls.sort((a, b) => a.startedAt - b.startedAt);
  },
});

/**
 * Watch RAG queries for an activity - real-time subscription
 */
export const watchRagQueries = query({
  args: {
    activityId: v.id("agentActivity"),
  },
  handler: async (ctx, args) => {
    const ragQueries = await ctx.db
      .query("agentRagQueries")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();

    return ragQueries;
  },
});

/**
 * Get all activities for a game (for history/replay)
 */
export const getGameActivities = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const activities = await ctx.db
      .query("agentActivity")
      .withIndex("by_game_turn", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(limit);

    return activities;
  },
});

/**
 * Get full activity details with tool calls and RAG queries
 */
export const getFullActivityDetails = query({
  args: {
    activityId: v.id("agentActivity"),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) return null;

    const toolCalls = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();

    const ragQueries = await ctx.db
      .query("agentRagQueries")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();

    return {
      activity,
      toolCalls: toolCalls.sort((a, b) => a.startedAt - b.startedAt),
      ragQueries,
    };
  },
});

/**
 * Get activities for a specific player
 */
export const getPlayerActivities = query({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const activities = await ctx.db
      .query("agentActivity")
      .withIndex("by_game_player", (q) =>
        q.eq("gameId", args.gameId).eq("playerId", args.playerId)
      )
      .order("desc")
      .take(limit);

    return activities;
  },
});
