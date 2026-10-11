import { View, type ViewProps } from "react-native";

import { cn } from "../utils/cn";

type CardTone = "default" | "primary" | "warning" | "muted";

const TONES: Record<CardTone, string> = {
  default: "bg-white border-slate-200/70 dark:bg-ink-900 dark:border-ink-800",
  primary: "bg-brand-50 border-brand-100 dark:bg-brand-950/40 dark:border-brand-900/60",
  warning: "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50",
  muted: "bg-slate-100 border-slate-100 dark:bg-ink-850 dark:border-ink-800",
};

export interface CardProps extends ViewProps {
  tone?: CardTone;
  className?: string;
}

export function Card({ tone = "default", className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-3xl border p-5 shadow-sm shadow-slate-200 dark:shadow-none",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
