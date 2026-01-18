import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { SCENARIOS, type ScenarioId } from "./scenarios";
import type { Doc, Id } from "./_generated/dataModel";

// Model registry - models with CONFIRMED tool_choice support
// IMPORTANT: Only Devstral and Claude models are confirmed stable
const MODELS = {
  // === STABLE (Recommended - reliable tool calling) ===
  "devstral": {
    provider: "openrouter" as const,
    model: "mistralai/devstral-2512:free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Best free model. Excellent tool use.",
  },
  "claude-sonnet": {
    provider: "anthropic" as const,
    model: "claude-sonnet-4-20250514",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    supportsTools: true,
    description: "Best overall. Superior reasoning & strategy.",
  },
  "claude-opus": {
    provider: "anthropic" as const,
    model: "claude-opus-4-20250514",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    supportsTools: true,
    description: "Most capable. Deep analysis & planning.",
  },

  // === EXPERIMENTAL (May fail or produce errors) ===
  "claude-haiku": {
    provider: "anthropic" as const,
    model: "claude-haiku-4-20250514",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    supportsTools: true,
    description: "Fast but less reliable for tool use.",
  },
  "llama-3.3-70b": {
    provider: "openrouter" as const,
    model: "meta-llama/llama-3.3-70b-instruct",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Meta Llama 3.3 70B. Tool use can fail.",
  },
  "qwen3-32b": {
    provider: "openrouter" as const,
    model: "qwen/qwen-3-32b",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Qwen3 32B. Inconsistent tool use.",
  },
  "mistral-small": {
    provider: "openrouter" as const,
    model: "mistralai/mistral-small-3.1-24b-instruct",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Mistral Small 24B. Error-prone.",
  },
  "trinity-mini": {
    provider: "openrouter" as const,
    model: "arcee-ai/trinity-mini:free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Arcee's 26B MoE. Often fails.",
  },
  "qwen3-coder": {
    provider: "openrouter" as const,
    model: "qwen/qwen3-coder:free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Qwen3 Coder. Very inconsistent.",
  },
  "gemma-3-27b": {
    provider: "openrouter" as const,
    model: "google/gemma-3-27b-it",
    apiKeyEnv: "OPENROUTER_API_KEY",
    supportsTools: true,
    description: "Google Gemma 3 27B. Frequently fails.",
  },
} as const;

