import Ionicons from "@expo/vector-icons/Ionicons";
import { Children, Fragment, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

/** An iOS inset grouped list: one rounded card with hairline separators between rows. */
export function ListGroup({
  children,
  header,
  headerRight,
  footer,
  className,
}: {
  children: ReactNode;
  header?: string;
  headerRight?: ReactNode;
  footer?: string;
  className?: string;
}) {
  const { colors } = useThemeColors();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className={cn("gap-1.5", className)}>
      {header || headerRight ? (
        <View className="flex-row items-end justify-between gap-3 px-1 pt-2">
          {header ? (
            <AppText variant="overline" tone="subtle" accessibilityRole="header">
              {header}
            </AppText>
          ) : (
            <View />
          )}
          {headerRight}
        </View>
      ) : null}
      <View className="overflow-hidden rounded-card bg-card dark:bg-ink-900">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={{ height: 0.5, backgroundColor: colors.separator, marginLeft: 58 }} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="caption" tone="subtle" className="px-1 text-[13px] leading-[18px]">
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

/** A colored rounded-square icon, as in iOS Settings. */
export function RowIcon({ icon, color }: { icon: IconName; color: string }) {
  return (
    <View
      className="h-[30px] w-[30px] items-center justify-center rounded-lg"
      style={{ backgroundColor: color }}
    >
      <Ionicons name={icon} size={17} color="#FFFFFF" />
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  right,
  onPress,
  chevron = Boolean(onPress),
  accessibilityLabel,
  destructive = false,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  accessibilityLabel?: string;
  destructive?: boolean;
}) {
  const { colors } = useThemeColors();
  const body = (
    <View
      className={cn(
        "flex-row items-center gap-3 px-4",
        subtitle ? "min-h-[60px] py-2.5" : "min-h-[50px] py-2",
      )}
    >
      {icon ? <RowIcon icon={icon} color={iconColor ?? colors.primary} /> : null}
      <View className="flex-1 gap-0.5">
        <AppText
          variant="body"
          numberOfLines={2}
          className={cn(
            subtitle && "font-semibold text-[16px]",
            destructive && "text-rose-500 dark:text-rose-400",
          )}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="caption"
            tone="subtle"
            className="text-[13px] leading-[17px]"
            numberOfLines={2}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" tone="subtle" numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={17} color={colors.chevron} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(", ")}
      className="active:bg-black/5 dark:active:bg-white/10"
    >
      {body}
    </Pressable>
  );
}
