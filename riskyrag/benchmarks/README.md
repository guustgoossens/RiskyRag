# RiskyRag Tournament System

Terminal-based tournament runner for evaluating LLM agents playing RiskyRag.

## Quick Start

### Interactive Mode

```bash
bun benchmarks/runner.ts
```

Select from predefined tournaments or create custom games.

### Run Predefined Tournament

```bash
bun benchmarks/runner.ts quick
bun benchmarks/runner.ts full
bun benchmarks/runner.ts llama
bun benchmarks/runner.ts constantinople
```

### Run Custom Game

```bash
bun benchmarks/runner.ts custom 1453 gpt-4o claude-3.5-sonnet
bun benchmarks/runner.ts custom 1776 gpt-4o gpt-4o-mini claude-3.5-sonnet
```

### List Available Tournaments

```bash
bun benchmarks/runner.ts list
```

## Predefined Tournaments

### Quick Test (`quick`)
- **Purpose**: Fast testing (1 game per matchup)
- **Scenarios**: 1453 only
- **Matchups**: 2 (flagship models + fast models)
- **Duration**: ~10 minutes

### Full Comparison (`full`)
- **Purpose**: Comprehensive model comparison
- **Scenarios**: 1453, 1776, 1914
- **Matchups**: 4 major comparisons
- **Games per matchup**: 5
- **Duration**: ~5 hours

### Llama Benchmark (`llama`)
- **Purpose**: Test open-source models
- **Scenarios**: 1453 only
- **Matchups**: 3 (Llama variants + comparisons)
- **Games per matchup**: 3
- **Duration**: ~45 minutes

### Constantinople Deep Dive (`constantinople`)
- **Purpose**: Exhaustive 1453 scenario testing
- **Scenarios**: 1453 only
- **Matchups**: 6 (all model combinations)
- **Games per matchup**: 10
- **Duration**: ~5 hours

## Available Models

### OpenAI
- `gpt-4o` - Latest GPT-4 optimized
- `gpt-4o-mini` - Faster, cheaper variant
- `gpt-4-turbo` - Previous generation

### Anthropic
- `claude-3.5-sonnet` - Most capable Claude
- `claude-3.5-haiku` - Fast and efficient

### Local (vLLM)
- `llama-3.2-7b` - Llama 3.2 7B Instruct
- `llama-3.2-13b` - Llama 3.2 13B Instruct

## Available Scenarios

- `1453` - Fall of Constantinople (2 players)
- `1776` - American Revolution (3 players)
- `1914` - World War I (4 players)

## Custom Tournament Configuration

Edit `benchmarks/config.ts` to create custom tournaments:

```typescript
export const TOURNAMENTS = {
  myTournament: {
    name: "My Custom Tournament",
    description: "Description here",
    scenarios: ["1453", "1776"],
    matchups: [
      {
        models: ["gpt-4o", "claude-3.5-sonnet"],
        description: "Optional description",
      },
      // ... more matchups
    ],
    gamesPerMatchup: 3,
    parallel: false, // Run games in parallel (experimental)
  },
};
```

## Output and Reporting

The tournament runner displays:

1. **Live Progress**
   - Current turn and active player
   - Time elapsed per game
   - Overall tournament progress bar

2. **Game Results**
   - Winner and model
   - Total turns
   - Game duration

3. **Final Report**
   - Overall statistics
   - Win rates by model (with progress bars)
   - Games by scenario breakdown

Example output:

```
🏆 Model Performance:
  gpt-4o               [████████████        ] 62.5% (10/16 wins)
  claude-3.5-sonnet    [██████████          ] 50.0% (8/16 wins)
  gpt-4o-mini          [████████            ] 37.5% (6/16 wins)
```

## Integration with Evaluation System

Tournament games automatically trigger evaluation:

1. Game completes → `benchmarks.recordGameResult` called
2. `recordGameResult` → triggers `evals.evaluateGame` via scheduler
3. Evaluation results stored in `agentEvaluations` table
4. View evaluations via:
   - Convex dashboard
   - `getModelStats` query
   - `getTournamentStats` query
   - Frontend EvalDashboard component

