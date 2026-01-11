# Data Flow & State Management Standards

## Convex Integration

### Subscriptions
- Use `useQuery` for almost all game state. The UI must be reactive.
- Convex handles real-time sync automatically.

### Mutations
- All user actions (Attack, Move, Fortify) call `useMutation` with `api.mutation`.
- Arguments must match `convex/schema.ts` types.

### Actions
- For external API calls (LLM inference), use Convex actions.

---

## Critical Data Points

### 1. GameState
```typescript
// api.games.get(gameId)
{
  status: "waiting" | "active" | "finished",
  currentTurn: number,
  currentDate: number,    // Unix timestamp (game year)
  startDate: number,      // Scenario start date
  scenario: string,       // "1453", "1776", "1914"
  activePlayerId: Id<"players">,
  phase: "deploy" | "attack" | "fortify"
}
```

### 2. MapState
```typescript
// api.map.get(gameId)
territories: Array<{
  _id: Id<"territories">,
  name: string,
  owner: Id<"players">,
  troops: number,
  adjacentTo: string[]
}>
```

### 3. Players
```typescript
// api.players.list(gameId)
players: Array<{
  _id: Id<"players">,
  isHuman: boolean,
  nation: string,
  model?: string,  // "gpt-4", "claude-sonnet", "llama-3.2-7b"
  territories: string[],
  isEliminated: boolean
}>
```

### 4. Historical Snippets (RAG)
```typescript
// api.rag.queryHistory({ question, maxDate })
snippets: Array<{
  content: string,
  eventDate: number,
  source: string,
  region: string
}>
```
**CRITICAL:** Always filter by `maxDate`. Never expose future knowledge.

### 5. Logs/Chat
```typescript
// api.logs.stream(gameId)
logs: Array<{
  type: "action" | "chat" | "system",
  playerId: Id<"players">,
  content: string,
  timestamp: number
}>
```

---

## React Patterns

### Container/Presentational Split
- **Container**: Fetches data via `useQuery`, handles mutations.
- **Presentational**: Receives data as props, renders UI.

```tsx
// Container: GameBoard.tsx
const territories = useQuery(api.map.get, { gameId });
return <MapSVG territories={territories} onSelect={handleSelect} />;

// Presentational: MapSVG.tsx
function MapSVG({ territories, onSelect }: MapSVGProps) {
  return territories.map(t => <TerritoryPath key={t._id} {...t} />);
}
```

*Do not drill Convex hooks deep into leaf components.*

### Loading States
Always handle undefined data (loading):
```tsx
const gameState = useQuery(api.games.get, { id: gameId });
if (!gameState) return <LoadingSkeleton />;
```

### Optimistic Updates
For fast-feeling UI, consider optimistic mutations:
```tsx
const attack = useMutation(api.game.attack).withOptimisticUpdate(
  (localStore, args) => {
    // Update local cache immediately
  }
);
```

---

## State Categories

| Type | Source | Example |
|------|--------|---------|
| Server State | Convex `useQuery` | Game state, territories, players |
| Local UI State | `useState` | Modal open/closed, selected territory |
| Form State | `useState` or React Hook Form | Chat input, player name |
| URL State | TanStack Router params | `gameId` from `/game/$gameId` |

---

## Critical UI State Requirements

### Map State
- **Need:** `territories` array from Convex.
- **UI Logic:** Map `territory.owner` to CSS fill color. Map `territory.troops` to badge.

### Temporal State
- **Need:** `game.currentDate` (Unix timestamp).
- **UI Logic:** Pass to `HistoricalContextModal` to prove date filtering.

### Agent State (Thinking)
- **Need:** Real-time "status" field for AI (`isThinking`, `currentToolCall`).
- **UI Logic:** Trigger glow effect or "Thinking..." toast.

---

## Tooling

- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI (Radix Primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
