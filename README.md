# RiskyRag (RiskyRagBench)

**Multiplayer grand strategy game where LLMs play historically accurate Risk**

[![NexHacks 2026](https://img.shields.io/badge/NexHacks-2026-blue)](https://nexhacks.com)
[![Education](https://img.shields.io/badge/Track-Education-green)](https://nexhacks.com)
[![DevTools](https://img.shields.io/badge/Track-DevTools%20%26%20Infrastructure-orange)](https://nexhacks.com)

## What is this?

RiskyRag is a "Risk"-style strategy game where humans compete against LLM-powered AI agents. The twist: **temporal knowledge filtering**. Choose a start date (1453, 1776, 1914), and AI agents only know history up to that point.

```
┌─────────────────────────────────────────┐
│  "It's 1453. You are the Ottoman Empire" │
│  🤖 AI: "I will besiege Constantinople"  │
│                                           │
│  Historical RAG filtered to ≤1453        │
│  No "future knowledge" leakage           │
└─────────────────────────────────────────┘
```

### Why This Matters

1. **Novel LLM Benchmark:** Tests strategic reasoning, tool usage, and temporal constraint adherence
2. **Educational Platform:** Learn history by playing as/against historically accurate AI
3. **Technical Innovation:** First implementation of temporally-filtered RAG using Apple's CLaRa
4. **Reusable Infrastructure:** Open-source temporal RAG that works for any time-sensitive domain

## Quick Start

```bash
# Clone repo
cd /Users/guustgoossens/Desktop/Accaio/RiskyRag

# Install dependencies
bun install                  # Frontend + backend
cd scraper && uv sync       # Python scraping pipeline

# Set up Convex
npx convex dev

# Run scrapers (pre-populate historical data)
uv run riskyrag scrape wikipedia_events --date-range 1400-1500
uv run riskyrag embed --model voyage-2
uv run riskyrag sync-to-convex

# Start vLLM server (requires GPU or use OpenAI fallback)
# See vllm-setup.md for details

# Start frontend
bun dev
```

Open [http://localhost:5173](http://localhost:5173) to play!

## Architecture

```
Frontend (Vite + React)
    ↓ WebSocket
Convex Backend (Real-time DB)
    ↓ MCP Tools
vLLM Server (Llama 3.2 7B)
    ↓ RAG Query
Temporal RAG (CLaRa + Voyage)
    ↓ Filtered by date
Historical Snippets Database
```

## Key Features

- ⏰ **Temporal RAG:** AI only knows history up to game date
- 🎮 **Real-time Multiplayer:** Powered by Convex
- 🤖 **LLM Agents:** Play against GPT-4, Claude, or Llama
- 📚 **Educational Mode:** Ask AI about historical events
- 📊 **Benchmarking:** Compare LLM strategic reasoning
- 🌍 **Historical Scenarios:** 1453, 1776, 1914, and more

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React + TanStack Router |
| Backend | Convex (real-time database) |
| LLM Inference | vLLM + Llama 3.2 7B/13B |
| RAG | Apple CLaRa + Voyage embeddings |
| Scraping | Partner's extraction engine + Python |
| Package Managers | bun (TS), uv (Python) |

## Project Structure

```
RiskyRag/
├── PRD.md                    # Full product requirements
├── README.md                 # This file
├── CLAUDE.md                 # AI assistant instructions
│
├── frontend/                 # Game UI
│   ├── src/
│   │   ├── routes/          # TanStack Router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── package.json
│
├── convex/                   # Backend (Convex)
│   ├── schema.ts            # Database schema
│   ├── game.ts              # Game logic mutations
│   ├── rag.ts               # RAG queries
│   └── agent.ts             # LLM agent interface
│
├── scraper/                  # Historical data pipeline
│   ├── src/
│   │   ├── scrapers/        # Wikipedia, etc.
│   │   ├── ingest.py        # Embedding generation
│   │   └── sync.py          # Upload to Convex
│   └── pyproject.toml
│
├── vllm-server/             # LLM inference
│   └── setup.md
│
└── benchmarks/              # Evaluation scripts
    └── run_tournament.ts
```

## Core Concepts

### 1. Temporal RAG

**Problem:** LLMs know the future (from training data)

**Solution:** Filter RAG results by date

```python
def retrieve(query: str, max_date: datetime):
    """Only return docs where event_date <= max_date"""
    results = vector_search(
        embed(query),
        filters={"event_date": {"$lte": max_date}}
    )
    return results
```

### 2. LLM Agent Tools

AI agents interact via function calling:

- `get_game_state()` - See map, territories, troops
- `attack_territory(from, to, troops)` - Launch attack
- `move_troops(from, to, count)` - Reposition
- `send_negotiation(recipient, msg)` - Diplomacy
- `query_history(question)` - Learn about the past

### 3. Historical Scenarios

| Year | Event | Nations |
|------|-------|---------|
| 1453 | Fall of Constantinople | Ottomans, Byzantines, Venice |
| 1776 | American Revolution | Britain, France, Colonies |
| 1914 | WWI Start | Germany, France, Britain, Russia |

## Development Roadmap

**Phase 1: Infrastructure (Hours 0-8)**
- Set up Convex + vLLM
- Basic frontend scaffold
- Python scraping environment

**Phase 2: Core Game (Hours 8-20)**
- Game state management
- Attack/move/fortify mechanics
- Map UI for 1453 scenario

**Phase 3: Temporal RAG (Hours 20-32)** ⭐
- Scrape Wikipedia (1400-1500)
- Implement date filtering
- Integrate with LLM agents

**Phase 4: Polish (Hours 32-48)**
- Negotiation UI
- Historical query feature
- Benchmarking metrics
- Demo preparation

## Contributing

We're building this at **NexHacks 2026** (Jan 18-19, Pittsburgh). Team:
- **Backend Lead:** [@rolimups](https://github.com/yourusername)
- **Data Lead:** [@partner](https://github.com/partner) (scraping + CLaRa)
- **Frontend Lead:** TBD

Want to join? DM us on Discord!

## Benchmarking

Run automated tournaments to compare LLMs:

```bash
bun run benchmark \
  --models gpt-4,llama-3.2-7b,claude-sonnet-3.5 \
  --scenario 1453 \
  --games 50
```

Metrics tracked:
- Win rate
- Average game length
- Tool usage patterns
- Historical accuracy score

## License

MIT (post-hackathon)

## Acknowledgments

- **Apple CLaRa** for temporal RAG inspiration
- **vLLM** for efficient LLM inference
- **Convex** for real-time backend magic
- **NexHacks** for the opportunity

---

**Built with 🔥 for NexHacks 2026**

*Where history meets AI meets strategy*
