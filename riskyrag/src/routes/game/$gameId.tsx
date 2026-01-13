import { createFileRoute } from "@tanstack/react-router";
import RiskyRagApp from "@/components/gemini/3";

export const Route = createFileRoute("/game/$gameId")({
  component: RiskyRagApp,
});
