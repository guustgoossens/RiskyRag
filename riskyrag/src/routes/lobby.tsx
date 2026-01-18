import { createFileRoute } from "@tanstack/react-router";
import Lobby from "@/components/gemini/2";

export const Route = createFileRoute("/lobby")({
  component: Lobby,
});
