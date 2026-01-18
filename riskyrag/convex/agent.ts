import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { SCENARIOS, type ScenarioId } from "./scenarios";
import type { Doc, Id } from "./_generated/dataModel";

// Model registry for multi-provider support
const MODELS = {
  "gpt-4o": {
    provider: "openai",
    model: "gpt-4o",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  "gpt-4o-mini": {
    provider: "openai",
    model: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  "claude-sonnet": {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },
  "llama-3.2-7b": {
    provider: "vllm",
    model: "meta-llama/Llama-3.2-7B-Instruct",
    apiKeyEnv: "VLLM_API_KEY",
  },
} as const;

type ModelKey = keyof typeof MODELS;
type ModelConfig = (typeof MODELS)[ModelKey];

// Message type for LLM conversations
type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

// ==================== TOOL VALIDATION SYSTEM ====================

type GamePhase = "setup" | "reinforce" | "attack" | "fortify";

type ValidationContext = {
  phase: GamePhase;
  hasDoneCheckpoint: boolean;
  hasPendingConquest: boolean;
  reinforcementsRemaining: number;
  setupTroopsRemaining: number;
  fortifyUsed: boolean;
};

type ValidationResult = {
  valid: boolean;
  error?: string;
  hint?: string;
};

// Define which phases each tool is allowed in, and any additional requirements
const TOOL_VALIDATORS: Record<
  string,
  (ctx: ValidationContext, args: Record<string, unknown>) => ValidationResult
> = {
  get_game_state: () => ({ valid: true }), // Always allowed

  place_reinforcements: (ctx) => {
    if (ctx.phase !== "setup" && ctx.phase !== "reinforce") {
      return {
        valid: false,
        error: `Cannot place reinforcements during ${ctx.phase.toUpperCase()} phase.`,
        hint: "Reinforcements can only be placed during SETUP or REINFORCE phases.",
      };
    }
    if (ctx.phase === "setup" && ctx.setupTroopsRemaining <= 0) {
      return {
        valid: false,
        error: "No setup troops remaining.",
        hint: "Use finish_setup to complete your setup phase.",
      };
    }
    if (ctx.phase === "reinforce" && ctx.reinforcementsRemaining <= 0) {
      return {
        valid: false,
        error: "No reinforcements remaining.",
        hint: "Use advance_phase to move to ATTACK phase.",
      };
    }
    return { valid: true };
  },

  finish_setup: (ctx) => {
    if (ctx.phase !== "setup") {
      return {
        valid: false,
        error: `Cannot finish setup during ${ctx.phase.toUpperCase()} phase.`,
        hint: "finish_setup is only available during initial SETUP phase.",
      };
    }
    if (ctx.setupTroopsRemaining > 0) {
      return {
        valid: false,
        error: `You still have ${ctx.setupTroopsRemaining} setup troops to place.`,
        hint: "Place all troops before finishing setup.",
      };
    }
    return { valid: true };
  },

  advance_phase: (ctx) => {
    if (ctx.phase === "setup") {
      return {
        valid: false,
        error: "Cannot advance phase during SETUP.",
        hint: "Use finish_setup to complete initial placement.",
      };
    }
    if (ctx.phase === "reinforce" && ctx.reinforcementsRemaining > 0) {
      return {
        valid: false,
        error: `You still have ${ctx.reinforcementsRemaining} reinforcements to place.`,
        hint: "Place all reinforcements before advancing to ATTACK phase.",
      };
    }
    if (ctx.hasPendingConquest) {
      return {
        valid: false,
        error: "You have a pending conquest to confirm.",
        hint: "Use confirm_conquest to move troops into the conquered territory first.",
      };
    }
    return { valid: true };
  },

  attack_territory: (ctx) => {
    if (ctx.phase !== "attack") {
      return {
        valid: false,
        error: `Cannot attack during ${ctx.phase.toUpperCase()} phase.`,
        hint: ctx.phase === "reinforce"
          ? "Advance to ATTACK phase first using advance_phase."
          : "Attacks are only allowed during ATTACK phase.",
      };
    }
    if (ctx.hasPendingConquest) {
      return {
        valid: false,
        error: "You have a pending conquest to confirm.",
        hint: "Use confirm_conquest before attacking again.",
      };
    }
    return { valid: true };
  },

  confirm_conquest: (ctx) => {
    if (!ctx.hasPendingConquest) {
      return {
        valid: false,
        error: "No pending conquest to confirm.",
        hint: "You can only confirm a conquest after winning an attack.",
      };
    }
    return { valid: true };
  },

  fortify: (ctx) => {
    if (ctx.phase !== "fortify") {
      return {
        valid: false,
        error: `Cannot fortify during ${ctx.phase.toUpperCase()} phase.`,
        hint: "Advance to FORTIFY phase first.",
      };
    }
    if (ctx.fortifyUsed) {
      return {
        valid: false,
        error: "You already used your fortify move this turn.",
        hint: "You only get ONE fortify move per turn. Use end_turn to finish.",
      };
    }
    return { valid: true };
  },

  query_history: () => ({ valid: true }), // Always allowed

  send_negotiation: () => ({ valid: true }), // Always allowed

  done: (ctx) => {
    if (ctx.phase !== "attack" && ctx.phase !== "fortify") {
      return {
        valid: false,
        error: `Cannot validate strategy during ${ctx.phase.toUpperCase()} phase.`,
        hint: ctx.phase === "reinforce"
          ? "Complete reinforcements and advance to ATTACK phase first."
          : "Complete setup first before validating strategy.",
      };
    }
    if (ctx.hasPendingConquest) {
      return {
        valid: false,
        error: "You have a pending conquest to confirm.",
        hint: "Use confirm_conquest before calling done.",
      };
    }
    return { valid: true };
  },

  end_turn: (ctx) => {
    if (ctx.phase !== "attack" && ctx.phase !== "fortify") {
      return {
        valid: false,
        error: `Cannot end turn during ${ctx.phase.toUpperCase()} phase.`,
        hint: ctx.phase === "reinforce"
          ? "Place all reinforcements and advance through phases first."
          : "Complete setup first.",
      };
    }
    if (ctx.hasPendingConquest) {
      return {
        valid: false,
        error: "You have a pending conquest to confirm.",
        hint: "Use confirm_conquest before ending your turn.",
      };
    }
    if (!ctx.hasDoneCheckpoint) {
      return {
        valid: false,
        error: "You must call 'done' before ending your turn.",
        hint: "Call the 'done' tool to validate your strategy, then call end_turn.",
      };
    }
    return { valid: true };
  },
};

// Validate a tool call before execution
function validateToolCall(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ValidationContext
): ValidationResult {
  const validator = TOOL_VALIDATORS[toolName];
  if (!validator) {
    return {
      valid: false,
      error: `Unknown tool: ${toolName}`,
      hint: "Check available tools in the game context.",
    };
  }
  return validator(ctx, args);
}

// ==================== TOOL DEFINITIONS ====================

// Tool definitions for AI agents
const GAME_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_game_state",
      description:
        "Get the current map showing your territories, troop counts, phase, and visible enemy positions",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "place_reinforcements",
      description:
        "Place troops on your territories. Available during SETUP phase (initial placement) and REINFORCE phase. Must place all troops before advancing.",
      parameters: {
        type: "object",
        properties: {
          territory: {
            type: "string",
            description: "Your territory name to reinforce",
          },
          troops: {
            type: "number",
            description: "Number of troops to place (cannot exceed remaining reinforcements)",
          },
        },
        required: ["territory", "troops"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "finish_setup",
      description:
        "Finish placing initial troops and pass to the next player. Only available during SETUP phase when you have placed all your setup troops.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "advance_phase",
      description:
        "Move to the next phase. REINFORCE → ATTACK → FORTIFY. Must place all reinforcements before advancing from reinforce phase.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "attack_territory",
      description:
        "Attack an adjacent enemy territory. Only available during ATTACK phase. You roll 1-3 dice (need at least dice+1 troops). If you conquer, you must confirm how many troops to move.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Your territory name to attack from",
          },
          to: {
            type: "string",
            description: "Enemy territory name to attack",
          },
          dice: {
            type: "number",
            description: "Number of dice to roll (1, 2, or 3). Need at least dice+1 troops in territory.",
          },
        },
        required: ["from", "to", "dice"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "confirm_conquest",
      description:
        "After conquering a territory, confirm how many troops to move into it. Must move at least the dice rolled, max is all but 1.",
      parameters: {
        type: "object",
        properties: {
          troops: {
            type: "number",
            description: "Number of troops to move into conquered territory",
          },
        },
        required: ["troops"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fortify",
      description:
        "Move troops between your own adjacent territories. Only available during FORTIFY phase. You get ONE fortify move per turn.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Source territory name" },
          to: { type: "string", description: "Destination territory name" },
          count: { type: "number", description: "Number of troops to move (must leave at least 1)" },
        },
        required: ["from", "to", "count"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_history",
      description:
        "Learn about historical events relevant to your nation and the current era. You can only know about events up to the current game year.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "Your question about history, strategy, or your nation",
          },
        },
        required: ["question"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_negotiation",
      description: "Send a diplomatic message to another nation",
      parameters: {
        type: "object",
        properties: {
          recipient_nation: {
            type: "string",
            description: "The nation to send the message to",
          },
          message: {
            type: "string",
            description: "Your diplomatic message",
          },
        },
        required: ["recipient_nation", "message"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "done",
      description:
        "Signal that you have completed your turn strategy. Only available during ATTACK or FORTIFY phase. Call this BEFORE end_turn to validate your decisions and ensure quality reasoning. This checkpoint helps track your strategic thinking.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["complete", "partial", "defensive"],
            description:
              "complete = executed full strategy, partial = couldn't do everything planned, defensive = focused on defense this turn",
          },
          strategy_summary: {
            type: "string",
            description: "Brief summary of what you accomplished this turn (2-3 sentences)",
          },
          checklist: {
            type: "object",
            description: "Honest self-assessment of your turn",
            properties: {
              consulted_history: {
                type: "boolean",
                description: "Did you query historical knowledge to inform decisions?",
              },
              evaluated_threats: {
                type: "boolean",
                description: "Did you assess enemy positions and potential attacks?",
              },
              reinforced_weak_points: {
                type: "boolean",
                description: "Did you strengthen vulnerable border territories?",
              },
              considered_diplomacy: {
                type: "boolean",
                description: "Did you consider or attempt diplomatic options?",
              },
              maximized_attacks: {
                type: "boolean",
                description: "Did you attack when advantageous (3+ troops vs enemy)?",
              },
            },
            required: [
              "consulted_history",
              "evaluated_threats",
              "reinforced_weak_points",
              "considered_diplomacy",
              "maximized_attacks",
            ],
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence in this turn's decisions",
          },
          next_turn_priority: {
            type: "string",
            description: "What should be your focus next turn?",
          },
        },
        required: ["status", "strategy_summary", "checklist", "confidence"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "end_turn",
      description:
        "End your turn. IMPORTANT: Call the 'done' tool first to validate your strategy. Available during ATTACK or FORTIFY phase. Cannot end turn if there is a pending conquest to confirm.",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of your strategy this turn",
          },
        },
        required: ["reasoning"],
      },
    },
  },
];

