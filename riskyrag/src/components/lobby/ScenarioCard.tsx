import { cn } from "@/lib/utils";
import type { Scenario } from "@/types";

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
}: ScenarioCardProps) {
  return (
    <button
      onClick={() => onSelect(scenario.id)}
      className={cn(
        "relative w-80 h-96 rounded-2xl overflow-hidden transition-all duration-300",
        "border-2 group cursor-pointer",
        isSelected
          ? "border-amber-500 shadow-xl shadow-amber-500/20 scale-105"
          : "border-slate-700 hover:border-slate-500"
      )}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{
          backgroundImage: `url(${scenario.mapImage})`,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 text-left">
        {/* Year Badge */}
        <div className="inline-block px-3 py-1 mb-3 bg-amber-600/90 rounded-full">
          <span className="text-sm font-bold text-white">{scenario.year}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">{scenario.title}</h3>

        {/* Description */}
        <p className="text-sm text-slate-300 line-clamp-2 mb-3">
          {scenario.description}
        </p>

        {/* Nations Preview */}
        <div className="flex flex-wrap gap-1">
          {scenario.nations.slice(0, 3).map((nation) => (
            <span
              key={nation}
              className="px-2 py-0.5 text-xs bg-slate-800/80 text-slate-300 rounded"
            >
              {nation}
            </span>
          ))}
          {scenario.nations.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-slate-800/80 text-slate-400 rounded">
              +{scenario.nations.length - 3} more
            </span>
          )}
        </div>

        {/* Difficulty */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">Difficulty:</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={cn(
                  "w-2 h-2 rounded-full",
                  level <=
                    (scenario.difficulty === "easy"
                      ? 1
                      : scenario.difficulty === "medium"
                        ? 2
                        : 3)
                    ? "bg-amber-500"
                    : "bg-slate-600"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
