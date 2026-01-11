import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        // Variants
        variant === "default" && "bg-slate-700 text-slate-300",
        variant === "success" && "bg-green-900/50 text-green-400 border border-green-700",
        variant === "warning" && "bg-amber-900/50 text-amber-400 border border-amber-700",
        variant === "danger" && "bg-red-900/50 text-red-400 border border-red-700",
        variant === "info" && "bg-blue-900/50 text-blue-400 border border-blue-700",
        // Sizes
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
