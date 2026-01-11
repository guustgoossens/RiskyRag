import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Terminal,
  Brain,
  Database,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

export const Route = createFileRoute("/dev/monitor")({
  component: MonitorPage,
});

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "success" | "error";
  timestamp: number;
}

interface RAGQuery {
  id: string;
  query: string;
  maxDate: number;
  docsRetrieved: number;
  docsFiltered: number;
  timestamp: number;
}

function MonitorPage() {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [ragQueries, setRagQueries] = useState<RAGQuery[]>([]);

  // Simulate incoming tool calls for demo
  useEffect(() => {
    const demoToolCalls: ToolCall[] = [
      {
        id: "1",
        name: "get_game_state",
        args: {},
        result: '{"turn": 5, "phase": "attack"}',
        status: "success",
        timestamp: Date.now() - 5000,
      },
      {
        id: "2",
        name: "query_history",
        args: { question: "What are the weaknesses of Constantinople's walls?" },
        result: "The Theodosian walls have stood for a thousand years...",
        status: "success",
        timestamp: Date.now() - 3000,
      },
      {
        id: "3",
        name: "attack_territory",
        args: { from: "anatolia", to: "constantinople", troops: 8 },
        status: "pending",
        timestamp: Date.now(),
      },
    ];

    const demoRagQueries: RAGQuery[] = [
      {
        id: "1",
        query: "Ottoman military tactics",
        maxDate: new Date("1453-05-01").getTime(),
        docsRetrieved: 15,
        docsFiltered: 3,
        timestamp: Date.now() - 4000,
      },
      {
        id: "2",
        query: "Constantinople defenses",
        maxDate: new Date("1453-05-01").getTime(),
        docsRetrieved: 22,
        docsFiltered: 8,
        timestamp: Date.now() - 2000,
      },
    ];

    setToolCalls(demoToolCalls);
    setRagQueries(demoRagQueries);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Terminal className="w-8 h-8 text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">AI Agent Monitor</h1>
          <p className="text-sm text-slate-400">
            Real-time visualization of LLM agent behavior
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-green-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Calls Log */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Agent Tool Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {toolCalls.map((call) => (
                <div
                  key={call.id}
                  className={cn(
                    "p-3 rounded-lg border font-mono text-sm",
                    call.status === "pending" &&
                      "bg-amber-500/10 border-amber-500/30",
                    call.status === "success" &&
                      "bg-green-500/10 border-green-500/30",
                    call.status === "error" &&
                      "bg-red-500/10 border-red-500/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-amber-400">{call.name}</span>
                    <div className="flex items-center gap-2">
                      {call.status === "pending" && (
                        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                      )}
                      {call.status === "success" && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {call.status === "error" && (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-xs text-slate-500">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs">
                    args: {JSON.stringify(call.args)}
                  </div>
                  {call.result && (
                    <div className="text-green-400 text-xs mt-1 truncate">
                      → {call.result}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RAG Performance */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Temporal RAG Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {ragQueries.reduce((sum, q) => sum + q.docsRetrieved, 0)}
                  </div>
                  <div className="text-xs text-slate-400">Docs Retrieved</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {ragQueries.reduce((sum, q) => sum + q.docsFiltered, 0)}
                  </div>
                  <div className="text-xs text-slate-400">Future Blocked</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">100%</div>
                  <div className="text-xs text-slate-400">Filter Accuracy</div>
                </div>
              </div>

              {/* Query Log */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-400">
                  Recent Queries
                </div>
                {ragQueries.map((query) => (
                  <div
                    key={query.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="text-sm text-white mb-1">
                      "{query.query}"
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <Badge variant="info" size="sm">
                        Cutoff: {new Date(query.maxDate).getFullYear()}
                      </Badge>
                      <span className="text-slate-400">
                        {query.docsRetrieved} retrieved
                      </span>
                      <span className="text-red-400">
                        {query.docsFiltered} filtered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Probability */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Win Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { nation: "Ottoman Empire", model: "GPT-4", probability: 65, color: "#dc2626" },
                { nation: "Byzantine Empire", model: "Human", probability: 25, color: "#7c3aed" },
                { nation: "Venice", model: "Claude", probability: 10, color: "#0891b2" },
              ].map((player) => (
                <div key={player.nation}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-sm text-white">{player.nation}</span>
                      <Badge size="sm" variant="default">
                        {player.model}
                      </Badge>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {player.probability}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${player.probability}%`,
                        backgroundColor: player.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Comparison */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Model Benchmark</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2">Model</th>
                    <th className="pb-2">Win Rate</th>
                    <th className="pb-2">Avg Turns</th>
                    <th className="pb-2">Tool Usage</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-2">GPT-4</td>
                    <td className="py-2 text-green-400">72%</td>
                    <td className="py-2">28</td>
                    <td className="py-2">High</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2">Claude Sonnet</td>
                    <td className="py-2 text-amber-400">58%</td>
                    <td className="py-2">32</td>
                    <td className="py-2">Medium</td>
                  </tr>
                  <tr>
                    <td className="py-2">Llama 3.2 7B</td>
                    <td className="py-2 text-red-400">35%</td>
                    <td className="py-2">41</td>
                    <td className="py-2">Low</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
