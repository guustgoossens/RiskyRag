# RiskyRag Component Patterns

Specific UI component implementations and layout logic.

---

## A. The Game Board (Centerpiece)

The map is the visual heart of the game. It must feel like a physical artifact.

### Visual Treatment

- **Texture:** High-fidelity paper grain overlay
- **Territory Fill:** Faction color at 40% opacity (multiply mode) so parchment shows through
- **Borders:** Hand-drawn style, slightly irregular lines
- **Decorations:** Subtle latitude/longitude lines, compass rose

### Territory States

| State | Visual Treatment |
|-------|------------------|
| Neutral | Grey fill (`#64748B` at 30%) |
| Owned | Faction color at 40% opacity |
| Hover | Gold border glow |
| Selected | Gold border + expanded info card |
| Under Attack | Red pulse animation |

### Units (Board Game Tokens)

**Do not use realistic soldiers.** Use abstracted tokens:

```jsx
// Token Component
<div className="relative w-12 h-12 rounded-full bg-[faction-color] border-2 border-imperial-gold shadow-lg">
  <span className="absolute inset-0 flex items-center justify-center font-cinzel text-white font-bold">
    {troopCount}
  </span>
  {/* Icon overlay */}
  <SwordIcon className="absolute -top-1 -right-1 w-4 h-4 text-imperial-gold" />
</div>
```

### Tooltip on Hover

```jsx
<div className="absolute bg-parchment border border-imperial-gold rounded p-3 shadow-xl">
  <h4 className="font-cinzel text-void-navy uppercase tracking-wide">
    Constantinople
  </h4>
  <p className="font-inter text-sm text-slate-700">
    8 Troops • Byzantine Empire
  </p>
</div>
```

---

## B. The AI Insight Panel (The Differentiator)

This panel proves the Temporal RAG innovation. It must be visually distinct from historical elements.

### Layout

- **Position:** Collapsible right sidebar overlay
- **Width:** 400px (expanded), 48px (collapsed icon)
- **Z-Index:** 60 (above map, below modals)

### Styling

```jsx
<aside className="fixed right-0 top-0 h-full w-[400px]
  bg-slate-900/80 backdrop-blur-md
  border-l border-cognitive-teal/30
  font-mono text-sm">

  {/* Header with Temporal Filter Badge */}
  <header className="p-4 border-b border-cognitive-teal/20">
    <h2 className="text-cognitive-teal font-semibold">AI MONITOR</h2>
    <TemporalFilterBadge maxDate={gameDate} />
  </header>

  {/* Streaming Logs */}
  <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-120px)]">
    {logs.map(log => (
      <LogEntry key={log.id} {...log} />
    ))}
  </div>
</aside>
```

### Temporal Filter Badge (Critical Component)

This badge **must be prominent** to showcase the core innovation.

```jsx
<div className="inline-flex items-center gap-2 px-3 py-1.5
  bg-cognitive-teal/10 border border-cognitive-teal rounded-full">
  <span className="w-2 h-2 rounded-full bg-cognitive-teal animate-pulse" />
  <span className="text-cognitive-teal text-xs font-mono uppercase tracking-wider">
    Temporal Filter: Active
  </span>
  <span className="text-cognitive-teal/70 text-xs">
    ≤ {formatYear(maxDate)}
  </span>
</div>
```

### Log Entry Styling

```jsx
<div className="text-slate-400">
  <span className="text-cognitive-teal">{'>'}</span>
  <span className="text-slate-500 ml-2">{timestamp}</span>
  <code className="block ml-4 text-slate-300">
    query_history("{query}", maxDate={maxDate})
  </code>
  <span className="block ml-4 text-safe-emerald text-xs">
    → {resultCount} snippets retrieved
  </span>
</div>
```

### "Blocked Future" Indicator

When the AI tries to access future knowledge:

