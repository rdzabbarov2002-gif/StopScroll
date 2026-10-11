import { useColorScheme } from "nativewind";

/**
 * Colors for places that can't take a className (icons, navigation, SVG, placeholders).
 * Values mirror the Tailwind classes used across the components.
 */
export const palette = {
  light: {
    background: "#F5F7FA", // canvas
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F9", // slate-100
    border: "#E2E8F0", // slate-200
    text: "#0F172A", // slate-900
    textMuted: "#64748B", // slate-500
    textSubtle: "#94A3B8", // slate-400
    primary: "#6366F1", // brand-500 (rings, bars, icons)
    primaryStrong: "#4F46E5", // brand-600 (filled buttons, active tab)
    primarySoft: "#E0E7FF", // brand-100
    success: "#10B981", // emerald-500 (saved time)
    warning: "#F59E0B", // amber-500
    warningStrong: "#D97706", // amber-600
    danger: "#F43F5E", // rose-500
    ringTrack: "#E2E8F0",
    onPrimary: "#FFFFFF",
    onWarning: "#0B1120",
  },
  dark: {
    background: "#0B1120", // ink-950
    surface: "#111827", // ink-900
    surfaceMuted: "#1B2438", // ink-800
    border: "#1B2438", // ink-800
    text: "#F1F5F9", // slate-100
    textMuted: "#94A3B8", // slate-400
    textSubtle: "#64748B", // slate-500
    primary: "#818CF8", // brand-400
    primaryStrong: "#6366F1", // brand-500
    primarySoft: "#312E81", // brand-900
    success: "#34D399", // emerald-400
    warning: "#FBBF24", // amber-400
    warningStrong: "#F59E0B", // amber-500
    danger: "#FB7185", // rose-400
    ringTrack: "#1B2438",
    onPrimary: "#FFFFFF",
    onWarning: "#0B1120",
  },
} as const;

/**
 * Chart colors. The two series pair (resisted ↔ slip) was checked with a CVD validator
 * against the card surfaces of both themes; red/green failed, indigo/orange passes.
 */
export const chartPalette = {
  light: {
    series: "#5B5BD6", // main series, emphasized mark
    seriesMid: "#9496E6", // middle step of the same ramp (heatmap "within limit")
    seriesMuted: "#C9CAF3", // the same series, de-emphasized
    slip: "#EB6834",
    grid: "#E2E8F0",
    axis: "#94A3B8",
    empty: "#EEF1F5",
    limit: "#D97706",
  },
  dark: {
    series: "#7C7FF0",
    seriesMid: "#4E50A8",
    seriesMuted: "#34366E",
    slip: "#D95926",
    grid: "#1B2438",
    axis: "#64748B",
    empty: "#1B2438",
    limit: "#F59E0B",
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)["light"]]: string };
export type ChartColors = { [K in keyof (typeof chartPalette)["light"]]: string };

export function useThemeColors(): { isDark: boolean; colors: ThemeColors; chart: ChartColors } {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return {
    isDark,
    colors: isDark ? palette.dark : palette.light,
    chart: isDark ? chartPalette.dark : chartPalette.light,
  };
}
