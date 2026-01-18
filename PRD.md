# Product Requirements Document: RiskyRag

**Version:** 1.0
**Date:** January 4, 2026
**Project:** RiskyRag (Benchmark: RiskyRagBench)
**Hackathon:** NexHacks Pittsburgh 2026
**Tracks:** Education, DevTools & Infrastructure

---

## Executive Summary

RiskyRag is a multiplayer grand strategy game where human players compete against LLM-powered AI agents in a historically accurate "Risk"-style world. The game's unique innovation is **temporal knowledge filtering**: players choose a historical start date (e.g., 1453, 1776, 1914), and the AI agents only have access to knowledge from before that date. This creates an authentic historical experience while serving as a novel benchmarking platform for LLM strategic reasoning, tool usage, and temporal constraint adherence.

**Core Innovation:** Temporal RAG filtering using Apple's CLaRa to ensure LLMs don't "cheat" by knowing future events.

---

## Problem Statement

### Current Gaps
1. **LLM Benchmarks are static:** Most benchmarks (MMLU, HumanEval) test knowledge recall or coding, not complex multi-turn strategic reasoning
2. **Educational games lack AI depth:** Historical games use scripted AI that doesn't meaningfully engage with historical context
3. **RAG systems ignore temporal constraints:** Existing RAG doesn't handle "knowledge cutoff" scenarios where retrieval must be historically bounded

### Our Solution
A game that simultaneously:
- **Tests LLM capabilities** in a complex, multi-agent environment with tool usage, negotiation, and strategic planning
- **Teaches history** through interactive gameplay where AI opponents accurately represent historical powers
- **Advances RAG technology** by implementing and open-sourcing temporal filtering techniques

---

## Target Audience

| Audience | Use Case | Value Proposition |
|----------|----------|-------------------|
| **AI Researchers** | LLM benchmarking | Novel evaluation environment for strategic reasoning, tool usage, multi-agent coordination |
| **Educators** | EdTech tool | Interactive history learning with AI tutors that stay "in character" for any historical period |
| **Students** | Learning platform | Learn geopolitics, history, and strategy by playing as/against historical powers |
| **Game Developers** | Technical demo | Reference implementation for LLM-as-game-agent with temporal constraints |

---

## Success Criteria (Hackathon)

### Must-Have (MVP)
- [ ] **Temporal RAG pipeline** that filters historical data by date
- [ ] **Working game loop** with 2-4 territories, turn-based movement/combat
- [ ] **At least one LLM agent** that can play a full game using tool calls
- [ ] **Real-time multiplayer** sync via Convex for human players
- [ ] **Historical data** for at least one time period (e.g., 1453 Constantinople fall)

### Should-Have
- [ ] **Multiple start dates** (1453, 1776, 1914)
- [ ] **Diplomacy system** where agents can negotiate
- [ ] **Historical query feature** - ask AI about its nation's past
- [ ] **Benchmark metrics** - win rate, average game length, tool usage stats

### Nice-to-Have
- [ ] **Multi-LLM comparison** (GPT-4 vs Llama vs Claude)
- [ ] **Replay system** to review AI decisions
- [ ] **Educational mode** with in-game historical tooltips

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (Vite + React + TanStack Router)              │
│ - Game board UI (map, territories, troops)             │
│ - Real-time updates via Convex subscriptions           │
│ - Chat/negotiation interface                            │
└──────────────────┬──────────────────────────────────────┘
                   │ WebSocket (Convex)
