import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ==================== EVALUATION SYSTEM ====================
// Minimalist eval setup for RiskyRag agents per game
// Focuses on: Tool Usage, Eagerness, and Game Outcome

// Eval result type
export type AgentEvalResult = {
  gameId: string;
  playerId: string;
  nation: string;
  model: string | null;
  isHuman: boolean;
  
  // Tool Usage Metrics
  toolUsageScore: number; // 0-100
  toolUsageBreakdown: {
    totalToolsUsed: number;
    uniqueToolsUsed: number;
    toolCategoriesUsed: string[];
    historicalQueries: number;
    negotiations: number;
    strategicCheckpoints: number;
  };
  
  // Eagerness Metrics
  eagernessScore: number; // 0-100
  eagernessBreakdown: {
    attacksInitiated: number;
    territoriesConquered: number;
    averageTroopsMovedPerAttack: number;
    fortifyMoves: number;
    defensiveActions: number;
  };
  
  // Game Outcome Metrics
  outcomeScore: number; // 0-100
  outcomeBreakdown: {
    finalTerritoryCount: number;
    finalTerritoryPercentage: number;
    wonGame: boolean;
    winCondition: string | null;
    territoriesGained: number;
    territoriesLost: number;
  };
  
  // Quality Metrics (from done checkpoints)
  qualityScore: number; // 0-100
  qualityBreakdown: {
    checkpointsCompleted: number;
    averageChecklistScore: number; // 0-5
    averageConfidence: string; // "high", "medium", "low"
    strategicPlanning: boolean;
    threatEvaluation: boolean;
    historicalConsultation: boolean;
  };
  
  // Overall Score
  overallScore: number; // 0-100
  evaluationTimestamp: number;
};

// ==================== CORE EVAL FUNCTIONS ====================

