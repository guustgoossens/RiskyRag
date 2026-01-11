# RiskyRag UI Hierarchy & View Map

## 1. Global Layouts

- **MainLayout**: Contains global Toast provider, TanStack Router Outlet.
- **GameLayout**: Sidebar (Players), Topbar (Date/Turn), Canvas (Map), BottomBar (Actions).

---

## 2. Route: / (Landing Page)

- **LandingPage**:
    - `HeroSection`: Title, tagline, cinematic background.
    - `AuthControls`: Login/Register buttons (or guest play).
    - `FeatureHighlights`: Cards showing Temporal RAG, AI Agents, Multiplayer.

---

## 3. Route: /lobby (Scenario Selection)

- **LobbyLayout**: Centered, cinematic background.
- **ScenarioCarousel**: Horizontal scroll of `ScenarioCard`.
    - `ScenarioCard`: Props: `title`, `year`, `difficulty`, `mapImage`, `description`.
- **PlayerConfigurationPanel**:
    - `HumanSlot`: Avatar, Name input.
    - `AISlot`: Dropdown for Nation, Dropdown for Model (GPT-4, Claude, Llama), Difficulty toggle.
- **ModelSelectorTooltip**: Hover card explaining model strengths.
- **StartGameButton**: Triggers `api.games.create`.

### Historical Scenarios Available

| Year | Event | Nations |
|------|-------|---------|
| 1453 | Fall of Constantinople | Ottomans, Byzantines, Venice |
| 1776 | American Revolution | Britain, France, Colonies |
| 1914 | WWI Start | Germany, France, Britain, Russia |

---

## 4. Route: /game/$gameId (The Board)

The primary interface for gameplay.

### Header Components
- `HistoricalDateDisplay`: Large typography showing current year (e.g., "1453").
- `TurnProgress`: Progress bar (`Turn 12/50`).
- `GlobalNotificationTicker`: Scrolling text for world events.

### MapLayer (Core)
- `MapSVG`: Static SVG container.
- `TerritoryPath`: Interactive `<path>` elements. Color based on `ownerId`.
- `TroopBadge`: Centroid overlay showing troop count.
- `CombatAnimationOverlay`: Transient animation layer for dice/cannon.

### Right Sidebar (HUD)
- `PlayerList`: Vertical list of `PlayerCard`s.
    - `PlayerCard`: Avatar, Nation Name, Territory Count, Troop Count, Status.
    - `AICardBadges`: Visual indicator of AI model.
- `HistoryButton`: Opens `HistoricalQueryModal`.

### Bottom Action Bar
- `PhaseIndicator`: Current phase (Deploy, Attack, Fortify).
- `ActionButtons`: `AttackBtn`, `MoveBtn`, `FortifyBtn`, `EndTurnBtn`.

---

## 5. Feature: Diplomacy (Overlay/Drawer)

Split view over Game Board (map remains partially visible).

### ChatDrawer
- `PersonaAvatar`: Large portrait of historical figure.
- `ChatWindow`: Scrollable message area.
    - `MessageBubble`: Styled differently for User vs. AI.
- `ThinkingIndicator`: "GPT-4 is thinking..." animation.

### NegotiationControls
- `DiplomaticActionRow`: Buttons for `Propose Alliance`, `Declare War`, `Cease-Fire`.

### RAG Context Panel (Right side)
- `KnowledgeCutoffBadge`: "Knowledge <= May 1453".
- `FactList`: Bullet points of what AI "knows" (debug/educational).

---

## 6. Feature: Temporal RAG (Modal)

Shows the "Temporal RAG" innovation for education.

### HistoricalContextModal
- `QueryInput`: "Ask the Ottoman Empire about their history..."
- `AnswerCard`: The text response.
- `CitationBadge`: Citations like `[Source: Wikipedia, 1453]`.
- `TemporalFilterStatus`: Visual checkmark showing "Future events blocked."
- `RelatedTopicChips`: Clickable tags to explore deeper.

---

## 7. Route: /dev/monitor (AI Debug)

Visualize the tech stack for judges/debugging.

### AgentDashboard
- `LiveLogStream`: Terminal-style feed of tool calls (`attack_territory(...)`).
- `RAGPerformanceChart`: Line chart (docs retrieved vs. blocked by date filter).
- `ThinkingProcess`: Stepper showing AI's chain-of-thought.
- `WinProbabilityGauge`: Speedometer-style chart.

---

## 8. Route: /game/$gameId/post (Benchmark Results)

Post-game summary and metrics.

### PostGameLayout
- `VictoryBanner`: "Ottoman Empire Wins".
- `StatComparisonTable`: Columns for Human vs AI models.
    - Metrics: Win rate, Turns alive, Negotiation success.
- `ToolUsageChart`: Graph showing Attack vs Negotiate preferences per model.
- `DownloadDataBtn`: Export game logs for benchmark dataset.