## Monitoring Active Games

While games are running, you can monitor them using Convex queries:

```typescript
// Get all active tournament games
const active = await client.query(api.tournament.getActiveTournamentGames);

// Monitor specific game
const status = await client.query(api.tournament.getGameStatus, { gameId });
```

## Environment Setup

Ensure your `.env.local` has:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
OPENAI_API_KEY=sk-...           # For OpenAI models
ANTHROPIC_API_KEY=sk-ant-...    # For Claude models
VLLM_ENDPOINT=http://localhost:8000  # For local models (optional)
```

## Known Limitations

1. **Territory Initialization**: Currently requires manual setup through UI before starting games. Full automation coming soon.

2. **Parallel Execution**: Marked experimental - sequential execution is more stable.

3. **Game Timeout**: Games that hang won't auto-terminate. Monitor active games and manually intervene if needed.

4. **Model Availability**: Ensure all models in your tournament config are accessible via API keys or local inference.

## Troubleshooting

### "CONVEX_URL not found"
Set `VITE_CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` in environment:
```bash
export VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### "Unknown model: xyz"
Check model ID in `benchmarks/config.ts` matches `AVAILABLE_MODELS`.

### Game hangs indefinitely
1. Check Convex dashboard for agent errors
2. Review agent activity logs (`agentActivity` table)
3. Verify RAG queries aren't timing out
4. Ensure tool execution is working (check `agentToolCalls`)

### "Game created but not started"
Territories need initialization. Options:
1. Use UI to set up game first
2. Run seed script for scenario
3. Implement programmatic territory initialization (TODO)

## Advanced Usage

### Custom Matchup Validation

```typescript
import { validateMatchup, getScenario } from "./config";

const scenario = getScenario("1453");
const matchup = { models: ["gpt-4o", "claude-3.5-sonnet"] };

const validation = validateMatchup(matchup, scenario);
if (!validation.valid) {
  console.error(validation.error);
}
```

### Tournament Duration Estimation

```typescript
import { estimateTournamentDuration, getTournament } from "./config";

const tournament = getTournament("full");
const minutes = estimateTournamentDuration(tournament);
console.log(`Estimated duration: ${minutes} minutes`);
```

## Results Analysis

After running tournaments, analyze results:

```bash
# View model statistics in Convex dashboard
# Or query programmatically:
```

```typescript
// Get tournament statistics
const stats = await client.query(api.tournament.getTournamentStats);

// Get evaluation stats (more detailed)
const evalStats = await client.query(api.evals.getModelStats);

// Compare specific scenarios
const results = await client.query(api.tournament.getTournamentResults, {
  scenario: "1453",
  limit: 100,
});
```

## Contributing

To add a new model:

1. Add to `AVAILABLE_MODELS` in `config.ts`
2. Configure API access in environment
3. Test with single game before tournament

To add a new scenario:

1. Define in `convex/scenarios.ts`
2. Add to `AVAILABLE_SCENARIOS` in `benchmarks/config.ts`
3. Ensure territory data exists
4. Test initialization flow

## For Hackathon

Focus areas for demo:

1. **Quick Tournament**: Run `bun benchmarks/runner.ts quick` for fast results
2. **Model Comparison**: Show win rates for GPT-4o vs Claude 3.5 Sonnet
3. **Evaluation Dashboard**: Display quality metrics from eval system
4. **Live Monitoring**: Show agent reasoning during game execution

Key metrics to highlight:

- **Win Rate**: Overall game victories
- **Tool Usage**: How effectively models use available tools
- **Eagerness**: Aggressive vs defensive play styles
- **Quality**: Strategic planning and historical consultation
- **Temporal RAG**: Demonstrate knowledge cutoff working correctly

---

**Quick Reference:**

```bash
# Interactive menu
bun benchmarks/runner.ts

# Fast test (10 min)
bun benchmarks/runner.ts quick

# Custom 1v1
bun benchmarks/runner.ts custom 1453 gpt-4o claude-3.5-sonnet

# List options
bun benchmarks/runner.ts list
```
