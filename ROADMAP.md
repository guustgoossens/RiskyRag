# RiskyRag Implementation Roadmap

## Overview

RiskyRag is a multiplayer Risk-style strategy game where AI agents have **temporal knowledge filtering** - they can only access historical knowledge up to the game's current date. This is the core innovation for the NexHacks 2026 hackathon.

**Key Innovation**: Temporal RAG filtering ensures LLMs can't "cheat" by knowing future events.

---

## Phase 1: Infrastructure Setup ✅ COMPLETE

**Goal**: Set up the full project structure with Convex backend, frontend, and Python scraper.

### Completed
- [x] Convex schema with all tables (games, players, territories, historicalSnippets, gameLog, gameResults, negotiations)
- [x] Convex functions for games, players, territories, RAG, agent, negotiations, benchmarks
- [x] 1453 "Fall of Constantinople" scenario with 10 territories and 4 nations
- [x] Frontend with TanStack Start + Convex provider
- [x] Python scraper with registry pattern, Wikipedia scraper, embedding pipeline
- [x] Sample historical data for testing (seed.ts)

### Key Files
| Component | Path |
|-----------|------|
| Schema | `riskyrag/convex/schema.ts` |
| Game Logic | `riskyrag/convex/games.ts`, `territories.ts`, `players.ts` |
| Temporal RAG | `riskyrag/convex/rag.ts` |
| AI Agent | `riskyrag/convex/agent.ts` |
| Scenarios | `riskyrag/convex/scenarios.ts` |
| Scraper | `scraper/src/riskyrag/` |

---

## Phase 2: Core Game Logic

**Goal**: Implement the full game loop with turn-based mechanics.

### Tasks
- [ ] Game creation flow in frontend (create game → select scenario → join)
- [ ] Player joining and nation selection
- [ ] Turn execution: reinforce → attack → fortify → end turn
- [ ] Combat resolution (simplified deterministic for MVP)
- [ ] Win condition checking (75% territories or eliminate opponents)
- [ ] Real-time game state updates via Convex subscriptions
- [ ] Basic game lobby UI

### Combat Rules (Simplified)
```
Attacker wins if: attackingTroops > defenderTroops + 1
Losses:
  - Defender: loses all troops
  - Attacker: loses floor(defenderTroops / 2)
```

---

## Phase 3: Temporal RAG ⭐ CRITICAL

**Goal**: Populate the knowledge base and verify temporal filtering works correctly.

### Tasks
- [ ] Run Wikipedia scraper for 1400-1500 events
- [ ] Generate embeddings with Voyage AI
- [ ] Upload to Convex historicalSnippets table
- [ ] Test temporal filtering with known dates:
  - Query "What happened in Constantinople?" with date=1453-05-28 → Should NOT include fall
  - Query "What happened in Constantinople?" with date=1453-05-30 → Should include fall
- [ ] Add more historical sources if time permits

### Verification Tests
```bash
# Seed test data
npx convex run seed:seedHistoricalData

# Test query (should return events before May 29, 1453)
# Game date: May 28, 1453
npx convex run rag:queryHistory '{"gameId": "...", "question": "Constantinople"}'
```

---

## Phase 4: LLM Agents

**Goal**: AI agents can play a complete game using tool calls.

### Tasks
- [ ] Test agent turn execution with OpenAI GPT-4o
- [ ] Verify agents use historical query tool correctly
- [ ] Verify agents respect temporal knowledge cutoff
- [ ] Add support for multiple models (Claude, Llama via vLLM)
- [ ] Agent negotiation between nations
- [ ] System prompts tuned for each nation's historical persona

### Agent Tools
| Tool | Description |
|------|-------------|
| `get_game_state` | View territories, troops, enemy positions |
| `attack_territory` | Attack adjacent enemy territory |
| `move_troops` | Move between owned territories |
| `query_history` | Ask about historical events (temporal filtered!) |
| `send_negotiation` | Diplomatic message to another nation |
| `end_turn` | Complete turn with reasoning |

---

## Phase 5: Polish & Benchmark

**Goal**: Demo-ready with benchmark results.

### Tasks
- [ ] Map visualization in frontend
- [ ] Game log / replay viewer
- [ ] Run benchmark tournament (50+ games)
- [ ] Track metrics: win rate by model, tool usage, historical queries
- [ ] Prepare demo script
- [ ] Deploy to Vercel (frontend) + Convex Cloud (already done)

### Demo Script
1. Start game in 1453 (Fall of Constantinople)
2. Show map: Ottoman Empire vs Byzantines
3. AI makes first move (Ottoman attacks Constantinople)
4. Ask AI: "Will you win?" → AI: "Victory is uncertain"
5. Ask AI: "What happened in 1918?" → AI: "I don't know that year"
6. Show code: temporal filtering in action
7. Show benchmark: GPT-4 wins X%, Llama wins Y%

### Benchmark Metrics
```typescript
{
  model: string,
  wins: number,
  gamesPlayed: number,
  avgTerritories: number,
  avgHistoricalQueries: number,
  avgNegotiations: number,
}
```

---

## Quick Commands

### Development
```bash
# Start Convex backend
cd riskyrag && npx convex dev

# Start frontend
cd riskyrag && bun dev

# Seed test data
npx convex run seed:seedHistoricalData
```

### Scraper
```bash
cd scraper
uv sync
uv run riskyrag test-scrape --source wikipedia --limit 5
uv run riskyrag scrape --source wikipedia --start-year 1400 --end-year 1500
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (TanStack Start + React)                       │
│ - Game lobby, map visualization, chat                   │
│ - Real-time updates via Convex subscriptions            │
└──────────────────┬──────────────────────────────────────┘
                   │ WebSocket (Convex)
┌──────────────────▼──────────────────────────────────────┐
│ CONVEX BACKEND                                          │
│ Tables: games, players, territories, historicalSnippets │
│ Functions: game logic, RAG queries, agent execution     │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌────────────────────┐
│ LLM PROVIDERS │    │ TEMPORAL RAG       │
│               │◄───┤                    │
│ - OpenAI      │    │ Vector search with │
│ - Anthropic   │    │ date filtering     │
│ - vLLM        │    │ (core innovation)  │
└───────────────┘    └────────────────────┘
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| vLLM setup complex | Use OpenAI API as fallback |
| Wikipedia scraping slow | Pre-scrape, limit to 100 events |
| Temporal filtering bugs | Test with known historical dates |
| Game balance issues | Keep simple: 10 territories, deterministic combat |

---

## Success Criteria

**MVP (Demo-able):**
- [x] Convex backend deployed
- [ ] Temporal RAG correctly filters by date
- [ ] At least 1 LLM agent can play a full game
- [ ] Human can play against AI in browser
- [ ] Benchmark results for 2+ models
