# CLAUDE.md

Instructions for Claude Code when working on the RiskyRag (RiskyRagBench) project.

## Project Context

This is a **hackathon project for NexHacks 2026** (48-hour deadline). Speed and functionality matter more than perfect code. The goal is a working demo that showcases:

1. **Temporal RAG filtering** (the core innovation)
2. **LLM agents playing a strategy game** via tool calls
3. **Real-time multiplayer** using Convex
4. **Educational value** (learn history through gameplay)

## Repository Structure

```
RiskyRag/
├── frontend/          # Vite + React + TanStack Router
├── convex/           # Convex backend (game state, RAG, agent interface)
├── scraper/          # Python pipeline for historical data (uv)
├── vllm-server/      # LLM inference setup docs
└── benchmarks/       # Tournament evaluation scripts (RiskyRagBench)
```

**IMPORTANT:** This is a **monorepo**. Each subfolder has its own package.json or pyproject.toml.

## Tech Stack

| Component | Technology | Package Manager |
|-----------|------------|-----------------|
| Frontend | Vite + React | `bun` |
| Backend | Convex | `npx convex` |
| Scraping | Python 3.12 + uv | `uv` |
| LLM Inference | vLLM (Llama 3.2 7B/13B) | Docker / pip |

## Commands by Folder

### Root
```bash
bun install          # Install all workspace dependencies
```

### Frontend (`frontend/`)
```bash
cd frontend
bun install
bun dev             # Dev server on port 5173
bun build
bun typecheck
```

### Convex (`convex/`)
```bash
npx convex dev      # Run in separate terminal (auto-watches)
npx convex deploy   # For production
```

### Scraper (`scraper/`)
```bash
cd scraper
uv sync && uv sync --dev
uv run riskyrag scrape wikipedia_events --date-range 1400-1500
uv run riskyrag embed --model voyage-2
uv run riskyrag sync-to-convex
uv run pytest       # Tests
uv run mypy src/    # Type checking
```

### vLLM
See `vllm-server/setup.md` for GPU setup. For hackathon, **use OpenAI as fallback** if vLLM setup takes >2 hours.

## Key Implementation Principles

### 1. Temporal RAG is Critical ⭐

**The entire project hinges on this working correctly.**

When implementing RAG queries:
```typescript
// convex/rag.ts
export const queryHistory = query({
  args: {
    question: v.string(),
    maxDate: v.number() // Unix timestamp - CRITICAL
  },
  handler: async (ctx, args) => {
    // MUST filter by date
    const results = await ctx.db
      .query("historicalSnippets")
      .filter(q => q.lte(q.field("eventDate"), args.maxDate))
      .collect();

    // Then do vector search on filtered set
    // ...
  }
})
```

**Never allow the LLM to access data after `maxDate`.** This would break the entire concept.

### 2. Game State Schema

The Convex schema should track:

```typescript
// convex/schema.ts
export default defineSchema({
  games: defineTable({
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    currentTurn: v.number(),
    currentDate: v.number(),  // Game year as Unix timestamp
    startDate: v.number(),    // Historical scenario start date
    scenario: v.string(),     // "1453", "1776", "1914"
  }),

  players: defineTable({
    gameId: v.id("games"),
    isHuman: v.boolean(),
    nation: v.string(),       // "Ottoman Empire", "France"
    model: v.optional(v.string()),  // "gpt-4", "llama-3.2-7b"
    territories: v.array(v.string()),
  }),

  territories: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    owner: v.id("players"),
    troops: v.number(),
    adjacentTo: v.array(v.string()),
  }),

  historicalSnippets: defineTable({
    content: v.string(),
    embedding: v.array(v.float64()),
    eventDate: v.number(),        // Unix timestamp
    publicationDate: v.number(),  // Usually same as eventDate
    source: v.string(),
    region: v.string(),
    tags: v.array(v.string()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1024,  // Voyage AI dimensions
    filterFields: ["eventDate", "region"],
  }),
});
```

### 3. LLM Agent Interface

Agents must interact via **tool calls only** (no direct DB access). Define tools in `convex/agent.ts`:

```typescript
export const AGENT_TOOLS = [
  {
    name: "get_game_state",
    description: "Get current territories, troops, and visible enemy positions",
    parameters: { }
  },
  {
    name: "attack_territory",
    description: "Attack adjacent enemy territory",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Your territory ID" },
        to: { type: "string", description: "Enemy territory ID" },
        troops: { type: "number", description: "Attack with N troops" }
      },
      required: ["from", "to", "troops"]
    }
  },
  // ... more tools
];
```

### 4. Hackathon Speed Hacks

**It's okay to:**
- Use hardcoded map data for 1 scenario (1453)
- Skip animations initially
- Use OpenAI instead of vLLM if vLLM is problematic
- Simplify combat (deterministic instead of dice rolls)
- Have only 2-3 AI agents

**NOT okay to:**
- Skip temporal filtering (this is the core innovation)
- Ignore real-time sync (Convex makes this easy)
- Skip the demo video/presentation prep

### 5. Reusing Patterns from Parent Repos