// Execute an AI player's turn
export const executeTurn = action({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; iterations: number; activityId: Id<"agentActivity"> }> => {
    // Get game and player state
    const game: Doc<"games"> | null = await ctx.runQuery(api.games.get, { id: args.gameId });
    const player: Doc<"players"> | null = await ctx.runQuery(api.players.get, { id: args.playerId });

    if (!game || !player) {
      throw new Error("Game or player not found");
    }

    if (player.isHuman) {
      throw new Error("Cannot execute AI turn for human player");
    }

    const modelKey = (player.model ?? "gpt-4o") as ModelKey;
    const modelConfig = MODELS[modelKey];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelKey}`);
    }

    // Get scenario data for system prompt
    const scenario = SCENARIOS[game.scenario as ScenarioId];
    const nationData = scenario.nations.find((n) => n.name === player.nation);

    if (!nationData) {
      throw new Error(`Nation not found: ${player.nation}`);
    }

    // ===== START ACTIVITY LOGGING =====
    const activityId: Id<"agentActivity"> = await ctx.runMutation(api.agentStreaming.startActivity, {
      gameId: args.gameId,
      playerId: args.playerId,
      turn: game.currentTurn,
      model: player.model ?? "gpt-4o",
      nation: player.nation,
      gameDateTimestamp: game.currentDate,
    });

    let finalReasoning: string | undefined;
    let doneCheckpoint: {
      status: string;
      strategySummary: string;
      checklist: Record<string, boolean>;
      confidence: string;
      nextTurnPriority?: string;
    } | undefined;

    try {
      // Build the system prompt
      const systemPrompt = nationData.systemPrompt;

      // Get current game state for context
      const territories: Doc<"territories">[] = await ctx.runQuery(api.territories.getByGame, {
        gameId: args.gameId,
      });
      const players: Doc<"players">[] = await ctx.runQuery(api.players.getByGame, {
        gameId: args.gameId,
      });

      const myTerritories = territories.filter((t: Doc<"territories">) => t.ownerId === args.playerId);

      const gameDate = new Date(game.currentDate);
      const gameStateContext = `
Current Game State (Turn ${game.currentTurn}):
Date: ${gameDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })}

