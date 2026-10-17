import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { useT } from "../i18n";
import { getCategory } from "../utils/catalog";
import { cn } from "../utils/cn";
import { formatMinutes } from "../utils/date";
import { useThemeColors } from "../utils/theme";
import type { Replacement } from "../utils/types";
import { AppText } from "./AppText";
import { categoryColor } from "./categoryColors";
import { RowIcon } from "./ListGroup";
import { ProBadge } from "./ProBadge";

interface ReplacementCardProps {
  item: Replacement;
  locked: boolean;
  onPress: () => void;
  compact?: boolean;
}

export function ReplacementCard({ item, locked, onPress, compact = false }: ReplacementCardProps) {
  const { colors } = useThemeColors();
  const t = useT();
  const category = getCategory(item.category);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatMinutes(item.minutes)}, ${category.label}${locked ? t.replacements.a11y.locked : ""}`}
      className="flex-row items-center gap-3 rounded-card bg-card p-4 active:opacity-80 dark:bg-ink-900"
    >
      <RowIcon
        icon={item.icon}
        color={locked ? colors.textSubtle : categoryColor(item.category, colors)}
      />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <AppText variant="heading" className={cn("shrink text-[16px]")} numberOfLines={1}>
            {item.title}
          </AppText>
          {item.custom ? (
            <View className="rounded-full bg-[#E8E8ED] px-2 py-0.5 dark:bg-ink-700">
              <AppText variant="label" tone="subtle" className="text-[11px]">
                {t.replacements.card.own}
              </AppText>
            </View>
          ) : null}
        </View>
        {!compact && item.description ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {item.description}
          </AppText>
        ) : null}
        <AppText variant="caption" tone="subtle" className="text-[13px]">
          {category.label} · {formatMinutes(item.minutes)}
        </AppText>
      </View>
      {locked ? <ProBadge /> : <Ionicons name="chevron-forward" size={17} color={colors.chevron} />}
    </Pressable>
  );
}
