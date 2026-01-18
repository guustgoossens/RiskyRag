# RiskyRag Agent Evaluation System

## Overview

The RiskyRag evaluation system provides a minimalist but comprehensive framework for assessing AI agent performance in historical strategy games. The system focuses on four key dimensions:

1. **Tool Usage** - How effectively agents use available tools
2. **Eagerness** - How aggressively and strategically agents play
3. **Game Outcome** - Final results and territory control
4. **Quality** - Strategic planning and decision-making quality

## Architecture

The eval system follows a similar pattern to the Intelligence eval architecture but simplified for game contexts:

```
┌─────────────────────────────────────────────────────────────────┐
│  Evaluation System                                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Data Collection (from game logs, activities, tool calls)   │
│  2. Metric Calculation (4 dimensions)                         │
│  3. Scoring (0-100 per dimension)                            │
│  4. Storage (persistent evaluation records)                   │
│  5. Analysis (model comparison, scenario analysis)            │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Core Evaluation (`convex/evals.ts`)

- **`evaluatePlayerPerformance()`** - Main evaluation function
- **Scoring functions** - Calculate scores for each dimension
- **Mutations** - `evaluateGame()`, `evaluatePlayer()`
- **Queries** - `getGameEvaluations()`, `getModelStats()`, etc.

### 2. Data Sources

The system analyzes data from:

- **Game Logs** - All player actions and events
- **Agent Activities** - Strategic checkpoints and reasoning
- **Tool Calls** - Specific tool usage patterns
- **Territory Data** - Final game state and outcomes

### 3. UI Components (`src/components/evals/`)

- **EvalDashboard** - Visual overview of game evaluations
- **EvalCard** - Individual player performance cards
- **ModelComparison** - Cross-model performance analysis

## Evaluation Dimensions

### 1. Tool Usage (25% weight)

**Measures:** How effectively agents use the available toolset

**Metrics:**
- Total tools used
- Unique tools used (diversity)
- Tool categories used (military, historical, diplomatic, strategic, economic)
- Historical queries (situational awareness)
- Negotiations (diplomatic engagement)
- Strategic checkpoints (quality control)

**Scoring:** 0-100 based on tool diversity and appropriate usage

### 2. Eagerness (25% weight)

**Measures:** How aggressively and strategically agents play

**Metrics:**
- Attacks initiated
- Territories conquered
- Average troops moved per attack
- Fortify moves (strategic positioning)
- Defensive actions (balanced play)

**Scoring:** 0-100 based on aggressive play balanced with strategic positioning

### 3. Game Outcome (30% weight)

**Measures:** Final results and territory control

**Metrics:**
- Win/loss (50 points for winning)
- Final territory percentage
- Territories gained (expansion)
- Territories lost (defensive capability)

**Scoring:** 0-100 based on final game state

### 4. Quality (20% weight)

**Measures:** Strategic planning and decision-making quality

**Metrics:**
- Checkpoints completed (consistency)
- Average checklist score (thoroughness)
- Confidence levels (self-assessment)
- Strategic planning capability
- Threat evaluation
- Historical consultation

**Scoring:** 0-100 based on strategic quality and self-assessment

## Automatic Evaluation

The system automatically evaluates games when they finish through the benchmark recording process:

```typescript
// In benchmarks.ts
try {
  await ctx.scheduler.runAfter(0, api.evals.evaluateGame, {
    gameId: args.gameId,
  });
} catch (error) {
  console.error("Failed to trigger automatic evaluation:", error);
}
```

## Usage

### Manual Evaluation

```typescript
// Evaluate a specific game
const evaluations = await ctx.runMutation(api.evals.evaluateGame, {
  gameId: gameId,
});

// Evaluate a specific player
const evaluation = await ctx.runMutation(api.evals.evaluatePlayer, {
  gameId: gameId,
  playerId: playerId,
});
```

### Querying Results

```typescript
// Get evaluations for a game
const evaluations = await ctx.runQuery(api.evals.getGameEvaluations, {
  gameId: gameId,
});

// Get model performance statistics
const modelStats = await ctx.runQuery(api.evals.getModelStats);

// Get scenario statistics
const scenarioStats = await ctx.runQuery(api.evals.getScenarioStats);
```

### UI Integration

```tsx
import { EvalDashboard } from "../../components/evals";

function GamePage({ gameId }) {
  return (
    <div>
      {/* ... other game content ... */}
      <EvalDashboard gameId={gameId} />
    </div>
  );
}
```

## Scoring Algorithm

The overall score is a weighted average:

```
Overall Score = 
  (Tool Usage × 25%) + 
  (Eagerness × 25%) + 
  (Game Outcome × 30%) + 
  (Quality × 20%)
```

Each dimension uses its own scoring function with appropriate weighting of sub-metrics.

## Data Model

Evaluations are stored in the `agentEvaluations` table:

```typescript
type AgentEvalResult = {
  gameId: string;
  playerId: string;
  nation: string;
  model: string | null;
  isHuman: boolean;
  
  toolUsageScore: number; // 0-100
  toolUsageBreakdown: {
    totalToolsUsed: number;
    uniqueToolsUsed: number;
    toolCategoriesUsed: string[];
    historicalQueries: number;
    negotiations: number;
    strategicCheckpoints: number;
  };
  
  eagernessScore: number; // 0-100
  eagernessBreakdown: {
    attacksInitiated: number;
    territoriesConquered: number;
    averageTroopsMovedPerAttack: number;
    fortifyMoves: number;
    defensiveActions: number;
  };
  
  outcomeScore: number; // 0-100
  outcomeBreakdown: {
    finalTerritoryCount: number;
    finalTerritoryPercentage: number;
    wonGame: boolean;
    winCondition: string | null;
    territoriesGained: number;
    territoriesLost: number;
  };
  
  qualityScore: number; // 0-100
  qualityBreakdown: {
    checkpointsCompleted: number;
    averageChecklistScore: number; // 0-5
    averageConfidence: string; // "high", "medium", "low"
    strategicPlanning: boolean;
    threatEvaluation: boolean;
    historicalConsultation: boolean;
  };
  
  overallScore: number; // 0-100
  evaluationTimestamp: number;
};
```

## Future Enhancements

1. **Temporal Analysis** - Track performance over time
2. **Scenario-Specific Weighting** - Adjust scoring based on scenario difficulty
3. **Human Benchmarking** - Compare AI performance to human players
4. **Behavioral Patterns** - Identify common strategies and mistakes
5. **Model Recommendations** - Suggest optimal models for different scenarios

## References

- Inspired by the Intelligence eval architecture but simplified for game contexts
- Follows the same principles of modular, code-based evaluation with clear metrics
- Designed for easy integration with existing game systems