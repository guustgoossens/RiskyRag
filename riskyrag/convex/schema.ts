import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Game sessions
  games: defineTable({
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("finished")
    ),
    scenario: v.string(), // "1453", "1776", "1914"
    startDate: v.number(), // Unix timestamp of scenario start
    currentDate: v.number(), // Current game date (advances with turns)
    currentTurn: v.number(),
    currentPlayerId: v.optional(v.id("players")),
    winnerId: v.optional(v.id("players")),
    maxPlayers: v.number(),
    createdAt: v.number(),
    // Turn phase tracking (Risk rules)
    phase: v.optional(
      v.union(
        v.literal("setup"), // Initial troop placement
        v.literal("reinforce"),
        v.literal("attack"),
        v.literal("fortify")
      )
    ),
    reinforcementsRemaining: v.optional(v.number()), // Troops left to place
    fortifyUsed: v.optional(v.boolean()), // Has player used their one fortify move?
    // Pending conquest - player must confirm troop movement after conquering
    pendingConquest: v.optional(
      v.object({
        fromTerritory: v.string(),
        toTerritory: v.string(),
        minTroops: v.number(), // Minimum troops to move (= dice rolled)
        maxTroops: v.number(), // Maximum troops to move (= troops - 1)
        previousOwner: v.union(v.id("players"), v.null()),
      })
    ),
    // Spectator mode for AI vs AI games - shows all agent thinking
    isSpectatorMode: v.optional(v.boolean()),
    // Risk card system
    cardTradeCount: v.optional(v.number()), // Global escalation counter for card trades
    conqueredThisTurn: v.optional(v.boolean()), // Track if current player conquered a territory
    mustTradeCards: v.optional(v.boolean()), // Force trade if holding 5+ cards
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // Players (human or AI)
  players: defineTable({
    gameId: v.id("games"),
    oderId: v.optional(v.string()), // WorkOS user ID for humans
    isHuman: v.boolean(),
    nation: v.string(), // "Ottoman Empire", "Byzantine Empire"
    model: v.optional(v.string()), // "gpt-4", "llama-3.2-7b" for AI
    color: v.string(), // Hex color for map
    isEliminated: v.boolean(),
    joinedAt: v.number(),
    setupTroopsRemaining: v.optional(v.number()), // Troops left to place during setup phase
    // Risk cards (earned by conquering territories)
    cards: v.optional(v.array(v.union(
      v.literal("infantry"),
      v.literal("cavalry"),
      v.literal("artillery")
    ))),
  })
    .index("by_game", ["gameId"])
    .index("by_user", ["oderId"]),

  // Map territories
  territories: defineTable({
    gameId: v.id("games"),
    name: v.string(), // Internal ID: "constantinople"
    displayName: v.string(), // Display: "Constantinople"
    ownerId: v.optional(v.id("players")),
    troops: v.number(),
    adjacentTo: v.array(v.string()), // Territory names
    region: v.string(), // "Balkans", "Anatolia"
    position: v.object({
      // For map rendering
      x: v.number(),
      y: v.number(),
    }),
  })
    .index("by_game", ["gameId"])
    .index("by_owner", ["ownerId"])
    .index("by_game_name", ["gameId", "name"]),

  // Historical knowledge base (TEMPORAL RAG)
  historicalSnippets: defineTable({
    content: v.string(),
    embedding: v.array(v.float64()),
    eventDate: v.number(), // CRITICAL: Unix timestamp of event
    publicationDate: v.number(), // When knowledge became available
    source: v.string(), // "wikipedia", "britannica"
    sourceUrl: v.optional(v.string()),
    region: v.string(), // Geographic region
    tags: v.array(v.string()), // ["battle", "treaty", "leader"]
    title: v.optional(v.string()),
    participants: v.optional(v.array(v.string())), // Nations involved
    contentHash: v.optional(v.string()), // MD5 hash for deduplication
  })
    .index("by_date", ["eventDate"])
    .index("by_region", ["region"])
    .index("by_source", ["source"])
    .index("by_content_hash", ["contentHash"]) // For dedup lookups
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024, // Voyage AI
      filterFields: ["eventDate", "region"],
    }),

  // Game action log
  gameLog: defineTable({
    gameId: v.id("games"),
    turn: v.number(),
    playerId: v.id("players"),
    action: v.string(), // "attack", "move", "negotiate", "query", "end_turn"
    details: v.any(), // Action-specific payload
    timestamp: v.number(),
  })
    .index("by_game_turn", ["gameId", "turn"])
    .index("by_game", ["gameId"]),

  // Benchmark results
  gameResults: defineTable({
    gameId: v.id("games"),
    scenario: v.string(),
    totalTurns: v.number(),
    winnerId: v.optional(v.id("players")),
    winnerNation: v.optional(v.string()),
    winnerModel: v.optional(v.string()),
    players: v.array(
      v.object({
        oderId: v.optional(v.string()),
        nation: v.string(),
        isHuman: v.boolean(),
        model: v.optional(v.string()),
        finalTerritoryCount: v.number(),
        toolCallsUsed: v.number(),
        historicalQueriesAsked: v.number(),
        negotiationsInitiated: v.number(),
      })
    ),
    durationMs: v.number(),
    completedAt: v.number(),
  })
    .index("by_scenario", ["scenario"])
    .index("by_model", ["winnerModel"]),

  // Diplomacy messages
  negotiations: defineTable({
    gameId: v.id("games"),
    turn: v.number(),
    senderId: v.id("players"),
    recipientId: v.id("players"),
    message: v.string(),
    timestamp: v.number(),
    // Negotiation response handling
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("countered")
      )
    ),
    responseMessage: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
  })
    .index("by_game", ["gameId"])
    .index("by_game_turn", ["gameId", "turn"])
    .index("by_recipient", ["gameId", "recipientId"]),

  // Agent observability - activity tracking
  agentActivity: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    turn: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("error")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    currentTool: v.optional(v.string()),
    currentToolDescription: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    model: v.optional(v.string()),
    nation: v.optional(v.string()),
    gameDateTimestamp: v.optional(v.number()),
    // Done checkpoint data (quality tracking)
    doneCheckpoint: v.optional(
      v.object({
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
        checklistScore: v.number(), // X out of 5
      })
    ),
    doneBeforeEnd: v.optional(v.boolean()), // Did agent call done() before end_turn()?
  })
    .index("by_game_turn", ["gameId", "turn"])
    .index("by_game_player", ["gameId", "playerId"])
    .index("by_game_status", ["gameId", "status"]),

  // Agent tool calls log
  agentToolCalls: defineTable({
    activityId: v.id("agentActivity"),
    gameId: v.id("games"),
    toolName: v.string(),
    arguments: v.any(),
    result: v.optional(v.any()),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  })
    .index("by_activity", ["activityId"])
    .index("by_game", ["gameId"]),

  // Agent RAG queries with temporal filtering info
  agentRagQueries: defineTable({
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
    // Store actual snippets with their citations
    snippets: v.optional(
      v.array(
        v.object({
          title: v.optional(v.string()),
          content: v.string(),
          source: v.string(),
          sourceUrl: v.optional(v.string()),
          date: v.string(),
        })
      )
    ),
  })
    .index("by_activity", ["activityId"])
    .index("by_tool_call", ["toolCallId"]),

  // Agent private strategic notes
  agentNotes: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    turn: v.number(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_game_player", ["gameId", "playerId"])
    .index("by_game_turn", ["gameId", "turn"]),
});