Your Territories (${myTerritories.length}):
${myTerritories.map((t: Doc<"territories">) => `- ${t.displayName}: ${t.troops} troops (adjacent to: ${t.adjacentTo.join(", ")})`).join("\n")}

Other Powers:
${players
  .filter((p: Doc<"players">) => p._id !== args.playerId && !p.isEliminated)
  .map((p: Doc<"players">) => {
    const theirTerritories = territories.filter((t: Doc<"territories">) => t.ownerId === p._id);
    return `- ${p.nation}: ${theirTerritories.length} territories`;
  })
  .join("\n")}

Current Phase: ${game.phase ?? "reinforce"}
${game.phase === "setup" ? `Setup troops remaining: ${player.setupTroopsRemaining ?? 0}` : ""}
${game.reinforcementsRemaining ? `Reinforcements to place: ${game.reinforcementsRemaining}` : ""}
${game.pendingConquest ? `PENDING CONQUEST: You must move ${game.pendingConquest.minTroops}-${game.pendingConquest.maxTroops} troops to ${game.pendingConquest.toTerritory}` : ""}
${game.fortifyUsed ? "Fortify move already used this turn" : ""}

${game.phase === "setup" ? `SETUP PHASE (Turn 0):
You are placing your initial army. Distribute your ${player.setupTroopsRemaining ?? 0} remaining troops across your territories strategically.
1. Use place_reinforcements to add troops to your territories
2. When all troops are placed, use finish_setup to pass to the next player

Available Actions (SETUP):
- place_reinforcements: Place troops on your territory
- finish_setup: Complete your setup (only when all troops are placed)
- get_game_state: View the current map
- query_history: Ask about historical events (you only know events up to ${gameDate.getFullYear()})
- send_negotiation: Send a diplomatic message to another nation
` : `Turn Phases (in order):
1. REINFORCE: Place all reinforcement troops on your territories
2. ATTACK: Attack enemy territories (optional, can attack multiple times)
3. FORTIFY: Move troops between your territories (ONE move only, optional)

Available Actions:
- place_reinforcements: Place troops on your territory (REINFORCE phase)
- advance_phase: Move to the next phase
- attack_territory: Attack with 1-3 dice (ATTACK phase only, need dice+1 troops)
- confirm_conquest: After conquering, choose how many troops to move in
- fortify: Move troops between your territories (FORTIFY phase, ONE move per turn)
- query_history: Ask about historical events (you only know events up to ${gameDate.getFullYear()})
- send_negotiation: Send a diplomatic message to another nation
- done: Validate your strategy (ATTACK/FORTIFY phase only, REQUIRED before end_turn)
- end_turn: End your turn (ATTACK or FORTIFY phase)`}