// Evaluate a single player's performance in a game
async function evaluatePlayerPerformance(
  ctx: any,
  gameId: string,
  playerId: string
): Promise<AgentEvalResult> {
  const game = await ctx.db.get(gameId);
  const player = await ctx.db.get(playerId);
  
  if (!game || !player) {
    throw new Error("Game or player not found");
  }
  
  // Get all territories for final counts
  const territories = await ctx.db
    .query("territories")
    .withIndex("by_game", (q: any) => q.eq("gameId", gameId))
    .collect();

  // Get all game logs for this player
  const logs = await ctx.db
    .query("gameLog")
    .withIndex("by_game", (q: any) => q.eq("gameId", gameId))
    .filter((q: any) => q.eq(q.field("playerId"), playerId))
    .collect();

  // Get all agent activities for this player
  const activities = await ctx.db
    .query("agentActivity")
    .withIndex("by_game_player", (q: any) =>
      q.eq("gameId", gameId).eq("playerId", playerId)
    )
    .collect();

  // Get all tool calls for this player
  const toolCalls = await ctx.db
    .query("agentToolCalls")
    .withIndex("by_game", (q: any) => q.eq("gameId", gameId))
    .collect();

  const playerToolCalls = toolCalls.filter((tc: any) => {
    const activity = activities.find((a: any) => a._id === tc.activityId);
    return activity?.playerId === playerId;
  });
  
  // Calculate player's territories at start and end
  const initialTerritories = territories.filter((t: any) => {
    // This is a simplification - in a real game we'd need to track initial state
    // For now, we'll use the current owner as the "final" state
    return t.ownerId === playerId;
  }).length;

  const finalTerritories = territories.filter((t: any) => t.ownerId === playerId).length;
  const totalTerritories = territories.length;

  // ===== TOOL USAGE METRICS =====
  const uniqueToolsUsed = new Set(playerToolCalls.map((tc: any) => tc.toolName));
  const toolCategoriesUsed = new Set<string>();

  // Categorize tools
  playerToolCalls.forEach((tc: any) => {
    if (["place_reinforcements", "attack_territory", "confirm_conquest", "fortify"].includes(tc.toolName)) {
      toolCategoriesUsed.add("military");
    } else if (tc.toolName === "query_history") {
      toolCategoriesUsed.add("historical");
    } else if (["send_negotiation", "respond_to_negotiation"].includes(tc.toolName)) {
      toolCategoriesUsed.add("diplomatic");
    } else if (tc.toolName === "done") {
      toolCategoriesUsed.add("strategic");
    } else if (tc.toolName === "trade_cards") {
      toolCategoriesUsed.add("economic");
    }
  });
  
  const historicalQueries = logs.filter((l: any) => l.action === "query").length;
  const negotiations = logs.filter((l: any) => l.action === "negotiate").length;
  const strategicCheckpoints = logs.filter((l: any) => l.action === "done_checkpoint").length;
  
  // Calculate tool usage score (0-100)
  const toolUsageScore = calculateToolUsageScore({
    totalToolsUsed: playerToolCalls.length,
    uniqueToolsUsed: uniqueToolsUsed.size,
    toolCategoriesUsed: toolCategoriesUsed.size,
    historicalQueries,
    negotiations,
    strategicCheckpoints,
  });
  
  // ===== EAGERNESS METRICS =====
  const attacksInitiated = logs.filter((l: any) => l.action === "attack").length;
  const territoriesConquered = logs.filter((l: any) => l.action === "conquer").length;

  // Calculate average troops moved per attack (simplified)
  const attackLogs = logs.filter((l: any) => l.action === "attack");
  const troopsMoved = attackLogs.reduce((sum: any, log: any) => {
    const details = log.details as any;
    return sum + (details?.troopsMoved || 0);
  }, 0);
  const averageTroopsMovedPerAttack = attackLogs.length > 0 
    ? troopsMoved / attackLogs.length 
    : 0;
  
  const fortifyMoves = logs.filter((l: any) => l.action === "fortify").length;
  const defensiveActions = logs.filter((l: any) =>
    l.action === "reinforce" || l.action === "fortify"
  ).length;
  
  // Calculate eagerness score (0-100)
  const eagernessScore = calculateEagernessScore({
    attacksInitiated,
    territoriesConquered,
    averageTroopsMovedPerAttack,
    fortifyMoves,
    defensiveActions,
  });
  
  // ===== GAME OUTCOME METRICS =====
  const wonGame = game.winnerId === playerId;
  const winCondition = wonGame ? (game.status === "finished" ? "victory" : null) : null;
  const territoriesGained = Math.max(0, finalTerritories - initialTerritories);
  const territoriesLost = Math.max(0, initialTerritories - finalTerritories);
  
  // Calculate outcome score (0-100)
  const outcomeScore = calculateOutcomeScore({
    finalTerritoryCount: finalTerritories,
    finalTerritoryPercentage: finalTerritories / totalTerritories,
    wonGame,
    territoriesGained,
    territoriesLost,
  });
  
  // ===== QUALITY METRICS =====
  const checkpointsCompleted = activities.filter((a: any) => a.doneCheckpoint).length;

  const checklistScores = activities
    .filter((a: any) => a.doneCheckpoint)
    .map((a: any) => a.doneCheckpoint?.checklistScore || 0);

  const averageChecklistScore = checklistScores.length > 0
    ? checklistScores.reduce((sum: any, score: any) => sum + score, 0) / checklistScores.length
    : 0;
  
  // Determine average confidence
  const confidenceLevels = activities
    .filter((a: any) => a.doneCheckpoint)
    .map((a: any) => a.doneCheckpoint?.confidence || "medium");
  
  const confidenceScore = calculateConfidenceScore(confidenceLevels);
  
  const strategicPlanning = checkpointsCompleted > 0 && averageChecklistScore >= 3;
  const threatEvaluation = activities.some((a: any) =>
    a.doneCheckpoint?.checklist.evaluated_threats
  );
  const historicalConsultation = activities.some((a: any) =>
    a.doneCheckpoint?.checklist.consulted_history
  );
  
  // Calculate quality score (0-100)
  const qualityScore = calculateQualityScore({
    checkpointsCompleted,
    averageChecklistScore,
    confidenceScore,
    strategicPlanning,
    threatEvaluation,
    historicalConsultation,
  });
  
  // ===== OVERALL SCORE =====
  const overallScore = Math.round(
    (toolUsageScore * 0.25 + 
     eagernessScore * 0.25 + 
     outcomeScore * 0.30 + 
     qualityScore * 0.20)
  );
  
  return {
    gameId: gameId.toString(),
    playerId: playerId.toString(),
    nation: player.nation,
    model: player.model,
    isHuman: player.isHuman,
    
    toolUsageScore,
    toolUsageBreakdown: {
      totalToolsUsed: playerToolCalls.length,
      uniqueToolsUsed: uniqueToolsUsed.size,
      toolCategoriesUsed: Array.from(toolCategoriesUsed),
      historicalQueries,
      negotiations,
      strategicCheckpoints,
    },
    
    eagernessScore,
    eagernessBreakdown: {
      attacksInitiated,
      territoriesConquered,
      averageTroopsMovedPerAttack,
      fortifyMoves,
      defensiveActions,
    },
    
    outcomeScore,
    outcomeBreakdown: {
      finalTerritoryCount: finalTerritories,
      finalTerritoryPercentage: finalTerritories / totalTerritories,
      wonGame,
      winCondition,
      territoriesGained,
      territoriesLost,
    },
    
    qualityScore,
    qualityBreakdown: {
      checkpointsCompleted,
      averageChecklistScore,
      averageConfidence: confidenceScore >= 75 ? "high" : confidenceScore >= 50 ? "medium" : "low",
      strategicPlanning,
      threatEvaluation,
      historicalConsultation,
    },
    
    overallScore,
    evaluationTimestamp: Date.now(),
  };
}

