import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    // Include only convex test files
    include: ["convex/**/*.test.ts"],
    // Timeout for tests (useful for action tests)
    testTimeout: 10000,
  },
});