type ModelKey = keyof typeof MODELS;

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

  trade_cards: (ctx) => {
    if (ctx.phase !== "reinforce") {
      return {
        valid: false,
        error: `Cannot trade cards during ${ctx.phase.toUpperCase()} phase.`,
        hint: "Card trading only allowed during REINFORCE phase.",
      };
    }
    return { valid: true };
  },

  send_negotiation: () => ({ valid: true }), // Always allowed

  respond_to_negotiation: () => ({ valid: true }), // Always allowed

  take_note: () => ({ valid: true }), // Always allowed

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
        "Move troops between your territories through any connected path of territories you own. Does NOT require direct adjacency - you can move through chains (e.g., A→B→C if you own all three). Only available during FORTIFY phase. You get ONE fortify move per turn.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Source territory name" },
          to: { type: "string", description: "Destination territory name (must be reachable through your territories)" },
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
      name: "trade_cards",
      description:
        "Trade 3 Risk cards for bonus reinforcement troops. Valid sets: 3 of the same type (infantry/cavalry/artillery) OR 1 of each type. Bonus increases with each trade (4→6→8→10→12→15→20). Only available during REINFORCE phase. You MUST trade if holding 5+ cards.",
      parameters: {
        type: "object",
        properties: {
          cardIndices: {
            type: "array",
            items: { type: "number" },
            description: "Array of exactly 3 card indices to trade (0-indexed from your card list)",
          },
        },
        required: ["cardIndices"],
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
      name: "respond_to_negotiation",
      description: "Respond to a diplomatic message you received. You can accept, reject, or counter the proposal.",
      parameters: {
        type: "object",
        properties: {
          sender_nation: {
            type: "string",
            description: "The nation that sent you the message",
          },
          response: {
            type: "string",
            enum: ["accept", "reject", "counter"],
            description: "Your response: accept the proposal, reject it, or counter with a new proposal",
          },
          message: {
            type: "string",
            description: "Your response message (required for counter, optional for accept/reject)",
          },
        },
        required: ["sender_nation", "response"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "take_note",
      description: "Record a private strategic note. These notes are not visible to other players but help you plan across turns. Use this to track long-term strategies, observations about enemy behavior, or reminders for future turns.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Your strategic note. Be specific about plans, threats, or observations.",
          },
        },
        required: ["content"],
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

    const modelKey = (player.model ?? "devstral") as ModelKey;
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
      model: player.model ?? "devstral",
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
${myTerritories.map((t: Doc<"territories">) => `- ${t.name}: ${t.troops} troops (adjacent to: ${t.adjacentTo.join(", ")})`).join("\n")}

IMPORTANT: Use the exact territory names shown above (e.g., "constantinople", "thrace") in tool calls. These are case-sensitive identifiers.

NOTE on Movement:
- ATTACK: Must be to adjacent enemy territories only
- FORTIFY: Can move through ANY chain of connected territories you own (e.g., if you own A, B, C in a chain, you can move directly from A to C)

Enemy Territories (you can attack these):
${players
  .filter((p: Doc<"players">) => p._id !== args.playerId && !p.isEliminated)
  .map((p: Doc<"players">) => {
    const theirTerritories = territories.filter((t: Doc<"territories">) => t.ownerId === p._id);
    return `${p.nation}:\n${theirTerritories.map((t: Doc<"territories">) => `  - ${t.name}: ${t.troops} troops (adjacent to: ${t.adjacentTo.join(", ")})`).join("\n")}`;
  })
  .join("\n")}

MAP TOPOLOGY (all territory connections):
${territories.map((t: Doc<"territories">) => {
  const owner = players.find((p: Doc<"players">) => p._id === t.ownerId);
  const ownerName = owner?.nation ?? "Neutral";
  return `${t.name} (${ownerName}, ${t.troops} troops) ↔ ${t.adjacentTo.join(", ")}`;
}).join("\n")}

Current Phase: ${game.phase ?? "reinforce"}
${game.phase === "setup" ? `Setup troops remaining: ${player.setupTroopsRemaining ?? 0}` : ""}
${game.reinforcementsRemaining ? `Reinforcements to place: ${game.reinforcementsRemaining}` : ""}
${game.pendingConquest ? `PENDING CONQUEST: You must move ${game.pendingConquest.minTroops}-${game.pendingConquest.maxTroops} troops to ${game.pendingConquest.toTerritory}` : ""}
${game.fortifyUsed ? "Fortify move already used this turn" : ""}

RISK CARDS:
Your Cards: ${(player.cards ?? []).map((c: string, i: number) => `${i}: ${c}`).join(", ") || "None"}
Cards can be traded for bonus troops: 3 of same type OR 1 of each type (infantry/cavalry/artillery).
Next trade bonus: ${(() => { const bonuses = [4, 6, 8, 10, 12, 15, 20]; return bonuses[Math.min(game.cardTradeCount ?? 0, bonuses.length - 1)]; })()} troops
${(player.cards?.length ?? 0) >= 5 ? "⚠️ You have 5+ cards - MUST trade before placing reinforcements!" : ""}
${(player.cards?.length ?? 0) >= 3 && game.phase === "reinforce" ? "💡 You can trade cards during REINFORCE phase using trade_cards tool." : ""}

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
3. FORTIFY: Move troops through connected territories you own (ONE move only, optional)

Available Actions:
- place_reinforcements: Place troops on your territory (REINFORCE phase)
- trade_cards: Trade 3 cards for bonus troops (REINFORCE phase only, 3 same OR 1 each)
- advance_phase: Move to the next phase
- attack_territory: Attack with 1-3 dice (ATTACK phase only, need dice+1 troops)
- confirm_conquest: After conquering, choose how many troops to move in
- fortify: Move troops through any chain of connected territories you own (FORTIFY phase, ONE move per turn, does NOT require direct adjacency)
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
      const maxIterations = 20; // Allow plenty of room for full turn completion

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

          // Parse tool arguments with error handling (some models return malformed JSON)
          let toolArgs: Record<string, unknown>;
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            console.error(`Failed to parse tool arguments for ${toolName}:`, toolCall.function.arguments);
            // Try to salvage by treating as empty args or skip this tool call
            messages.push({
              role: "assistant",
              content: null,
              tool_calls: [toolCall],
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: "Invalid JSON in tool arguments. Please format your tool call correctly.",
                rawArguments: toolCall.function.arguments?.slice(0, 200),
              }),
            });
            continue;
          }

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
                    territory: toolArgs.territory as string,
                    troops: toolArgs.troops as number,
                  });
                  toolResult = JSON.stringify(result);
                } else {
                  // During reinforce phase, use reinforce
                  const result = await ctx.runMutation(api.territories.reinforce, {
                    gameId: args.gameId,
                    playerId: args.playerId,
                    territory: toolArgs.territory as string,
                    troops: toolArgs.troops as number,
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
                  fromTerritory: toolArgs.from as string,
                  toTerritory: toolArgs.to as string,
                  diceCount: toolArgs.dice as number,
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
                    troopsToMove: toolArgs.troops as number,
                  }
                );
                toolResult = JSON.stringify(result);
                break;
              }

              case "fortify": {
                const result = await ctx.runMutation(api.territories.moveTroops, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                  fromTerritory: toolArgs.from as string,
                  toTerritory: toolArgs.to as string,
                  count: toolArgs.count as number,
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
                    question: toolArgs.question as string,
                  }
                );

                toolResult = JSON.stringify(ragResult.snippets, null, 2);

                // Log RAG query with temporal filtering info and snippets for citations
                await ctx.runMutation(api.agentStreaming.logRagQuery, {
                  activityId,
                  toolCallId,
                  gameId: args.gameId,
                  question: toolArgs.question as string,
                  gameDateTimestamp: game.currentDate,
                  snippetsReturned: ragResult.snippets.length,
                  snippetsBlocked: ragResult.blocked.count,
                  blockedEventsSample: ragResult.blocked.sample,
                  snippets: ragResult.snippets.map((s: {
                    content: string;
                    title: string | null;
                    date: string;
                    source: string;
                    sourceUrl: string | null;
                    relevanceScore: number;
                  }) => ({
                    title: s.title ?? undefined,
                    content: s.content,
                    source: s.source,
                    sourceUrl: s.sourceUrl ?? undefined,
                    date: s.date,
                  })),
                });

                // Log the historical query
                await ctx.runMutation(api.gameLog.add, {
                  gameId: args.gameId,
                  turn: game.currentTurn,
                  playerId: args.playerId,
                  action: "query",
                  details: {
                    question: toolArgs.question as string,
                    resultCount: ragResult.snippets.length,
                    blockedCount: ragResult.blocked.count,
                  },
                });
                break;
              }

              case "trade_cards": {
                const result = await ctx.runMutation(api.territories.tradeCards, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                  cardIndices: toolArgs.cardIndices as number[],
                });
                toolResult = JSON.stringify(result);
                break;
              }

              case "send_negotiation": {
                // Find recipient player
                const recipientNation = toolArgs.recipient_nation as string;
                const recipient = players.find(
                  (p: Doc<"players">) => p.nation === recipientNation
                );
                if (!recipient) {
                  toolResult = `Error: Nation "${recipientNation}" not found`;
                } else {
                  await ctx.runMutation(api.negotiations.send, {
                    gameId: args.gameId,
                    senderId: args.playerId,
                    recipientId: recipient._id,
                    message: toolArgs.message as string,
                  });
                  toolResult = `Message sent to ${recipientNation}`;
                }
                break;
              }

              case "respond_to_negotiation": {
                // Find the sender player
                const senderNation = toolArgs.sender_nation as string;
                const responseType = toolArgs.response as string;
                const senderPlayer = players.find(
                  (p: Doc<"players">) => p.nation === senderNation
                );
                if (!senderPlayer) {
                  toolResult = `Error: Nation "${senderNation}" not found`;
                } else {
                  // Find the pending negotiation from this sender
                  const pendingNegotiations = await ctx.runQuery(
                    api.negotiations.getPendingForPlayer,
                    {
                      gameId: args.gameId,
                      playerId: args.playerId,
                    }
                  );

                  const negotiation = pendingNegotiations.find(
                    (n: { senderId: Id<"players"> }) => n.senderId === senderPlayer._id
                  );

                  if (!negotiation) {
                    toolResult = `Error: No pending negotiation from ${senderNation}`;
                  } else {
                    const statusMap: Record<string, "accepted" | "rejected" | "countered"> = {
                      accept: "accepted",
                      reject: "rejected",
                      counter: "countered",
                    };

                    await ctx.runMutation(api.negotiations.respond, {
                      negotiationId: negotiation._id,
                      playerId: args.playerId,
                      status: statusMap[responseType],
                      responseMessage: toolArgs.message as string | undefined,
                    });

                    toolResult = `Response sent to ${senderNation}: ${responseType}`;
                  }
                }
                break;
              }

              case "take_note": {
                await ctx.runMutation(api.agentNotes.add, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                  turn: game.currentTurn,
                  content: toolArgs.content as string,
                });
                toolResult = "Strategic note recorded.";
                break;
              }

              case "done": {
                // Validation already done by validateToolCall - just execute
                // Store checkpoint data for activity completion
                const checklist = toolArgs.checklist as {
                  consulted_history: boolean;
                  evaluated_threats: boolean;
                  reinforced_weak_points: boolean;
                  considered_diplomacy: boolean;
                  maximized_attacks: boolean;
                };
                const status = toolArgs.status as string;
                const strategySummary = toolArgs.strategy_summary as string;
                const confidence = toolArgs.confidence as string;
                const nextTurnPriority = toolArgs.next_turn_priority as string | undefined;

                doneCheckpoint = {
                  status,
                  strategySummary,
                  checklist,
                  confidence,
                  nextTurnPriority,
                };

                // Log the checkpoint
                await ctx.runMutation(api.agentStreaming.logDoneCheckpoint, {
                  activityId,
                  gameId: args.gameId,
                  status,
                  strategySummary,
                  checklist,
                  confidence,
                  nextTurnPriority,
                });

                // Log to game log as well
                await ctx.runMutation(api.gameLog.add, {
                  gameId: args.gameId,
                  turn: game.currentTurn,
                  playerId: args.playerId,
                  action: "done_checkpoint",
                  details: {
                    status,
                    confidence,
                    checklist,
                  },
                });

                // Return confirmation with quality feedback
                const checklistItems = Object.entries(checklist);
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
                const reasoning = toolArgs.reasoning as string | undefined;
                finalReasoning = reasoning;

                // Log the turn end
                await ctx.runMutation(api.gameLog.add, {
                  gameId: args.gameId,
                  turn: game.currentTurn,
                  playerId: args.playerId,
                  action: "end_turn",
                  details: { reasoning },
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

        // Get fresh game state to check phase
        const currentGame = await ctx.runQuery(api.games.get, { id: args.gameId });
        const currentPlayer = await ctx.runQuery(api.players.get, { id: args.playerId });

        if (currentGame?.phase === "setup") {
          // During setup, we need to handle this specially
          const troopsRemaining = currentPlayer?.setupTroopsRemaining ?? 0;

          if (troopsRemaining === 0) {
            // All troops placed, auto-finish setup to trigger next player
            try {
              await ctx.runMutation(api.territories.finishSetup, {
                gameId: args.gameId,
                playerId: args.playerId,
              });
              finalReasoning = "Setup auto-completed after max iterations";
            } catch (e) {
              // finishSetup might fail if already advanced, ignore
            }
          } else {
            // Still has troops - auto-place them evenly across territories
            const myTerritories = await ctx.runQuery(api.territories.getByOwner, {
              playerId: args.playerId,
            });

            if (myTerritories.length > 0) {
              // Distribute remaining troops evenly
              const troopsPerTerritory = Math.floor(troopsRemaining / myTerritories.length);
              let leftover = troopsRemaining % myTerritories.length;

              for (const territory of myTerritories) {
                const toPlace = troopsPerTerritory + (leftover > 0 ? 1 : 0);
                if (leftover > 0) leftover--;

                if (toPlace > 0) {
                  try {
                    await ctx.runMutation(api.territories.placeSetupTroop, {
                      gameId: args.gameId,
                      playerId: args.playerId,
                      territory: territory.name,
                      troops: toPlace,
                    });
                  } catch (e) {
                    // Ignore placement errors
                  }
                }
              }

              // Now finish setup
              try {
                await ctx.runMutation(api.territories.finishSetup, {
                  gameId: args.gameId,
                  playerId: args.playerId,
                });
                finalReasoning = "Setup auto-completed with distributed troops";
              } catch (e) {
                // finishSetup might fail, ignore
              }
            }
          }
        } else {
          // Normal turn - auto-complete if done checkpoint was reached
          if (doneCheckpoint) {
            // Agent called done() but didn't call end_turn - auto-complete
            try {
              await ctx.runMutation(api.games.nextTurn, { gameId: args.gameId });
              finalReasoning = "Turn auto-completed after done checkpoint";
            } catch (e) {
              // nextTurn might fail if there's a pending conquest, log it
              await ctx.runMutation(api.gameLog.add, {
                gameId: args.gameId,
                turn: game.currentTurn,
                playerId: args.playerId,
                action: "end_turn",
                details: { reasoning: "Max iterations after done", forced: true, error: String(e) },
              });
            }
          } else {
            // Agent didn't even call done - just log it
            await ctx.runMutation(api.gameLog.add, {
              gameId: args.gameId,
              turn: game.currentTurn,
              playerId: args.playerId,
              action: "end_turn",
              details: { reasoning: "Max iterations reached", forced: true },
            });
          }
        }
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

// Fallback model order - try these in sequence if the primary model fails
// Only stable models first, then experimental as last resort
const FALLBACK_MODEL_ORDER: ModelKey[] = [
  "devstral",       // Best free model (stable)
  "claude-sonnet",  // Best overall (stable)
  "claude-opus",    // Most capable (stable)
  // Experimental fallbacks only if stable ones fail
  "claude-haiku",   // Fast but less reliable
  "llama-3.3-70b",  // Can work sometimes
  "mistral-small",  // Error-prone but possible
];

// Helper to call LLM with tool support via OpenRouter
// OpenRouter provides an OpenAI-compatible API at https://openrouter.ai/api/v1
// Docs: https://openrouter.ai/docs/guides/features/tool-calling
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
  // Build list of models to try: primary first, then fallbacks (excluding primary)
  const primaryModelKey = Object.entries(MODELS).find(
    ([, v]) => v.model === config.model
  )?.[0] as ModelKey | undefined;

  const modelsToTry = primaryModelKey
    ? [primaryModelKey, ...FALLBACK_MODEL_ORDER.filter((m) => m !== primaryModelKey)]
    : FALLBACK_MODEL_ORDER;

  const errors: string[] = [];

  for (const modelKey of modelsToTry) {
    const modelConfig = MODELS[modelKey];
    const apiKey = process.env[modelConfig.apiKeyEnv];

    if (!apiKey) {
      errors.push(`${modelKey}: Missing API key ${modelConfig.apiKeyEnv}`);
      continue;
    }

    // Try this model with 2 retries (3 total attempts) for transient errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await callLLMSingle(modelConfig, messages, tools, apiKey);
        if (modelKey !== primaryModelKey) {
          console.log(`Successfully used fallback model: ${modelKey} (primary was unavailable)`);
        }
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        // Check if this is a retryable error (rate limit, temporary unavailable)
        const isRetryable =
          errorMsg.includes("429") ||
          errorMsg.includes("rate-limit") ||
          errorMsg.includes("temporarily") ||
          errorMsg.includes("upstream") ||
          errorMsg.includes("503") ||
          errorMsg.includes("502");

        if (isRetryable && attempt < 3) {
          // Wait before retry: 1s, then 2s
          const waitMs = attempt * 1000;
          console.log(`${modelKey} attempt ${attempt} failed (retryable), waiting ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        // Non-retryable error or last attempt - move to next model
        errors.push(`${modelKey}: ${errorMsg.slice(0, 150)}`);
        break;
      }
    }
  }

  // All models failed
  throw new Error(`All LLM models failed:\n${errors.join("\n")}`);
}

// Single LLM call without retry/fallback logic
async function callLLMSingle(
  config: (typeof MODELS)[ModelKey],
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
  }>,
  tools: typeof GAME_TOOLS,
  apiKey: string
): Promise<{
  content: string | null;
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }> | null;
}> {
  if (config.provider === "anthropic") {
    return callAnthropicLLM(config, messages, tools, apiKey);
  }
  // Default to OpenRouter for all other providers
  return callOpenRouterLLM(config, messages, tools, apiKey);
}

// Call Anthropic API (Claude models)
async function callAnthropicLLM(
  config: (typeof MODELS)[ModelKey],
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
  }>,
  tools: typeof GAME_TOOLS,
  apiKey: string
): Promise<{
  content: string | null;
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }> | null;
}> {
  // Convert OpenAI format to Anthropic format
  // Extract system message
  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  // Convert messages to Anthropic format
  const anthropicMessages: Array<{
    role: "user" | "assistant";
    content: string | Array<{ type: string; tool_use_id?: string; content?: string; id?: string; name?: string; input?: unknown }>;
  }> = [];

  for (const msg of nonSystemMessages) {
    if (msg.role === "user") {
      anthropicMessages.push({
        role: "user",
        content: msg.content ?? "",
      });
    } else if (msg.role === "assistant") {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Assistant message with tool calls
        const content: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }> = [];
        if (msg.content) {
          content.push({ type: "text", text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          content.push({
            type: "tool_use",
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          });
        }
        anthropicMessages.push({ role: "assistant", content });
      } else {
        anthropicMessages.push({
          role: "assistant",
          content: msg.content ?? "",
        });
      }
    } else if (msg.role === "tool") {
      // Tool result - add to previous user message or create new one
      const toolResult = {
        type: "tool_result" as const,
        tool_use_id: msg.tool_call_id!,
        content: msg.content ?? "",
      };
      anthropicMessages.push({
        role: "user",
        content: [toolResult],
      });
    }
  }

  // Convert tools to Anthropic format
  const anthropicTools = tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

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
      system: systemMessage?.content ?? undefined,
      messages: anthropicMessages,
      tools: anthropicTools,
      tool_choice: { type: "auto" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Anthropic error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  // Parse Anthropic response into our format
  let textContent: string | null = null;
  const toolCalls: Array<{ id: string; function: { name: string; arguments: string } }> = [];

  for (const block of data.content || []) {
    if (block.type === "text") {
      textContent = block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  return {
    content: textContent,
    toolCalls: toolCalls.length > 0 ? toolCalls : null,
  };
}

// Call OpenRouter API (OpenAI-compatible)
async function callOpenRouterLLM(
  config: (typeof MODELS)[ModelKey],
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
  }>,
  tools: typeof GAME_TOOLS,
  apiKey: string
): Promise<{
  content: string | null;
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }> | null;
}> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // Required by OpenRouter for tracking
      "HTTP-Referer": process.env.OPENROUTER_REFERER ?? "https://riskyrag.dev",
      "X-Title": "RiskyRag Game Agent",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  // Check for error in response body (OpenRouter sometimes returns 200 with error)
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  // Validate response structure
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    console.error("Invalid OpenRouter response - no choices:", JSON.stringify(data).slice(0, 500));
    throw new Error(`Invalid response: missing choices array`);
  }

  const choice = data.choices[0];

  if (!choice.message) {
    console.error("Invalid OpenRouter response - no message:", JSON.stringify(choice).slice(0, 500));
    throw new Error(`Invalid response: missing message in choice`);
  }

  return {
    content: choice.message.content,
    toolCalls: choice.message.tool_calls ?? null,
  };
}

// Helper action to trigger AI turn for current player (useful for debugging/manual kicks)
export const triggerCurrentAI = action({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args): Promise<{ triggered: boolean; playerId?: string; reason?: string }> => {
    const game = await ctx.runQuery(api.games.get, { id: args.gameId });
    if (!game) {
      return { triggered: false, reason: "Game not found" };
    }

    if (game.status !== "active") {
      return { triggered: false, reason: `Game is ${game.status}` };
    }

    if (!game.currentPlayerId) {
      return { triggered: false, reason: "No current player" };
    }

    const player = await ctx.runQuery(api.players.get, { id: game.currentPlayerId });
    if (!player) {
      return { triggered: false, reason: "Current player not found" };
    }

    if (player.isHuman) {
      return { triggered: false, reason: "Current player is human" };
    }

    // Trigger the AI turn
    await ctx.scheduler.runAfter(0, api.agent.executeTurn, {
      gameId: args.gameId,
      playerId: game.currentPlayerId,
    });

    return { triggered: true, playerId: game.currentPlayerId };
  },
});
