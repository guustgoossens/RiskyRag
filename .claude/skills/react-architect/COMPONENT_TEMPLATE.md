# React Component Template

When generating components, adhere to this structure.

## Standard Component Template

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
// Import UI components (Button, Card, etc.)

interface ComponentNameProps {
  gameId: Id<"games">;
  // strict typing for other props
}

export function ComponentName({ gameId }: ComponentNameProps) {
  // 1. Hooks & State
  const gameState = useQuery(api.games.get, { id: gameId });
  const performAction = useMutation(api.games.performAction);

  // 2. Loading States
  if (!gameState) return <div className="animate-pulse">Loading...</div>;

  // 3. Handlers
  const handleAction = () => {
    performAction({ gameId, type: "ATTACK" });
  };

  // 4. Render
  return (
    <section className="relative p-4 border rounded-lg bg-paper-texture">
       {/* Use semantic HTML */}
    </section>
  );
}
```

---

## Presentational Component Template

For components that only receive props (no data fetching):

```tsx
import { cn } from "@/lib/utils";

interface TerritoryPathProps {
  id: string;
  name: string;
  ownerColor: string;
  troops: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TerritoryPath({
  id,
  name,
  ownerColor,
  troops,
  isSelected,
  onSelect,
}: TerritoryPathProps) {
  return (
    <g
      onClick={() => onSelect(id)}
      className={cn(
        "cursor-pointer transition-all",
        isSelected && "stroke-yellow-400 stroke-2"
      )}
    >
      <path
        d="M..."
        fill={ownerColor}
        className="hover:brightness-110"
      />
      <text className="text-xs font-bold">{troops}</text>
    </g>
  );
}
```

---

## Hook Template

For custom hooks wrapping Convex queries:

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function useGameState(gameId: Id<"games">) {
  const game = useQuery(api.games.get, { id: gameId });
  const territories = useQuery(api.map.get, { gameId });
  const players = useQuery(api.players.list, { gameId });

  const isLoading = !game || !territories || !players;

  return {
    game,
    territories,
    players,
    isLoading,
    currentPlayer: players?.find(p => p._id === game?.activePlayerId),
  };
}
```

---

## Styling Rules

### Tailwind Classes
- Use `className` with Tailwind utility classes.
- Use `flex`/`grid` for layout.
- Use project-specific colors from `tailwind.config.js`:
  - `bg-parchment` - paper/old map texture
  - `bg-ink` - dark text areas
  - `text-gold` - accents and highlights
  - `border-sepia` - vintage border color

### Shadcn/UI Components
Import from `@/components/ui/`:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
```

### Conditional Classes
Use `cn()` utility for conditional classes:
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "opacity-50 pointer-events-none"
)} />
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `PlayerCard.tsx` |
| Hook | camelCase with `use` prefix | `useGameState.ts` |
| Utility | camelCase | `formatDate.ts` |
| Route | kebab-case | `$gameId.tsx` |
| Types | PascalCase | `types.ts` → `GameState` |

---

## Props Interface Guidelines

1. **Always export interfaces** for reusability.
2. **Use Convex `Id<>` types** for database references.
3. **Mark optional props** with `?`.
4. **Use descriptive names** (`onTerritorySelect` not `onClick`).

```tsx
export interface PlayerCardProps {
  player: {
    _id: Id<"players">;
    nation: string;
    isHuman: boolean;
    model?: string;
  };
  isActive: boolean;
  onSelect?: (playerId: Id<"players">) => void;
}
```

---

## Error Handling Pattern

```tsx
export function GameBoard({ gameId }: GameBoardProps) {
  const gameState = useQuery(api.games.get, { id: gameId });

  // Loading
  if (gameState === undefined) {
    return <LoadingSkeleton />;
  }

  // Not found (Convex returns null for missing docs)
  if (gameState === null) {
    return <NotFoundError message="Game not found" />;
  }

  // Render
  return <div>...</div>;
}
```
