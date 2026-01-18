# RiskyRag Frontend

The frontend for RiskyRag - a multiplayer strategy game where LLM agents play Risk with temporal knowledge filtering.

## Quick Start

```bash
# Install dependencies
bun install

# Start Convex backend (in a separate terminal)
npx convex dev

# Start the frontend
bun dev
```

Open http://localhost:3000 to see the app.

## Project Structure

```
riskyrag/
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── games.ts         # Game CRUD operations
│   ├── players.ts       # Player management
│   ├── territories.ts   # Territory & combat logic
│   ├── rag.ts           # Temporal RAG (core innovation!)
│   ├── agent.ts         # LLM agent with tools
│   ├── scenarios.ts     # 1453 scenario data
│   ├── negotiations.ts  # Diplomacy system
│   ├── gameLog.ts       # Action logging
│   ├── benchmarks.ts    # Performance tracking
│   └── seed.ts          # Sample historical data
│
├── src/
│   ├── routes/          # TanStack Router pages
│   │   ├── index.tsx    # Landing page
│   │   ├── lobby.tsx    # Game lobby
│   │   └── game/        # Game view
│   ├── components/      # React components
│   │   ├── game/        # Game UI (ActionBar, PlayerHUD)
│   │   ├── map/         # Map rendering
│   │   ├── lobby/       # Lobby components
│   │   └── ui/          # Shared UI components
│   ├── hooks/           # Custom hooks
│   │   └── useGame.ts   # Convex game hooks
│   └── lib/
│       └── convex.tsx   # Convex provider
│
├── .env.local           # Environment variables
└── package.json
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:
- `VITE_CONVEX_URL` - Your Convex deployment URL (shown when you run `npx convex dev`)

## Convex Backend

The backend is built with Convex and includes:

### Core Tables
- **games** - Game sessions with state, scenario, and current turn
- **players** - Human and AI players with nation assignments
- **territories** - Map territories with ownership and troop counts
- **historicalSnippets** - Knowledge base with temporal filtering (vector index)
- **gameLog** - Action history for replay and benchmarking
- **negotiations** - Diplomacy messages between players

### Key Functions
- `games.create` - Create a new game with a scenario
- `players.initializeGame` - Set up all players and territories
- `territories.attack` - Simplified deterministic combat
- `rag.queryHistory` - **CRITICAL**: Temporal RAG with date filtering
- `agent.executeTurn` - Run an AI player's turn with tool calling

## Temporal RAG

The core innovation is in `convex/rag.ts`. When AI agents query historical knowledge:

```typescript
// CRITICAL: Vector search with temporal filter
const results = await ctx.vectorSearch("historicalSnippets", "by_embedding", {
  vector: embedding,
  limit: topK,
  filter: (q) => q.lte(q.field("eventDate"), game.currentDate)
});
```

This ensures AI agents **cannot know future events**. If the game date is May 28, 1453, the AI doesn't know that Constantinople will fall on May 29.

## Development

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Build for production
bun build
```

## Seeding Data

To seed sample historical data for testing:

```bash
npx convex run seed:seedHistoricalData
```

Note: This uses zero embeddings for testing. For production, use the scraper pipeline to generate proper embeddings.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are in `src/routes/`.

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.
