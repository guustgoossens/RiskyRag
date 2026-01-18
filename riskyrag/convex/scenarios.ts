// Historical scenario data for RiskyRag
// These define the starting conditions for each scenario

// Region bonus definitions per scenario
export const REGION_BONUSES = {
  "1453": {
    Balkans: { total: 6, bonus: 3 },
    Anatolia: { total: 2, bonus: 2 },
    Thrace: { total: 2, bonus: 2 },
  },
  "1861": {
    "Union Core": { total: 6, bonus: 5 },
    "Confederate Core": { total: 6, bonus: 5 },
    "Border States": { total: 3, bonus: 2 },
    Western: { total: 3, bonus: 3 },
    // Special: Mississippi River bonus (mississippi_valley + gulf_coast)
  },
} as const;

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
  "1861": {
    name: "American Civil War",
    description:
      "The Union fights to preserve the nation while the Confederacy battles for independence. Control of the Mississippi and the capitals will decide the war.",
    startDate: new Date("1861-04-12").getTime(), // Fort Sumter
    timeAdvancementMs: 14 * 24 * 60 * 60 * 1000, // 2 weeks per turn
    territories: [
      // Union Core
      {
        name: "new_england",
        displayName: "New England",
        region: "Union Core",
        adjacentTo: ["new_york"],
        position: { x: 700, y: 80 },
      },
      {
        name: "new_york",
        displayName: "New York",
        region: "Union Core",
        adjacentTo: ["new_england", "pennsylvania", "ohio_valley"],
        position: { x: 620, y: 120 },
      },
      {
        name: "pennsylvania",
        displayName: "Pennsylvania",
        region: "Union Core",
        adjacentTo: ["new_york", "ohio_valley", "maryland", "west_virginia"],
        position: { x: 540, y: 160 },
      },
      {
        name: "ohio_valley",
        displayName: "Ohio Valley",
        region: "Union Core",
        adjacentTo: ["new_york", "pennsylvania", "great_lakes", "kentucky"],
        position: { x: 440, y: 140 },
      },
      {
        name: "great_lakes",
        displayName: "Great Lakes",
        region: "Union Core",
        adjacentTo: ["ohio_valley", "missouri"],
        position: { x: 340, y: 100 },
      },
      {
        name: "washington_dc",
        displayName: "Washington D.C.",
        region: "Union Core",
        adjacentTo: ["maryland", "virginia"],
        position: { x: 580, y: 220 },
        isCapital: true,
      },
      // Border States
      {
        name: "maryland",
        displayName: "Maryland",
        region: "Border States",
        adjacentTo: ["pennsylvania", "washington_dc", "virginia"],
        position: { x: 600, y: 180 },
      },
      {
        name: "west_virginia",
        displayName: "West Virginia",
        region: "Border States",
        adjacentTo: ["pennsylvania", "virginia"],
        position: { x: 480, y: 200 },
      },
      {
        name: "kentucky",
        displayName: "Kentucky",
        region: "Border States",
        adjacentTo: ["ohio_valley", "tennessee", "missouri"],
        position: { x: 380, y: 220 },
        isNeutral: true,
      },
      // Western
      {
        name: "missouri",
        displayName: "Missouri",
        region: "Western",
        adjacentTo: ["great_lakes", "kentucky", "arkansas"],
        position: { x: 260, y: 180 },
      },
      // Confederate Core
      {
        name: "virginia",
        displayName: "Virginia",
        region: "Confederate Core",
        adjacentTo: [
          "washington_dc",
          "maryland",
          "west_virginia",
          "carolinas",
          "tennessee",
        ],
        position: { x: 540, y: 280 },
        isCapital: true,
      },
      {
        name: "tennessee",
        displayName: "Tennessee",
        region: "Confederate Core",
        adjacentTo: [
          "virginia",
          "kentucky",
          "mississippi_valley",
          "arkansas",
          "carolinas",
          "deep_south",
        ],
        position: { x: 380, y: 300 },
      },
      {
        name: "carolinas",
        displayName: "The Carolinas",
        region: "Confederate Core",
        adjacentTo: ["virginia", "tennessee", "deep_south"],
        position: { x: 580, y: 340 },
      },
      {
        name: "deep_south",
        displayName: "Deep South",
        region: "Confederate Core",
        adjacentTo: ["carolinas", "tennessee", "gulf_coast", "mississippi_valley"],
        position: { x: 480, y: 380 },
      },
      {
        name: "gulf_coast",
        displayName: "Gulf Coast",
        region: "Confederate Core",
        adjacentTo: ["deep_south", "texas", "mississippi_valley"],
        position: { x: 380, y: 420 },
      },
      {
        name: "mississippi_valley",
        displayName: "Mississippi Valley",
        region: "Western",
        adjacentTo: ["tennessee", "deep_south", "gulf_coast", "arkansas"],
        position: { x: 300, y: 360 },
      },
      {
        name: "arkansas",
        displayName: "Arkansas",
        region: "Western",
        adjacentTo: ["tennessee", "texas", "missouri", "mississippi_valley"],
        position: { x: 260, y: 320 },
      },
      {
        name: "texas",
        displayName: "Texas",
        region: "Confederate Core",
        adjacentTo: ["gulf_coast", "arkansas"],
        position: { x: 180, y: 400 },
      },
    ],
    nations: [
      {
        name: "Union",
        color: "#1565C0", // Navy Blue
        accentColor: "#FFD700", // Gold
        startTerritories: [
          "new_england",
          "new_york",
          "pennsylvania",
          "ohio_valley",
          "great_lakes",
          "washington_dc",
          "maryland",
          "west_virginia",
          "missouri",
        ],
        startingTroops: {
          new_england: 4,
          new_york: 5,
          pennsylvania: 6,
          ohio_valley: 5,
          great_lakes: 4,
          washington_dc: 7,
          maryland: 4,
          west_virginia: 3,
          missouri: 4,
        },
        isAI: true,
        model: "gpt-4o",
        systemPrompt: `You are President Abraham Lincoln leading the Union in 1861. Your primary objective is to preserve the United States and defeat the Confederate rebellion.

Your advantages include industrial might, naval superiority, and a larger population. However, the Confederacy has skilled generals and the advantage of fighting on home territory.

Key strategic priorities:
1. Defend Washington D.C. at all costs - the capital must not fall
2. Control the Mississippi River to split the Confederacy
3. Capture Richmond, the Confederate capital
4. Prevent European recognition of the Confederacy

Remember: You do NOT know events after 1861. You are uncertain whether the war will be short or long.`,
      },
      {
        name: "Confederacy",
        color: "#6B7280", // Gray
        accentColor: "#DC2626", // Battle Red
        startTerritories: [
          "virginia",
          "tennessee",
          "carolinas",
          "deep_south",
          "gulf_coast",
          "mississippi_valley",
          "arkansas",
          "texas",
        ],
        startingTroops: {
          virginia: 8,
          tennessee: 5,
          carolinas: 5,
          deep_south: 6,
          gulf_coast: 4,
          mississippi_valley: 5,
          arkansas: 3,
          texas: 3,
        },
        isAI: true,
        model: "gpt-4o",
        systemPrompt: `You are President Jefferson Davis leading the Confederate States of America in 1861. Your objective is to defend Southern independence and force the Union to recognize the Confederacy.

Your advantages include superior military leadership, interior lines of defense, and fighting for your homeland. However, the Union has industrial superiority and a larger population.

Key strategic priorities:
1. Defend Richmond, Virginia - the Confederate capital
2. Threaten Washington D.C. to demoralize the North
3. Hold the Mississippi River to maintain territorial integrity
4. Seek European recognition and support

Remember: You do NOT know events after 1861. You believe the war will be short and the South will prevail.`,
      },
    ],
    // Kentucky starts neutral - first to attack claims it
    neutralTerritories: ["kentucky"],
    neutralTroops: {
      kentucky: 3,
    },
  },
} as const;

export type ScenarioId = keyof typeof SCENARIOS;
export type Scenario = (typeof SCENARIOS)[ScenarioId];
export type Territory = Scenario["territories"][number];
export type Nation = Scenario["nations"][number];

// Helper to calculate total starting troops for a nation
export function getTotalStartingTroops(nation: Nation): number {
  const troops = nation.startingTroops as Record<string, number>;
  return Object.values(troops).reduce((sum, count) => sum + count, 0);
}

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
