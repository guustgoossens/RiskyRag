import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900",
        // Variants
        variant === "primary" &&
          "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-lg shadow-amber-600/25",
        variant === "secondary" &&
          "bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500 border border-slate-600",
        variant === "ghost" &&
          "bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white",
        variant === "danger" &&
          "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        // Sizes
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-base",
        size === "lg" && "px-6 py-3 text-lg",
        // Disabled
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
