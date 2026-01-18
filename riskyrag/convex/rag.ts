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
      sourceUrl: string | null;
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
        sourceUrl: s.doc?.sourceUrl ?? null,
        relevanceScore: s.score,
      }));

    return filteredSnippets;
  },
});

// Enhanced query that tracks blocked events for observability
export const queryHistoryWithBlocked = action({
  args: {
    question: v.string(),
    gameId: v.id("games"),
    topK: v.optional(v.number()),
    region: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    snippets: Array<{
      content: string;
      title: string | null;
      date: string;
      source: string;
      sourceUrl: string | null;
      relevanceScore: number;
    }>;
    blocked: {
      count: number;
      sample: Array<{ title?: string; eventDate: number }>;
    };
  }> => {
    // Get the current game state to determine the knowledge cutoff
    const game = await ctx.runQuery(api.games.get, { id: args.gameId });
    if (!game) {
      throw new Error("Game not found");
    }

    const maxDate = game.currentDate;
    const topK = args.topK ?? 5;

    // Generate embedding for the question
    const embedding = await generateEmbedding(args.question);

    // Vector search - fetch extra to account for filtering
    const searchResults = await ctx.vectorSearch(
      "historicalSnippets",
      "by_embedding",
      {
        vector: embedding,
        limit: topK * 3,
      }
    );

    // Fetch full documents
    const allSnippets = await Promise.all(
      searchResults.map(async (r) => {
        const doc = await ctx.runQuery(api.rag.getSnippet, { id: r._id });
        return {
          doc,
          score: r._score,
        };
      })
    );

    // Separate into allowed and blocked
    const allowed: typeof allSnippets = [];
    const blocked: Array<{ title?: string; eventDate: number }> = [];

    for (const s of allSnippets) {
      if (!s.doc) continue;

      // Check region filter
      if (args.region && s.doc.region !== args.region) continue;

      // CRITICAL: Temporal filter
      if (s.doc.eventDate > maxDate) {
        // This event is in the "future" - blocked
        blocked.push({
          title: s.doc.title ?? undefined,
          eventDate: s.doc.eventDate,
        });
      } else {
        allowed.push(s);
      }
    }

    // Get top K allowed snippets
    const filteredSnippets = allowed.slice(0, topK).map((s) => ({
      content: s.doc?.content ?? "",
      title: s.doc?.title ?? null,
      date: new Date(s.doc?.eventDate ?? 0).toISOString(),
      source: s.doc?.source ?? "unknown",
      sourceUrl: s.doc?.sourceUrl ?? null,
      relevanceScore: s.score,
    }));

    return {
      snippets: filteredSnippets,
      blocked: {
        count: blocked.length,
        // Return sample of blocked events (up to 5)
        sample: blocked.slice(0, 5),
      },
    };
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

// Batch add snippets (for bulk ingestion) - with deduplication
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
        contentHash: v.optional(v.string()), // MD5 hash for dedup
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: { inserted: number; skipped: number; ids: string[] } = {
      inserted: 0,
      skipped: 0,
      ids: [],
    };

    for (const snippet of args.snippets) {
      // Check for existing snippet with same content hash
      if (snippet.contentHash) {
        const existing = await ctx.db
          .query("historicalSnippets")
          .withIndex("by_content_hash", (q) =>
            q.eq("contentHash", snippet.contentHash)
          )
          .first();

        if (existing) {
          results.skipped++;
          results.ids.push(existing._id);
          continue;
        }
      }

      // Insert new snippet
      const id = await ctx.db.insert("historicalSnippets", snippet);
      results.inserted++;
      results.ids.push(id);
    }

    return results;
  },
});