```jsx
<div className="bg-war-crimson/10 border border-war-crimson/30 rounded p-2 ml-4">
  <span className="text-war-crimson text-xs">
    ⚠ Blocked: Event occurs after {gameYear}
  </span>
</div>
```

---

## C. Chat & Diplomacy Interface

Style: Diplomatic scroll or official letter.

### Container

```jsx
<div className="bg-parchment rounded-lg border-2 border-imperial-gold/50
  shadow-xl overflow-hidden">

  {/* Scroll Header */}
  <header className="bg-void-navy/10 px-4 py-3 border-b border-imperial-gold/30">
    <h3 className="font-cinzel text-void-navy uppercase tracking-wide">
      Diplomatic Correspondence
    </h3>
  </header>

  {/* Messages */}
  <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
    {messages.map(msg => <DiplomaticMessage key={msg.id} {...msg} />)}
  </div>
</div>
```

### Message Bubble (AI)

```jsx
<div className="flex gap-3">
  {/* Avatar: Oil painting in gold frame */}
  <div className="w-12 h-12 rounded-full border-2 border-imperial-gold
    overflow-hidden shadow-md flex-shrink-0">
    <img src={leaderPortrait} alt={nationName} className="w-full h-full object-cover" />
  </div>

  <div className="flex-1">
    <span className="font-cinzel text-sm text-void-navy">{leaderName}</span>
    <p className="mt-1 font-inter text-slate-700 leading-relaxed">
      {/* Typewriter animation for AI responses */}
      <TypewriterText text={message} />
    </p>
  </div>
</div>
```

### Message Bubble (Human)

```jsx
<div className="flex gap-3 justify-end">
  <div className="bg-void-navy/5 rounded-lg px-4 py-2 max-w-[80%]">
    <p className="font-inter text-slate-800">{message}</p>
  </div>
</div>
```

---

## D. Scenario Selection Cards

### Layout

- Three large vertical cards side by side
- Responsive: Stack on mobile

### Card Component

```jsx
<button
  onClick={() => selectScenario(id)}
  className={`
    relative w-[300px] h-[450px] rounded-lg overflow-hidden
    border-2 transition-all duration-300
    ${selected
      ? 'border-imperial-gold shadow-[0_0_30px_rgba(212,175,55,0.5)]'
      : 'border-slate-700 hover:border-imperial-gold/50'}
  `}
>
  {/* Historical Painting */}
  <div className="h-[60%] overflow-hidden">
    <img src={scenarioArt} alt={title}
      className="w-full h-full object-cover" />
  </div>

  {/* Content */}
  <div className="h-[40%] bg-void-navy p-4 text-left">
    <span className="text-imperial-gold font-mono text-sm">{year}</span>
    <h3 className="font-cinzel text-2xl text-parchment uppercase mt-1">
      {title}
    </h3>
    <p className="font-inter text-sm text-slate-400 mt-2">
      {description}
    </p>
  </div>

  {/* Selection Indicator */}
  {selected && (
    <div className="absolute top-4 right-4 w-8 h-8 rounded-full
      bg-imperial-gold flex items-center justify-center">
      <CheckIcon className="w-5 h-5 text-void-navy" />
    </div>
  )}
</button>
```

---

## E. Top Bar (HUD)

### Layout

```jsx
<header className="fixed top-0 left-0 right-0 h-16 z-50
  bg-void-navy/90 backdrop-blur-sm border-b border-slate-800
  flex items-center justify-between px-6">

  {/* Left: Logo/Back */}
  <div className="flex items-center gap-4">
    <button className="text-imperial-gold hover:text-parchment">
      <ArrowLeftIcon className="w-5 h-5" />
    </button>
    <span className="font-cinzel text-parchment tracking-widest">
      RISKYRAG
    </span>
  </div>

  {/* Center: Current Year (Large) */}
  <div className="absolute left-1/2 -translate-x-1/2">
    <span className="font-cinzel text-4xl text-imperial-gold">
      {currentYear}
    </span>
  </div>

  {/* Right: Turn Info */}
  <div className="flex items-center gap-4">
    <span className="font-inter text-sm text-slate-400">
      Turn {turnNumber}
    </span>
    <button className="px-4 py-2 bg-imperial-gold text-void-navy
      font-cinzel uppercase tracking-wider rounded
      hover:bg-parchment transition-colors">
      End Turn
    </button>
  </div>
</header>
```

