import { useColorScheme } from "nativewind";
import { Platform } from "react-native";

/**
 * Colors for places that can't take a className (icons, navigation, SVG, placeholders).
 * Values mirror the Tailwind classes used across the components: an Apple-style system
 * with a white (or black) page, soft grey cards and the iOS system colors.
 */
export const palette = {
  light: {
    background: "#FFFFFF", // canvas
    surface: "#F4F4F7", // card
    surfaceMuted: "#FFFFFF", // a fill nested inside a card
    border: "#E5E5EA", // slate-200
    separator: "rgba(60, 60, 67, 0.18)",
    text: "#000000",
    textMuted: "#6C6C70",
    textSubtle: "#8E8E93",
    chevron: "#B9B9BE",
    primary: "#007AFF", // brand-600
    primaryStrong: "#007AFF",
    primarySoft: "#EAF3FF", // brand-50
    success: "#248A3D", // emerald-600 (text-safe green)
    successBright: "#34C759",
    warning: "#FF9500",
    warningStrong: "#F25C05", // amber-600
    danger: "#FF3B30",
    indigo: "#5856D6",
    ringTrack: "#E5E5EA",
    onPrimary: "#FFFFFF",
    onWarning: "#FFFFFF",
    tabBar: "rgba(255, 255, 255, 0.94)",
    tabActive: "rgba(0, 0, 0, 0.06)",
  },
  dark: {
    background: "#000000", // ink-950
    surface: "#1C1C1E", // ink-900
    surfaceMuted: "#2C2C2E", // ink-850
    border: "#2C2C2E",
    separator: "rgba(84, 84, 88, 0.6)",
    text: "#FFFFFF",
    textMuted: "#AEAEB2",
    textSubtle: "#98989F",
    chevron: "#5A5A5F",
    primary: "#0A84FF", // brand-500
    primaryStrong: "#0A84FF",
    primarySoft: "#0B2A4A", // brand-900
    success: "#30D158",
    successBright: "#30D158",
    warning: "#FF9F0A",
    warningStrong: "#FF7A1A",
    danger: "#FF453A",
    indigo: "#5E5CE6",
    ringTrack: "#2C2C2E",
    onPrimary: "#FFFFFF",
    onWarning: "#FFFFFF",
    tabBar: "rgba(37, 37, 40, 0.94)",
    tabActive: "rgba(255, 255, 255, 0.12)",
  },
} as const;

/**
 * Chart colors. The two series pair (resisted ↔ slip, within ↔ over the limit) is
 * blue ↔ orange, which stays distinct for the common color-vision deficiencies.
 */
export const chartPalette = {
  light: {
    series: "#007AFF", // main series, emphasized mark
    seriesMid: "#7DB8FF", // middle step of the same ramp (heatmap "within limit")
    seriesMuted: "#C9DFFF", // the same series, de-emphasized
    slip: "#F25C05",
    grid: "#E5E5EA",
    axis: "#8E8E93",
    empty: "#E9E9EE",
    limit: "#F25C05",
    comparison: "#D1D1D6", // the grey "yesterday / average" line
  },
  dark: {
    series: "#0A84FF",
    seriesMid: "#2F6DB5",
    seriesMuted: "#1B3A5E",
    slip: "#FF7A1A",
    grid: "#2C2C2E",
    axis: "#98989F",
    empty: "#2C2C2E",
    limit: "#FF7A1A",
    comparison: "#48484A",
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)["light"]]: string };
export type ChartColors = { [K in keyof (typeof chartPalette)["light"]]: string };

/**
 * Rounded numerals, like the big numbers in Apple's Health and Fitness apps.
 * iOS resolves "ui-rounded" to SF Pro Rounded; elsewhere the system font is used.
 */
export const ROUNDED_FONT = Platform.select({
  ios: "ui-rounded",
  web: "StopScrollRounded, ui-rounded, system-ui, sans-serif",
  default: undefined,
});

export function useThemeColors(): { isDark: boolean; colors: ThemeColors; chart: ChartColors } {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return {
    isDark,
    colors: isDark ? palette.dark : palette.light,
    chart: isDark ? chartPalette.dark : chartPalette.light,
  };
}
