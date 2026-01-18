/// <reference types="vite/client" />

// Module glob for convex-test
// This imports all Convex function files for the test runner
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
