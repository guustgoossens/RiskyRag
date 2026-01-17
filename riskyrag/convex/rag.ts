import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// CRITICAL: This is the core temporal RAG implementation
// AI agents can ONLY access historical knowledge up to the game's current date

// Query historical snippets with temporal filtering
export const queryHistory = action({
  args: {
    question: v.string(),
    gameId: v.id("games"),
    topK: v.optional(v.number()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<
    Array<{
      content: string;
      title: string | null;
      date: string;
      source: string;
      relevanceScore: number;
    }>
  > => {
    // Get the current game state to determine the knowledge cutoff
    const game = await ctx.runQuery(api.games.get, { id: args.gameId });
    if (!game) {
      throw new Error("Game not found");
    }

    const maxDate = game.currentDate;
    const topK = args.topK ?? 5;

    // Generate embedding for the question
    const embedding = await generateEmbedding(args.question);

    // CRITICAL: Vector search with temporal filter
    // This ensures the AI cannot "know the future"
    // Note: We fetch more results and filter post-search for temporal constraint
    const searchResults = await ctx.vectorSearch("historicalSnippets", "by_embedding", {
      vector: embedding,
      limit: topK * 3, // Fetch extra to account for filtering
    });

    // Fetch full documents and apply temporal filter
    const allSnippets = await Promise.all(
      searchResults.map(async (r) => {
        const doc = await ctx.runQuery(api.rag.getSnippet, { id: r._id });
        return {
          doc,
          score: r._score,
        };
      })
    );

    // CRITICAL: Filter by date - AI cannot know future events
    const filteredSnippets = allSnippets
      .filter((s) => {
        if (!s.doc) return false;
        // Must be before or equal to current game date
        if (s.doc.eventDate > maxDate) return false;
        // Optional region filter
        if (args.region && s.doc.region !== args.region) return false;
        return true;
      })
      .slice(0, topK)
      .map((s) => ({
        content: s.doc?.content ?? "",
        title: s.doc?.title ?? null,
        date: new Date(s.doc?.eventDate ?? 0).toISOString(),
        source: s.doc?.source ?? "unknown",
        relevanceScore: s.score,
      }));

    return filteredSnippets;
  },
});

// Get a single snippet by ID
export const getSnippet = query({
  args: { id: v.id("historicalSnippets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Add a historical snippet (for ingestion)
export const addSnippet = mutation({
  args: {
    content: v.string(),
    embedding: v.array(v.float64()),
    eventDate: v.number(),
    publicationDate: v.number(),
    source: v.string(),
    sourceUrl: v.optional(v.string()),
    region: v.string(),
    tags: v.array(v.string()),
    title: v.optional(v.string()),
    participants: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("historicalSnippets", args);
  },
});

// Batch add snippets (for bulk ingestion)
export const batchAddSnippets = mutation({
  args: {
    snippets: v.array(
      v.object({
        content: v.string(),
        embedding: v.array(v.float64()),
        eventDate: v.number(),
        publicationDate: v.number(),
        source: v.string(),
        sourceUrl: v.optional(v.string()),
        region: v.string(),
        tags: v.array(v.string()),
        title: v.optional(v.string()),
        participants: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const snippet of args.snippets) {
      const id = await ctx.db.insert("historicalSnippets", snippet);
      ids.push(id);
    }
    return ids;
  },
});

// Count snippets (for diagnostics)
export const count = query({
  args: {},
  handler: async (ctx) => {
    const snippets = await ctx.db.query("historicalSnippets").collect();
    return snippets.length;
  },
});

// List snippets by date range (for debugging)
export const listByDateRange = query({
  args: {
    minDate: v.number(),
    maxDate: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("historicalSnippets")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("eventDate"), args.minDate),
          q.lte(q.field("eventDate"), args.maxDate)
        )
      )
      .take(limit);
  },
});

// Helper function to generate embeddings
// In production, this would call Voyage AI or OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  // Try Voyage AI first, fall back to OpenAI
  const voyageKey = process.env.VOYAGE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (voyageKey) {
    try {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${voyageKey}`,
        },
        body: JSON.stringify({
          model: "voyage-2",
          input: text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      }
    } catch (e) {
      console.error("Voyage API error:", e);
    }
  }

  if (openaiKey) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text,
            dimensions: 1024, // Match Voyage dimensions
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      }
    } catch (e) {
      console.error("OpenAI API error:", e);
    }
  }

  // Fallback: Return a zero vector (for testing only)
  console.warn("No embedding API available, returning zero vector");
  return new Array(1024).fill(0);
}