IMPORTANT WORKFLOW: Before ending your turn, follow this sequence:
1. Complete all reinforcements (REINFORCE phase)
2. Make your attacks (ATTACK phase)
3. Fortify if desired (FORTIFY phase)
4. Call 'done' to validate your strategy (only works in ATTACK or FORTIFY phase)
5. Call 'end_turn' to finish

The done checkpoint ensures quality decision-making by having you:
- Summarize what you accomplished this turn
- Complete an honest self-assessment checklist
- Indicate your confidence level
- Plan your priority for next turn

Think strategically. Follow Risk rules: reinforce first, then attack, then fortify.
`;

      // Execute the AI turn with tool calling
      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: gameStateContext },
      ];

      let turnComplete = false;
      let iterations = 0;
      const maxIterations = 10;

      while (!turnComplete && iterations < maxIterations) {
        iterations++;

        const response = await callLLM(modelConfig, messages, GAME_TOOLS);

        if (!response.toolCalls || response.toolCalls.length === 0) {
          // No tool calls, add assistant message and prompt for action
          messages.push({
            role: "assistant",
            content: response.content ?? "I need to decide on my next action.",
          });
          messages.push({
            role: "user",
            content:
              "Please use one of the available tools to take an action or end your turn.",
          });
          continue;
        }

        // Process tool calls
        for (const toolCall of response.toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          // ===== LOG TOOL CALL START =====
          await ctx.runMutation(api.agentStreaming.updateCurrentTool, {
            activityId,
            toolName,
          });

          const toolCallId = await ctx.runMutation(
            api.agentStreaming.logToolCallStart,
            {
              activityId,
              gameId: args.gameId,
              toolName,
              arguments: toolArgs,
            }
          );

          let toolResult: string;
          let toolError: string | undefined;

          // ===== VALIDATE TOOL CALL =====
          // Get fresh game state for validation
          const currentGame = await ctx.runQuery(api.games.get, { id: args.gameId });
          const currentPlayer = await ctx.runQuery(api.players.get, { id: args.playerId });

          const validationCtx: ValidationContext = {
            phase: (currentGame?.phase ?? "reinforce") as GamePhase,
            hasDoneCheckpoint: !!doneCheckpoint,
            hasPendingConquest: !!currentGame?.pendingConquest,
            reinforcementsRemaining: currentGame?.reinforcementsRemaining ?? 0,
            setupTroopsRemaining: currentPlayer?.setupTroopsRemaining ?? 0,
            fortifyUsed: currentGame?.fortifyUsed ?? false,
          };

          const validation = validateToolCall(toolName, toolArgs, validationCtx);

          if (!validation.valid) {
            // Tool call rejected - return clear error to agent
            toolError = validation.error;
            toolResult = JSON.stringify({
              rejected: true,
              error: validation.error,
              hint: validation.hint,
              currentPhase: validationCtx.phase,
              hasDoneCheckpoint: validationCtx.hasDoneCheckpoint,
            });

            // Log the rejection
            await ctx.runMutation(api.agentStreaming.logToolCallComplete, {
              toolCallId,
              result: toolResult,
              status: "error",
              errorMessage: `Validation failed: ${validation.error}`,
            });

            // Add tool result to conversation so agent learns from rejection
            messages.push({
              role: "assistant",
              content: null,
              tool_calls: [toolCall],
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            });

            continue; // Skip execution, move to next tool call
          }

          // ===== EXECUTE VALIDATED TOOL =====
          try {
            switch (toolName) {
              case "get_game_state": {
                const state = await ctx.runQuery(api.games.getFullState, {
                  gameId: args.gameId,
                });
                toolResult = JSON.stringify(state, null, 2);
                break;
              }

              case "place_reinforcements": {
                // Use phase from validation context (already fetched)
                if (validationCtx.phase === "setup") {
                  // During setup phase, use placeSetupTroop
                  const result = await ctx.runMutation(api.territories.placeSetupTroop, {
                    gameId: args.gameId,
                    playerId: args.playerId,
                    territory: toolArgs.territory,
                    troops: toolArgs.troops,
                  });
                  toolResult = JSON.stringify(result);
                } else {
                  // During reinforce phase, use reinforce
                  const result = await ctx.runMutation(api.territories.reinforce, {
                    gameId: args.gameId,
                    playerId: args.playerId,
                    territory: toolArgs.territory,
                    troops: toolArgs.troops,
                  });
                  toolResult = JSON.stringify(result);
                }
                break;
              }

              case "finish_setup": {
                const result = await ctx.runMutation(api.territories.finishSetup, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                });
                toolResult = JSON.stringify(result);

                // If setup is complete and it's another player's turn, we're done
                if (result.setupComplete || result.nextPlayerId !== args.playerId) {
                  turnComplete = true;
                }
                break;
              }

              case "advance_phase": {
                const result = await ctx.runMutation(api.games.advancePhase, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                });
                toolResult = JSON.stringify(result);
                break;
              }

              case "attack_territory": {
                const result = await ctx.runMutation(api.territories.attack, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                  fromTerritory: toolArgs.from,
                  toTerritory: toolArgs.to,
                  diceCount: toolArgs.dice,
                });
                toolResult = JSON.stringify(result);
                break;
              }

              case "confirm_conquest": {
                const result = await ctx.runMutation(
                  api.territories.confirmConquest,
                  {
                    gameId: args.gameId,
                    playerId: args.playerId,
                    troopsToMove: toolArgs.troops,
                  }
                );
                toolResult = JSON.stringify(result);
                break;
              }

              case "fortify": {
                const result = await ctx.runMutation(api.territories.moveTroops, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                  fromTerritory: toolArgs.from,
                  toTerritory: toolArgs.to,
                  count: toolArgs.count,
                });
                toolResult = JSON.stringify(result);
                break;
              }

              case "query_history": {
                // Use enhanced RAG query with blocked events tracking
                const ragResult = await ctx.runAction(
                  api.rag.queryHistoryWithBlocked,
                  {
                    gameId: args.gameId,
                    question: toolArgs.question,
                  }
                );

                toolResult = JSON.stringify(ragResult.snippets, null, 2);

                // Log RAG query with temporal filtering info
                await ctx.runMutation(api.agentStreaming.logRagQuery, {
                  activityId,
                  toolCallId,
                  gameId: args.gameId,
                  question: toolArgs.question,
                  gameDateTimestamp: game.currentDate,
                  snippetsReturned: ragResult.snippets.length,
                  snippetsBlocked: ragResult.blocked.count,
                  blockedEventsSample: ragResult.blocked.sample,
                });

                // Log the historical query
                await ctx.runMutation(api.gameLog.add, {
                  gameId: args.gameId,
                  turn: game.currentTurn,
                  playerId: args.playerId,
                  action: "query",
                  details: {
                    question: toolArgs.question,
                    resultCount: ragResult.snippets.length,
                    blockedCount: ragResult.blocked.count,
                  },
                });
                break;
              }

              case "send_negotiation": {
                // Find recipient player
                const recipient = players.find(
                  (p: Doc<"players">) => p.nation === toolArgs.recipient_nation
                );
                if (!recipient) {
                  toolResult = `Error: Nation "${toolArgs.recipient_nation}" not found`;
                } else {
                  await ctx.runMutation(api.negotiations.send, {
                    gameId: args.gameId,
                    senderId: args.playerId,
                    recipientId: recipient._id,
                    message: toolArgs.message,
                  });
                  toolResult = `Message sent to ${toolArgs.recipient_nation}`;
                }
                break;
              }

              case "done": {
                // Validation already done by validateToolCall - just execute
                // Store checkpoint data for activity completion
                doneCheckpoint = {
                  status: toolArgs.status,
                  strategySummary: toolArgs.strategy_summary,
                  checklist: toolArgs.checklist,
                  confidence: toolArgs.confidence,
                  nextTurnPriority: toolArgs.next_turn_priority,
                };

                // Log the checkpoint
                await ctx.runMutation(api.agentStreaming.logDoneCheckpoint, {
                  activityId,
                  gameId: args.gameId,
                  status: toolArgs.status,
                  strategySummary: toolArgs.strategy_summary,
                  checklist: toolArgs.checklist,
                  confidence: toolArgs.confidence,
                  nextTurnPriority: toolArgs.next_turn_priority,
                });

                // Log to game log as well
                await ctx.runMutation(api.gameLog.add, {
                  gameId: args.gameId,
                  turn: game.currentTurn,
                  playerId: args.playerId,
                  action: "done_checkpoint",
                  details: {
                    status: toolArgs.status,
                    confidence: toolArgs.confidence,
                    checklist: toolArgs.checklist,
                  },
                });

                // Return confirmation with quality feedback
                const checklistItems = Object.entries(toolArgs.checklist);
                const completedCount = checklistItems.filter(([, v]) => v).length;
                const totalCount = checklistItems.length;

                toolResult = JSON.stringify({
                  confirmed: true,
                  message: `Strategy checkpoint recorded. Quality score: ${completedCount}/${totalCount} checklist items completed.`,
                  feedback: completedCount < 3
                    ? "Consider consulting history and evaluating threats before ending turn."
                    : "Good strategic coverage. You may now end your turn.",
                });
                break;
              }

              case "end_turn": {
                // First advance to next turn
                const nextTurnResult = await ctx.runMutation(api.games.nextTurn, {
                  gameId: args.gameId,
                });

                // Capture reasoning for activity completion
                finalReasoning = toolArgs.reasoning;

                // Log the turn end
                await ctx.runMutation(api.gameLog.add, {
                  gameId: args.gameId,
                  turn: game.currentTurn,
                  playerId: args.playerId,
                  action: "end_turn",
                  details: { reasoning: toolArgs.reasoning },
                });
                turnComplete = true;
                toolResult = JSON.stringify(nextTurnResult);
                break;
              }

              default:
                toolResult = `Unknown tool: ${toolName}`;
            }
          } catch (error) {
            toolError =
              error instanceof Error ? error.message : "Unknown error";
            toolResult = `Error: ${toolError}`;
          }

          // ===== LOG TOOL CALL COMPLETE =====
          await ctx.runMutation(api.agentStreaming.logToolCallComplete, {
            toolCallId,
            result: toolResult.length > 1000 ? toolResult.slice(0, 1000) + "..." : toolResult,
            status: toolError ? "error" : "success",
            errorMessage: toolError,
          });

          // Add tool result to conversation
          messages.push({
            role: "assistant",
            content: null,
            tool_calls: [toolCall],
          });
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      }

      if (!turnComplete) {
        // Force end turn if max iterations reached
        finalReasoning = "Max iterations reached";
        await ctx.runMutation(api.gameLog.add, {
          gameId: args.gameId,
          turn: game.currentTurn,
          playerId: args.playerId,
          action: "end_turn",
          details: { reasoning: "Max iterations reached", forced: true },
        });
      }

      // ===== COMPLETE ACTIVITY =====
      await ctx.runMutation(api.agentStreaming.completeActivity, {
        activityId,
        reasoning: finalReasoning,
        status: "completed",
        doneBeforeEnd: !!doneCheckpoint,
      });

      return { success: true, iterations, activityId };
    } catch (error) {
      // ===== HANDLE ERROR =====
      await ctx.runMutation(api.agentStreaming.completeActivity, {
        activityId,
        reasoning:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        doneBeforeEnd: !!doneCheckpoint,
      });
      throw error;
    }
  },
});

// Helper to call LLM with tool support
async function callLLM(
  config: (typeof MODELS)[ModelKey],
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
  }>,
  tools: typeof GAME_TOOLS
): Promise<{
  content: string | null;
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }> | null;
}> {
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  if (config.provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      toolCalls: choice.message.tool_calls ?? null,
    };
  }

  if (config.provider === "anthropic") {
    // Convert OpenAI format to Anthropic format
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content ?? "",
      }));

    const systemMessage = messages.find((m) => m.role === "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: systemMessage?.content ?? "",
        messages: anthropicMessages,
        tools: tools.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          input_schema: t.function.parameters,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();

    // Convert Anthropic response to OpenAI format
    const textContent = data.content.find((c: any) => c.type === "text");
    const toolUseContent = data.content.filter(
      (c: any) => c.type === "tool_use"
    );

    return {
      content: textContent?.text ?? null,
      toolCalls:
        toolUseContent.length > 0
          ? toolUseContent.map((t: any) => ({
              id: t.id,
              function: {
                name: t.name,
                arguments: JSON.stringify(t.input),
              },
            }))
          : null,
    };
  }

  if (config.provider === "vllm") {
    const vllmEndpoint =
      process.env.VLLM_ENDPOINT ?? "http://localhost:8000/v1/chat/completions";

    const response = await fetch(vllmEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`vLLM API error: ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      toolCalls: choice.message.tool_calls ?? null,
    };
  }

  // This should never be reached, but TypeScript needs it
  throw new Error(`Unknown provider: ${(config as ModelConfig).provider}`);
}
