import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { cn } from "../utils/cn";
import { AppText } from "./AppText";

/** Small "PRO" pill for locked items and the header. */
export function ProBadge({ className, locked = true }: { className?: string; locked?: boolean }) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 self-start rounded-full bg-brand-600 px-2 py-0.5 dark:bg-brand-500",
        className,
      )}
    >
      {locked ? <Ionicons name="lock-closed" size={10} color="#FFFFFF" /> : null}
      <AppText variant="overline" className="text-[10px] tracking-wider text-white">
        Pro
      </AppText>
    </View>
  );
}
