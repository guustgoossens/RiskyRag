import { createFileRoute } from "@tanstack/react-router";
import RiskyRagDebugMonitor from "@/components/gemini/7";

export const Route = createFileRoute("/dev/monitor")({
  component: RiskyRagDebugMonitor,
});
