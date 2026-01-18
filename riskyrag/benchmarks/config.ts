/**
 * Tournament Configuration
 * Defines available models, scenarios, and tournament setups for RiskyRag evals
 */

export type ModelConfig = {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "local" | "openrouter";
  apiModel: string; // e.g., "gpt-4o", "claude-3-5-sonnet-20241022"
  description?: string;
  color?: string; // Hex color for visualization
};

export type ScenarioConfig = {
  id: string;
  name: string;
  year: number;
  description: string;
  players: number; // Number of players in this scenario
};

export type TournamentConfig = {
  name: string;
  description: string;
  scenarios: string[]; // Scenario IDs
  matchups: ModelMatchup[];
  gamesPerMatchup: number; // Repeat each matchup N times
  parallel?: boolean; // Run games in parallel (default: sequential)
};

export type ModelMatchup = {
  models: string[]; // Model IDs for each player position
  description?: string;
};

// ==================== AVAILABLE MODELS ====================

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    apiModel: "gpt-4o",
    description: "Latest GPT-4 optimized model",
    color: "#10a37f",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    apiModel: "gpt-4o-mini",
    description: "Faster, cheaper GPT-4o variant",
    color: "#19c37d",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    apiModel: "gpt-4-turbo",
    description: "Previous generation GPT-4",
    color: "#0c8359",
  },

  // Anthropic Models
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    apiModel: "claude-3-5-sonnet-20241022",
    description: "Most capable Claude model",
    color: "#d97757",
  },
  {
    id: "claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    apiModel: "claude-3-5-haiku-20241022",
    description: "Fast and efficient Claude",
    color: "#e89b7f",
  },

  // OpenRouter Models (Free Tier)
  {
    id: "devstral",
    name: "Devstral",
    provider: "openrouter",
    apiModel: "mistralai/devstral-2512:free",
    description: "Mistral's dev-focused model (free via OpenRouter)",
    color: "#ff7000",
  },

  // Local Models (vLLM)
  {
    id: "llama-3.2-7b",
    name: "Llama 3.2 7B",
    provider: "local",
    apiModel: "meta-llama/Llama-3.2-7B-Instruct",
    description: "Open source Llama model",
    color: "#4267b2",
  },
  {
    id: "llama-3.2-13b",
    name: "Llama 3.2 13B",
    provider: "local",
    apiModel: "meta-llama/Llama-3.2-13B-Instruct",
    description: "Larger Llama model",
    color: "#2c4a7c",
  },
];

// ==================== AVAILABLE SCENARIOS ====================

export const AVAILABLE_SCENARIOS: ScenarioConfig[] = [
  {
    id: "1453",
    name: "Fall of Constantinople (1453)",
    year: 1453,
    description: "Ottoman Empire vs Byzantine Empire - Historical turning point",
    players: 2,
  },
  {
    id: "1776",
    name: "American Revolution (1776)",
    year: 1776,
    description: "British Empire vs American Colonies vs France",
    players: 3,
  },
  {
    id: "1914",
    name: "World War I (1914)",
    year: 1914,
    description: "Great powers compete for European dominance",
    players: 4,
  },
];

// ==================== PREDEFINED TOURNAMENTS ====================

export const TOURNAMENTS: Record<string, TournamentConfig> = {
  // Quick test tournament - 1 game per matchup
  quick: {
    name: "Quick Test",
    description: "Fast tournament for testing (1 game per matchup)",
    scenarios: ["1453"],
    matchups: [
      {
        models: ["gpt-4o", "claude-3.5-sonnet"],
        description: "OpenAI vs Anthropic flagship",
      },
      {
        models: ["gpt-4o-mini", "claude-3.5-haiku"],
        description: "Fast models comparison",
      },
    ],
    gamesPerMatchup: 1,
    parallel: false,
  },

  // Comprehensive model comparison
  full: {
    name: "Full Model Comparison",
    description: "All major models across all scenarios (5 games per matchup)",
    scenarios: ["1453", "1776", "1914"],
    matchups: [
      { models: ["gpt-4o", "claude-3.5-sonnet"], description: "Flagship battle" },
      { models: ["gpt-4o", "gpt-4o-mini"], description: "GPT-4o variants" },
      { models: ["claude-3.5-sonnet", "claude-3.5-haiku"], description: "Claude variants" },
      { models: ["gpt-4o", "llama-3.2-7b"], description: "Proprietary vs Open" },
    ],
    gamesPerMatchup: 5,
    parallel: false,
  },

  // Llama benchmark
  llama: {
    name: "Llama Models",
    description: "Test open source Llama models",
    scenarios: ["1453"],
    matchups: [
      { models: ["llama-3.2-7b", "llama-3.2-13b"], description: "7B vs 13B" },
      { models: ["llama-3.2-7b", "gpt-4o-mini"], description: "7B vs GPT-4o-mini" },
      { models: ["llama-3.2-13b", "gpt-4o"], description: "13B vs GPT-4o" },
    ],
    gamesPerMatchup: 3,
    parallel: false,
  },

  // Scenario-specific tournament
  constantinople: {
    name: "Fall of Constantinople",
    description: "Deep dive into 1453 scenario with all models",
    scenarios: ["1453"],
    matchups: [
      { models: ["gpt-4o", "claude-3.5-sonnet"] },
      { models: ["gpt-4o", "gpt-4o-mini"] },
      { models: ["gpt-4o", "llama-3.2-7b"] },
      { models: ["claude-3.5-sonnet", "gpt-4o-mini"] },
      { models: ["claude-3.5-sonnet", "llama-3.2-7b"] },
      { models: ["gpt-4o-mini", "llama-3.2-7b"] },
    ],
    gamesPerMatchup: 10,
    parallel: false,
  },
};

// ==================== HELPER FUNCTIONS ====================

export function getModel(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getScenario(id: string): ScenarioConfig | undefined {
  return AVAILABLE_SCENARIOS.find((s) => s.id === id);
}

export function getTournament(id: string): TournamentConfig | undefined {
  return TOURNAMENTS[id];
}

export function validateMatchup(
  matchup: ModelMatchup,
  scenario: ScenarioConfig
): { valid: boolean; error?: string } {
  if (matchup.models.length !== scenario.players) {
    return {
      valid: false,
      error: `Matchup has ${matchup.models.length} models but scenario requires ${scenario.players} players`,
    };
  }

  for (const modelId of matchup.models) {
    if (!getModel(modelId)) {
      return {
        valid: false,
        error: `Unknown model: ${modelId}`,
      };
    }
  }

  return { valid: true };
}

export function estimateTournamentDuration(
  tournament: TournamentConfig
): number {
  // Rough estimate: 5 minutes per game on average
  const totalGames =
    tournament.scenarios.length *
    tournament.matchups.length *
    tournament.gamesPerMatchup;
  return totalGames * 5; // minutes
}
