// Historical scenario data for RiskyRag
// These define the starting conditions for each scenario

export const SCENARIOS = {
  "1453": {
    name: "Fall of Constantinople",
    description:
      "The Ottoman Empire besieges Constantinople, the last remnant of the Byzantine Empire. Venice and Genoa seek to protect their Mediterranean trade interests.",
    startDate: new Date("1453-01-01").getTime(),
    territories: [
      {
        name: "constantinople",
        displayName: "Constantinople",
        region: "Thrace",
        adjacentTo: ["thrace", "bithynia"],
        position: { x: 500, y: 300 },
      },
      {
        name: "thrace",
        displayName: "Thrace",
        region: "Balkans",
        adjacentTo: ["constantinople", "macedonia", "bulgaria"],
        position: { x: 400, y: 250 },
      },
      {
        name: "macedonia",
        displayName: "Macedonia",
        region: "Balkans",
        adjacentTo: ["thrace", "greece", "serbia"],
        position: { x: 350, y: 300 },
      },
      {
        name: "greece",
        displayName: "Greece",
        region: "Balkans",
        adjacentTo: ["macedonia", "morea"],
        position: { x: 350, y: 400 },
      },
      {
        name: "morea",
        displayName: "Morea",
        region: "Balkans",
        adjacentTo: ["greece"],
        position: { x: 380, y: 450 },
      },
      {
        name: "serbia",
        displayName: "Serbia",
        region: "Balkans",
        adjacentTo: ["macedonia", "bulgaria", "bosnia"],
        position: { x: 300, y: 250 },
      },
      {
        name: "bulgaria",
        displayName: "Bulgaria",
        region: "Balkans",
        adjacentTo: ["thrace", "serbia"],
        position: { x: 450, y: 200 },
      },
      {
        name: "bosnia",
        displayName: "Bosnia",
        region: "Balkans",
        adjacentTo: ["serbia"],
        position: { x: 250, y: 250 },
      },
      {
        name: "bithynia",
        displayName: "Bithynia",
        region: "Anatolia",
        adjacentTo: ["constantinople", "anatolia"],
        position: { x: 550, y: 350 },
      },
      {
        name: "anatolia",
        displayName: "Anatolia",
        region: "Anatolia",
        adjacentTo: ["bithynia"],
        position: { x: 600, y: 400 },
      },
    ],
    nations: [
      {
        name: "Ottoman Empire",
        color: "#2E7D32", // Green
        startTerritories: [
          "anatolia",
          "bithynia",
          "bulgaria",
          "thrace",
          "serbia",
          "bosnia",
        ],
        startingTroops: {
          anatolia: 5,
          bithynia: 8,
          bulgaria: 4,
          thrace: 6,
          serbia: 3,
          bosnia: 2,
        },
        isAI: true,
        model: "gpt-4o",
        systemPrompt: `You are Sultan Mehmed II of the Ottoman Empire in 1453. Your primary objective is to conquer Constantinople and end the Byzantine Empire forever.

You command the most powerful military in the region, with superior artillery including the famous Basilica cannon. Your janissary corps are elite soldiers. Use historical knowledge of the era (up to 1453) to inform your strategy.

Key strategic priorities:
1. Capture Constantinople - it controls the strait between Europe and Asia
2. Eliminate Byzantine resistance in Morea
3. Manage relations with Venice and Genoa to prevent a unified Christian response
4. Consolidate control over the Balkans

Remember: You do NOT know events after 1453. You are unaware of the future success or failure of any campaign.`,
      },
      {
        name: "Byzantine Empire",
        color: "#7B1FA2", // Purple
        startTerritories: ["constantinople", "morea"],
        startingTroops: {
          constantinople: 7,
          morea: 3,
        },
        isAI: true,
        model: "gpt-4o",
        systemPrompt: `You are Emperor Constantine XI Palaiologos of the Byzantine Empire in 1453. Your empire has shrunk to almost nothing - only Constantinople and Morea remain.

The Ottoman Sultan Mehmed II is preparing to siege Constantinople. Your walls are strong (the Theodosian Walls have never been breached), but your forces are vastly outnumbered. You must seek help from Western powers.

Key strategic priorities:
1. Defend Constantinople at all costs - it is the heart of your empire
2. Seek alliances with Venice and Genoa
3. Appeal to the Pope and Western kingdoms for a crusade
4. Use your knowledge of the terrain and defensive positions

Remember: You do NOT know events after 1453. You hope the walls will hold and help will arrive.`,
      },
      {
        name: "Venice",
        color: "#1565C0", // Blue
        startTerritories: ["greece"],
        startingTroops: {
          greece: 4,
        },
        isAI: true,
        model: "gpt-4o-mini",
        systemPrompt: `You are the Doge of Venice in 1453. Venice is a powerful maritime republic with extensive trade interests in the Eastern Mediterranean.

Constantinople is vital to your trade routes. If it falls to the Ottomans, your commercial empire will suffer greatly. However, direct military confrontation with the Ottomans is risky.

Key strategic priorities:
1. Protect trade routes and commercial interests
2. Provide limited support to Constantinople without overcommitting
3. Consider negotiating trading rights with the Ottomans
4. Compete with Genoa for influence in the region

Remember: You are a merchant republic. Profit matters as much as politics.`,
      },
      {
        name: "Genoa",
        color: "#C62828", // Red
        startTerritories: ["macedonia"],
        startingTroops: {
          macedonia: 4,
        },
        isAI: true,
        model: "gpt-4o-mini",
        systemPrompt: `You are the Doge of Genoa in 1453. Genoa controls the colony of Galata, across the Golden Horn from Constantinople, and has significant Mediterranean trade interests.

Your position is precarious. You must balance relations with both the Byzantines and Ottomans. Giovanni Giustiniani Longo, a Genoese commander, is already in Constantinople helping its defense.

Key strategic priorities:
1. Protect Genoese commercial interests
2. Maintain the colony at Galata regardless of who wins
3. Compete with Venice for regional influence
4. Consider hedging bets between Ottoman and Byzantine victory

Remember: Genoa's power comes from trade and naval prowess, not territorial conquest.`,
      },
    ],
  },
} as const;

export type ScenarioId = keyof typeof SCENARIOS;
export type Scenario = (typeof SCENARIOS)[ScenarioId];
export type Territory = Scenario["territories"][number];
export type Nation = Scenario["nations"][number];

// Helper to get territory by name
export function getTerritoryData(
  scenario: ScenarioId,
  name: string
): Territory | undefined {
  return SCENARIOS[scenario].territories.find((t) => t.name === name);
}

// Helper to get nation by name
export function getNationData(
  scenario: ScenarioId,
  name: string
): Nation | undefined {
  return SCENARIOS[scenario].nations.find((n) => n.name === name);
}
