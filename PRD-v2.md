# Product Requirements Document: RiskyRag

| Field | Value |
|-------|-------|
| **Version** | 2.0 |
| **Date** | January 15, 2026 |
| **Status** | Draft |
| **Owner** | Guust Goossens |
| **Event** | NexHacks Pittsburgh 2026 (48h) |
| **Tracks** | Education, DevTools & Infrastructure |

---

## 1. Executive Summary

RiskyRag is a multiplayer strategy game where human players compete against LLM-powered AI agents in historically accurate scenarios. The core innovation is **Temporal RAG**: AI agents only access knowledge from before the game's start date, preventing "future knowledge" cheating.

**Primary Deliverables:**
1. Playable game with real-time multiplayer
2. Temporal RAG pipeline with date-filtered retrieval
3. LLM agent benchmark suite (RiskyRagBench)

---

## 2. Problem Statement

| Gap | Current State | Our Solution |
|-----|---------------|--------------|
| Static LLM benchmarks | MMLU/HumanEval test recall, not strategy | Multi-turn strategic reasoning benchmark |
| RAG ignores time | No temporal filtering in retrieval | Date-bounded knowledge retrieval |
| Educational AI lacks depth | Scripted AI, no historical context | AI agents "in character" for any era |

---

## 3. Success Criteria

### 3.1 MVP (Must Ship)

- [ ] Temporal RAG filters knowledge by `event_date <= game_start_date`
- [ ] One LLM agent completes a full game via tool calls
- [ ] Human vs AI multiplayer works in browser
- [ ] Real-time game state sync (no page refresh)
- [ ] Historical query returns era-appropriate answers

### 3.2 Should Have

- [ ] Multiple start dates (1453, 1776, 1914)
- [ ] Benchmark metrics: win rate, tool usage, game length
- [ ] Diplomacy/negotiation between agents

### 3.3 Nice to Have

- [ ] Multi-model comparison (GPT-4 vs Claude vs Llama)
- [ ] Replay system for AI decision review
- [ ] Educational tooltips

---

## 4. Technical Architecture

### 4.1 Two-World Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  React + TanStack Router + TanStack Query + TanStack AI         │
│  Tailwind CSS · Hosted on Cloudflare Pages                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Real-time subscriptions
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CONVEX                                   │
│  Game state · Player data · Chat history · Turn management      │
│  Actions call Python backend for RAG queries                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP (tool calls)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND                                │
│  FastAPI + ClaRa pipeline + Embeddings                          │
│  Hosted on Railway or Render                                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       VECTOR DATABASE                            │
│  Pinecone / Weaviate / Qdrant / pgvector                        │
│  Temporal metadata filtering on retrieval                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Stack Decisions

| Layer | Technology | Status | Owner |
|-------|------------|--------|-------|
| Frontend Framework | React + TanStack Router | **Confirmed** | G |
| Styling | Tailwind CSS | **Confirmed** | G |
| Real-time Sync | Convex | **Confirmed** | G |
| Agent/AI SDK | TanStack AI (`useChat`) | **Confirmed** | G |
| Backend Framework | FastAPI (Python) | **Confirmed** | A + C |
| Package Manager (TS) | bun | **Confirmed** | All |
| Package Manager (Py) | uv | **Confirmed** | A + C |
| Embeddings | ClaRa pipeline | **Confirmed** | A + C |
| Vector Database | TBD | **Open** | A + C |
| Model Routing | OpenRouter | **Confirmed** | All |
| Frontend Hosting | Cloudflare Pages | **Confirmed** | G |
| Backend Hosting | Railway or Render | **Confirmed** | A + C |

> **[OPEN-Q1]** Which vector database? Options: Pinecone, Weaviate, Qdrant, pgvector. Depends on ClaRa pipeline compatibility.

### 4.3 Data Flow

```
1. Player submits question
   └─▶ TanStack AI (useChat) streams to UI

2. Agent needs historical context
   └─▶ Tool call: query_history(question, max_date)
       └─▶ Convex action calls FastAPI endpoint

3. FastAPI receives request
   └─▶ ClaRa generates query embedding
   └─▶ Vector DB search with filter: event_date <= max_date
   └─▶ Returns ranked snippets

4. Agent synthesizes answer
   └─▶ Response streams back to UI
   └─▶ Convex updates game state (real-time sync to all players)
```

---

## 5. Core Features

### 5.1 Temporal RAG (Critical Path)

**Requirement:** LLMs must not access knowledge after `game_start_date`.

```python
# FastAPI endpoint
@app.post("/api/query")
async def query_history(
    question: str,
    max_date: int,  # Unix timestamp
    top_k: int = 5
) -> list[Snippet]:
    embedding = clara_pipeline.embed(question)

    results = vector_db.search(
        embedding=embedding,
        filter={"event_date": {"$lte": max_date}},
        top_k=top_k
    )

    return results
```

**Data Schema:**
```typescript
// Convex schema for reference (actual data in Vector DB)
historicalSnippets: {
  content: string
  embedding: float[]
  event_date: number      // When event occurred
  publication_date: number // When knowledge became available
  source: string
  region: string
  tags: string[]
}
```

