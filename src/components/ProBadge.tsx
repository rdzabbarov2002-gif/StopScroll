import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

/** Quiet "🔒 Pro" mark for locked items. */
export function ProBadge({ className, locked = true }: { className?: string; locked?: boolean }) {
  const { colors } = useThemeColors();
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 self-center rounded-full bg-[#E8E8ED] px-2 py-0.5 dark:bg-ink-700",
        className,
      )}
    >
      {locked ? <Ionicons name="lock-closed" size={10} color={colors.textSubtle} /> : null}
      <AppText variant="label" tone="subtle" className="text-[12px]">
        Pro
      </AppText>
    </View>
  );
}
