import { View, type ViewProps } from "react-native";

import { cn } from "../utils/cn";

type CardTone = "default" | "primary" | "warning" | "muted";

const TONES: Record<CardTone, string> = {
  default: "bg-card dark:bg-ink-900",
  primary: "bg-brand-50 dark:bg-brand-950",
  warning: "bg-amber-50 dark:bg-amber-950",
  muted: "bg-card dark:bg-ink-900",
};

export interface CardProps extends ViewProps {
  tone?: CardTone;
  className?: string;
}

/** A soft grey rounded panel, like the cards in Apple's Health app. */
export function Card({ tone = "default", className, ...props }: CardProps) {
  return <View className={cn("rounded-card p-[18px]", TONES[tone], className)} {...props} />;
}