// ==================== SCORING FUNCTIONS ====================

function calculateToolUsageScore(metrics: {
  totalToolsUsed: number;
  uniqueToolsUsed: number;
  toolCategoriesUsed: number;
  historicalQueries: number;
  negotiations: number;
  strategicCheckpoints: number;
}): number {
  // Base score from tool diversity
  let score = 0;
  
  // 0-30 points: Total tools used (more is better, up to a point)
  score += Math.min(30, metrics.totalToolsUsed * 2);
  
  // 0-20 points: Unique tools used (diversity)
  score += Math.min(20, metrics.uniqueToolsUsed * 5);
  
  // 0-20 points: Tool categories used (broader strategy)
  score += Math.min(20, metrics.toolCategoriesUsed * 10);
  
  // 0-10 points: Historical queries (situational awareness)
  score += Math.min(10, metrics.historicalQueries * 2);
  
  // 0-10 points: Negotiations (diplomatic engagement)
  score += Math.min(10, metrics.negotiations * 5);
  
  // 0-10 points: Strategic checkpoints (quality control)
  score += Math.min(10, metrics.strategicCheckpoints * 5);
  
  return Math.min(100, Math.max(0, score));
}

function calculateEagernessScore(metrics: {
  attacksInitiated: number;
  territoriesConquered: number;
  averageTroopsMovedPerAttack: number;
  fortifyMoves: number;
  defensiveActions: number;
}): number {
  let score = 0;
  
  // 0-40 points: Attacks initiated (aggressive play)
  score += Math.min(40, metrics.attacksInitiated * 8);
  
  // 0-30 points: Territories conquered (successful aggression)
  score += Math.min(30, metrics.territoriesConquered * 10);
  
  // 0-10 points: Average troops moved per attack (commitment)
  score += Math.min(10, metrics.averageTroopsMovedPerAttack * 2);
  
  // 0-10 points: Fortify moves (strategic positioning)
  score += Math.min(10, metrics.fortifyMoves * 3);
  
  // 0-10 points: Defensive actions (balanced play)
  score += Math.min(10, metrics.defensiveActions * 2);
  
  return Math.min(100, Math.max(0, score));
}