┌──────────────────▼──────────────────────────────────────┐
│ CONVEX BACKEND (Real-time Database + Functions)        │
│ Tables:                                                 │
│ - games (state, territories, current turn)             │
│ - players (human/AI, nation, resources)                │
│ - historicalSnippets (content, embedding, date)        │
│ - gameLog (actions, negotiations, combat results)      │
│                                                         │
│ Mutations:                                              │
│ - executeTurn(), attackTerritory(), moveUnits()        │
│ - sendNegotiation(), queryHistory()                    │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌────────────────────┐
│ vLLM SERVER   │    │ TEMPORAL RAG       │
│               │◄───┤                    │
│ Model:        │    │ Apple CLaRa        │
│ Llama 3.2 7B  │    │ + Voyage           │
│ or 13B        │    │ embeddings         │
│               │    │                    │
│ Tool Calling  │    │ Date filtering:    │
│ Enabled       │    │ WHERE date <=      │
└───────────────┘    │ game.currentDate   │
                     └────────────────────┘
```

### Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Vite + React + TanStack Router | Fast dev experience, familiar to team |
| **Backend** | Convex | Real-time sync out-of-box, no WebSocket config needed |
| **LLM Inference** | vLLM + Llama 3.2 7B/13B | Efficient batched inference, open-source |
| **RAG** | Apple CLaRa + Voyage embeddings | Hackathon sponsor fit, novel tech to learn |
| **Scraping** | Partner's extraction engine + Python | Reuse existing patterns from /context repo |
| **Package Managers** | bun (TS), uv (Python) | Fast, modern tooling |

---

## Core Features

### 1. Temporal RAG System ⭐⭐⭐ (CRITICAL INNOVATION)

**Problem:** LLMs trained on 2023 data "know" that WWI ended in 1918. If game starts in 1915, they shouldn't know the outcome.

**Solution:**
```python
def retrieve_historical_context(
    query: str,
    knowledge_cutoff_date: datetime,  # e.g., 1915-06-01
    top_k: int = 5
) -> list[str]:
    """
    Only retrieve documents where:
    - event_date <= knowledge_cutoff_date
    - publication_date <= knowledge_cutoff_date
    """
    embedding = embed_query(query)

    results = vector_search(
        embedding=embedding,
        filters={
            "event_date": {"$lte": knowledge_cutoff_date.timestamp()},
            "publication_date": {"$lte": knowledge_cutoff_date.timestamp()}
        },
        top_k=top_k
    )

    return [doc.content for doc in results]
```

**Data Schema:**
```typescript
historicalSnippets: defineTable({
  content: v.string(),
  embedding: v.array(v.float64()),
  eventDate: v.number(),        // Unix timestamp of historical event
  publicationDate: v.number(),  // When this knowledge was "known"
  source: v.string(),           // "Wikipedia", "Encyclopedia Britannica"
  region: v.string(),           // "Europe", "Asia", etc.
  tags: v.array(v.string()),    // ["battle", "treaty", "territorial_change"]
})
```

### 2. LLM Agent Interface (MCP Tools)

AI agents interact via function calling:

```typescript
// Tool definitions
const GAME_TOOLS = [
  {
    name: "get_game_state",
    description: "Get current map, your territories, troop counts, and visible enemy positions",
    parameters: { }
  },
  {
    name: "attack_territory",
    description: "Attack an adjacent enemy territory",
    parameters: {
      from: "string",  // Your territory ID
      to: "string",    // Enemy territory ID
      troops: "number" // Number of troops to attack with
    }
  },
  {
    name: "move_troops",
    description: "Move troops between your own territories",
    parameters: {
      from: "string",
      to: "string",
      count: "number"
    }
  },
  {
    name: "send_negotiation",
    description: "Send a diplomatic message to another nation",
    parameters: {
      recipient: "string",  // Nation name
      message: "string"
    }
  },
  {
    name: "query_history",
    description: "Learn about historical events relevant to your nation (up to current game year)",
    parameters: {
      question: "string"
    }
  }
]
```

### 3. Game Mechanics (Simplified Risk)

**Map:**
- Start with 10-20 territories for MVP
- Each territory has:
  - Name (e.g., "Constantinople", "France", "Ottoman Anatolia")
  - Owner (nation/player)
  - Troop count
  - Adjacency list (connected territories)

**Turn Structure:**
1. **Reinforce:** Receive new troops (1 per 3 territories owned)
2. **Attack:** Optional attacks on adjacent enemy territories
3. **Fortify:** Move troops between your territories
4. **AI Turn:** LLM agents execute their turns via tool calls

**Combat:**
- Attacker rolls dice equal to attacking troops (max 3)
- Defender rolls dice equal to defending troops (max 2)
- Highest rolls compared, loser loses 1 troop
- Repeat until attacker retreats or defender eliminated

**Win Condition:**
- Control 75% of territories OR eliminate all opponents

### 4. Historical Scenarios

| Start Date | Scenario | Nations (AI) | Historical Context |
|------------|----------|--------------|-------------------|
| **1453** | Fall of Constantinople | Ottoman Empire, Byzantine Empire, Venice, Genoa | Mehmed II's siege |
| **1776** | American Revolution | British Empire, France, Spain, Thirteen Colonies | Colonial independence |
| **1914** | WWI Start | Germany, France, Britain, Russia, Austria-Hungary, Ottoman Empire | Pre-war alliances |

### 5. Educational Features

**In-Game Historical Queries:**
```
Player: "Why is the Ottoman Empire so strong right now?"

