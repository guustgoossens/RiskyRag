# RiskyRag Map Visualization System

## Overview

This document details the implementation of SVG territory maps for RiskyRag. We use a **phased approach**:

| Phase | Style | Effort | Goal |
|-------|-------|--------|------|
| **1-2** | Stylized Abstract | 2-3 hrs | Quick, functional, looks good |
| **5-6** | Historically Accurate | 6-8 hrs | Educational, immersive, traced from real maps |

---

## 1. Phased Map Strategy

### Phase 1-2: Stylized Abstract Map

**Concept:** Simple geometric polygons arranged to *suggest* the Mediterranean geography without being accurate. Think Risk board game style.

```
        ┌─────────┐
        │ BOSNIA  │
  ┌─────┼─────────┼─────────┐
  │SERBIA│BULGARIA│         │
  ├─────┼─────────┤ THRACE  │
  │MACED-│        ├─────────┤
  │ONIA  │        │CONSTANT-│
  ├──────┤        │INOPLE   ├──────────┐
  │GREECE│        └────┬────┤ BITHYNIA │
  ├──────┤             │    ├──────────┤
  │MOREA │             │    │ ANATOLIA │
  └──────┘             │    └──────────┘
                    (Strait)
```

**Benefits:**
- Can be defined in pure code (no Figma needed)
- Easy to adjust positions and sizes
- Still conveys strategic geography
- Clean upgrade path to accurate version

**Implementation:** Define simple polygon paths in `src/data/maps/1453-stylized.ts`

### Phase 5-6: Historically Accurate Map

**Concept:** Traced from actual 1453 reference maps, showing real borders of Ottoman, Byzantine, Venetian, and Genoese territories.

**Requirements:**
- Modern borders ≠ 1453 borders
- **Ottoman Empire** extent (Anatolia + parts of Balkans)
- **Byzantine Empire** (basically just Constantinople + Morea by 1453)
- **Serbian Despotate** (modern Serbia/Kosovo area)
- **Venetian possessions** (Morea/Peloponnese, coastal cities)
- **Genoese colonies** (Galata, Black Sea trading posts)

---

## 2. Map Sources (Phase 5-6)

### Best Reference Maps for 1453