// Upsert a single snippet (insert or skip if exists)
export const upsertSnippet = mutation({
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
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for existing snippet
    const existing = await ctx.db
      .query("historicalSnippets")
      .withIndex("by_content_hash", (q) => q.eq("contentHash", args.contentHash))
      .first();

    if (existing) {
      return { action: "skipped" as const, id: existing._id };
    }

    // Insert new snippet
    const id = await ctx.db.insert("historicalSnippets", args);
    return { action: "inserted" as const, id };
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

// ==================== LLM-SYNTHESIZED CHAT ====================

// Years to look back from game date (±50 years by default)
const DEFAULT_DATE_RANGE_YEARS = 50;

// Synthesize a coherent response from RAG snippets using LLM
export const synthesizeHistoricalResponse = action({
  args: {
    question: v.string(),
    gameId: v.id("games"),
    playerNation: v.string(),
    topK: v.optional(v.number()),
    dateRangeYears: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    response: string;
    citations: Array<{
      url: string | null;
      source: string;
      title: string | null;
    }>;
    blockedCount: number;
  }> => {
    // Get the current game state
    const game = await ctx.runQuery(api.games.get, { id: args.gameId });
    if (!game) {
      throw new Error("Game not found");
    }

    const maxDate = game.currentDate;
    const dateRangeYears = args.dateRangeYears ?? DEFAULT_DATE_RANGE_YEARS;
    // Calculate min date (50 years before game date by default)
    const minDate = maxDate - dateRangeYears * 365 * 24 * 60 * 60 * 1000;
    const topK = args.topK ?? 5;

    // Generate embedding for the question
    const embedding = await generateEmbedding(args.question);

    // Vector search - fetch extra to account for filtering
    const searchResults = await ctx.vectorSearch(
      "historicalSnippets",
      "by_embedding",
      {
        vector: embedding,
        limit: topK * 5, // Fetch more since we're filtering by date range
      }
    );

    // Fetch full documents
    const allSnippets = await Promise.all(
      searchResults.map(async (r) => {
        const doc = await ctx.runQuery(api.rag.getSnippet, { id: r._id });
        return {
          doc,
          score: r._score,
        };
      })
    );

    // Separate into allowed and blocked with DATE RANGE filtering
    const allowed: typeof allSnippets = [];
    let blockedCount = 0;

    for (const s of allSnippets) {
      if (!s.doc) continue;

      // CRITICAL: Must be AFTER minDate (not too old) and BEFORE maxDate (not future)
      if (s.doc.eventDate > maxDate) {
        // Future event - blocked
        blockedCount++;
      } else if (s.doc.eventDate < minDate) {
        // Too old - skip but don't count as blocked (just not relevant)
        continue;
      } else {
        // Within date range
        allowed.push(s);
      }
    }

    // Get top K allowed snippets
    const relevantSnippets = allowed.slice(0, topK);

    // Build citations
    const citations = relevantSnippets.map((s) => ({
      url: s.doc?.sourceUrl ?? null,
      source: s.doc?.source ?? "unknown",
      title: s.doc?.title ?? null,
    }));

    // If no snippets, return "no knowledge" response
    if (relevantSnippets.length === 0) {
      const gameYear = new Date(maxDate).getFullYear();
      return {
        response: `I have no knowledge of this matter as of ${gameYear}. The archives contain no relevant records from this era.`,
        citations: [],
        blockedCount,
      };
    }

    // Build context for LLM
    const snippetContext = relevantSnippets
      .map((s, i) => {
        const date = new Date(s.doc?.eventDate ?? 0).getFullYear();
        return `[Source ${i + 1}, ${date}]: ${s.doc?.content}`;
      })
      .join("\n\n");

    const gameYear = new Date(maxDate).getFullYear();

    // Call LLM to synthesize response
    const synthesizedResponse = await callChatLLM({
      systemPrompt: `You are a historical advisor for the nation of ${args.playerNation} in the year ${gameYear}.
You have access to historical archives and must answer questions based ONLY on the provided sources.
Respond in character as an advisor/scholar from this era. Be concise but informative.
Do NOT mention source numbers or citations in your response - those are handled separately.
If the sources don't contain relevant information for the question, say so honestly.
Keep responses to 2-3 paragraphs maximum.`,
      userMessage: `Question: ${args.question}

Historical Sources:
${snippetContext}

Provide a coherent response based on these sources. Speak as an advisor to the ruler of ${args.playerNation}.`,
    });

    return {
      response: synthesizedResponse,
      citations,
      blockedCount,
    };
  },
});

// Simple LLM call for chat synthesis
async function callChatLLM(args: {
  systemPrompt: string;
  userMessage: string;
}): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    // Fallback: just return a simple concatenation
    console.warn("No OpenAI API key, falling back to simple response");
    return "The archives speak of these matters, though the details require careful study.";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast and cheap for synthesis
        messages: [
          { role: "system", content: args.systemPrompt },
          { role: "user", content: args.userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return "The archives are difficult to interpret at this moment.";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? "No response from the archives.";
  } catch (e) {
    console.error("LLM call failed:", e);
    return "The archives are temporarily unavailable.";
  }
}

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