---

## F. Left Sidebar (Player List)

```jsx
<aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)]
  bg-void-navy/70 backdrop-blur-sm border-r border-slate-800 p-4">

  <h3 className="font-cinzel text-parchment text-sm uppercase tracking-widest mb-4">
    Nations
  </h3>

  <div className="space-y-3">
    {players.map(player => (
      <div
        key={player.id}
        className={`
          flex items-center gap-3 p-3 rounded-lg
          ${player.isActive
            ? 'bg-imperial-gold/10 border border-imperial-gold'
            : 'bg-slate-800/50'}
        `}
      >
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-full border-2 overflow-hidden
          ${player.isHuman ? 'border-safe-emerald' : 'border-cognitive-teal'}
        `}>
          <img src={player.avatar} alt={player.nation} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-sm text-parchment truncate">
            {player.nation}
          </p>
          <p className="text-xs text-slate-500">
            {player.territoryCount} territories
          </p>
        </div>

        {/* AI/Human Badge */}
        {!player.isHuman && (
          <span className="px-2 py-0.5 text-xs font-mono
            bg-cognitive-teal/20 text-cognitive-teal rounded">
            AI
          </span>
        )}
      </div>
    ))}
  </div>
</aside>
```

---

## G. Bottom Action Bar

```jsx
<footer className="fixed bottom-0 left-64 right-0 h-20 z-40
  bg-void-navy/90 backdrop-blur-sm border-t border-slate-800
  flex items-center justify-center gap-4 px-6">

  <ActionButton
    icon={<SwordsIcon />}
    label="Attack"
    variant="danger"
  />
  <ActionButton
    icon={<ShieldIcon />}
    label="Fortify"
    variant="default"
  />
  <ActionButton
    icon={<ScrollIcon />}
    label="Diplomacy"
    variant="default"
  />
  <ActionButton
    icon={<BookIcon />}
    label="History"
    variant="ai"
  />
</footer>
```

### Action Button Component

```jsx
const variants = {
  default: 'bg-slate-800 hover:bg-slate-700 text-parchment border-slate-600',
  danger: 'bg-war-crimson/20 hover:bg-war-crimson/30 text-war-crimson border-war-crimson/50',
  ai: 'bg-cognitive-teal/20 hover:bg-cognitive-teal/30 text-cognitive-teal border-cognitive-teal/50',
};

<button className={`
  flex flex-col items-center gap-1 px-6 py-3 rounded-lg
  border transition-all
  ${variants[variant]}
`}>
  <span className="w-6 h-6">{icon}</span>
  <span className="font-cinzel text-xs uppercase tracking-wider">{label}</span>
</button>
```

---

## H. Micro-interactions

### Territory Hover

```css
.territory:hover {
  filter: brightness(1.1);
  stroke: #D4AF37;
  stroke-width: 3px;
  transition: all 0.2s ease;
}
```

### AI Thinking State

```jsx
<div className="flex items-center gap-2 text-cognitive-teal">
  <div className="w-4 h-4 border-2 border-cognitive-teal border-t-transparent
    rounded-full animate-spin" />
  <span className="text-sm font-mono animate-pulse">
    Consulting historical records...
  </span>
</div>
```

### Battle Animation (Simple)

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.token-battle {
  animation: shake 0.3s ease-in-out 3;
}

.damage-number {
  color: #C0392B;
  animation: fadeUp 1s ease-out forwards;
}

@keyframes fadeUp {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
}
```
