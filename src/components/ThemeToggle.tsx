import { useApp } from "../context/AppContext";
import { haptics } from "../utils/haptics";
import type { IconName, ThemePreference } from "../utils/types";
import { IconButton } from "./IconButton";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

export const THEME_META: Record<ThemePreference, { icon: IconName; label: string }> = {
  system: { icon: "contrast-outline", label: "системная" },
  light: { icon: "sunny-outline", label: "светлая" },
  dark: { icon: "moon-outline", label: "тёмная" },
};

export function ThemeToggle() {
  const { themePreference, setThemePreference } = useApp();
  const next = NEXT[themePreference];
  return (
    <IconButton
      icon={THEME_META[themePreference].icon}
      accessibilityLabel={`Тема: ${THEME_META[themePreference].label}. Переключить на ${THEME_META[next].label}`}
      onPress={() => {
        haptics.selection();
        setThemePreference(next);
      }}
    />
  );
}
