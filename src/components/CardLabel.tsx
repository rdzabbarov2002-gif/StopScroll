import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { View } from "react-native";

import { m, useT } from "../i18n";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

/** Colored "icon + category" line at the top of a Health-style card, with an optional chevron. */
export function CardLabel({
  icon,
  label,
  color,
  chevron = false,
  right,
}: {
  icon: IconName;
  label: string;
  color: string;
  chevron?: boolean;
  right?: ReactNode;
}) {
  const { colors } = useThemeColors();
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="shrink flex-row items-center gap-1.5">
        <Ionicons name={icon} size={18} color={color} />
        <AppText variant="heading" style={{ color }} numberOfLines={1} className="shrink">
          {label}
        </AppText>
      </View>
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.chevron} /> : null}
    </View>
  );
}

/** "● Сегодня / 30 мин" — a labelled big number, colored or grey. */
export function KeyValue({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <View
      className="flex-1 gap-0.5"
      accessible
      accessibilityLabel={`${label}: ${value} ${unit ?? ""}`}
    >
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <AppText variant="label" style={{ color }} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <View className="flex-row items-baseline gap-1">
        <AppText
          rounded
          className="text-[36px] font-bold leading-[42px] tracking-tight"
          style={{ color }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value}
        </AppText>
        {unit ? (
          <AppText className="text-[17px] font-semibold" style={{ color }} numberOfLines={1}>
            {unit}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** Thin iOS separator line. */
export function Separator({ className }: { className?: string }) {
  const { colors } = useThemeColors();
  return <View className={className} style={{ height: 0.5, backgroundColor: colors.separator }} />;
}

/** Splits minutes into number/unit pairs, so "2 ч 30 мин" renders with big numbers and small units. */
export function durationParts(totalMinutes: number): { value: string; unit: string }[] {
  const { minute, hour } = m().common.duration;
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return [{ value: String(rest), unit: minute }];
  if (rest === 0) return [{ value: String(hours), unit: hour }];
  return [
    { value: String(hours), unit: hour },
    { value: String(rest), unit: minute },
  ];
}

/** A labelled big duration: "● Сегодня / 2 ч 30 мин"; `null` shows a dash. */
export function DurationValue({
  label,
  minutes,
  color,
  emptyText = "—",
}: {
  label: string;
  minutes: number | null;
  color: string;
  emptyText?: string;
}) {
  const t = useT();
  const parts = minutes === null ? null : durationParts(minutes);
  return (
    <View
      className="flex-1 gap-0.5"
      accessible
      accessibilityLabel={`${label}: ${parts ? parts.map((part) => `${part.value} ${part.unit}`).join(" ") : t.common.noData}`}
    >
      <View className="flex-row items-center gap-1.5">
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <AppText variant="label" style={{ color }} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <View className="flex-row flex-wrap items-baseline gap-x-1">
        {parts ? (
          parts.map((part) => (
            <View key={part.unit} className="flex-row items-baseline gap-1">
              <AppText
                rounded
                className="text-[36px] font-bold leading-[42px] tracking-tight"
                style={{ color }}
              >
                {part.value}
              </AppText>
              <AppText className="text-[17px] font-semibold" style={{ color }}>
                {part.unit}
              </AppText>
            </View>
          ))
        ) : (
          <AppText rounded className="text-[36px] font-bold leading-[42px]" style={{ color }}>
            {emptyText}
          </AppText>
        )}
      </View>
    </View>
  );
}