You can reference:
- **`../context/`** for scraper registry patterns, ingestion pipelines
- **`../Intelligence/`** for MCP tool interface patterns
- **`../ClearTax/`** for Convex + TanStack Router setup

But **do not import code directly**—this is a standalone hackathon project.

## Development Workflow

### Typical Task Flow

1. **Read PRD.md** to understand what you're building
2. **Check schema** in `convex/schema.ts` before modifying DB
3. **Run `npx convex dev`** in a separate terminal (always)
4. **Use `bun dev`** for frontend hot reload
5. **Test RAG filtering** with known historical dates before integrating with LLM

### Testing Temporal RAG

```typescript
// Quick sanity check
const results1 = await ctx.runQuery(api.rag.queryHistory, {
  question: "What happened in Constantinople?",
  maxDate: new Date("1453-05-29").getTime()
});
// Should include: "Ottomans conquered Constantinople"

const results2 = await ctx.runQuery(api.rag.queryHistory, {
  question: "What happened in Constantinople?",
  maxDate: new Date("1453-05-28").getTime()
});
// Should NOT include conquest (it's still under siege)
```

## Common Pitfalls

### ❌ Don't: Allow LLM to "know the future"
```typescript
// BAD - no date filtering
const allSnippets = await ctx.db.query("historicalSnippets").collect();
```

### ✅ Do: Always filter by game date
```typescript
// GOOD
const filteredSnippets = await ctx.db
  .query("historicalSnippets")
  .filter(q => q.lte(q.field("eventDate"), game.currentDate))
  .collect();
```

### ❌ Don't: Overcomplicate game mechanics
- Simple deterministic combat is fine for MVP
- 10 territories is enough for demo

### ✅ Do: Focus on core innovation
- Temporal RAG **must** work flawlessly
- LLM agents **must** be able to play a full game
- Real-time updates **must** feel smooth

## Environment Variables

### Frontend (`frontend/.env.local`)
```bash
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

### Convex (`convex/.env`)
```bash
OPENAI_API_KEY=sk-...           # For embeddings or fallback LLM
VOYAGE_API_KEY=pa-...           # For embeddings
VLLM_ENDPOINT=http://localhost:8000  # If using vLLM
```

### Scraper (`scraper/.env`)
```bash
CONVEX_DEPLOYMENT=prod:your-deployment
CONVEX_URL=https://your-convex-deployment.convex.cloud
VOYAGE_API_KEY=pa-...
```

## Git Workflow

Since this is a hackathon:
- **Commit frequently** (every working feature)
- **Descriptive messages** ("Add temporal filtering to RAG" not "fix bug")
- **No branching needed** (main branch only, fast iteration)
- **Tag important milestones** (v0.1-mvp, v0.2-demo-ready)

## Debugging Tips

### Convex Issues
```bash
npx convex dev --tail-logs    # See real-time logs
npx convex dashboard          # Visual DB inspector
```

### RAG Not Working
1. Check if snippets exist: `npx convex run rag:count`
2. Check date filtering: Log `eventDate` values
3. Check embeddings: Verify dimension matches (1024 for Voyage)

### LLM Agent Stuck
1. Check tool definitions match agent's expectations
2. Log tool call requests/responses
3. Try simpler prompt ("You are playing Risk. Your goal is to conquer territories.")

## Presentation Prep (Final 4 Hours)

**Must-have for demo:**
1. **Live game** where human plays against 1 AI agent
2. **Show temporal filtering** - ask AI about "future" event, it says "I don't know"
3. **Benchmark results** - win rate chart for 2+ models
4. **Code walkthrough** - show the temporal RAG filtering logic

**Demo script:**
```
1. Start game in 1453 (Fall of Constantinople)
2. Show map with Ottoman Empire vs Byzantines
3. AI makes first move (attacks Constantinople)
4. Ask AI: "Will you win this war?"
   → AI: "I am besieging Constantinople. Victory is uncertain."
5. Ask AI: "What happened in 1918?"
   → AI: "I don't have knowledge of that year yet."
6. Show code: temporal filtering in action
7. Show benchmark: GPT-4 wins 70%, Llama 40%
```

## Success Criteria

**MVP = Demo-able in 48h:**
- [ ] Temporal RAG correctly filters by date
- [ ] At least 1 LLM agent can play a full game
- [ ] Human can play against AI in browser
- [ ] Real-time updates work (Convex)
- [ ] Historical query feature works
- [ ] Benchmark results for 2+ models

**Bonus points:**
- [ ] Multiple scenarios (1453, 1776)
- [ ] Diplomacy/negotiation between agents
- [ ] Rich historical dataset (1000+ snippets)
- [ ] Smooth UI with map visualization

## When in Doubt

1. **Prioritize temporal RAG** - this is the core innovation
2. **Keep it simple** - hardcode maps, use basic combat
3. **Ask for help** - tag teammates if blocked >30min
4. **Ship features** - working > perfect

---

**Remember:** This is a hackathon. Speed, functionality, and demo quality matter most. Clean code is secondary.

Good luck! 🚀