AI (as Ottoman Empire, 1453):
"We recently conquered Constantinople under Sultan Mehmed II,
ending the Byzantine Empire. Our janissary corps and artillery
are the most advanced in the world. We control key trade routes
between Europe and Asia."
```

**Learning Outcomes:**
- Understand geopolitical tensions of different eras
- Learn about historical leaders, battles, alliances
- Experience strategic decision-making in historical contexts

---

## Data Pipeline

### Scraping Strategy (Partner's Extraction Engine)

**Priority Sources:**
1. **Wikipedia:** Historical events, battles, treaties, territorial changes
2. **Leader Timelines:** Reigns, terms, birth/death dates
3. **Alliance Data:** Who was allied with whom, when
4. **Economic/Military Stats:** If available (population, army size)

**Data Schema:**
```python
@dataclass
class HistoricalEvent:
    title: str
    description: str
    event_date: datetime         # When it happened
    publication_date: datetime   # When it became "known" (usually same)
    participants: list[str]      # Nations/leaders involved
    event_type: str              # "battle", "treaty", "territorial_change"
    region: str                  # Geographic area
    source_url: str
```

**Scraper Registry (Fork from /context):**
```python
@register_scraper("wikipedia_historical_events")
class WikiHistoryScraper(BaseScraper):
    async def scrape(self, source: Source) -> list[RawDocument]:
        # Use partner's extraction engine
        events = await extraction_engine.extract(
            urls=self.get_wikipedia_urls(),
            schema=HistoricalEventSchema
        )
        return self.convert_to_documents(events)
```

### Ingestion Pipeline

```bash
# Scrape historical data
uv run riskyrag scrape wikipedia_events --date-range 1400-2000

# Generate embeddings
uv run riskyrag embed --model voyage-2

# Upload to Convex
uv run riskyrag sync-to-convex
```

---

## Benchmarking System

### Metrics to Track

```typescript
gameResults: defineTable({
  gameId: v.id("games"),
  winner: v.string(),
  totalTurns: v.number(),
  players: v.array(v.object({
    name: v.string(),
    isAI: v.boolean(),
    model: v.optional(v.string()),  // "gpt-4", "llama-3.2-7b"
    finalTerritories: v.number(),
    toolCallsUsed: v.number(),
    negotiationsInitiated: v.number(),
    historicalQueriesAsked: v.number(),
    winRate: v.number(),
  })),
  scenario: v.string(),
  startDate: v.number(),
})
```

### Benchmark Experiments

1. **Win Rate by Model:** GPT-4 vs Llama 3.2 7B vs Claude Sonnet
2. **Strategic Depth:** Do agents use negotiation effectively?
3. **Historical Accuracy:** Do agents stay "in character" for their era?
4. **Tool Usage:** Which tools do different models prefer?

**Automated Benchmark Run:**
```bash
bun run benchmark \
  --models gpt-4,llama-3.2-7b,claude-sonnet-3.5 \
  --scenario 1453 \
  --games 50 \
  --output results/benchmark_jan_2026.json