> **[OPEN-Q2]** Does ClaRa handle temporal metadata filtering natively, or must we implement it?

### 5.2 LLM Agent Tools

Agents interact via function calling through TanStack AI:

| Tool | Purpose |
|------|---------|
| `get_game_state` | View territories, troops, enemy positions |
| `attack_territory` | Attack adjacent enemy territory |
| `move_troops` | Reposition troops between owned territories |
| `send_negotiation` | Diplomatic message to another nation |
| `query_history` | RAG query bounded by game date |

### 5.3 Game Mechanics (Simplified Risk)

- **Map:** 10-20 territories for MVP
- **Turn:** Reinforce → Attack → Fortify
- **Combat:** Simplified deterministic (no dice for MVP)
- **Win:** Control 75% of territories OR eliminate all opponents

### 5.4 Historical Scenarios

| Start Date | Scenario | Nations |
|------------|----------|---------|
| 1453 | Fall of Constantinople | Ottoman Empire, Byzantine Empire, Venice |
| 1776 | American Revolution | Britain, France, Thirteen Colonies |
| 1914 | WWI Outbreak | Germany, France, Britain, Russia |

---

## 6. Data Pipeline

### 6.1 Ingestion Flow

```
Wikipedia/Sources → ClaRa Scraping → Chunking → Embedding → Vector DB
```

> **[OPEN-Q3]** What does Abdul's ClaRa pipeline provide? Full pipeline or just embeddings?

### 6.2 Priority Sources

1. Wikipedia historical events (battles, treaties, territorial changes)
2. Leader timelines (reigns, terms)
3. Alliance data (who allied with whom, when)

---

## 7. Benchmarking (RiskyRagBench)

### 7.1 Metrics

| Metric | Description |
|--------|-------------|
| Win Rate | % of games won per model |
| Tool Usage | Frequency of each tool by model |
| Temporal Accuracy | Does agent correctly refuse "future" questions? |
| Game Length | Average turns to completion |
| Negotiation Effectiveness | Did diplomacy affect outcomes? |

### 7.2 Evaluation Commands

```bash
# Run benchmark tournament
bun run benchmark \
  --models gpt-4,claude-sonnet,llama-3.2 \
  --scenario 1453 \
  --games 50 \
  --output results/benchmark.json
```

> **[OPEN-Q4]** Is the model eval suite a hackathon priority or post-hackathon?

---

## 8. Team Allocation

| Area | Owner | Scope |
|------|-------|-------|
| Frontend + Real-time | G | React, TanStack, Convex, AI SDK |
| RAG Backend | A + C | FastAPI, ClaRa, Vector DB, Embeddings |
| Data Pipeline | A + C | Scraping, Processing, Ingestion |

---

## 9. Hosting & Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Cloudflare Pages | Auto-deploy from main |
| Convex | Convex Cloud | Managed, no config |
| Python Backend | Railway or Render | Easy deploy, free tier |
| Vector DB | TBD | Managed service preferred |

> **[OPEN-Q5]** Railway vs Render for Python backend? Any preference based on ClaRa requirements?

---

## 10. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ClaRa learning curve | High | Study beforehand; have simpler RAG fallback |
| Vector DB choice delays | Medium | Default to Pinecone (easiest) if undecided |
| Real-time complexity | Low | Convex handles this; no custom WebSockets |
| Scraping takes too long | High | Pre-scrape data before hackathon |

---

## 11. Open Questions Summary

| ID | Question | Blocking? | Owner |
|----|----------|-----------|-------|
| **Q1** | Which vector database? (Pinecone/Weaviate/Qdrant/pgvector) | Yes | A + C |
| **Q2** | Does ClaRa handle temporal filtering natively? | Yes | A |
| **Q3** | What does ClaRa pipeline provide? (Full pipeline vs embeddings only) | Yes | A |
| **Q4** | Is model eval suite a hackathon priority? | No | All |
| **Q5** | Railway vs Render for Python backend? | No | A + C |
| **Q6** | What historical data is pre-scraped/available? | Yes | A |
| **Q7** | OpenRouter setup: which models to benchmark? | No | All |

---

## 12. Next Steps

1. [ ] **A** to clarify ClaRa pipeline scope (Q2, Q3)
2. [ ] **A + C** to decide vector database (Q1)
3. [ ] **G** to scaffold frontend + Convex
4. [ ] **All** to request free credits from tool providers
5. [ ] **All** to set up shared git repo

---

## Appendix A: API Contract (Draft)

### Python Backend Endpoints

```
POST /api/query
  Request:  { question: str, max_date: int, top_k: int }
  Response: { snippets: [{ content, score, event_date, source }] }

POST /api/embed
  Request:  { text: str }
  Response: { embedding: float[] }

GET /api/health
  Response: { status: "ok", vector_db: "connected" }
```

### Convex Actions (Call Python)

```typescript
// convex/rag.ts
export const queryHistory = action({
  args: { question: v.string(), maxDate: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/query`, {
      method: "POST",
      body: JSON.stringify({
        question: args.question,
        max_date: args.maxDate,
        top_k: 5
      })
    });
    return response.json();
  }
});
```

---

**Document Status:** Draft v2.0
**Last Updated:** January 15, 2026