| Source | URL | Format | Quality | Notes |
|--------|-----|--------|---------|-------|
| **USF Maps Collection** | [Ottoman Empire 1453](https://etc.usf.edu/maps/pages/1700/1787/1787.htm) | PNG/JPG | ⭐⭐⭐⭐⭐ | **Best choice** - Shows Ottoman, Byzantine, Venetian, Genoese territories distinctly color-coded |
| **The Map Archive** | [Ottoman Empire 1453](https://themaparchive.com/product/ottoman-empire-1453/) | JPEG 300 DPI | ⭐⭐⭐⭐ | Paid, but very clean for tracing |
| **TimeMaps** | [Turkey 1453](https://timemaps.com/history/turkey-1453ad/) | Image | ⭐⭐⭐ | Free, clear borders |
| **Lucius-Note** | [Byzantine Maps 330-1453](https://lucius-note.net/byzantium/) | Image | ⭐⭐⭐⭐ | Full Byzantine timeline, detailed |
| **Wikimedia Commons** | Search "Ottoman Empire 1453 map svg" | SVG/PNG | Variable | Some users have created vector versions |
| **David Rumsey Collection** | [Historical Maps](https://www.davidrumsey.com/) | High-res scans | ⭐⭐⭐⭐ | Period maps, good for texture overlays |
| **Natural Earth** | [naturalearth.com](https://www.naturalearthdata.com/) | Shapefile/GeoJSON | ⭐⭐⭐ | Modern coastlines to trace |

### Academic Sources
- **Cambridge Medieval History** maps
- **Osprey Publishing** campaign maps (Fall of Constantinople 1453)

---

## 3. Image → SVG Conversion Methods

### Option 1: Figma Plugins (Recommended)

| Plugin | Cost | Best For |
|--------|------|----------|
| [Trace to SVG](https://www.figma.com/community/plugin/1484824321206850669/trace-to-svg) | Free | Clean outlines, adjustable threshold |
| [Tracer](https://www.figma.com/community/plugin/1446261680803936357/tracer-turn-bitmap-images-into-svgs) | Free | Uses Potrace algorithm, open source |
| [Image Tracer](https://www.figma.com/community/plugin/735707089415755407/image-tracer) | Free | Colored vector layers |
| [Free Vectorizer](https://www.figma.com/community/plugin/1526280907441235581/free-vectorizer-image-tracer) | Free | Runs locally, privacy-friendly |

**Figma Workflow:**
```
1. Import reference map PNG into Figma (set as background, 50% opacity)
2. Run tracer plugin → generates rough SVG paths
3. Clean up paths manually (simplify curves, adjust vertices)
4. Name each layer with territory ID (e.g., "constantinople")
5. Export as SVG
6. Extract path "d" attributes for React
```

### Option 2: Vector Magic (Best Auto-Quality)

[Vector Magic](https://vectormagic.com/) - Automatic vectorization with excellent color detection. Works well for maps with distinct color regions.

**Pros:** Highest quality auto-trace
**Cons:** Paid service

### Option 3: Manual Tracing in Figma

For only 10 territories, manual tracing with the Pen tool may be faster than cleaning up auto-traced results.

**Guide:** [Creating an SVG Image Map with Figma](https://leemartin.medium.com/creating-an-svg-image-map-with-figma-and-a-touch-of-javascript-b80f46c9a70d)

### Option 4: Illustrator Image Trace

Adobe Illustrator's Image Trace feature with "High Fidelity Photo" or "16 Colors" preset, then manual cleanup.

---

## 4. Conversion Workflow (Phase 5-6)

### Step-by-Step Process

```
1. DOWNLOAD
   └── Get USF 1453 map (highest res available)

2. PREPARE IN FIGMA
   ├── Create 1200x800 frame
   ├── Import map as background (50% opacity, locked)
   └── Create "Territories" layer group

3. TRACE TERRITORIES
   ├── Option A: Run Tracer plugin, then clean up
   └── Option B: Manual trace with Pen tool (P)

   For each territory:
   ├── Create closed path
   ├── Simplify curves (Object → Path → Simplify)
   ├── Name layer: "constantinople", "thrace", etc.
   └── Set fill to territory color for preview

4. EXPORT
   ├── Select all territory paths
   ├── Export as SVG (Preferences: Outline stroke)
   └── Copy to clipboard or download

5. EXTRACT PATH DATA
   ├── Open SVG in text editor
   ├── Copy each path's "d" attribute
   └── Add to src/data/maps/1453.ts

6. CALCULATE CENTROIDS
   ├── For each territory, find visual center
   └── Record x,y for troop token placement
```

### Figma Settings for Clean Export

```
Export Settings:
├── Format: SVG
├── Include "id" attribute: Yes
├── Outline text: Yes
├── Simplify stroke: No (keep precision)
└── Use absolute positioning: Yes
```

---

## 5. Territory Data Structure

### Schema (Already in Convex)

```typescript
// convex/schema.ts - territories table
{
  gameId: v.id("games"),
  name: v.string(),           // "constantinople"
  displayName: v.string(),    // "Constantinople"
  ownerId: v.optional(v.id("players")),
  troops: v.number(),
  adjacentTo: v.array(v.string()),
  region: v.string(),         // "Balkans", "Anatolia"
  position: v.object({        // Centroid for label placement
    x: v.number(),
    y: v.number(),
  }),
}
```

### New: SVG Path Data

Add a `mapData` object to the scenario definition:

```typescript
// convex/scenarios.ts or new file: src/data/maps/1453.ts

export const MAP_1453 = {
  viewBox: "0 0 1200 800",  // SVG viewBox dimensions

  territories: {
    constantinople: {
      // SVG path data (d attribute)
      path: "M 650 280 L 680 260 L 710 275 L 705 310 L 670 320 L 645 300 Z",
      // Centroid for troop token placement
      centroid: { x: 675, y: 290 },
      // Label anchor point (can differ from centroid)
      labelAnchor: { x: 675, y: 305 },
    },
    thrace: {
      path: "M 580 220 L 650 200 L 710 220 L 720 280 L 650 280 L 600 260 Z",
      centroid: { x: 650, y: 245 },
      labelAnchor: { x: 650, y: 250 },
    },
    // ... etc for all 10 territories
  },

  // Decorative elements
  decorations: {
    coastline: "M 100 400 C 200 380, 300 420, 400 400...",  // Mediterranean coastline
    seaLabels: [
      { text: "MARE AEGEUM", x: 500, y: 450, rotation: -15 },
      { text: "MARE NIGRUM", x: 750, y: 150, rotation: 0 },
    ],
    compass: { x: 100, y: 700 },
  },
};
```

---

## 6. Territory Visual States

Based on the design system, territories have these states:

### State Definitions

| State | Condition | Visual Treatment |
|-------|-----------|------------------|
| **Neutral** | `ownerId === null` | `#64748B` at 30% opacity |
| **Owned** | `ownerId !== null` | Faction color at 40% opacity over parchment |
| **Hovered** | Mouse over | Gold border glow (`#D4AF37`) |
| **Selected** | Clicked by current player | Gold border + info panel |
| **Attackable** | Adjacent to selected, enemy-owned | Red pulse animation |
| **Under Siege** | Active battle | Shake + smoke effect |
| **Captured** | Just changed hands | Flash animation |

### CSS/Tailwind Implementation

```tsx
// src/components/map/Territory.tsx

interface TerritoryProps {
  id: string;
  path: string;
  owner: Player | null;
  troops: number;
  centroid: { x: number; y: number };
  state: 'neutral' | 'owned' | 'hovered' | 'selected' | 'attackable' | 'siege';
  onClick: () => void;
}

const factionColors = {
  ottoman: '#B91C1C',    // Ottoman Red
  byzantine: '#7E22CE',  // Byzantine Purple
  venetian: '#0369A1',   // Venetian Blue
  genoese: '#059669',    // Genoese Green (added)
  neutral: '#64748B',    // Neutral Grey
};

const stateStyles = {
  neutral: {
    fill: 'rgba(100, 116, 139, 0.3)',
    stroke: '#475569',
    strokeWidth: 1,
    filter: 'none',
  },
  owned: (factionColor: string) => ({
    fill: `${factionColor}66`,  // 40% opacity
    stroke: '#1e293b',
    strokeWidth: 1.5,
    filter: 'none',
  }),
  hovered: {
    stroke: '#D4AF37',
    strokeWidth: 3,
    filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))',
  },
  selected: {
    stroke: '#D4AF37',
    strokeWidth: 4,
    filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.8))',
  },
  attackable: {
    stroke: '#C0392B',
    strokeWidth: 3,
    filter: 'drop-shadow(0 0 10px rgba(192, 57, 43, 0.7))',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  siege: {
    stroke: '#C0392B',
    strokeWidth: 4,
    filter: 'drop-shadow(0 0 20px rgba(192, 57, 43, 0.9))',
    animation: 'shake 0.3s ease-in-out infinite',
  },
};
```

---

## 7. Troop Count Display

### Token Design (Board Game Style)

Troops are displayed as **circular tokens** positioned at territory centroids.

```tsx
// src/components/map/TroopToken.tsx

interface TroopTokenProps {
  count: number;
  factionColor: string;
  position: { x: number; y: number };
  isCurrentPlayer: boolean;
}

export function TroopToken({ count, factionColor, position, isCurrentPlayer }: TroopTokenProps) {
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Outer ring (gold for current player) */}
      <circle
        r={18}
        fill={factionColor}
        stroke={isCurrentPlayer ? '#D4AF37' : '#1e293b'}
        strokeWidth={isCurrentPlayer ? 3 : 2}
        className="drop-shadow-lg"
      />

      {/* Inner highlight */}
      <circle
        r={14}
        fill={`${factionColor}CC`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />

      {/* Troop count */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="font-cinzel font-bold text-white"
        style={{ fontSize: count > 99 ? '12px' : '16px' }}
      >
        {count}
      </text>
    </g>
  );
}
```

### Label Positioning

Territory names appear on hover via tooltip, **not permanently on map** (too cluttered).

```tsx
// Tooltip component (appears on hover)
<g
  transform={`translate(${labelAnchor.x}, ${labelAnchor.y})`}
  className="pointer-events-none"
  style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}
>
  <rect
    x={-60} y={-30} width={120} height={50}
    rx={4}
    fill="#F5E6CC"
    stroke="#D4AF37"
    strokeWidth={1}
    className="drop-shadow-xl"
  />
  <text
    textAnchor="middle"
    y={-10}
    className="font-cinzel text-void-navy uppercase tracking-wide"
    style={{ fontSize: '11px' }}
  >
    {displayName}
  </text>
  <text
    textAnchor="middle"
    y={10}
    className="font-inter text-slate-600"
    style={{ fontSize: '10px' }}
  >
    {troops} Troops • {ownerName}
  </text>
</g>
```

---

## 8. Complete Map Component Architecture

```
src/components/map/
├── GameMap.tsx           # Main container (viewBox, background)
├── MapBackground.tsx     # Parchment texture, sea, coastlines
├── Territory.tsx         # Single territory path + interactions
├── TroopToken.tsx        # Circular troop count badge
├── TerritoryTooltip.tsx  # Hover info card
├── MapDecorations.tsx    # Compass rose, sea labels, grid
└── index.ts              # Barrel export
```

### GameMap.tsx (Main Component)

```tsx
import { MAP_1453 } from '@/data/maps/1453';

export function GameMap({
  territories,
  players,
  selectedTerritory,
  onTerritoryClick,
  attackSource,
}: GameMapProps) {
  const mapData = MAP_1453;  // Switch based on scenario

  return (
    <div className="relative w-full h-full bg-void-navy overflow-hidden">
      <svg
        viewBox={mapData.viewBox}
        className="w-full h-full"
        style={{ background: '#0F172A' }}
      >
        {/* Layer 1: Background & Sea */}
        <MapBackground />

        {/* Layer 2: Territory shapes */}
        {territories.map(territory => {
          const pathData = mapData.territories[territory.name];
          const owner = players.find(p => p._id === territory.ownerId);

          return (
            <Territory
              key={territory._id}
              id={territory.name}
              path={pathData.path}
              owner={owner}
              troops={territory.troops}
              centroid={pathData.centroid}
              isSelected={selectedTerritory === territory._id}
              isAttackable={/* check adjacency */}
              onClick={() => onTerritoryClick(territory._id)}
            />
          );
        })}

        {/* Layer 3: Troop tokens (above territories) */}
        {territories.map(territory => {
          const pathData = mapData.territories[territory.name];
          const owner = players.find(p => p._id === territory.ownerId);

          return (
            <TroopToken
              key={`token-${territory._id}`}
              count={territory.troops}
              factionColor={owner?.color || '#64748B'}
              position={pathData.centroid}
              isCurrentPlayer={/* check */}
            />
          );
        })}

        {/* Layer 4: Decorations */}
        <MapDecorations decorations={mapData.decorations} />

        {/* Layer 5: Tooltips (rendered last for z-index) */}
        <TerritoryTooltip ... />
      </svg>
    </div>
  );
}
```

---

## 9. Map Background Design

### Parchment Texture

```tsx
// src/components/map/MapBackground.tsx

export function MapBackground() {
  return (
    <g id="background">
      {/* Base parchment color */}
      <rect
        x="0" y="0" width="100%" height="100%"
        fill="#F5E6CC"
      />

      {/* Paper grain texture overlay */}
      <rect
        x="0" y="0" width="100%" height="100%"
        fill="url(#paper-grain)"
        opacity={0.3}
      />

      {/* Sea area */}
      <path
        d={SEA_PATH}  // Mediterranean + Black Sea
        fill="#1e3a5f"
        opacity={0.8}
      />

      {/* Coastline detail */}
      <path
        d={COASTLINE_PATH}
        fill="none"
        stroke="#8B7355"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Latitude/longitude grid */}
      <g opacity={0.1} stroke="#8B7355" strokeWidth={0.5}>
        {/* Horizontal lines */}
        <line x1="0" y1="200" x2="1200" y2="200" />
        <line x1="0" y1="400" x2="1200" y2="400" />
        <line x1="0" y1="600" x2="1200" y2="600" />
        {/* Vertical lines */}
        <line x1="300" y1="0" x2="300" y2="800" />
        <line x1="600" y1="0" x2="600" y2="800" />
        <line x1="900" y1="0" x2="900" y2="800" />
      </g>
    </g>
  );
}
```

### SVG Texture Pattern

```tsx
// In SVG defs
<defs>
  <pattern id="paper-grain" patternUnits="userSpaceOnUse" width="200" height="200">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="200" height="200" filter="url(#noise)" opacity="0.1" />
  </pattern>
</defs>
```

---

## 10. Creating the 1453 Map (Manual Method)

### Tools Needed
- **Figma** (free) or **Adobe Illustrator**
- Reference image from Wikimedia

### Process

#### Step 1: Set Up Canvas
```
1. Create new Figma file
2. Set frame to 1200x800px
3. Import reference map as background layer (50% opacity)
```

#### Step 2: Trace Territories
```
For each of the 10 territories:
1. Use Pen tool to create closed path
2. Simplify curves (don't need perfect accuracy)
3. Name layer with territory ID (e.g., "constantinople")
```

#### Step 3: Export SVG
```
1. Select all territory paths
2. Export as SVG
3. Copy path "d" attribute values
```

#### Step 4: Extract Path Data
```javascript
// Parse the exported SVG and extract:
{
  constantinople: {
    path: "M 650 280 L 680 260...",
    centroid: calculateCentroid(path),
  },
  // ...
}
```

### Figma Plugin Recommendation

Use **"SVG Export"** plugin to get clean path data.

---

## 11. Adjacency Visualization

### Connection Lines (Optional)

Show adjacency with subtle lines during attack selection:

```tsx
// Only visible when player is selecting attack target
{attackSource && territories.map(territory => {
  const sourceData = mapData.territories[attackSource.name];
  const isAdjacent = attackSource.adjacentTo.includes(territory.name);

  if (!isAdjacent) return null;

  const targetData = mapData.territories[territory.name];

  return (
    <line
      key={`adj-${attackSource.name}-${territory.name}`}
      x1={sourceData.centroid.x}
      y1={sourceData.centroid.y}
      x2={targetData.centroid.x}
      y2={targetData.centroid.y}
      stroke="#C0392B"
      strokeWidth={2}
      strokeDasharray="8,4"
      opacity={0.5}
      className="animate-pulse"
    />
  );
})}
```

---

## 12. Responsive Considerations

### Scaling Strategy

```tsx
<svg
  viewBox="0 0 1200 800"
  preserveAspectRatio="xMidYMid meet"
  className="w-full h-full max-h-[calc(100vh-12rem)]"
>
```

### Mobile Adaptation

- On mobile, show simplified graph view instead of full map
- Use pinch-to-zoom for detail
- Larger touch targets on territories

---

## 13. Performance Notes

### Optimization Tips

1. **Simplify paths**: Reduce path complexity (fewer points)
2. **CSS transforms**: Use `transform` instead of changing coordinates
3. **Layered rendering**: Only re-render layers that change
4. **Memoization**: Wrap Territory components in `React.memo`

```tsx
const Territory = React.memo(function Territory({...}: TerritoryProps) {
  // Component implementation
}, (prev, next) => {
  // Custom comparison for re-render
  return prev.troops === next.troops
    && prev.isSelected === next.isSelected
    && prev.ownerId === next.ownerId;
});
```

---

## 14. Implementation Roadmap

### Phase 1-2: Stylized Abstract Map (Hackathon MVP)

**Goal:** Functional map that looks good, built quickly

- [ ] Define stylized polygon paths in code (`src/data/maps/1453-stylized.ts`)
- [ ] Implement Territory component with state-based styling
- [ ] Add troop tokens at territory centroids
- [ ] Wire up click handlers and attack selection
- [ ] Basic hover tooltips
- [ ] Adjacency lines during attack mode

**Effort:** 2-3 hours

### Phase 3-4: Polish & Additional Scenarios

- [ ] Add parchment background texture
- [ ] Implement all visual state transitions (animations)
- [ ] Refine territory shapes based on feedback
- [ ] Add 1776 American Revolution scenario (stylized)
- [ ] Add 1914 Great War scenario (stylized)
- [ ] Scenario selection UI

**Effort:** 4-6 hours

### Phase 5-6: Historically Accurate Maps

**Goal:** Educational, immersive experience with real 1453 borders

- [ ] Download USF 1453 reference map
- [ ] Trace accurate territory boundaries in Figma
- [ ] Export SVG paths and integrate
- [ ] Add historical map decorations (compass, sea labels)
- [ ] Create accurate 1776 map
- [ ] Create accurate 1914 map
- [ ] Optional: Period-appropriate background textures

**Effort:** 6-8 hours

---

## 15. Files to Create/Modify

### Phase 1-2 (Stylized)

| File | Action | Purpose |
|------|--------|---------|
| `src/data/maps/1453-stylized.ts` | Create | Simplified polygon paths |
| `src/components/map/GameMap.tsx` | Rewrite | New map architecture |
| `src/components/map/Territory.tsx` | Update | State-based styling |
| `src/components/map/TroopToken.tsx` | Create | Troop count display |

### Phase 5-6 (Accurate)

| File | Action | Purpose |
|------|--------|---------|
| `src/data/maps/1453.ts` | Create | Traced accurate SVG paths |
| `src/data/maps/1776.ts` | Create | American Revolution map |
| `src/data/maps/1914.ts` | Create | Great War map |
| `src/components/map/MapBackground.tsx` | Create | Parchment + sea |
| `src/components/map/MapDecorations.tsx` | Create | Compass, labels |
| `public/textures/parchment.png` | Add | Background texture |
