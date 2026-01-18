/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as agentNotes from "../agentNotes.js";
import type * as agentStreaming from "../agentStreaming.js";
import type * as benchmarks from "../benchmarks.js";
import type * as gameLog from "../gameLog.js";
import type * as games from "../games.js";
import type * as negotiations from "../negotiations.js";
import type * as players from "../players.js";
import type * as rag from "../rag.js";
import type * as scenarios from "../scenarios.js";
import type * as seed from "../seed.js";
import type * as territories from "../territories.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  agentNotes: typeof agentNotes;
  agentStreaming: typeof agentStreaming;
  benchmarks: typeof benchmarks;
  gameLog: typeof gameLog;
  games: typeof games;
  negotiations: typeof negotiations;
  players: typeof players;
  rag: typeof rag;
  scenarios: typeof scenarios;
  seed: typeof seed;
  territories: typeof territories;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
