import type { TriggerTone } from "../utils/catalog";

/** Tailwind classes and icon colors per trigger tone (light / dark). */
export const TRIGGER_TONES: Record<
  TriggerTone,
  { card: string; iconBg: string; icon: { light: string; dark: string } }
> = {
  amber: {
    card: "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    icon: { light: "#D97706", dark: "#FBBF24" },
  },
  sky: {
    card: "bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/40",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    icon: { light: "#0284C7", dark: "#38BDF8" },
  },
  rose: {
    card: "bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    icon: { light: "#E11D48", dark: "#FB7185" },
  },
  violet: {
    card: "bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    icon: { light: "#7C3AED", dark: "#A78BFA" },
  },
  teal: {
    card: "bg-teal-50 border-teal-100 dark:bg-teal-950/30 dark:border-teal-900/40",
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    icon: { light: "#0D9488", dark: "#2DD4BF" },
  },
  slate: {
    card: "bg-slate-100 border-slate-200 dark:bg-ink-850 dark:border-ink-800",
    iconBg: "bg-slate-200 dark:bg-ink-700",
    icon: { light: "#475569", dark: "#94A3B8" },
  },
};