function calculateOutcomeScore(metrics: {
  finalTerritoryCount: number;
  finalTerritoryPercentage: number;
  wonGame: boolean;
  territoriesGained: number;
  territoriesLost: number;
}): number {
  let score = 0;
  
  // 0-50 points: Win/loss (binary outcome)
  if (metrics.wonGame) {
    score += 50;
  }
  
  // 0-30 points: Territory percentage
  score += Math.min(30, metrics.finalTerritoryPercentage * 100);
  
  // 0-10 points: Territories gained (expansion)
  score += Math.min(10, metrics.territoriesGained * 1);
  
  // 0-10 points: Territories lost (defensive capability)
  score += Math.min(10, Math.max(0, 10 - metrics.territoriesLost));
  
  return Math.min(100, Math.max(0, score));
}

function calculateConfidenceScore(confidenceLevels: string[]): number {
  if (confidenceLevels.length === 0) return 50; // Neutral
  
  const scoreMap: Record<string, number> = {
    "high": 100,
    "medium": 60,
    "low": 30,
  };
  
  const total = confidenceLevels.reduce((sum, level) => sum + (scoreMap[level] || 50), 0);
  return total / confidenceLevels.length;
}

function calculateQualityScore(metrics: {
  checkpointsCompleted: number;
  averageChecklistScore: number;
  confidenceScore: number;
  strategicPlanning: boolean;
  threatEvaluation: boolean;
  historicalConsultation: boolean;
}): number {
  let score = 0;
  
  // 0-30 points: Checkpoints completed (consistency)
  score += Math.min(30, metrics.checkpointsCompleted * 10);
  
  // 0-25 points: Average checklist score (thoroughness)
  score += Math.min(25, metrics.averageChecklistScore * 5);
  
  // 0-15 points: Confidence (self-assessment)
  score += Math.min(15, metrics.confidenceScore * 0.15);
  
  // 0-10 points: Strategic planning
  score += metrics.strategicPlanning ? 10 : 0;
  
  // 0-10 points: Threat evaluation
  score += metrics.threatEvaluation ? 10 : 0;
  
  // 0-10 points: Historical consultation
  score += metrics.historicalConsultation ? 10 : 0;
  
  return Math.min(100, Math.max(0, score));
}

// ==================== MUTATIONS ====================

/**
 * Evaluate all players in a completed game
 */
export const evaluateGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    
    if (game.status !== "finished") {
      throw new Error("Game must be finished to evaluate");
    }
    
    // Get all players
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    
    // Evaluate each player
    const evaluations: AgentEvalResult[] = [];
    
    for (const player of players) {
      try {
        const result = await evaluatePlayerPerformance(ctx, args.gameId, player._id);
        evaluations.push(result);
        
        // Store evaluation result
        await ctx.db.insert("agentEvaluations", {
          gameId: args.gameId,
          playerId: player._id,
          nation: player.nation,
          model: player.model,
          isHuman: player.isHuman,
          evaluation: result,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error(`Failed to evaluate player ${player._id}:`, error);
        // Continue with other players
      }
    }
    
    return evaluations;
  },
});

/**
 * Evaluate a specific player in a game
 */
export const evaluatePlayer = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const result = await evaluatePlayerPerformance(ctx, args.gameId, args.playerId);
    
    // Store evaluation result
    const evalId = await ctx.db.insert("agentEvaluations", {
      gameId: args.gameId,
      playerId: args.playerId,
      nation: result.nation,
      model: result.model ?? undefined,
      isHuman: result.isHuman,
      evaluation: result,
      timestamp: Date.now(),
    });
    
    return { ...result, evaluationId: evalId };
  },
});

