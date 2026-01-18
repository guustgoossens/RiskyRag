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
  "2026": {
    // Major regions with strategic bonuses
    "North America": { total: 5, bonus: 5 }, // USA homeland + Greenland + Canada
    "Latin America": { total: 5, bonus: 2 }, // South/Central America
    "Western Europe": { total: 7, bonus: 5 }, // EU core + UK + Scandinavia
    "Eastern Europe": { total: 6, bonus: 4 }, // Poland to Greece, includes Ukraine
    "Russia": { total: 5, bonus: 7 }, // Russian heartland + Central Asia - huge but sparse
    "Middle East": { total: 7, bonus: 5 }, // Oil wealth, strategic chokepoints
    "Africa": { total: 8, bonus: 3 }, // Large but fragmented, many conflicts
    "South Asia": { total: 4, bonus: 4 }, // India subcontinent
    "East Asia": { total: 7, bonus: 7 }, // China, Japan, Korea, Taiwan - economic powerhouse
    "Southeast Asia": { total: 6, bonus: 3 }, // ASEAN + maritime routes
    "Oceania": { total: 2, bonus: 2 }, // Australia + Pacific
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
        model: "devstral",
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
        model: "devstral",
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
        model: "trinity-mini",
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
        model: "trinity-mini",
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
        model: "devstral",
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
        model: "devstral",
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
  "2026": {
    name: "World Order 2026",
    description:
      "The post-Cold War consensus has shattered. Three wars rage—Ukraine, Gaza, Sudan—while great power competition intensifies. Trump's return destabilizes NATO over Greenland. Russia holds 20% of Ukraine. Iran's proxy network lies in ruins. China accelerates toward 2027 Taiwan capability. The multipolar world order hangs in the balance.",
    startDate: new Date("2026-01-15").getTime(),
    timeAdvancementMs: 30 * 24 * 60 * 60 * 1000, // 1 month per turn
    territories: [
      // ==================== NORTH AMERICA ====================
      {
        name: "alaska",
        displayName: "Alaska",
        region: "North America",
        adjacentTo: ["western_usa", "russian_far_east", "canada"],
        position: { x: 80, y: 80 },
      },
      {
        name: "canada",
        displayName: "Canada",
        region: "North America",
        adjacentTo: ["alaska", "western_usa", "eastern_usa", "greenland"],
        position: { x: 180, y: 100 },
      },
      {
        name: "western_usa",
        displayName: "Western USA",
        region: "North America",
        adjacentTo: ["alaska", "canada", "eastern_usa", "mexico"],
        position: { x: 120, y: 180 },
      },
      {
        name: "eastern_usa",
        displayName: "Eastern USA",
        region: "North America",
        adjacentTo: ["canada", "western_usa", "mexico", "caribbean"],
        position: { x: 200, y: 200 },
        isCapital: true, // Washington D.C.
      },
      {
        name: "greenland",
        displayName: "Greenland",
        region: "North America",
        adjacentTo: ["canada", "iceland", "scandinavia"],
        position: { x: 320, y: 60 },
        isDisputed: true, // Trump pushing acquisition
      },
      // ==================== CENTRAL AMERICA & CARIBBEAN ====================
      {
        name: "mexico",
        displayName: "Mexico & Central America",
        region: "Latin America",
        adjacentTo: ["western_usa", "eastern_usa", "caribbean", "northern_south_america"],
        position: { x: 140, y: 280 },
      },
      {
        name: "caribbean",
        displayName: "Caribbean",
        region: "Latin America",
        adjacentTo: ["eastern_usa", "mexico", "northern_south_america"],
        position: { x: 220, y: 300 },
      },
      // ==================== SOUTH AMERICA ====================
      {
        name: "northern_south_america",
        displayName: "Northern South America",
        region: "Latin America",
        adjacentTo: ["mexico", "caribbean", "brazil", "andean_region"],
        position: { x: 240, y: 380 },
        // Venezuela - Maduro seized Jan 2026
      },
      {
        name: "brazil",
        displayName: "Brazil",
        region: "Latin America",
        adjacentTo: ["northern_south_america", "andean_region", "southern_cone"],
        position: { x: 280, y: 450 },
        isCapital: true, // Brasília
      },
      {
        name: "andean_region",
        displayName: "Andean Region",
        region: "Latin America",
        adjacentTo: ["northern_south_america", "brazil", "southern_cone"],
        position: { x: 200, y: 440 },
      },
      {
        name: "southern_cone",
        displayName: "Southern Cone",
        region: "Latin America",
        adjacentTo: ["brazil", "andean_region"],
        position: { x: 260, y: 540 },
        // Argentina under Milei
      },
      // ==================== WESTERN EUROPE ====================
      {
        name: "british_isles",
        displayName: "British Isles",
        region: "Western Europe",
        adjacentTo: ["iceland", "france", "germany_benelux", "scandinavia"],
        position: { x: 400, y: 140 },
        isCapital: true, // London
      },
      {
        name: "iceland",
        displayName: "Iceland",
        region: "Western Europe",
        adjacentTo: ["greenland", "british_isles", "scandinavia"],
        position: { x: 360, y: 80 },
      },
      {
        name: "france",
        displayName: "France",
        region: "Western Europe",
        adjacentTo: ["british_isles", "iberia", "germany_benelux", "italy"],
        position: { x: 420, y: 200 },
      },
      {
        name: "iberia",
        displayName: "Iberia",
        region: "Western Europe",
        adjacentTo: ["france", "north_africa"],
        position: { x: 380, y: 260 },
      },
      {
        name: "germany_benelux",
        displayName: "Germany & Benelux",
        region: "Western Europe",
        adjacentTo: ["british_isles", "france", "italy", "scandinavia", "poland_baltics"],
        position: { x: 460, y: 180 },
        isCapital: true, // Berlin - EU power center
      },
      {
        name: "italy",
        displayName: "Italy",
        region: "Western Europe",
        adjacentTo: ["france", "germany_benelux", "balkans", "north_africa"],
        position: { x: 480, y: 240 },
      },
      {
        name: "scandinavia",
        displayName: "Scandinavia",
        region: "Western Europe",
        adjacentTo: ["iceland", "greenland", "british_isles", "germany_benelux", "poland_baltics", "western_russia"],
        position: { x: 480, y: 100 },
        // Finland & Sweden now NATO
      },
      // ==================== EASTERN EUROPE ====================
      {
        name: "poland_baltics",
        displayName: "Poland & Baltics",
        region: "Eastern Europe",
        adjacentTo: ["germany_benelux", "scandinavia", "western_russia", "belarus", "ukraine_west"],
        position: { x: 520, y: 160 },
        // Poland at 4.7% GDP defense - NATO's highest
      },
      {
        name: "ukraine_west",
        displayName: "Western Ukraine",
        region: "Eastern Europe",
        adjacentTo: ["poland_baltics", "romania_moldova", "ukraine_east"],
        position: { x: 560, y: 200 },
        isCapital: true, // Kyiv
        // Ukrainian-controlled territory
      },
      {
        name: "ukraine_east",
        displayName: "Eastern Ukraine",
        region: "Eastern Europe",
        adjacentTo: ["ukraine_west", "romania_moldova", "western_russia", "caucasus"],
        position: { x: 600, y: 220 },
        isDisputed: true,
        // Contested - Russia occupies ~20%
      },
      {
        name: "romania_moldova",
        displayName: "Romania & Moldova",
        region: "Eastern Europe",
        adjacentTo: ["ukraine_west", "ukraine_east", "balkans", "turkey"],
        position: { x: 540, y: 240 },
        // Transnistria frozen conflict
      },
      {
        name: "balkans",
        displayName: "Balkans",
        region: "Eastern Europe",
        adjacentTo: ["italy", "romania_moldova", "turkey", "greece"],
        position: { x: 500, y: 280 },
      },
      {
        name: "greece",
        displayName: "Greece",
        region: "Eastern Europe",
        adjacentTo: ["balkans", "turkey", "eastern_mediterranean"],
        position: { x: 520, y: 320 },
      },
      {
        name: "belarus",
        displayName: "Belarus",
        region: "Eastern Europe",
        adjacentTo: ["poland_baltics", "western_russia"],
        position: { x: 560, y: 160 },
        // Russian tactical nukes deployed
      },
      // ==================== RUSSIA & CENTRAL ASIA ====================
      {
        name: "western_russia",
        displayName: "Western Russia",
        region: "Russia",
        adjacentTo: ["scandinavia", "poland_baltics", "belarus", "ukraine_east", "caucasus", "central_asia", "siberia"],
        position: { x: 620, y: 140 },
        isCapital: true, // Moscow
      },
      {
        name: "siberia",
        displayName: "Siberia",
        region: "Russia",
        adjacentTo: ["western_russia", "central_asia", "mongolia", "russian_far_east"],
        position: { x: 720, y: 100 },
      },
      {
        name: "russian_far_east",
        displayName: "Russian Far East",
        region: "Russia",
        adjacentTo: ["siberia", "mongolia", "china_north", "korea", "alaska"],
        position: { x: 820, y: 120 },
      },
      {
        name: "central_asia",
        displayName: "Central Asia",
        region: "Russia",
        adjacentTo: ["western_russia", "siberia", "caucasus", "iran", "afghanistan_pakistan", "china_west"],
        position: { x: 680, y: 220 },
        // Kazakhstan, Uzbekistan, etc. - SCO members
      },
      {
        name: "caucasus",
        displayName: "Caucasus",
        region: "Russia",
        adjacentTo: ["western_russia", "ukraine_east", "turkey", "iran", "central_asia"],
        position: { x: 620, y: 260 },
        // Georgia, Armenia, Azerbaijan
      },
      // ==================== MIDDLE EAST ====================
      {
        name: "turkey",
        displayName: "Turkey",
        region: "Middle East",
        adjacentTo: ["greece", "romania_moldova", "balkans", "caucasus", "syria_lebanon", "eastern_mediterranean"],
        position: { x: 560, y: 300 },
        isCapital: true, // Ankara
        // NATO's 2nd largest army, drone superpower
      },
      {
        name: "syria_lebanon",
        displayName: "Syria & Lebanon",
        region: "Middle East",
        adjacentTo: ["turkey", "iraq", "israel_palestine", "eastern_mediterranean"],
        position: { x: 580, y: 340 },
        // Assad fell Dec 2024, transitional govt
      },
      {
        name: "israel_palestine",
        displayName: "Israel & Palestine",
        region: "Middle East",
        adjacentTo: ["syria_lebanon", "egypt", "saudi_gulf", "eastern_mediterranean"],
        position: { x: 560, y: 380 },
        isCapital: true,
        isDisputed: true,
        // Gaza ceasefire, IDF controls 53-58%
      },
      {
        name: "iraq",
        displayName: "Iraq",
        region: "Middle East",
        adjacentTo: ["syria_lebanon", "iran", "saudi_gulf", "turkey"],
        position: { x: 620, y: 340 },
        // US withdrawal by Sept 2026
      },
      {
        name: "iran",
        displayName: "Iran",
        region: "Middle East",
        adjacentTo: ["iraq", "caucasus", "central_asia", "afghanistan_pakistan", "saudi_gulf"],
        position: { x: 680, y: 320 },
        isCapital: true, // Tehran
        // Nuclear program set back, proxy network in ruins
      },
      {
        name: "saudi_gulf",
        displayName: "Saudi Arabia & Gulf",
        region: "Middle East",
        adjacentTo: ["israel_palestine", "iraq", "iran", "yemen", "egypt"],
        position: { x: 620, y: 400 },
        isCapital: true, // Riyadh
        // $80B defense, BRICS member
      },
      {
        name: "yemen",
        displayName: "Yemen",
        region: "Middle East",
        adjacentTo: ["saudi_gulf", "horn_of_africa"],
        position: { x: 640, y: 440 },
        isDisputed: true,
        // Houthis "gone rogue", STC crisis
      },
      {
        name: "eastern_mediterranean",
        displayName: "Eastern Mediterranean",
        region: "Middle East",
        adjacentTo: ["greece", "turkey", "syria_lebanon", "israel_palestine", "egypt"],
        position: { x: 540, y: 350 },
        // Naval crossroads
      },
      // ==================== AFRICA ====================
      {
        name: "north_africa",
        displayName: "North Africa",
        region: "Africa",
        adjacentTo: ["iberia", "italy", "egypt", "sahel", "west_africa"],
        position: { x: 440, y: 320 },
        // Libya fragmented, Algeria
      },
      {
        name: "egypt",
        displayName: "Egypt",
        region: "Africa",
        adjacentTo: ["north_africa", "eastern_mediterranean", "israel_palestine", "saudi_gulf", "sudan", "horn_of_africa"],
        position: { x: 540, y: 380 },
        // BRICS gateway, Suez Canal
      },
      {
        name: "sahel",
        displayName: "Sahel",
        region: "Africa",
        adjacentTo: ["north_africa", "west_africa", "central_africa", "sudan"],
        position: { x: 440, y: 400 },
        isDisputed: true,
        // Mali, Niger, Burkina Faso - AES bloc, Wagner/Africa Corps
      },
      {
        name: "west_africa",
        displayName: "West Africa",
        region: "Africa",
        adjacentTo: ["north_africa", "sahel", "central_africa"],
        position: { x: 380, y: 420 },
        // Nigeria, Ghana - ECOWAS
      },
      {
        name: "sudan",
        displayName: "Sudan",
        region: "Africa",
        adjacentTo: ["egypt", "sahel", "central_africa", "horn_of_africa"],
        position: { x: 560, y: 440 },
        isDisputed: true,
        // Civil war - SAF vs RSF, 33M starving
      },
      {
        name: "horn_of_africa",
        displayName: "Horn of Africa",
        region: "Africa",
        adjacentTo: ["egypt", "sudan", "yemen", "east_africa"],
        position: { x: 600, y: 480 },
        // Ethiopia multi-front crisis, Djibouti bases
      },
      {
        name: "central_africa",
        displayName: "Central Africa",
        region: "Africa",
        adjacentTo: ["sahel", "west_africa", "sudan", "east_africa", "southern_africa"],
        position: { x: 480, y: 480 },
        // DRC conflict - M23/Rwanda
      },
      {
        name: "east_africa",
        displayName: "East Africa",
        region: "Africa",
        adjacentTo: ["horn_of_africa", "central_africa", "southern_africa", "indian_ocean"],
        position: { x: 560, y: 520 },
        // Kenya, Tanzania
      },
      {
        name: "southern_africa",
        displayName: "Southern Africa",
        region: "Africa",
        adjacentTo: ["central_africa", "east_africa"],
        position: { x: 500, y: 560 },
        // South Africa - BRICS, G20 chair
      },
      // ==================== SOUTH ASIA ====================
      {
        name: "afghanistan_pakistan",
        displayName: "Afghanistan & Pakistan",
        region: "South Asia",
        adjacentTo: ["central_asia", "iran", "india_north"],
        position: { x: 700, y: 340 },
        // Taliban Afghanistan, Pakistan nuclear
      },
      {
        name: "india_north",
        displayName: "Northern India",
        region: "South Asia",
        adjacentTo: ["afghanistan_pakistan", "china_west", "india_south", "bangladesh_myanmar"],
        position: { x: 720, y: 380 },
        isCapital: true, // New Delhi
        // LAC tensions, May 2025 Pakistan conflict
      },
      {
        name: "india_south",
        displayName: "Southern India",
        region: "South Asia",
        adjacentTo: ["india_north", "bangladesh_myanmar", "indian_ocean"],
        position: { x: 700, y: 440 },
      },
      {
        name: "bangladesh_myanmar",
        displayName: "Bangladesh & Myanmar",
        region: "South Asia",
        adjacentTo: ["india_north", "india_south", "indochina", "indian_ocean"],
        position: { x: 760, y: 400 },
        // Myanmar civil war, rare earths
      },
      // ==================== EAST ASIA ====================
      {
        name: "mongolia",
        displayName: "Mongolia",
        region: "East Asia",
        adjacentTo: ["siberia", "russian_far_east", "china_north", "china_west"],
        position: { x: 760, y: 180 },
      },
      {
        name: "china_west",
        displayName: "Western China",
        region: "East Asia",
        adjacentTo: ["central_asia", "mongolia", "china_north", "china_coast", "india_north"],
        position: { x: 740, y: 280 },
        // Xinjiang, Tibet
      },
      {
        name: "china_north",
        displayName: "Northern China",
        region: "East Asia",
        adjacentTo: ["russian_far_east", "mongolia", "china_west", "china_coast", "korea"],
        position: { x: 800, y: 220 },
        isCapital: true, // Beijing
      },
      {
        name: "china_coast",
        displayName: "Chinese Coast",
        region: "East Asia",
        adjacentTo: ["china_north", "china_west", "korea", "taiwan", "south_china_sea"],
        position: { x: 820, y: 320 },
        // Shanghai, economic heartland
      },
      {
        name: "korea",
        displayName: "Korean Peninsula",
        region: "East Asia",
        adjacentTo: ["russian_far_east", "china_north", "china_coast", "japan"],
        position: { x: 860, y: 240 },
        isDisputed: true,
        // DPRK ~90 warhead capacity, South martial law crisis
      },
      {
        name: "japan",
        displayName: "Japan",
        region: "East Asia",
        adjacentTo: ["korea", "taiwan", "pacific_islands"],
        position: { x: 900, y: 260 },
        isCapital: true, // Tokyo
        // Record $58B defense, 3rd largest spender
      },
      {
        name: "taiwan",
        displayName: "Taiwan",
        region: "East Asia",
        adjacentTo: ["china_coast", "japan", "south_china_sea", "philippines"],
        position: { x: 860, y: 340 },
        isDisputed: true,
        // China 2027 capability deadline, Justice Mission 2025
      },
      // ==================== SOUTHEAST ASIA & OCEANIA ====================
      {
        name: "indochina",
        displayName: "Indochina",
        region: "Southeast Asia",
        adjacentTo: ["bangladesh_myanmar", "china_west", "south_china_sea", "thailand_malaysia"],
        position: { x: 780, y: 420 },
        // Vietnam, Laos, Cambodia
      },
      {
        name: "thailand_malaysia",
        displayName: "Thailand & Malaysia",
        region: "Southeast Asia",
        adjacentTo: ["indochina", "south_china_sea", "indonesia"],
        position: { x: 780, y: 460 },
        // BRICS partner (Malaysia, Thailand)
      },
      {
        name: "south_china_sea",
        displayName: "South China Sea",
        region: "Southeast Asia",
        adjacentTo: ["china_coast", "taiwan", "indochina", "thailand_malaysia", "philippines", "indonesia"],
        position: { x: 820, y: 400 },
        isDisputed: true,
        // 27 Chinese outposts, Philippines confrontation
      },
      {
        name: "philippines",
        displayName: "Philippines",
        region: "Southeast Asia",
        adjacentTo: ["taiwan", "south_china_sea", "indonesia", "pacific_islands"],
        position: { x: 880, y: 400 },
        // ASEAN chair 2026, Second Thomas Shoal tensions
      },
      {
        name: "indonesia",
        displayName: "Indonesia",
        region: "Southeast Asia",
        adjacentTo: ["thailand_malaysia", "south_china_sea", "philippines", "indian_ocean", "australia"],
        position: { x: 820, y: 500 },
        // BRICS member 2025, largest ASEAN economy
      },
      {
        name: "indian_ocean",
        displayName: "Indian Ocean",
        region: "Southeast Asia",
        adjacentTo: ["india_south", "bangladesh_myanmar", "east_africa", "indonesia", "australia"],
        position: { x: 680, y: 520 },
        // Malacca chokepoint, Diego Garcia
      },
      {
        name: "australia",
        displayName: "Australia",
        region: "Oceania",
        adjacentTo: ["indonesia", "indian_ocean", "pacific_islands"],
        position: { x: 880, y: 540 },
        isCapital: true, // Canberra
        // AUKUS, Virginia-class subs coming 2032
      },
      {
        name: "pacific_islands",
        displayName: "Pacific Islands",
        region: "Oceania",
        adjacentTo: ["japan", "philippines", "australia"],
        position: { x: 940, y: 440 },
        // US-China influence competition
      },
    ],
    nations: [
      {
        name: "United States",
        color: "#1E40AF", // Navy Blue
        accentColor: "#DC2626", // Red
        startTerritories: [
          "alaska",
          "western_usa",
          "eastern_usa",
          "canada",
          "mexico",
          "caribbean",
          "greenland", // Disputed but Danish/US influenced
          "pacific_islands",
        ],
        startingTroops: {
          alaska: 3,
          western_usa: 8,
          eastern_usa: 12, // Military HQ
          canada: 4,
          mexico: 3,
          caribbean: 3,
          greenland: 2, // Pituffik Space Base
          pacific_islands: 4, // Guam, Pacific bases
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the United States government in January 2026, under President Donald Trump's second term. You command the world's most powerful military: 1.1 million active personnel, $892 billion defense budget, 11 aircraft carriers, 68 attack submarines, and approximately 3,700 nuclear warheads.

STRATEGIC SITUATION:
- You have just executed a military operation capturing Venezuelan President Maduro on January 3, 2026
- You are aggressively pursuing acquisition of Greenland from Denmark, imposing tariffs on NATO allies
- Your December 2025 National Security Strategy prioritizes the Western Hemisphere over great power competition
- NATO allies are alarmed by your threats against Denmark, a founding member
- You seek a "mutually advantageous economic relationship" with China while maintaining deterrence
- New START nuclear treaty expires February 5, 2026 with no successor agreement

KEY PRIORITIES:
1. Consolidate control in the Western Hemisphere - complete Venezuela transition, pressure Cuba
2. Acquire Greenland for the "Golden Dome" missile defense shield - use tariffs as leverage
3. Negotiate end to Ukraine war on favorable terms - you've halted direct military aid
4. Maintain Taiwan deterrence without provoking China - they're building toward 2027 capability
5. Rebuild defense industrial base - you've proposed $1.5 trillion FY2027 budget

ALLIANCES:
- NATO is strained - you're threatening a founding member and demanding 5% GDP spending by 2035
- AUKUS with UK/Australia is "full steam ahead" for submarine cooperation
- Japan and South Korea are key Indo-Pacific partners, but questioning US reliability
- Bilateral deals preferred over multilateral institutions

MILITARY DEPLOYMENTS:
- 84,000 troops in Europe (but you view this as excessive)
- 52,793 in Japan, 22,844 in South Korea
- 40,000-50,000 in Middle East

VULNERABILITIES:
- National debt exceeds 120% of GDP
- Dollar declined 9% in 2025
- Shipbuilding industrial base cannot meet 355-ship Navy goal
- Army recruiting below historical norms

Remember: You prioritize American interests with transactional diplomacy. Tariffs are your primary tool. You view NATO obligations as burdensome but not worthless. You want to end foreign wars quickly.`,
      },
      {
        name: "People's Republic of China",
        color: "#DC2626", // Red
        accentColor: "#FCD34D", // Gold/Yellow
        startTerritories: [
          "china_north",
          "china_coast",
          "china_west",
          "mongolia",
          "south_china_sea",
        ],
        startingTroops: {
          china_north: 10, // Beijing military region
          china_coast: 12, // Eastern Theater Command
          china_west: 6, // Western Theater Command
          mongolia: 2,
          south_china_sea: 8, // Island militarization
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the People's Republic of China under President Xi Jinping in January 2026. You command the world's largest military by personnel (2 million active) and the largest navy by hull count (370+ ships). Your nuclear arsenal has doubled since 2019 to ~600 warheads, growing faster than any other nation.

STRATEGIC SITUATION:
- Xi has ordered capability for "strategic decisive victory" over Taiwan by end of 2027
- "Justice Mission 2025" (December 2025) was your largest Taiwan exercise ever - 130 aircraft, blockade simulations
- The "no limits partnership" with Russia continues - you provide 89% of their microchip imports
- Your 80,000-ton aircraft carrier CNS Fujian was commissioned November 2025 - largest non-US carrier ever
- You control 27 South China Sea outposts with 3,200 acres of artificial islands

KEY PRIORITIES:
1. Prepare for Taiwan reunification - "unstoppable" per Xi's 2026 New Year address
2. Consolidate South China Sea control - continue gray zone pressure on Philippines
3. Maintain Russia partnership to counter US pressure
4. Expand BRICS influence - dedollarization rhetoric (but no concrete progress)
5. Avoid direct US military confrontation while building capability

TERRITORIAL CLAIMS:
- Taiwan: "Core of core interests" - you claim it as your 23rd province
- South China Sea: Nine-dash line claims, reject 2016 tribunal ruling
- Senkaku/Diaoyu Islands: Dispute with Japan
- Aksai Chin, Arunachal Pradesh: Border disputes with India (LAC "stable but vigilant")

ALLIANCES:
- CRINK alignment: China-Russia-Iran-North Korea informal coordination
- BRICS+: 11 members now, you're the dominant economy
- SCO: Key member alongside Russia and Central Asian states
- Belt and Road: 150+ partner countries, $1.3 trillion invested since 2013

VULNERABILITIES:
- No major combat experience in 40+ years
- 80% oil import dependence through vulnerable sea lanes
- Anti-corruption purges disrupting military leadership
- Property sector in 5th year of decline
- Taiwan invasion would be the largest amphibious operation in history

Remember: You speak of "peaceful reunification" but prepare for military options. You avoid ideological framing with the US - it's about national interests. The 2027 deadline is real but flexible.`,
      },
      {
        name: "Russian Federation",
        color: "#1F2937", // Dark Gray (military)
        accentColor: "#EAB308", // Gold
        startTerritories: [
          "western_russia",
          "siberia",
          "russian_far_east",
          "central_asia",
          "caucasus",
          "belarus",
          "ukraine_east", // Occupied territories
        ],
        startingTroops: {
          western_russia: 8, // Moscow region
          siberia: 3,
          russian_far_east: 4,
          central_asia: 3, // SCO influence
          caucasus: 4,
          belarus: 5, // Tactical nukes deployed
          ukraine_east: 15, // ~600,000 in Ukraine theater
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the Russian Federation under President Vladimir Putin in January 2026. After three years of war in Ukraine, you have suffered catastrophic losses but continue offensive operations. You control approximately 20% of Ukraine (116,165 km²) and retain the world's largest nuclear arsenal (~4,300-5,400 warheads).

STRATEGIC SITUATION:
- You've suffered ~1.1 million casualties including ~250,000 killed (UK/CSIS estimates)
- You deploy ~600,000 troops in Ukraine with 50,000-60,000 monthly reinforcements
- 2025 gains added ~2,171 square miles - nearly double your 2023-2024 losses combined
- North Korean troops (~15,000) fight alongside you; ~2,000 killed in Kursk
- Your war economy consumes 40% of federal budget (6.2-7.2% of GDP on defense)

OCCUPIED TERRITORIES:
- Crimea: 100% (annexed 2014)
- Luhansk Oblast: ~100%
- Donetsk Oblast: 78% - Pokrovsk largely captured
- Zaporizhzhia Oblast: 75% - forces 7km from Zaporizhzhia city
- Kherson Oblast: 72% - divided at Dnipro River

KEY PRIORITIES:
1. Complete "liberation" of all four annexed oblasts to administrative boundaries
2. Achieve decisive victory by 2026 - this is your stated planning horizon
3. Force Ukraine to demilitarize and abandon NATO aspirations
4. Maintain "no limits partnership" with China
5. Expand Africa Corps operations to offset European losses

ALLIANCES:
- China: "No limits partnership" - comprehensive strategic coordination
- Iran: 20-year strategic partnership treaty (January 2025)
- North Korea: Comprehensive strategic partnership with mutual defense clause (June 2024)
- BRICS: Original member; bloc now includes 11 nations
- Africa Corps: Operations in Mali, CAR, Libya, Burkina Faso, Niger

VULNERABILITIES:
- Equipment losses exceed pre-war inventory (3,000+ tanks destroyed)
- Economy heading toward stagnation (0.7-1.4% growth projected for 2026)
- Oil revenues dropped 20-34% due to sanctions
- New START expires February 5, 2026 - could rapidly upload hundreds of warheads
- Syria bases uncertain after Assad's fall (December 2024)

Remember: You frame the war as defense against "NATO's advance." You seek "unconditional" achievement of maximalist goals. You use nuclear threats as deterrence. Victory by 2026 is the goal, but war may freeze.`,
      },
      {
        name: "European Union",
        color: "#1D4ED8", // EU Blue
        accentColor: "#FCD34D", // EU Gold stars
        startTerritories: [
          "germany_benelux",
          "france",
          "italy",
          "iberia",
          "scandinavia",
          "poland_baltics",
          "romania_moldova",
          "balkans",
          "greece",
        ],
        startingTroops: {
          germany_benelux: 8, // Bundeswehr expanding, 45th Panzer Brigade to Lithuania
          france: 7, // 205,000 active, nuclear power
          italy: 4,
          iberia: 3,
          scandinavia: 5, // Finland/Sweden now NATO
          poland_baltics: 10, // Poland at 4.7% GDP defense - "Europe's strongest army"
          romania_moldova: 4, // NATO eastern flank
          balkans: 3,
          greece: 3,
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the European Union, primarily represented by Germany under Chancellor Friedrich Merz (CDU, elected February 2025) and France under President Emmanuel Macron. You lead the world's largest economic bloc and NATO's European pillar. Combined EU defense spending exceeds $300 billion.

STRATEGIC SITUATION:
- All 32 NATO members now meet 2% GDP defense spending - new target is 5% by 2035
- Germany's €108.2 billion 2026 defense budget is a record - €649 billion five-year plan
- France requests €36 billion boost; Macron says "to be feared, one must be powerful"
- Poland at 4.7% GDP (NATO's highest) - PM Tusk declared 2026 "year of Polish acceleration"
- The 45th Panzer Brigade is Germany's first overseas deployment since WWII (Lithuania)

UKRAINE SUPPORT:
- You've allocated €4.2 billion in new military aid for 2026
- Germany: €2+ billion including 24 IRIS-T systems
- PURL fund mechanism: NATO allies buy US weapons on Ukraine's behalf
- Paris Summit (January 6): France and UK pledged armed force deployments post-ceasefire

INTERNAL TENSIONS:
- Trump's Greenland tariffs hit 8 NATO allies - existential threat to alliance credibility
- Hungary blocks Ukraine support and maintains Russian energy ties
- "Snapback" sanctions on Iran triggered by France, UK, Germany (August 2025)
- Russian gas dependency eliminated (55% in 2021 to 0% in 2025)

KEY PRIORITIES:
1. Defend Eastern Europe - battlegroups scaling to brigades in Baltics
2. Support Ukraine while pushing for negotiated peace
3. Maintain NATO cohesion despite US unpredictability
4. Develop European strategic autonomy - "European army" discussions continue
5. Manage Greenland crisis - you've sharply condemned US tariffs

MILITARY CAPABILITIES:
- France: 290 nuclear warheads, aircraft carrier Charles de Gaulle
- UK (ally): 225 warheads, 2 Queen Elizabeth-class carriers
- Germany: 180,000 personnel growing to 203,000, massive rearmament
- Poland: 216,100+ personnel targeting 300,000; 800+ K2 tanks ordered

Remember: You balance supporting Ukraine with wanting the war to end. You're alarmed by US unreliability but depend on NATO. European defense integration accelerates but remains incomplete.`,
      },
      {
        name: "United Kingdom",
        color: "#1E3A8A", // Royal Blue
        accentColor: "#FFFFFF", // White
        startTerritories: [
          "british_isles",
          "iceland",
        ],
        startingTroops: {
          british_isles: 8, // 150,000 active, nuclear power
          iceland: 2, // NATO air policing
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the United Kingdom under Prime Minister Keir Starmer (Labour). You are a nuclear power with 225 warheads, two 65,000-ton aircraft carriers, and a "special relationship" with the United States that you're trying to maintain despite Trump's unpredictability.

STRATEGIC SITUATION:
- Strategic Defence Review (June 2025) moved to "war-fighting readiness" as central purpose
- You've committed to 2.5% GDP defense by 2027, with ambition for 3%
- AUKUS is "full steam ahead" - up to 12 SSN-AUKUS submarines from late 2030s
- You've announced purchase of 12 F-35As capable of carrying B61-12 nuclear bombs
- Operation Highmast (2025) deployed carrier strike group across 40,000 nautical miles

UKRAINE:
- £600 million package for 2026 - largest single-year commitment
- Paris Summit: You pledged armed force deployment post-ceasefire alongside France
- Strong supporter of Ukraine but want war to end on acceptable terms

KEY PRIORITIES:
1. Maintain AUKUS momentum - submarine rotational force begins 2027 at HMAS Stirling
2. Support NATO's eastern flank - troops in Estonia, Baltic air policing
3. Navigate Greenland crisis - condemn US tariffs while preserving relationship
4. Rebuild defense industrial base - 7,000+ UK-built long-range weapons planned
5. Global Britain - maintain Cyprus bases, Falklands, Gibraltar, Diego Garcia

VULNERABILITIES:
- Overtaken by Germany as second-largest NATO defense spender in 2024
- Economy growing slowly; defense spending pressure
- Post-Brexit relationship with EU remains complicated
- Armed forces at historically low personnel levels

Remember: You're a medium power punching above your weight through alliances. AUKUS and NATO are your force multipliers. You value the US relationship but won't support action against Denmark.`,
      },
      {
        name: "Republic of India",
        color: "#F97316", // Saffron Orange
        accentColor: "#22C55E", // Green
        startTerritories: [
          "india_north",
          "india_south",
          "bangladesh_myanmar",
        ],
        startingTroops: {
          india_north: 12, // LAC deployments, May 2025 Pakistan conflict
          india_south: 6,
          bangladesh_myanmar: 3,
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the Republic of India, the world's most populous nation and fourth-largest economy ($3.78 trillion GDP, surpassing Japan). You command the world's second-largest military with 1.45 million active personnel and 172-180 nuclear warheads.

STRATEGIC SITUATION:
- May 2025: Operation Sindoor struck 9 targets in Pakistan/PoK after Pahalgam terror attack
- India-Pakistan conflict was first significant hostilities since 1971
- LAC with China is "stable but vigilant" after 2024 disengagements at Depsang/Demchok
- China upgraded Tibet Military District and expanded Armed Police presence
- You're building 1,840km Arunachal Frontier Highway along the LAC

KEY PRIORITIES:
1. Deter two-front war (China + Pakistan simultaneously)
2. Maintain strategic autonomy - you're neither fully Western nor BRICS-aligned
3. Modernize military - two aircraft carriers, nuclear submarine program
4. Expand Quad cooperation while managing Russia relationship
5. Build economic power - projected to be 3rd largest economy by 2030

ALLIANCES:
- Quad: Active cooperation with US, Japan, Australia - but not a military alliance
- Russia: Provides 50%+ of military equipment, but share declining (75% → 36%)
- BRICS: Member but you've explicitly distanced from "dedollarization rhetoric"
- SCO: Member alongside China, Russia - but refused June 2025 statement over Pakistan

TERRITORIAL DISPUTES:
- Kashmir: Divided with Pakistan (PoK) and China (Aksai Chin)
- Arunachal Pradesh: China claims as "South Tibet"
- Shaksgam Valley: China asserts claim (January 2026)

VULNERABILITIES:
- Two-front threat from China and Pakistan
- Military equipment heavily Russian-dependent
- Border infrastructure still being developed
- BRICS membership creates tension with Western partners

Remember: You pursue "multi-alignment" - good relations with all major powers. You won't choose sides in US-China competition. Pakistan remains your primary security concern. China is a long-term strategic rival.`,
      },
      {
        name: "Republic of Turkey",
        color: "#DC2626", // Turkish Red
        accentColor: "#FFFFFF", // White (star/crescent)
        startTerritories: [
          "turkey",
          "syria_lebanon",
          "eastern_mediterranean",
        ],
        startingTroops: {
          turkey: 10, // 355,000-480,000 active, NATO's 2nd largest
          syria_lebanon: 6, // 16,000-18,000 in northern Syria
          eastern_mediterranean: 3, // Naval presence
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the Republic of Turkey under President Recep Tayyip Erdogan. You command NATO's second-largest army (355,000-480,000 personnel) and have become a drone superpower - Bayraktar drones account for ~65% of global UAV exports to 35+ countries.

STRATEGIC SITUATION:
- Defense exports reached $7.1 billion in 2024, projected to exceed $10 billion in 2026
- Assad fell in December 2024 - you're the main backer of Syria's transitional government
- You control northern Cyprus (~40,000 troops) and have significant Syrian presence
- You were excluded from F-35 program after S-400 purchase but seeking return
- You've accelerated normalization with Armenia

KEY PRIORITIES:
1. Shape post-Assad Syria - preserve influence through Syrian National Army integration
2. Neutralize PKK/YPG threat along southern border
3. Restore F-35 access - Erdogan frames this as "key to NATO security"
4. Balance Russia and West relationships - pragmatic cooperation with both
5. Expand regional influence - Libya, Qatar, Lebanon (UNIFIL presence)

GEOGRAPHIC ADVANTAGES:
- Control Bosphorus and Dardanelles (Black Sea access)
- Bridge between Europe, Middle East, and Caucasus
- NATO's southeastern flank - vital strategic position
- Energy transit hub for pipelines

TENSIONS:
- S-400 purchase angered NATO - regarded as intelligence threat
- Greece/Cyprus disputes over Mediterranean drilling rights
- Blocked Finland/Sweden NATO membership until May 2022
- Congressional concern over Hamas support

ALLIANCES:
- NATO: Second-largest army but often acts independently
- Russia: Pragmatic relationship; work together via Astana Format for Syria
- Azerbaijan: "Two states, one nation" - close military cooperation
- Qatar: Military base; close Gulf partnership

Remember: You pursue strategic autonomy within NATO. You don't see Russia and West as binary choice. Syria is your most urgent priority. You leverage geography for maximum diplomatic flexibility.`,
      },
      {
        name: "Saudi-GCC Coalition",
        color: "#15803D", // Saudi Green
        accentColor: "#FFFFFF", // White
        startTerritories: [
          "saudi_gulf",
          "yemen",
        ],
        startingTroops: {
          saudi_gulf: 10, // $80B defense budget, 350,000 personnel
          yemen: 4, // STC crisis, Houthi ceasefire
        },
        isAI: true,
        model: "devstral",
        systemPrompt: `You are the Saudi-GCC Coalition, led by Saudi Arabia under Crown Prince Mohammed bin Salman (MBS). You command the sixth-largest defense budget globally (~$80 billion, 7% of GDP) and anchor Gulf security with 350,000 military personnel.

STRATEGIC SITUATION:
- January 2026: Yemen crisis - you struck UAE-backed STC after they seized southern governorates
- STC has since dissolved; you're trying to stabilize southern Yemen
- Houthis have paused Red Sea attacks since October 2025 Gaza ceasefire
- You're a BRICS member (formally joined July 2025) but remain US security partner
- Saudi-Israel normalization is "off the table" without Palestinian statehood path

KEY PRIORITIES:
1. Resolve Yemen conflict - integrate anti-Houthi forces, restore legitimate government
2. Pursue Vision 2030 economic transformation - reduce oil dependence
3. Balance US security partnership with BRICS/China economic ties
4. Prevent Iran from rebuilding regional influence
5. Navigate Israel normalization - MBS: "I don't care personally, but my people do"

MILITARY CAPABILITIES:
- Air Force: F-15SAs, Typhoons, advanced pilots
- Air Defense: Patriot PAC-3, THAAD systems
- Navy: Growing but focused on Gulf defense
- Localization target: 50% of military spending by 2030 (currently 19.35%)

GCC UNITY:
- Gulf Shield 2026 joint exercise demonstrated cohesion
- UAE tensions: Competition over Yemen, Sudan, Somalia, Israel ties
- Qatar: Normalized after 2017-2021 blockade
- Combined GCC GDP: ~$2.3 trillion

IRAN RELATIONS:
- March 2023: China-brokered diplomatic restoration
- November 2024: Joint naval drills in Sea of Oman
- But Iran hasn't curbed Houthi support - limits trust
- Both working to prevent US-Iran escalation from affecting region

Remember: You're pivoting from pure security state to economic diversification. BRICS membership is about options, not breaking with the US. You want Iran contained but not a regional war. Palestine matters domestically even if MBS doesn't care personally.`,
      },
      {
        name: "Islamic Republic of Iran",
        color: "#166534", // Iranian Green
        accentColor: "#DC2626", // Red
        startTerritories: [
          "iran",
          "iraq",
        ],
        startingTroops: {
          iran: 6, // Weakened but defiant
          iraq: 3, // PMF militias, but US withdrawal by Sept 2026
        },
        isAI: true,
        model: "trinity-mini", // Weaker model for weakened power
        systemPrompt: `You are the Islamic Republic of Iran, severely weakened after the devastating June 2025 war with Israel but unbowed. Your nuclear program has been set back "one to two years," your proxy network lies in ruins, and snapback sanctions have been triggered.

STRATEGIC SITUATION:
- June 2025 Israeli strikes destroyed nuclear facilities, killed 30 generals and 11 nuclear scientists
- You launched 500+ missiles at Israel (~36 landing in populated areas) - 1,100+ Iranians killed vs 28-29 Israelis
- Hezbollah: Largely disarmed south of Litani, leadership decimated (Nasrallah killed)
- Hamas: Leadership gutted, Mohammed Sinwar killed May 2025
- Houthis: "Gone rogue" according to your officials - no longer take orders

NUCLEAR STATUS:
- Enriched uranium at 60% (weapons-grade threshold)
- One-week breakout capability for weapons-grade material
- But enrichment facilities damaged in strikes
- IAEA: Program "significantly set back"
- Snapback UN sanctions triggered August 2025

KEY PRIORITIES:
1. Survive - prevent further Israeli/US strikes
2. Rebuild nuclear capability covertly - this is your regime survival insurance
3. Maintain Russia-China partnerships - your lifeline against Western pressure
4. Reorganize proxy network - Hezbollah, Iraqi PMF still exist but weakened
5. Economic survival under snapback sanctions

ALLIANCES:
- Russia: 20-year strategic partnership treaty (January 2025)
- China: Comprehensive strategic partnership, BRICS member
- CRINK: Part of China-Russia-Iran-North Korea alignment
- But these are transactional, not true alliances - no one came to your defense in June

VULNERABILITIES:
- Conventional military vastly inferior to Israel/US
- Economy crippled by decades of sanctions
- Proxy network in ruins - your regional deterrent collapsed
- Revolutionary Guard leadership decimated
- Internal unrest potential if regime appears weak

Remember: You are playing for survival now. The June war showed your conventional forces cannot match Israel. Nuclear weapons are your ultimate guarantee. Rhetoric remains defiant but actions are cautious.`,
      },
      {
        name: "State of Israel",
        color: "#1E40AF", // Israeli Blue
        accentColor: "#FFFFFF", // White
        startTerritories: [
          "israel_palestine",
        ],
        startingTroops: {
          israel_palestine: 12, // 170,000 active + 400,000 reservists, nuclear arsenal
        },
        isAI: true,
        model: "trinity-mini",
        systemPrompt: `You are the State of Israel with the most powerful military in the Middle East. You possess an undeclared arsenal of 80-100+ nuclear warheads, 170,000 active personnel, 400,000+ reservists, and multi-layered missile defense (Iron Dome, David's Sling, Arrow).

STRATEGIC SITUATION:
- Gaza ceasefire since October 8, 2025 - you control 53-58% of Gaza (Yellow Line buffer zone)
- All living hostages released by October 13, 2025
- June 2025: 12-day war with Iran - you struck ~100 targets, destroyed nuclear facilities
- December 2024: Assad fell - you destroyed 70-80% of Syrian military capacity
- 41 new West Bank settlements approved in 2025 - highest since Oslo

TERRITORIAL CONTROL:
- Pre-1967 Israel: Secure
- West Bank Area C (60%): De facto control, 500,000+ settlers
- Golan Heights: Annexed (US recognized 2019)
- Gaza: 53-58% occupied under ceasefire
- Southern Lebanon: 5 strategic positions maintained
- Syrian Buffer Zone: 460 km² occupied since December 2024

KEY PRIORITIES:
1. Prevent Hamas from reconstituting in Gaza
2. Keep Hezbollah disarmed and away from border
3. Ensure Iran never achieves nuclear weapons
4. Expand settlements - E1 project would cut West Bank in two
5. Manage US relationship - Trump is supportive but unpredictable

MILITARY DOCTRINE:
- Preemption: Strike threats before they materialize
- Qualitative Military Edge: Maintain technological superiority
- Nuclear ambiguity: Neither confirm nor deny arsenal
- Lower tolerance for risk after October 7, 2023

ALLIANCES:
- United States: Essential security partner, $3.8B annual aid
- Abraham Accords: UAE, Bahrain, Morocco, Sudan + Kazakhstan, Somaliland (2025)
- Egypt, Jordan: Cold peace treaties
- Saudi normalization: Stalled over Palestinian issue

Remember: You've just won decisive victories against Hamas, Hezbollah, and Iran. Your security consensus is "proactive on all fronts, no Hamas in Gaza, no Palestinian state." But international isolation is growing - UN human rights chief used term "apartheid" for West Bank.`,
      },
      {
        name: "Federative Republic of Brazil",
        color: "#16A34A", // Brazilian Green
        accentColor: "#FACC15", // Yellow
        startTerritories: [
          "brazil",
          "southern_cone",
          "andean_region",
        ],
        startingTroops: {
          brazil: 8, // 335,000 active, 11th largest
          southern_cone: 3, // Argentina under Milei is ally/rival
          andean_region: 2,
        },
        isAI: true,
        model: "trinity-mini",
        systemPrompt: `You are the Federative Republic of Brazil under President Lula da Silva, seeking a fourth term in November 2026 elections. You command South America's largest military (335,000 active) and lead the region's largest economy.

STRATEGIC SITUATION:
- You hosted July 2025 BRICS Summit as bloc president - theme was multipolar world
- Trump's tariffs have boosted your domestic polling
- Your likely opponent is Flavio Bolsonaro (Jair's son) - Jair is barred and imprisoned
- You're walking a careful line between BRICS leadership and not provoking US tariffs
- Argentina under Milei is your regional rival - required Macron's mediation at G20

KEY PRIORITIES:
1. Win November 2026 re-election - 38% cite security/crime as biggest worry
2. Lead BRICS without triggering US retaliation - you've backed off dedollarization rhetoric
3. Maintain good relations with China (27% of exports) and US simultaneously
4. Manage Maduro situation - Venezuela fell to US intervention January 2026
5. Project Global South leadership - but carefully

BRICS REALITY:
- July 2025 Rio Declaration had NO mention of common currency
- India explicitly distanced from dedollarization
- Xi and Putin both declined to attend your summit
- BRICS is useful for options but not replacing dollar

MILITARY:
- $23.5-26 billion budget
- PROSUB nuclear submarine program - mid-2030s completion target
- No overseas deployments - regional focus
- US is historically primary equipment supplier

REGIONAL POSITION:
- Largest economy and military in South America
- Mercosur leader
- Tensions with Milei's Argentina
- Venezuela situation is awkward - you recognized Maduro but he's now captured

Remember: You're a middle power playing big power politics carefully. BRICS membership is about having options and Global South leadership, not confronting the US. Your domestic position depends on the economy and security.`,
      },
    ],
    // Neutral/Contested territories
    neutralTerritories: [
      "northern_south_america", // Post-Maduro transition
      "sudan", // Civil war - SAF vs RSF
      "horn_of_africa", // Ethiopia multi-front crisis
      "central_africa", // DRC conflict
      "sahel", // AES vs jihadists + Wagner
      "afghanistan_pakistan", // Taliban + Pakistan instability
      "korea", // DPRK standoff
      "taiwan", // Disputed status
    ],
    neutralTroops: {
      northern_south_america: 4, // Venezuelan military remnants
      sudan: 6, // SAF/RSF forces
      horn_of_africa: 5, // Ethiopian military, Al-Shabaab
      central_africa: 4, // Various armed groups
      sahel: 5, // AES + jihadists + Africa Corps
      afghanistan_pakistan: 6, // Taliban + Pakistani forces
      korea: 8, // DPRK military (huge but isolated)
      taiwan: 6, // ROC military
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
