import { cn } from "@/lib/utils";

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isAttackPath?: boolean;
  isActive?: boolean;
}

export function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  isAttackPath,
  isActive,
}: ConnectionLineProps) {
  // Default styling
  let strokeColor = "#334155"; // Slate
  let strokeWidth = 1.5;
  let strokeDasharray = "none";
  let className = "";

  if (isAttackPath) {
    strokeColor = "#EF4444"; // Red
    strokeWidth = 2;
    strokeDasharray = "6 3";
    className = "animate-dash";
  } else if (isActive) {
    strokeColor = "#D4AF37"; // Gold
    strokeWidth = 2;
  }

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      className={cn("transition-all duration-200", className)}
    />
  );
}
