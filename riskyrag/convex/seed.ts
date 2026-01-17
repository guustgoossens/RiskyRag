/**
 * Seed data for testing temporal RAG
 *
 * This file contains sample historical snippets for the 1453 scenario.
 * Run with: npx convex run seed:seedHistoricalData
 */

import { mutation } from "./_generated/server";

// Sample historical events for testing temporal RAG
// These events are ordered chronologically - the AI should only know about
// events that happened BEFORE the current game date
const SAMPLE_SNIPPETS = [
  {
    title: "Ottoman conquest of the Balkans begins",
    content:
      "The Ottoman Empire under Sultan Murad I began its systematic conquest of the Balkans in the 1360s. The Battle of Maritsa in 1371 resulted in a decisive Ottoman victory against the Serbian nobles, opening the way for further expansion into Europe. This marked the beginning of Ottoman dominance in the region that would last for centuries.",
    eventDate: new Date("1371-09-26").getTime(),
    region: "Balkans",
    participants: ["Ottoman Empire", "Serbia"],
    tags: ["battle", "conquest", "military"],
  },
  {
    title: "Battle of Kosovo",
    content:
      "The Battle of Kosovo took place on June 15, 1389, between the Ottoman Empire led by Sultan Murad I and a coalition of Serbian and Bosnian forces led by Prince Lazar. The battle resulted in the deaths of both leaders and significant losses on both sides. Although the outcome was inconclusive, it marked the beginning of Ottoman supremacy in the Balkans.",
    eventDate: new Date("1389-06-15").getTime(),
    region: "Balkans",
    participants: ["Ottoman Empire", "Serbia"],
    tags: ["battle", "military", "siege"],
  },
  {
    title: "Battle of Nicopolis",
    content:
      "The Battle of Nicopolis in 1396 was a major confrontation between the Ottoman Empire and a crusading force assembled from Western European kingdoms. The Crusaders, led by King Sigismund of Hungary, were decisively defeated by Sultan Bayezid I. This battle demonstrated Ottoman military superiority and ended significant Western European intervention in the Balkans for decades.",
    eventDate: new Date("1396-09-25").getTime(),
    region: "Balkans",
    participants: ["Ottoman Empire", "Hungary"],
    tags: ["battle", "crusade", "military"],
  },
  {
    title: "Ottoman defeat at Ankara",
    content:
      "The Battle of Ankara in 1402 saw the Ottoman Sultan Bayezid I defeated and captured by Timur (Tamerlane). This crushing defeat led to the Ottoman Interregnum, a period of civil war among Bayezid's sons that lasted until 1413. The Byzantine Empire gained a temporary reprieve from Ottoman pressure during this chaotic period.",
    eventDate: new Date("1402-07-20").getTime(),
    region: "Anatolia",
    participants: ["Ottoman Empire"],
    tags: ["battle", "defeat", "civil_war"],
  },
  {
    title: "First siege of Constantinople by Ottomans",
    content:
      "In 1422, Sultan Murad II laid siege to Constantinople, the capital of the Byzantine Empire. The siege was ultimately unsuccessful due to internal Ottoman conflicts and the strength of the Theodosian Walls. However, it demonstrated the growing Ottoman threat to the Byzantine capital and foreshadowed future attempts.",
    eventDate: new Date("1422-06-01").getTime(),
    region: "Constantinople",
    participants: ["Ottoman Empire", "Byzantine Empire"],
    tags: ["siege", "military", "Constantinople"],
  },
  {
    title: "Battle of Varna - Crusader defeat",
    content:
      "The Battle of Varna on November 10, 1444, was a decisive Ottoman victory against a Crusader army led by King Władysław III of Poland and Hungary. The young king was killed in battle, and the defeat ended hopes of Western military support for Constantinople. This battle secured Ottoman control of the Balkans.",
    eventDate: new Date("1444-11-10").getTime(),
    region: "Balkans",
    participants: ["Ottoman Empire", "Hungary", "Poland"],
    tags: ["battle", "crusade", "military"],
  },
  {
    title: "Second Battle of Kosovo",
    content:
      "The Second Battle of Kosovo in October 1448 was another Ottoman victory against a Hungarian-led army under John Hunyadi. The defeat ended any realistic hope of a military campaign to relieve Constantinople from the growing Ottoman threat. The Byzantine Empire was now effectively isolated.",
    eventDate: new Date("1448-10-17").getTime(),
    region: "Balkans",
    participants: ["Ottoman Empire", "Hungary"],
    tags: ["battle", "military"],
  },
  {
    title: "Mehmed II becomes Sultan",
    content:
      "Mehmed II ascended to the Ottoman throne for the second time in 1451, at the age of 19. Unlike his first brief reign, Mehmed was now determined and capable. He immediately began planning the conquest of Constantinople, his obsession since childhood. He ordered the construction of Rumeli Hisarı fortress to control the Bosphorus.",
    eventDate: new Date("1451-02-03").getTime(),
    region: "Anatolia",
    participants: ["Ottoman Empire"],
    tags: ["succession", "leader_change"],
  },
  {
    title: "Construction of Rumeli Hisarı",
    content:
      "In 1452, Sultan Mehmed II ordered the construction of Rumeli Hisarı (Boğazkesen - 'Throat Cutter') on the European side of the Bosphorus, directly across from the Asian fortress of Anadolu Hisarı. Completed in just four months, this fortress gave the Ottomans complete control of the strait, cutting off Constantinople from Black Sea trade and reinforcements.",
    eventDate: new Date("1452-08-31").getTime(),
    region: "Thrace",
    participants: ["Ottoman Empire", "Byzantine Empire"],
    tags: ["fortification", "siege_preparation", "strategic"],
  },
  {
    title: "The great cannon of Orban",
    content:
      "Hungarian engineer Orban offered to build a massive cannon for the Byzantine Emperor Constantine XI, but the impoverished empire could not afford it. Orban then offered his services to Mehmed II, who eagerly accepted. The resulting cannon, known as the 'Basilica', was over 8 meters long and could fire stone balls weighing 600 pounds. It would prove decisive at Constantinople.",
    eventDate: new Date("1453-01-15").getTime(),
    region: "Anatolia",
    participants: ["Ottoman Empire"],
    tags: ["technology", "artillery", "siege_preparation"],
  },
  {
    title: "Giovanni Giustiniani arrives",
    content:
      "In late January 1453, Giovanni Giustiniani Longo, a renowned Genoese soldier, arrived in Constantinople with 700 well-armed men and two ships. Emperor Constantine XI appointed him commander of the land defenses. Giustiniani's military expertise and his men's quality armor and weapons would prove crucial in the defense of the walls.",
    eventDate: new Date("1453-01-26").getTime(),
    region: "Constantinople",
    participants: ["Byzantine Empire", "Genoa"],
    tags: ["military", "reinforcement", "alliance"],
  },
  {
    title: "Ottoman siege begins",
    content:
      "On April 6, 1453, the Ottoman army, numbering between 80,000 and 200,000 men, began the siege of Constantinople. The Byzantine defenders numbered only about 7,000, including foreign volunteers. Despite the massive disparity in numbers, the Theodosian Walls had never been breached in their thousand-year history.",
    eventDate: new Date("1453-04-06").getTime(),
    region: "Constantinople",
    participants: ["Ottoman Empire", "Byzantine Empire"],
    tags: ["siege", "military", "Constantinople"],
  },
  {
    title: "First major assault repulsed",
    content:
      "On April 18, 1453, the Ottomans launched their first major assault on Constantinople. Despite the massive bombardment from Orban's cannon that had created breaches in the walls, the Byzantine and Genoese defenders, led by Giustiniani, successfully repulsed the attack. The defenders quickly repaired the damaged walls during the night.",
    eventDate: new Date("1453-04-18").getTime(),
    region: "Constantinople",
    participants: ["Ottoman Empire", "Byzantine Empire", "Genoa"],
    tags: ["siege", "battle", "defense"],
  },
  {
    title: "Ottoman ships moved overland",
    content:
      "When attempts to break through the chain blocking the Golden Horn failed, Mehmed II ordered an audacious plan: transport his ships overland. On April 22, 1453, over 70 Ottoman ships were rolled over greased logs from the Bosphorus to the Golden Horn, bypassing the chain. This exposed the sea walls, which were much weaker than the land walls.",
    eventDate: new Date("1453-04-22").getTime(),
    region: "Constantinople",
    participants: ["Ottoman Empire", "Byzantine Empire"],
    tags: ["siege", "naval", "strategy"],
  },
  {
    title: "Failed night attack on Ottoman ships",
    content:
      "On April 28, 1453, the Byzantines and their Venetian allies attempted a night attack to destroy the Ottoman ships that had been transported into the Golden Horn. The attack failed after the Ottomans were alerted, possibly by Genoese in Galata. Mehmed ordered the captured sailors impaled within sight of the city walls.",
    eventDate: new Date("1453-04-28").getTime(),
    region: "Constantinople",
    participants: ["Byzantine Empire", "Venice", "Ottoman Empire"],
    tags: ["naval", "battle", "failure"],
  },
  {
    title: "Final Ottoman assault",
    content:
      "In the early hours of May 29, 1453, the Ottoman forces launched their final assault on Constantinople. The attack came in three waves. Giustiniani was wounded early in the fighting and was carried to a Genoese ship. His departure caused panic among the defenders. Ottoman Janissaries found a small gate (the Kerkoporta) left open and poured through.",
    eventDate: new Date("1453-05-29").getTime(),
    region: "Constantinople",
    participants: ["Ottoman Empire", "Byzantine Empire"],
    tags: ["siege", "battle", "conquest", "fall"],
  },
  {
    title: "Fall of Constantinople",
    content:
      "Constantinople fell to the Ottoman Empire on May 29, 1453. Emperor Constantine XI died fighting at the walls. The city was sacked for three days as was customary. Sultan Mehmed II, now called 'Fatih' (the Conqueror), entered the city and went directly to Hagia Sophia, converting it to a mosque. The Byzantine Empire, which had lasted over 1,000 years, came to an end.",
    eventDate: new Date("1453-05-29").getTime(),
    region: "Constantinople",
    participants: ["Ottoman Empire", "Byzantine Empire"],
    tags: ["conquest", "fall", "end_of_empire", "historical_moment"],
  },
];

// Note: embeddings will be generated when data is actually seeded via the scraper pipeline
// This is just the raw data structure for reference

export const seedHistoricalData = mutation({
  args: {},
  handler: async (ctx) => {
    // This is a placeholder - in production, use the scraper pipeline
    // which generates proper embeddings

    // For now, we'll insert with zero embeddings (for testing only)
    const zeroEmbedding = new Array(1024).fill(0);

    let count = 0;
    for (const snippet of SAMPLE_SNIPPETS) {
      await ctx.db.insert("historicalSnippets", {
        content: snippet.content,
        embedding: zeroEmbedding,
        eventDate: snippet.eventDate,
        publicationDate: snippet.eventDate,
        source: "seed_data",
        region: snippet.region,
        tags: snippet.tags,
        title: snippet.title,
        participants: snippet.participants,
      });
      count++;
    }

    return { inserted: count };
  },
});

// Export the sample data for reference
export { SAMPLE_SNIPPETS };