// ==================== QUERIES ====================

/**
 * Get evaluation results for a game
 */
export const getGameEvaluations = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentEvaluations")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

/**
 * Get evaluation results for a player
 */
export const getPlayerEvaluations = query({
  args: {
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("agentEvaluations")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get evaluation statistics by model
 */
export const getModelStats = query({
  args: {},
  handler: async (ctx) => {
    const evaluations = await ctx.db.query("agentEvaluations").collect();
    
    const modelStats: Record<string, {
      evaluations: number;
      avgOverallScore: number;
      avgToolUsage: number;
      avgEagerness: number;
      avgOutcome: number;
      avgQuality: number;
      wins: number;
    }> = {};
    
    for (const evalResult of evaluations) {
      const model = evalResult.model || "unknown";
      const evaluation = evalResult.evaluation as AgentEvalResult;
      
      if (!modelStats[model]) {
        modelStats[model] = {
          evaluations: 0,
          avgOverallScore: 0,
          avgToolUsage: 0,
          avgEagerness: 0,
          avgOutcome: 0,
          avgQuality: 0,
          wins: 0,
        };
      }
      
      const stats = modelStats[model];
      stats.evaluations++;
      stats.avgOverallScore += evaluation.overallScore;
      stats.avgToolUsage += evaluation.toolUsageScore;
      stats.avgEagerness += evaluation.eagernessScore;
      stats.avgOutcome += evaluation.outcomeScore;
      stats.avgQuality += evaluation.qualityScore;
      
      if (evaluation.outcomeBreakdown.wonGame) {
        stats.wins++;
      }
    }
    
    // Calculate averages
    for (const model of Object.keys(modelStats)) {
      const stats = modelStats[model];
      if (stats.evaluations > 0) {
        stats.avgOverallScore /= stats.evaluations;
        stats.avgToolUsage /= stats.evaluations;
        stats.avgEagerness /= stats.evaluations;
        stats.avgOutcome /= stats.evaluations;
        stats.avgQuality /= stats.evaluations;
      }
    }
    
    return modelStats;
  },
});

/**
 * Get evaluation statistics by scenario
 */
export const getScenarioStats = query({
  args: {},
  handler: async (ctx) => {
    const evaluations = await ctx.db.query("agentEvaluations").collect();
    const games = await ctx.db.query("games").collect();
    
    const scenarioStats: Record<string, {
      evaluations: number;
      avgOverallScore: number;
      avgTurns: number;
      winsByModel: Record<string, number>;
    }> = {};
    
    for (const evalResult of evaluations) {
      const game = games.find((g) => g._id === evalResult.gameId);
      if (!game) continue;
      
      const scenario = game.scenario;
      const evaluation = evalResult.evaluation as AgentEvalResult;
      
      if (!scenarioStats[scenario]) {
        scenarioStats[scenario] = {
          evaluations: 0,
          avgOverallScore: 0,
          avgTurns: 0,
          winsByModel: {},
        };
      }
      
      const stats = scenarioStats[scenario];
      stats.evaluations++;
      stats.avgOverallScore += evaluation.overallScore;
      stats.avgTurns += game.currentTurn;
      
      if (evaluation.outcomeBreakdown.wonGame && evaluation.model) {
        stats.winsByModel[evaluation.model] = 
          (stats.winsByModel[evaluation.model] || 0) + 1;
      }
    }
    
    // Calculate averages
    for (const scenario of Object.keys(scenarioStats)) {
      const stats = scenarioStats[scenario];
      if (stats.evaluations > 0) {
        stats.avgOverallScore /= stats.evaluations;
        stats.avgTurns /= stats.evaluations;
      }
    }
    
    return scenarioStats;
  },
});

/**
 * Get recent evaluations
 */
export const getRecentEvaluations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("agentEvaluations")
      .order("desc")
      .take(limit);
  },
});