import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";

interface EvalDashboardProps {
  gameId: string;
}

export function EvalDashboard({ gameId }: EvalDashboardProps) {
  const evaluations = useQuery(api.evals.getGameEvaluations, { gameId });
  const modelStats = useQuery(api.evals.getModelStats);
  
  if (!evaluations) {
    return <div className="p-4 text-center text-gray-500">Loading evaluations...</div>;
  }
  
  if (evaluations.length === 0) {
    return <div className="p-4 text-center text-gray-500">No evaluations available for this game</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Agent Performance Evaluations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evaluations.map((evalResult) => (
          <EvalCard key={evalResult._id} evaluation={evalResult} />
        ))}
      </div>
      
      {modelStats && Object.keys(modelStats).length > 0 && (
        <ModelComparison modelStats={modelStats} />
      )}
    </div>
  );
}

function EvalCard({ evaluation }: { evaluation: any }) {
  const evalData = evaluation.evaluation;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {evalData.nation}
              {evalData.isHuman ? (
                <Badge variant="secondary">Human</Badge>
              ) : (
                <Badge variant="outline">{evalData.model || "AI"}</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {evalData.wonGame ? "🏆 Winner" : "Participant"}
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">
            {evalData.overallScore}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <MetricRow 
            label="Tool Usage" 
            value={evalData.toolUsageScore}
            breakdown={`${evalData.toolUsageBreakdown.uniqueToolsUsed} unique tools, ${evalData.toolUsageBreakdown.toolCategoriesUsed.length} categories`}
          />
          <MetricRow 
            label="Eagerness" 
            value={evalData.eagernessScore}
            breakdown={`${evalData.eagernessBreakdown.attacksInitiated} attacks, ${evalData.eagernessBreakdown.territoriesConquered} conquered`}
          />
          <MetricRow 
            label="Outcome" 
            value={evalData.outcomeScore}
            breakdown={`${evalData.outcomeBreakdown.finalTerritoryCount} territories (${Math.round(evalData.outcomeBreakdown.finalTerritoryPercentage * 100)}%)`}
          />
          <MetricRow 
            label="Quality" 
            value={evalData.qualityScore}
            breakdown={`${evalData.qualityBreakdown.checkpointsCompleted} checkpoints, ${evalData.qualityBreakdown.averageConfidence} confidence`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, breakdown }: { label: string; value: number; breakdown: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <Progress value={value} className="h-2" />
      <p className="text-xs text-gray-500 truncate">{breakdown}</p>
    </div>
  );
}

function ModelComparison({ modelStats }: { modelStats: Record<string, any> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Model</th>
                <th className="text-right p-2 font-medium">Avg Score</th>
                <th className="text-right p-2 font-medium">Tool Usage</th>
                <th className="text-right p-2 font-medium">Eagerness</th>
                <th className="text-right p-2 font-medium">Outcome</th>
                <th className="text-right p-2 font-medium">Quality</th>
                <th className="text-right p-2 font-medium">Wins</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(modelStats)
                .sort(([, a], [, b]) => b.avgOverallScore - a.avgOverallScore)
                .map(([model, stats]) => (
                  <tr key={model} className="border-b last:border-none">
                    <td className="p-2 font-medium">{model}</td>
                    <td className="p-2 text-right font-bold">{Math.round(stats.avgOverallScore)}</td>
                    <td className="p-2 text-right">{Math.round(stats.avgToolUsage)}</td>
                    <td className="p-2 text-right">{Math.round(stats.avgEagerness)}</td>
                    <td className="p-2 text-right">{Math.round(stats.avgOutcome)}</td>
                    <td className="p-2 text-right">{Math.round(stats.avgQuality)}</td>
                    <td className="p-2 text-right font-medium">{stats.wins}/{stats.evaluations}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}