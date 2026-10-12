import { Text, type TextProps } from "react-native";

import { cn } from "../utils/cn";
import { ROUNDED_FONT } from "../utils/theme";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "statement"
  | "body"
  | "caption"
  | "label"
  | "overline";
type Tone = "default" | "muted" | "subtle" | "primary" | "warning" | "success" | "inverse";

const VARIANTS: Record<Variant, string> = {
  display: "text-6xl font-bold tracking-tight",
  // iOS large title.
  title: "text-[34px] leading-[41px] font-bold tracking-tight",
  heading: "text-[17px] leading-[22px] font-semibold",
  // The one-sentence insight on Health-style cards.
  statement: "text-[19px] leading-[25px] font-semibold tracking-tight",
  body: "text-[17px] leading-[23px]",
  caption: "text-[15px] leading-5",
  label: "text-[15px] font-semibold",
  overline: "text-[13px] font-medium uppercase tracking-wide",
};

const TONES: Record<Tone, string> = {
  default: "text-slate-900 dark:text-white",
  muted: "text-slate-500 dark:text-[#AEAEB2]",
  subtle: "text-slate-400 dark:text-[#98989F]",
  primary: "text-brand-600 dark:text-brand-500",
  warning: "text-amber-600 dark:text-[#FF7A1A]",
  success: "text-emerald-600 dark:text-emerald-400",
  inverse: "text-white dark:text-black",
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  /** Rounded numerals for big numbers (SF Pro Rounded on iOS). */
  rounded?: boolean;
  className?: string;
}

export function AppText({
  variant = "body",
  tone = "default",
  rounded = false,
  className,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      className={cn(VARIANTS[variant], TONES[tone], className)}
      style={rounded ? [{ fontFamily: ROUNDED_FONT, fontVariant: ["tabular-nums"] }, style] : style}
      {...props}
    />
  );
}
