import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { getCategory } from "../utils/catalog";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { Replacement } from "../utils/types";
import { AppText } from "./AppText";
import { ProBadge } from "./ProBadge";

interface ReplacementCardProps {
  item: Replacement;
  locked: boolean;
  onPress: () => void;
  compact?: boolean;
}

const CATEGORY_STYLE = {
  body: "bg-emerald-100 dark:bg-emerald-950/50",
  mind: "bg-brand-100 dark:bg-brand-950/60",
  facts: "bg-amber-100 dark:bg-amber-950/50",
} as const;

export function ReplacementCard({ item, locked, onPress, compact = false }: ReplacementCardProps) {
  const { colors, isDark } = useThemeColors();
  const category = getCategory(item.category);
  const iconColor = {
    body: isDark ? "#34D399" : "#059669",
    mind: colors.primary,
    facts: isDark ? "#FBBF24" : "#D97706",
  }[item.category];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.minutes} мин, ${category.label}${locked ? ", доступно в Pro" : ""}`}
      className={cn(
        "flex-row items-center gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 active:opacity-80 dark:border-ink-800 dark:bg-ink-900",
        locked && "opacity-80",
      )}
    >
      <View
        className={cn(
          "h-12 w-12 items-center justify-center rounded-2xl",
          CATEGORY_STYLE[item.category],
        )}
      >
        <Ionicons name={item.icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <AppText variant="label" className="shrink text-base" numberOfLines={1}>
            {item.title}
          </AppText>
          {locked ? <ProBadge /> : null}
          {item.custom ? (
            <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-ink-800">
              <AppText variant="caption" tone="muted" className="text-[10px] font-semibold">
                СВОЯ
              </AppText>
            </View>
          ) : null}
        </View>
        {!compact && item.description ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {item.description}
          </AppText>
        ) : null}
        <AppText variant="caption" tone="subtle" className="text-xs">
          {category.label} · {item.minutes} мин
        </AppText>
      </View>
      <Ionicons
        name={locked ? "lock-closed-outline" : "chevron-forward"}
        size={18}
        color={colors.textSubtle}
      />
    </Pressable>
  );
}
