import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { SCENARIOS, type ScenarioId } from "./scenarios";

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
        "Place reinforcement troops on your territories. Only available during REINFORCE phase. Must place all reinforcements before attacking.",
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
      name: "end_turn",
      description:
        "End your turn. Available during ATTACK or FORTIFY phase. Cannot end turn if there is a pending conquest to confirm.",
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
  handler: async (ctx, args) => {
    // Get game and player state
    const game = await ctx.runQuery(api.games.get, { id: args.gameId });
    const player = await ctx.runQuery(api.players.get, { id: args.playerId });

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

    // Build the system prompt
    const systemPrompt = nationData.systemPrompt;

    // Get current game state for context
    const territories = await ctx.runQuery(api.territories.getByGame, {
      gameId: args.gameId,
    });
    const players = await ctx.runQuery(api.players.getByGame, {
      gameId: args.gameId,
    });

    const myTerritories = territories.filter((t) => t.ownerId === args.playerId);

    const gameDate = new Date(game.currentDate);
    const gameStateContext = `
Current Game State (Turn ${game.currentTurn}):
Date: ${gameDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })}

Your Territories (${myTerritories.length}):
${myTerritories.map((t) => `- ${t.displayName}: ${t.troops} troops (adjacent to: ${t.adjacentTo.join(", ")})`).join("\n")}

Other Powers:
${players
  .filter((p) => p._id !== args.playerId && !p.isEliminated)
  .map((p) => {
    const theirTerritories = territories.filter((t) => t.ownerId === p._id);
    return `- ${p.nation}: ${theirTerritories.length} territories`;
  })
  .join("\n")}

Current Phase: ${game.phase ?? "reinforce"}
${game.reinforcementsRemaining ? `Reinforcements to place: ${game.reinforcementsRemaining}` : ""}
${game.pendingConquest ? `PENDING CONQUEST: You must move ${game.pendingConquest.minTroops}-${game.pendingConquest.maxTroops} troops to ${game.pendingConquest.toTerritory}` : ""}
${game.fortifyUsed ? "Fortify move already used this turn" : ""}

Turn Phases (in order):
1. REINFORCE: Place all reinforcement troops on your territories
2. ATTACK: Attack enemy territories (optional, can attack multiple times)
3. FORTIFY: Move troops between your territories (ONE move only, optional)

Available Actions:
- place_reinforcements: Place troops on your territory (REINFORCE phase only)
- advance_phase: Move to the next phase
- attack_territory: Attack with 1-3 dice (ATTACK phase only, need dice+1 troops)
- confirm_conquest: After conquering, choose how many troops to move in
- fortify: Move troops between your territories (FORTIFY phase, ONE move per turn)
- query_history: Ask about historical events (you only know events up to ${gameDate.getFullYear()})
- send_negotiation: Send a diplomatic message to another nation
- end_turn: End your turn (ATTACK or FORTIFY phase)

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

        let toolResult: string;

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
              const result = await ctx.runMutation(api.territories.reinforce, {
                gameId: args.gameId,
                playerId: args.playerId,
                territory: toolArgs.territory,
                troops: toolArgs.troops,
              });
              toolResult = JSON.stringify(result);
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
              const result = await ctx.runMutation(api.territories.confirmConquest, {
                gameId: args.gameId,
                playerId: args.playerId,
                troopsToMove: toolArgs.troops,
              });
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
              const results = await ctx.runAction(api.rag.queryHistory, {
                gameId: args.gameId,
                question: toolArgs.question,
              });
              toolResult = JSON.stringify(results, null, 2);

              // Log the historical query
              await ctx.runMutation(api.gameLog.add, {
                gameId: args.gameId,
                turn: game.currentTurn,
                playerId: args.playerId,
                action: "query",
                details: { question: toolArgs.question, resultCount: results.length },
              });
              break;
            }

            case "send_negotiation": {
              // Find recipient player
              const recipient = players.find(
                (p) => p.nation === toolArgs.recipient_nation
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

            case "end_turn": {
              // First advance to next turn
              const nextTurnResult = await ctx.runMutation(api.games.nextTurn, {
                gameId: args.gameId,
              });

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
          toolResult = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
        }

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
      await ctx.runMutation(api.gameLog.add, {
        gameId: args.gameId,
        turn: game.currentTurn,
        playerId: args.playerId,
        action: "end_turn",
        details: { reasoning: "Max iterations reached", forced: true },
      });
    }

    return { success: true, iterations };
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