```

---

## Development Roadmap (48h Hackathon)

### Phase 1: Infrastructure (Hours 0-8)
- [ ] Set up Convex project + schema
- [ ] Set up vLLM server with Llama 3.2 7B
- [ ] Basic frontend scaffolding (Vite + React)
- [ ] Python scraping environment (uv + CLaRa)

### Phase 2: Core Game Logic (Hours 8-20)
- [ ] Implement game state management in Convex
- [ ] Build attack/move/fortify mechanics
- [ ] Create simple map UI (10 territories, 1453 scenario)
- [ ] Connect vLLM to Convex via MCP tools

### Phase 3: Temporal RAG (Hours 20-32) ⭐
- [ ] Scrape Wikipedia historical data (1400-1500)
- [ ] Generate embeddings with Voyage
- [ ] Implement temporal filtering in retrieval
- [ ] Integrate RAG with LLM agent context

### Phase 4: Polish & Demo (Hours 32-48)
- [ ] Add negotiation/chat UI
- [ ] Implement historical query feature
- [ ] Run benchmark games and collect metrics
- [ ] Prepare demo script and presentation
- [ ] Deploy to Vercel/Railway

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| vLLM setup too complex | Medium | High | Pre-test vLLM setup before hackathon, have OpenAI fallback |
| CLaRa learning curve steep | High | Medium | Study Apple paper beforehand, have simpler RAG backup |
| Scraping takes too long | Medium | High | Pre-scrape data before hackathon, focus on 1-2 scenarios |
| Game logic bugs | High | Medium | Use existing Risk implementations as reference |
| Temporal filtering fails | Low | High | Thorough testing with known historical events |

---

## Post-Hackathon Potential

### Immediate Extensions
- More historical scenarios (WWI, WWII, Cold War)
- Better game balance and mechanics
- Richer historical datasets
- Multi-LLM tournaments

### Long-Term Vision
- **LLM Benchmark as a Service:** Standard evaluation for strategic reasoning
- **Educational Platform:** License to schools for history classes
- **Research Tool:** Study how LLMs handle temporal constraints
- **Infrastructure Spinoff:** Temporal RAG library for time-sensitive applications (legal, medical)

---

## Sponsor Alignment

### Primary Tracks
- **Education:** Interactive history learning with AI tutors
- **DevTools & Infrastructure:** LLM benchmarking platform, RAG infrastructure

### Potential Sponsor Integrations
- **Arize:** AI observability for tracking LLM agent decisions
- **LiveKit:** Real-time voice chat for human-AI negotiations
- **Browserbase:** Scraping infrastructure for historical data
- **Parse/LeanMCP:** Tool orchestration for LLM agents

---

## Team Roles (Proposed)

| Role | Responsibilities | Skills Needed |
|------|------------------|---------------|
| **Backend Lead** (Guust) | Convex setup, game logic, RAG integration | TypeScript, Convex, Python |
| **Data Lead** (Partner) | Historical data scraping, CLaRa implementation | Python, scraping, embeddings |
| **Frontend Lead** (TBD) | Game UI, map visualization, chat interface | React, Vite, UI/UX |

---

## References

- [Apple CLaRa Paper](https://arxiv.org/abs/2501.xxxxx)
- [vLLM Documentation](https://docs.vllm.ai/)
- [Convex Real-time Database](https://docs.convex.dev/)
- [Voyage AI Embeddings](https://www.voyageai.com/)
- [Risk Game Rules](https://www.hasbro.com/common/instruct/risk.pdf)

---

**Document Status:** Draft v1.0
**Next Review:** Post-team-formation (Jan 5)
**Owner:** Guust Goossens (@rolimups)
