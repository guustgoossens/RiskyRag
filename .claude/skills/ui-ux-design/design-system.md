# RiskyRag Design System

Complete color palette, typography, and visual language reference.

---

## 1. Color Palette

### A. Primary Brand Colors (The "Canvas")

| Name | Hex | Usage |
|------|-----|-------|
| **Void Navy** | `#0F172A` | Main background outside the map. The "fog of time." |
| **Parchment Gold** | `#F5E6CC` | Map terrain, modal backgrounds, paper textures. |
| **Imperial Gold** | `#D4AF37` | Borders, victory headers, primary action buttons. |

### B. Functional Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Cognitive Teal** | `#00FFA3` | **CRITICAL.** Use ONLY for AI elements—thinking state, Temporal Filter badge, RAG logs. This neon signals *technology* against the historical background. |
| **War Crimson** | `#C0392B` | Attack buttons, "War Declared" notifications, enemy territory borders. |
| **Safe Emerald** | `#27AE60` | "Peace Treaty Signed," successful validation, positive resource gain. |

### C. Faction Colors (Map Control)

| Faction | Hex | Notes |
|---------|-----|-------|
| **Ottoman Red** | `#B91C1C` | Deep red, aggressive |
| **Byzantine Purple** | `#7E22CE` | Royal purple, defensive |
| **Venetian Blue** | `#0369A1` | Oceanic blue, mercantile |
| **Neutral Grey** | `#64748B` | Unclaimed territories |

### D. Tailwind Custom Config

```js
// tailwind.config.js extend.colors
colors: {
  'void-navy': '#0F172A',
  'parchment': '#F5E6CC',
  'imperial-gold': '#D4AF37',
  'cognitive-teal': '#00FFA3',
  'war-crimson': '#C0392B',
  'safe-emerald': '#27AE60',
  'ottoman': '#B91C1C',
  'byzantine': '#7E22CE',
  'venetian': '#0369A1',
}
```

---

## 2. Typography

### Headings: Cinzel or Trajan Pro

- **Style:** Serif, All-Caps, Engraved look
- **Usage:** Game Titles, Scenario Names ("FALL OF CONSTANTINOPLE"), Victory Screens, Nation Names
- **Vibe:** Monumental, epic, cinematic
- **Tailwind:** `font-cinzel uppercase tracking-wide`

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
```

### UI & Body: Inter or Lato

- **Style:** Sans-serif, clean, highly legible
- **Usage:** Tooltips, chat logs, button text, unit numbers
- **Vibe:** Invisible, functional, modern
- **Tailwind:** `font-inter` (default)

### Data/Code: JetBrains Mono

- **Style:** Monospace
- **Usage:** Specifically for the "AI Agent Monitor" (debug panel showing tool calls)
- **Vibe:** Technical, precise
- **Tailwind:** `font-mono`

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

### Font Scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Page Title | 3rem / 48px | 700 | Cinzel |
| Section Header | 1.5rem / 24px | 600 | Cinzel |
| Body Text | 1rem / 16px | 400 | Inter |
| Small/Caption | 0.875rem / 14px | 400 | Inter |
| Code/AI Logs | 0.875rem / 14px | 400 | JetBrains Mono |

---

## 3. Visual Metaphors

### The Two Worlds

| Aspect | Old World (Historical) | New World (AI) |
|--------|------------------------|----------------|
| Textures | Paper grain, aged parchment | Dark glass, subtle gradients |
| Borders | Gold, ornate | Teal glow, clean lines |
| Shadows | Hard drop shadows (physical) | Soft box-shadow with glow |
| Fonts | Serif (Cinzel) | Monospace (JetBrains) |
| Colors | Warm (Gold, Parchment) | Cool (Teal, Void Navy) |

### Contrast Principle

The brand identity emerges from the **collision** of these two worlds. Every screen should have elements from both:
- A parchment-textured map with neon-teal AI overlays
- Gold-bordered player cards next to glass-morphism AI panels

---

## 4. Iconography

### Style Guide

- Use "Etched" or "Sketch" style icons (hand-drawn quality)
- Line weight: 2px stroke
- Color: Inherit from context (Gold for historical, Teal for AI)

### Core Icons

| Action | Icon Description |
|--------|------------------|
| Attack | Crossed swords (drawn style) |
| Fortify | Castle tower or chess rook |
| Diplomacy | Quill pen or scrolled paper |
| History/RAG | Hourglass or compass |
| AI Thinking | Brain with circuit lines |

### Map Decorations

- Latitude/longitude grid lines (opacity: 10%)
- Compass rose in corner
- Sea monster illustrations in ocean areas (optional flourish)

---

## 5. Spacing & Layout

### Grid System

- Base unit: 4px
- Common spacing: 4, 8, 12, 16, 24, 32, 48, 64px
- Container max-width: 1440px

### Z-Index Layers

```
Map Base:        0
Territories:    10
Units/Tokens:   20
Tooltips:       30
Sidebars:       40
Modals:         50
AI Overlay:     60
Notifications: 100
```

---

## 6. Effects & Animations

### Glass Morphism (AI Panels)

```css
.ai-panel {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 163, 0.3);
  border-radius: 8px;
}
```

### Gold Glow (Selection State)

```css
.selected {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
  border: 2px solid #D4AF37;
}
```

### Teal Glow (AI Active)

```css
.ai-active {
  box-shadow: 0 0 15px rgba(0, 255, 163, 0.4);
  border-color: #00FFA3;
}
```

### Typewriter Animation (AI Response)

```css
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

.ai-response {
  overflow: hidden;
  white-space: nowrap;
  animation: typewriter 2s steps(40) forwards;
}
```
