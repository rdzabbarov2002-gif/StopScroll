import { Text, type TextProps } from "react-native";

import { cn } from "../utils/cn";

type Variant = "display" | "title" | "heading" | "body" | "caption" | "label" | "overline";
type Tone = "default" | "muted" | "subtle" | "primary" | "warning" | "inverse";

const VARIANTS: Record<Variant, string> = {
  display: "text-6xl font-extrabold tracking-tight",
  title: "text-3xl font-bold tracking-tight",
  heading: "text-lg font-bold",
  body: "text-base leading-6",
  caption: "text-sm leading-5",
  label: "text-sm font-semibold",
  overline: "text-xs font-semibold uppercase tracking-widest",
};

const TONES: Record<Tone, string> = {
  default: "text-slate-900 dark:text-slate-100",
  muted: "text-slate-500 dark:text-slate-400",
  subtle: "text-slate-400 dark:text-slate-500",
  primary: "text-brand-600 dark:text-brand-400",
  warning: "text-amber-600 dark:text-amber-400",
  inverse: "text-white dark:text-ink-950",
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  className?: string;
}

export function AppText({ variant = "body", tone = "default", className, ...props }: AppTextProps) {
  return <Text className={cn(VARIANTS[variant], TONES[tone], className)} {...props} />;
}
